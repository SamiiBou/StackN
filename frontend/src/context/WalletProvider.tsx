'use client';

import React, { ReactNode, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that need to be imported
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: React.FC<WalletContextProviderProps> = ({
  children,
}) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Mainnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => {
    if (network === WalletAdapterNetwork.Mainnet) {
      // Use your own RPC endpoint for better performance
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://solana-mainnet.g.alchemy.com/v2/vCq59BHgMYA2JIRKAbRPmIL8OaTeRAgu';
    }
    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Custom hook for wallet functionality
export const useWalletAuth = () => {
  const { publicKey, connected, connecting, disconnect, wallet } = useWallet();
  
  const walletAddress = useMemo(() => {
    return publicKey?.toString() || '';
  }, [publicKey]);
  
  const isConnected = useMemo(() => {
    return connected && publicKey;
  }, [connected, publicKey]);
  
  return {
    walletAddress,
    isConnected,
    connecting,
    disconnect,
    wallet,
    publicKey,
  };
};

// Wallet connection components
export const WalletConnectButton: React.FC = () => {
  return (
    <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 !rounded-lg !px-6 !py-3 !text-white !font-semibold !transition-all !duration-300 hover:!from-blue-600 hover:!to-purple-700" />
  );
};

export const WalletDisconnectBtn: React.FC = () => {
  return (
    <WalletDisconnectButton className="!bg-gradient-to-r !from-red-500 !to-pink-600 !rounded-lg !px-6 !py-3 !text-white !font-semibold !transition-all !duration-300 hover:!from-red-600 hover:!to-pink-700" />
  );
};

// Wallet info component
export const WalletInfo: React.FC = () => {
  const { walletAddress, isConnected, wallet } = useWalletAuth();
  
  if (!isConnected) {
    return null;
  }
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  return (
    <div className="flex items-center space-x-4 bg-black/20 backdrop-blur-md rounded-lg p-4 border border-white/10">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {wallet?.adapter.name || 'Connected'}
          </p>
          <p className="text-xs text-gray-300">
            {formatAddress(walletAddress)}
          </p>
        </div>
      </div>
    </div>
  );
}; 