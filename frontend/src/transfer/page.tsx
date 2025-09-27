'use client';

import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { ArrowLeft, Send, CheckCircle, AlertCircle, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import MiniKitCheck from '@/components/MiniKitCheck';
import { COMMON_TOKENS } from '@/lib/jupiterApi';

// Configuration WLD
const WLD_TOKEN_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003'; // WLD sur World Chain
const RECIPIENT_ADDRESS = '0x636678e4Be5598f345e6C262f4798d7f1bd3F1E2';

// Token display names and info
const TOKEN_INFO = {
  SOL: { name: 'Solana', symbol: 'SOL', category: 'Crypto' },
  USDC: { name: 'USD Coin', symbol: 'USDC', category: 'Stablecoin' },
  USDT: { name: 'Tether', symbol: 'USDT', category: 'Stablecoin' },
  JUP: { name: 'Jupiter', symbol: 'JUP', category: 'DeFi' },
  RAY: { name: 'Raydium', symbol: 'RAY', category: 'DeFi' },
  ORCA: { name: 'Orca', symbol: 'ORCA', category: 'DeFi' },
  TESLA: { name: 'Tesla', symbol: 'TSLA', category: 'Stock' },
  SPY: { name: 'SPDR S&P 500', symbol: 'SPY', category: 'ETF' },
  GOOGLE: { name: 'Alphabet', symbol: 'GOOGL', category: 'Stock' },
  APPLE: { name: 'Apple', symbol: 'AAPL', category: 'Stock' },
  AMAZON: { name: 'Amazon', symbol: 'AMZN', category: 'Stock' },
  CIRCLE: { name: 'Circle', symbol: 'CIRCLE', category: 'Stock' },
  ROBINHOOD: { name: 'Robinhood', symbol: 'HOOD', category: 'Stock' },
  NVIDIA: { name: 'NVIDIA', symbol: 'NVDA', category: 'Stock' },
  MICROSTRATEGY: { name: 'MicroStrategy', symbol: 'MSTR', category: 'Stock' },
  QQQ: { name: 'Invesco QQQ', symbol: 'QQQ', category: 'ETF' },
} as const;

interface TransferState {
  isTransferring: boolean;
  status: 'idle' | 'confirming' | 'success' | 'error';
  transactionId: string | null;
  error: string | null;
}

type TokenKey = keyof typeof COMMON_TOKENS;

export default function TransferPage() {
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    status: 'idle',
    transactionId: null,
    error: null,
  });

  // User input states
  const [transferAmount, setTransferAmount] = useState<string>('0.1');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('TESLA');
  const [isTokenDropdownOpen, setIsTokenDropdownOpen] = useState(false);

  // Fonction pour convertir 1 WLD en wei (18 decimals)
  const tokenToDecimals = (amount: string, decimals: number = 18): string => {
    const factor = BigInt(10) ** BigInt(decimals);
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
    return amountBigInt.toString();
  };

  // Validation functions
  const isValidAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 1000; // Max 1000 WLD
  };

  // Fonction de transfert WLD
  const transferWLD = async () => {
    console.log('[TRANSFER][WLD] 🆕 Starting WLD transfer');
    console.log('[TRANSFER][WLD] Amount:', transferAmount, 'WLD');
    console.log('[TRANSFER][WLD] Target token:', selectedToken, TOKEN_INFO[selectedToken].name);
    
    setTransferState({
      isTransferring: true,
      status: 'confirming',
      transactionId: null,
      error: null,
    });

    // Obtenir l'adresse de l'utilisateur
    let userAddress = null;
    try {
      const walletInfo = await MiniKit.commandsAsync.walletAuth({
        nonce: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        notBefore: new Date(),
        statement: "Authorize wallet for WLD transfer monitoring"
      });
      
      if (walletInfo.finalPayload?.status === 'success') {
        userAddress = walletInfo.finalPayload.address;
        console.log('[TRANSFER][WLD] User address obtained:', userAddress);
      }
    } catch (authError) {
      console.warn('[TRANSFER][WLD] Could not get user address, continuing without:', authError);
    }

    try {
      // Configuration du transfert
      const amount = tokenToDecimals(transferAmount, 18); // WLD a 18 decimals
      
      console.log('[TRANSFER][WLD] ② Configuration:', {
        token: WLD_TOKEN_ADDRESS,
        recipient: RECIPIENT_ADDRESS,
        amount: amount,
        amountFormatted: transferAmount + ' WLD',
        targetToken: selectedToken,
        targetTokenAddress: COMMON_TOKENS[selectedToken]
      });
      
      // ABI minimal pour la fonction transfer
      const erc20ABI = [
        {
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "name": "transfer",
          "outputs": [{ "name": "", "type": "bool" }],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ] as const;

      // 3) Envoie la commande sendTransaction via MiniKit
      console.log('[TRANSFER][WLD] ③ Executing MiniKit.commandsAsync.sendTransaction');
      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: WLD_TOKEN_ADDRESS,
            abi: erc20ABI,
            functionName: 'transfer',
            args: [RECIPIENT_ADDRESS, amount],
          },
        ],
      });
      
      const finalPayload = result.finalPayload;
      
      console.log('[TRANSFER][WLD] ④ MiniKit Response:', finalPayload);

      if (finalPayload.status === 'error') {
        throw new Error('Transaction failed: ' + JSON.stringify(finalPayload));
      }

      if (finalPayload.status === 'success' && finalPayload.transaction_id) {
        console.log('[TRANSFER][WLD] ✅ Transaction submitted:', finalPayload.transaction_id);
        
        setTransferState({
          isTransferring: false,
          status: 'success',
          transactionId: finalPayload.transaction_id,
          error: null,
        });

        // 4) Confirmer le transfert via notre API
        try {
          console.log('[TRANSFER][WLD] ⏳ Confirming transfer with backend...');
          
          // Récupérer le token d'authentification si disponible
          const authToken = localStorage.getItem('authToken');
          console.log('[TRANSFER][WLD] 🔐 Auth token found:', !!authToken);
          
          const headers: Record<string, string> = { 
            'Content-Type': 'application/json' 
          };
          
          if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
            console.log('[TRANSFER][WLD] 🔐 Including auth token in request');
          }
          
          const confirmResponse = await fetch('/api/confirm-transfer-wld', {
            method: 'POST',
            headers,
            body: JSON.stringify({ 
              payload: {
                transaction_id: finalPayload.transaction_id,
                status: finalPayload.status
              },
              fromAddress: userAddress,
              expectedAmount: transferAmount,
              targetToken: selectedToken,
              targetTokenAddress: COMMON_TOKENS[selectedToken]
            }),
          });

          if (confirmResponse.ok) {
            const confirmResult = await confirmResponse.json();
            console.log('[TRANSFER][WLD] ✅ Transfer confirmed by backend:', confirmResult);
            
            if (confirmResult.watch_details?.userDetected) {
              console.log('[TRANSFER][WLD] 🎯 User authenticated - will use personal Solana wallet');
            } else {
              console.log('[TRANSFER][WLD] ⚠️ User not authenticated - will use default wallet');
            }
          } else {
            console.warn('[TRANSFER][WLD] ⚠️ Backend confirmation failed, but transaction was sent');
          }
        } catch (confirmError) {
          console.error('[TRANSFER][WLD] ❌ Backend confirmation error:', confirmError);
          // Ne pas faire échouer la transaction pour une erreur de confirmation
        }
        
      } else {
        throw new Error('No transaction ID received');
      }

    } catch (error) {
      console.error('[TRANSFER][WLD] ❌ Transfer failed:', error);
      
      setTransferState({
        isTransferring: false,
        status: 'error',
        transactionId: null,
        error: error instanceof Error ? error.message : 'Transfer failed',
      });
    }
  };

  // Reset l'état
  const resetTransfer = () => {
    setTransferState({
      isTransferring: false,
      status: 'idle',
      transactionId: null,
      error: null,
    });
  };

  return (
    <MiniKitCheck>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Transfer WLD
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Envoyer WLD et convertir automatiquement en token de votre choix
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-blue-300">
                    Transfer Ready
                  </span>
                </div>
                <Link
                  href="/transfer-monitor"
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                >
                  📊 Monitor
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Transfer Card */}
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Transfer WLD</h2>
                <p className="text-gray-400">
                  Configurez votre transfert WLD et sélectionnez le token de destination
                </p>
              </div>

              {/* Transfer Configuration */}
              <div className="space-y-6 mb-8">
                {/* Amount Input */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <label className="block text-gray-400 mb-2">Montant WLD:</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="0.001"
                      max="1000"
                      step="0.001"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-lg font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      placeholder="0.1"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">
                      WLD
                    </span>
                  </div>
                  {!isValidAmount(transferAmount) && transferAmount && (
                    <p className="text-red-400 text-sm mt-1">
                      Veuillez entrer un montant valide (0.001 - 1000 WLD)
                    </p>
                  )}
                </div>

                {/* Token Selection */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <label className="block text-gray-400 mb-2">Token de destination:</label>
                  <div className="relative">
                    <button
                      onClick={() => setIsTokenDropdownOpen(!isTokenDropdownOpen)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {TOKEN_INFO[selectedToken].symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{TOKEN_INFO[selectedToken].name}</div>
                          <div className="text-gray-400 text-sm">{TOKEN_INFO[selectedToken].category}</div>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isTokenDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isTokenDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {Object.entries(TOKEN_INFO).map(([key, info]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedToken(key as TokenKey);
                              setIsTokenDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors flex items-center gap-3 ${
                              selectedToken === key ? 'bg-gray-600' : ''
                            }`}
                          >
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                              {info.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{info.name}</div>
                              <div className="text-gray-400 text-sm">{info.category} • {info.symbol}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Summary */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-gray-400 mb-3">Résumé du transfert:</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Montant WLD:</span>
                      <span className="text-blue-400 font-semibold">{transferAmount} WLD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Destination:</span>
                      <span className="text-purple-400 font-semibold">{TOKEN_INFO[selectedToken].symbol}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Flow: WLD → USDC → Bridge → {TOKEN_INFO[selectedToken].name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Button */}
              <AnimatePresence mode="wait">
                {transferState.status === 'idle' && (
                  <motion.button
                    key="transfer-button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onClick={transferWLD}
                    disabled={transferState.isTransferring || !isValidAmount(transferAmount)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Transférer {transferAmount} WLD → {TOKEN_INFO[selectedToken].symbol}
                  </motion.button>
                )}

                {transferState.status === 'confirming' && (
                  <motion.div
                    key="confirming"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full bg-yellow-600/20 border border-yellow-600 text-yellow-300 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirmation en cours...
                  </motion.div>
                )}

                {transferState.status === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="w-full bg-green-600/20 border border-green-600 text-green-300 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Transfert réussi !
                    </div>
                    
                    {transferState.transactionId && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-gray-400 mb-1">Transaction ID:</div>
                        <div className="font-mono text-sm text-gray-300 break-all">
                          {transferState.transactionId}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={resetTransfer}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      Nouveau transfert
                    </button>
                  </motion.div>
                )}

                {transferState.status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="w-full bg-red-600/20 border border-red-600 text-red-300 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Erreur de transfert
                    </div>
                    
                    {transferState.error && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-red-400 text-sm">
                          {transferState.error}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={resetTransfer}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                      Réessayer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info Card */}
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2 text-blue-400" />
                  Comment ça marche
                </h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                    <p>Configurez le montant WLD et sélectionnez le token de destination</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                    <p>Cliquez sur "Transférer" pour initier la transaction</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                    <p>World App s'ouvrira pour confirmer la transaction</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</div>
                    <p>Confirmez la transaction dans World App</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">5</div>
                    <p>Le système convertira automatiquement: WLD → USDC → Bridge → Token sélectionné</p>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-yellow-300">
                  ⚠️ Important
                </h3>
                <div className="space-y-2 text-sm text-yellow-200">
                  <p>• Vérifiez toujours l'adresse de destination</p>
                  <p>• Les transactions sur blockchain sont irréversibles</p>
                  <p>• Gardez votre transaction ID en sécurité</p>
                </div>
              </div>

              {/* Links */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Liens utiles
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://worldchain-mainnet.explorer.alchemy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>World Chain Explorer</span>
                  </a>
                  <a
                    href="https://worldcoin.org/world-chain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>World Chain Documentation</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MiniKitCheck>
  );
} 