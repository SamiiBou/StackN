'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthUpdaterProps {
  worldIdResponse?: {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    token?: string; // Pour compatibilité
  };
}

/**
 * Composant pour mettre à jour l'authentification après une connexion World ID
 * À utiliser dans les pages où World ID renvoie une réponse
 */
export function AuthUpdater({ worldIdResponse }: AuthUpdaterProps) {
  const { login } = useAuth();

  useEffect(() => {
    if (worldIdResponse?.success) {
      // Utiliser les nouveaux tokens si disponibles, sinon fallback sur l'ancien format
      const tokens = {
        accessToken: worldIdResponse.accessToken || worldIdResponse.token || '',
        refreshToken: worldIdResponse.refreshToken || '',
        expiresIn: worldIdResponse.expiresIn || 900 // 15 minutes par défaut
      };

      // Si on a un refresh token, utiliser le nouveau système
      if (tokens.refreshToken) {
        login(tokens).catch(console.error);
      } else if (tokens.accessToken) {
        // Compatibilité avec l'ancien système (sans refresh token)
        // Pour les utilisateurs existants, ils devront se reconnecter
        console.warn('No refresh token provided, user will need to re-login when token expires');
        
        // Stocker temporairement l'ancien token
        localStorage.setItem('access_token', tokens.accessToken);
      }
    }
  }, [worldIdResponse, login]);

  return null;
}

/**
 * Hook pour convertir l'ancien format de réponse au nouveau
 */
export function useTokenMigration() {
  const { login } = useAuth();

  const migrateTokenResponse = (response: any) => {
    if (!response.success) return response;

    // Si c'est déjà le nouveau format
    if (response.accessToken && response.refreshToken) {
      return response;
    }

    // Convertir l'ancien format
    return {
      ...response,
      accessToken: response.token,
      refreshToken: response.refreshToken || null,
      expiresIn: response.expiresIn || 900
    };
  };

  const handleAuthResponse = async (response: any) => {
    const migratedResponse = migrateTokenResponse(response);
    
    if (migratedResponse.success && migratedResponse.refreshToken) {
      await login({
        accessToken: migratedResponse.accessToken,
        refreshToken: migratedResponse.refreshToken,
        expiresIn: migratedResponse.expiresIn
      });
    }
    
    return migratedResponse;
  };

  return { handleAuthResponse };
}