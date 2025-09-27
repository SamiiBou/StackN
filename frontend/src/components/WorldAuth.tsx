'use client';

import React, { useState } from 'react';
import { MiniKit, WalletAuthInput } from '@worldcoin/minikit-js';
import { motion } from 'motion/react';

interface WorldAuthProps {
  onAuthSuccess: (walletAddress: string, username: string) => void;
}

const USFlag = () => {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden relative">
      <div className="absolute inset-0">
        <div className="h-full w-full bg-white flex flex-col">
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-600"></div>
        </div>
      </div>
      <div className="absolute top-0 left-0 w-3 h-3 bg-blue-700 rounded-tl-full"></div>
    </div>
  );
};

export default function WorldAuth({ onAuthSuccess }: WorldAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInstalled = MiniKit.isInstalled();

  if (!isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <header className="flex justify-between items-center mb-8 px-4 pt-8">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👋</span>
          </div>
          
          <div className="bg-[#f4f4f5] rounded-lg px-3 py-2 flex items-center space-x-2">
            <USFlag />
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </header>

        <div className="container mx-auto max-w-sm flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl shadow-sm p-10 w-full text-center">
            <div className="mb-8">
              <div className="w-1 h-12 bg-[#18181B] mx-auto mb-8"></div>
              <h1 className="text-3xl font-light text-[#18181B] mb-3">
                World App Required
              </h1>
              <p className="text-[#71717A] text-lg leading-relaxed">
                Open this app in World App to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const signInWithWorldWallet = async () => {
    try {
      if (!isInstalled) {
        setError('This app must be opened in World App');
        return;
      }

      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/nonce');
      if (!res.ok) {
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await res.json();

      const { commandPayload: generateMessageResult, finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: nonce,
        requestId: '0',
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Connect to Jupiter Swap to exchange tokens on Solana',
      });

      if (finalPayload.status === 'error') {
        setError('World App authentication failed');
        return;
      }

      const walletAddress = finalPayload.address;
      const username = MiniKit.user?.username || 'World User';
      const cleanUsername = username.replace(' User', '');
      const worldId = finalPayload.address;

      // Secure flow: send payload + nonce so server can verify SIWE
      const response = await fetch('/api/auth/world-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-xstocks-partner': 'true',
        },
        body: JSON.stringify({
          payload: finalPayload,
          nonce,
          username: cleanUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Backend authentication failed');
      }

      const result = await response.json();

      if (result.success) {
        const authData = {
          token: result.token,
          user: result.user,
          walletCreated: result.walletCreated,
          fullUsername: cleanUsername
        };
        
        localStorage.setItem('worldAuth', JSON.stringify(authData));
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('worldchainAddress', walletAddress);
        
        onAuthSuccess(walletAddress, cleanUsername);
      } else {
        setError('Authentication verification failed');
      }
    } catch (error) {
      setError('Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="flex justify-between items-center mb-8 px-4 pt-8">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👋</span>
        </div>
        
        <div className="bg-[#f4f4f5] rounded-lg px-3 py-2 flex items-center space-x-2">
          <USFlag />
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </header>

      <div className="container mx-auto max-w-sm flex items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="bg-white rounded-3xl shadow-sm p-10 w-full text-center"
        >
          <div className="mb-10">
            <div className="w-1 h-16 bg-[#18181B] mx-auto mb-10"></div>
            <h1 className="text-3xl font-light text-[#18181B] mb-4 tracking-tight">
              Sign In
            </h1>
            <p className="text-[#71717A] text-lg leading-relaxed font-light">
              Connect with World to continue
            </p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100"
            >
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <button
            onClick={signInWithWorldWallet}
            disabled={isLoading}
            className="w-full bg-[#18181B] text-white py-5 px-8 rounded-2xl font-medium text-lg hover:bg-[#27272A] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="font-light">Connecting</span>
              </div>
            ) : (
              <span className="font-light">Continue</span>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
