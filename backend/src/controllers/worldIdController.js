import worldIdAuthService from '../services/worldIdAuthService.js';
import solanaWalletService from '../services/solanaWalletService.js';
import { validationResult } from 'express-validator';

class WorldIdController {
  /**
   * Authentification avec World ID
   * POST /api/auth/world-id
   */
  async authenticate(req, res) {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { walletAddress, username, worldId, signature } = req.body;

      // Validation des données requises
      if (!walletAddress || !worldId) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address and World ID are required'
        });
      }

      console.log(`🌍 [WorldIdController] Authentication request for ${username || 'Unknown'} (${walletAddress})`);

      // Detect partner headers
      const partnerHeader = req.headers['x-xstocks-partner'];
      const isPartner = typeof partnerHeader === 'string' ? partnerHeader.toLowerCase() === 'true' : false;
      const partnerReferrer = req.headers['x-xstocks-partner-referrer'] || null;
      const partnerAppId = req.headers['x-xstocks-partner-appid'] || null;

      // For partner-originated auth, require that SIWE has been verified upstream
      const siweVerifiedHeader = req.headers['x-xstocks-siwe-verified'];
      const siweVerified = typeof siweVerifiedHeader === 'string' ? siweVerifiedHeader.toLowerCase() === 'true' : false;
      if (isPartner && !siweVerified) {
        return res.status(401).json({
          success: false,
          message: 'SIWE verification required for partner authentication'
        });
      }

      // Authentifier avec World ID
      const authResult = await worldIdAuthService.authenticateWithWorldId({
        walletAddress,
        username: username || 'World User',
        worldId,
        signature,
        partner: {
          isPartner,
          referrer: partnerReferrer,
          appId: partnerAppId
        }
      });

      // Log pour debugging
      if (authResult.walletCreated) {
        console.log(`🎉 [WorldIdController] New user onboarded with Solana wallet: ${authResult.user.solanaWallet?.publicKey}`);
      }

      res.status(200).json(authResult);

    } catch (error) {
      console.error('❌ [WorldIdController] Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtenir le profil utilisateur
   * GET /api/auth/profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user._id;
      const profile = await worldIdAuthService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        user: profile
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   * PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const updateData = req.body;

      const updatedUser = await worldIdAuthService.updateWorldIdUser(userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          fullName: updatedUser.fullName
        }
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Obtenir les informations de la wallet Solana
   * GET /api/auth/solana-wallet
   */
  async getSolanaWallet(req, res) {
    try {
      const userId = req.user._id;
      const walletInfo = await solanaWalletService.getWalletInfo(userId);

      if (!walletInfo) {
        return res.status(404).json({
          success: false,
          message: 'Solana wallet not found'
        });
      }

      res.status(200).json({
        success: true,
        wallet: walletInfo
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Get Solana wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Solana wallet',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Créer une nouvelle wallet Solana (si elle n'existe pas)
   * POST /api/auth/create-solana-wallet
   */
  async createSolanaWallet(req, res) {
    try {
      const userId = req.user._id;

      // Vérifier si l'utilisateur a déjà une wallet
      const hasWallet = await solanaWalletService.hasWallet(userId);
      if (hasWallet) {
        return res.status(400).json({
          success: false,
          message: 'User already has a Solana wallet'
        });
      }

      // Créer la nouvelle wallet
      const walletResult = await solanaWalletService.createNewWallet(userId);

      res.status(201).json({
        success: true,
        message: 'Solana wallet created successfully',
        wallet: {
          publicKey: walletResult.publicKey,
          createdAt: walletResult.createdAt
        }
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Create Solana wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Solana wallet',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Importer une wallet Solana existante
   * POST /api/auth/import-solana-wallet
   */
  async importSolanaWallet(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const userId = req.user._id;
      const { seedPhrase } = req.body;

      if (!seedPhrase) {
        return res.status(400).json({
          success: false,
          message: 'Seed phrase is required'
        });
      }

      // Vérifier si l'utilisateur a déjà une wallet active
      const hasWallet = await solanaWalletService.hasWallet(userId);
      if (hasWallet) {
        return res.status(400).json({
          success: false,
          message: 'User already has an active Solana wallet'
        });
      }

      // Importer la wallet
      const walletResult = await solanaWalletService.importWallet(userId, seedPhrase);

      res.status(201).json({
        success: true,
        message: 'Solana wallet imported successfully',
        wallet: {
          publicKey: walletResult.publicKey,
          createdAt: new Date()
        }
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Import Solana wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import Solana wallet',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Déconnexion
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      const userId = req.user._id;
      const result = await worldIdAuthService.logout(userId);

      res.status(200).json(result);

    } catch (error) {
      console.error('❌ [WorldIdController] Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Vérifier le statut d'authentification
   * GET /api/auth/status
   */
  async getAuthStatus(req, res) {
    try {
      const user = req.user;
      
      res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          worldId: user.worldId,
          worldIdVerified: user.worldIdVerified,
          lastLogin: user.lastLogin,
          solanaWallet: user.solanaWallet
        }
      });

    } catch (error) {
      console.error('❌ [WorldIdController] Auth status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get auth status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

export default new WorldIdController();
