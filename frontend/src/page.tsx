'use client';
import { animate, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GoCopilot } from "react-icons/go";
import StocksCard from "@/components/StocksCard";
import BuyModal from "@/components/BuyModal";
import TransactionTracker from "@/components/TransactionTracker";
import { useTransactionTracking } from "@/hooks/useTransactionTracking";
import { 
  GoogleIcon, 
  TeslaIcon, 
  AppleIcon, 
  AmazonIcon, 
  SPYIcon, 
  CircleIcon, 
  HoodIcon, 
  MetaIcon, 
  MicroStrategyIcon,
  NvidiaIcon,
  QQQIcon
} from "@/components/icons";
import { 
  SolanaIcon, BonkIcon, WifIcon, JupiterIcon, PopcatIcon, 
  PenguIcon, TrumpIcon, MelaniaIcon, PumpIcon, PepecoinIcon, 
  FartcoinIcon, WlfiIcon, UselessIcon 
} from '@/components/icons';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import Image from 'next/image';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { COMMON_TOKENS } from '@/lib/jupiterApi';
// We'll fetch crypto prices via backend aggregator to avoid CORS in World App
import { useRouter } from 'next/navigation';
import { MiniKit } from '@worldcoin/minikit-js';
import { useLanguage } from '@/context/LanguageContext';
import { useWldBalance } from '@/hooks/useWldBalance';
import worldBanner from '@/components/BOX-banner@3x.png';

const USFlag = () => {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden relative">
      {/* Red and white stripes */}
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
      {/* Blue canton */}
      <div className="absolute top-0 left-0 w-3 h-3 bg-blue-700 rounded-tl-full"></div>
    </div>
  );
};

const FrenchFlag = () => {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden relative flex">
      <div className="flex-1 bg-blue-600"></div>
      <div className="flex-1 bg-white"></div>
      <div className="flex-1 bg-red-600"></div>
    </div>
  );
};

const SpanishFlag = () => {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden relative flex flex-col">
      <div className="flex-1 bg-red-600"></div>
      <div className="h-2 bg-yellow-500 flex items-center justify-center relative">
        {/* Small coat of arms placeholder */}
        <div className="absolute left-1 w-1.5 h-1.5 bg-red-700 rounded-full opacity-50"></div>
      </div>
      <div className="flex-1 bg-red-600"></div>
    </div>
  );
};

const IndonesianFlag = () => {
  return (
    <div className="w-6 h-6 rounded-full overflow-hidden relative flex flex-col">
      <div className="flex-1 bg-red-600"></div>
      <div className="flex-1 bg-white"></div>
    </div>
  );
};

// Function to get the appropriate icon based on the symbol
const getStockIcon = (symbol: string) => {
  const symbolLower = symbol.toLowerCase();
  
  switch (symbolLower) {
    // --- Crypto tokens ---
    case 'bonk':
      return <BonkIcon />;
    case 'wif':
    case 'dogwifhat':
      return <WifIcon />;
    case 'jup':
    case 'jupiter':
      return <JupiterIcon />;
    case 'popcat':
      return <PopcatIcon />;
    case 'pengu':
      return <PenguIcon />;
    case 'trump':
      return <TrumpIcon />;
    case 'melania':
      return <MelaniaIcon />;
    case 'pump':
      return <PumpIcon />;
    case 'pepe':
    case 'pepecoin':
      return <PepecoinIcon />;
    case 'fart':
    case 'fartcoin':
      return <FartcoinIcon />;
    case 'wlfi':
      return <WlfiIcon />;
    case 'useless':
      return <UselessIcon />;
    // --- Solana family ---
    case 'sol':
    case 'solana':
    case 'wsol':
      return <SolanaIcon />;
    case 'google':
    case 'googl':
    case 'goog':
      return <GoogleIcon />;
    case 'tesla':
    case 'tsla':
      return <TeslaIcon />;
    case 'apple':
    case 'aapl':
      return <AppleIcon />;
    case 'amazon':
    case 'amzn':
      return <AmazonIcon />;
    case 'spy':
      return <SPYIcon />;
    case 'qqq':
      return <QQQIcon />;
    case 'circle':
    case 'crcl':
      return <CircleIcon />;
    case 'hood':
    case 'robinhood':
      return <HoodIcon />;
    case 'meta':
    case 'fb':
      return <MetaIcon />;
    case 'microstrategy':
    case 'mstr':
      return <MicroStrategyIcon />;
    case 'nvidia':
    case 'nvda':
      return <NvidiaIcon />;
    default:
      // Default icon for unmapped stocks,
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-600">
            {symbol.substring(0, 2).toUpperCase()}
          </span>
        </div>
      );
  }
};

// Function to get userId from localStorage
const getUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to retrieve userId from localStorage
    const userId = localStorage.getItem('userId');
    if (userId) return userId;
    
    // Otherwise try to decode the JWT token
    const token = localStorage.getItem('authToken') || localStorage.getItem('jwt');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || payload.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting userId:', error);
    return null;
  }
};

const getCryptoIcon = (cryptoKey: string) => {
  switch (cryptoKey) {
    case 'solana': return <SolanaIcon />;
    case 'bonk': return <BonkIcon />;
    case 'dogwifhat': return <WifIcon />;
    case 'jupiter': return <JupiterIcon />;
    case 'popcat': return <PopcatIcon />;
    case 'pengu': return <PenguIcon />;
    case 'trump': return <TrumpIcon />;
    case 'melania': return <MelaniaIcon />;
    case 'pump': return <PumpIcon />;
    case 'pepecoin': return <PepecoinIcon />;
    case 'fartcoin': return <FartcoinIcon />;
    case 'wlfi': return <WlfiIcon />;
    case 'useless': return <UselessIcon />;
    default: return <SolanaIcon />;
  }
};

export default function HomePage() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { 
    prices, 
    isLoading, 
    error, 
    getPrice, 
    getPriceFormatted 
  } = useTokenPrices();

  // Warm up WLD price early (even without wallet) to avoid initial gating on BuyModal
  const wldBootstrap = useWldBalance(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{name: string, icon: React.ReactNode} | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [showAllStocks, setShowAllStocks] = useState(true);
  const [activeTab, setActiveTab] = useState<'stocks' | 'crypto'>('stocks');
  // World App mini-app banner (visible for all users)
  const WORLD_MINI_APP_ID = 'app_b67c3e1ab1f44f3533b234a53d5a156d';
  const WORLD_MINI_APP_DEEP_LINK = `worldapp://mini-app?app_id=${WORLD_MINI_APP_ID}`;
  const WORLD_MINI_APP_WEB_URL = `https://worldcoin.org/mini-app?app_id=${WORLD_MINI_APP_ID}&app_mode=mini-app`;
  const showWorldBanner = true;
  /* -------------------------------------------------------------
   *  Initialise auth-related state synchronously from localStorage
   *  so that the username / auth status are available BEFORE the
   *  first paint. This removes the flicker ("User") and ensures the
   *  page shows the correct buying power immediately.
   * ----------------------------------------------------------- */

  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      const worldAuthRaw = localStorage.getItem('worldAuth');
      if (worldAuthRaw) {
        const authData = JSON.parse(worldAuthRaw);
        return authData.user?._id || authData.user?.id || null;
      }

      return getUserId();
    } catch {
      return null;
    }
  });

  const [username, setUsername] = useState<string>(() => {
    if (typeof window === 'undefined') return 'User';

    try {
      const worldAuthRaw = localStorage.getItem('worldAuth');
      if (worldAuthRaw) {
        const authData = JSON.parse(worldAuthRaw);
        return (
          authData.fullUsername ||
          `${authData.user?.firstName || ''} ${authData.user?.lastName || ''}`.trim() ||
          'World'
        ).replace(' User', '');
      }
    } catch {}

    return 'User';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!(localStorage.getItem('worldAuth') && localStorage.getItem('authToken'));
  });

  // We only need to show the spinner while we are not sure about auth.
  // If we already detected auth synchronously we can skip the spinner.
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !(localStorage.getItem('worldAuth') && localStorage.getItem('authToken'));
  });

  // Hook to manage transaction tracking
  const { activeTransaction, startTracking, clearTransaction } = useTransactionTracking(userId);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-selector')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isLanguageDropdownOpen]);

  // Debug logs for the transaction tracker
  useEffect(() => {
    console.log('📊 [HomePage] Active transaction:', activeTransaction);
    console.log('📊 [HomePage] User ID:', userId);
  }, [activeTransaction, userId]);

  // No gating by wallet anymore; banner shown to all

  const openWorldMiniApp = () => {
    try {
      // Reproduce Megapot behavior: try deep link, then fallback to same deep link via location
      window.open(WORLD_MINI_APP_DEEP_LINK, '_blank');
      setTimeout(() => {
        try { window.location.href = WORLD_MINI_APP_DEEP_LINK; } catch {}
      }, 100);
    } catch (err) {
      console.error('[WorldBanner] Failed to redirect to World App mini-app', err);
    }
  };

  // Hook to retrieve real portfolio data
  const { portfolioData, isLoading: portfolioLoading, error: portfolioError, refetch } = usePortfolioValue(userId);
  
  // Global flag to hide all Megapot UI/logic. Hidden for partner view only.
  const MEGAPOT_HIDDEN = (() => {
    try {
      if (typeof window === 'undefined') return false;
      const onWidgetPath = window.location.pathname.startsWith('/widget');
      const storagePartner = onWidgetPath && localStorage.getItem('xstocks_partner') === 'true';
      const partnerQuery = new URLSearchParams(window.location.search).get('partner')?.match(/^(1|true|yes)$/i);
      return (
        storagePartner ||
        document.body.classList.contains('partner-view') ||
        onWidgetPath ||
        partnerQuery
      );
    } catch {
      return false;
    }
  })();

  // ===== One-time Megapot test reset (disabled by default). Enable with NEXT_PUBLIC_ENABLE_MEGA_RESET=1 =====
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    const ENABLE_RESET = process.env.NEXT_PUBLIC_ENABLE_MEGA_RESET === '1';
    if (!ENABLE_RESET) return;
    try {
      const SCHEDULED = 'megapot_reset_scheduled';
      const PENDING = 'megapot_reset_pending';
      const KEYS_TO_CLEAR = [
        'megapot_has_purchased',
        'megapot_claimed',
        'first_trade_banner_hidden',
        'first_trade_banner_pending_buy',
        'megapot_last_purchase_ts',
        'megapot_show_banner',
        'us_stocks_active_transactions'
      ];

      // If a reset is pending, apply it now (this happens only once on the next startup)
      if (localStorage.getItem(PENDING) === 'true') {
        KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
        localStorage.removeItem(PENDING);
        console.log('🧹 [Megapot] One-time test reset applied');
        return;
      }

      // If not already scheduled, schedule the next-startup reset now
      if (!localStorage.getItem(SCHEDULED)) {
        localStorage.setItem(PENDING, 'true');
        localStorage.setItem(SCHEDULED, 'true');
        console.log('🧪 [Megapot] One-time test reset scheduled for next startup');
      }
    } catch (e) {
      console.log('🧪 [Megapot] Failed to schedule/apply one-time reset', e);
    }
  }, []);

  useEffect(() => {
    // Force one-time re-auth for specific wallet address
    try {
      const TARGET_WALLET = '0x21bee69e692ceb4c02b66c7a45620684904ba395'.toLowerCase();
      const consumed = localStorage.getItem('force_reauth_21bee_consumed') === 'true';
      const storedWallet = (
        localStorage.getItem('worldchainAddress') ||
        localStorage.getItem('walletAddress') ||
        ''
      ).toLowerCase();
      if (!consumed && storedWallet === TARGET_WALLET) {
        ['worldAuth','authToken','jwt','access_token','refresh_token'].forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
        });
        localStorage.setItem('force_reauth_21bee_consumed', 'true');
        console.log('🔐 [HomePage] Forced one-time re-auth for target wallet');
      }
    } catch {}

    // Proactively start backend transfer-watch service (idempotent)
    try { fetch('/api/transfer-watch/service/start', { method: 'POST' }); } catch {}

    // Check World ID authentication first
    const checkWorldIdAuth = () => {
      try {
        const worldAuth = localStorage.getItem('worldAuth');
        const authToken = localStorage.getItem('authToken');
        
        console.log('🔐 [HomePage] Checking World ID authentication...');
        console.log('🔐 [HomePage] WorldAuth data:', worldAuth ? 'Found' : 'Not found');
        console.log('🔐 [HomePage] Auth token:', authToken ? 'Found' : 'Not found');
        
        if (worldAuth && authToken) {
          try {
            const authData = JSON.parse(worldAuth);
            if (authData.user && authData.token) {
              console.log('✅ [HomePage] User is authenticated with World ID');
              setIsAuthenticated(true);
              
              // Get userId from authenticated user data
              const id = authData.user._id || authData.user.id || getUserId();
              setUserId(id);
              const displayName = (authData.fullUsername || `${authData.user?.firstName || ''} ${authData.user?.lastName || ''}`.trim() || 'World').replace(' User', '');
              setUsername(displayName);
              console.log('🔍 [HomePage] Retrieved userId from auth:', id);
              return;
            }
          } catch (parseError) {
            console.error('❌ [HomePage] Error parsing auth data:', parseError);
          }
        }
        
        console.log('❌ [HomePage] User is not authenticated with World ID');
        setIsAuthenticated(false);
        setUserId(null);
      } catch (error) {
        console.error('❌ [HomePage] Error checking authentication:', error);
        setIsAuthenticated(false);
        setUserId(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    // Clean old transactions on startup
    const cleanOldTransactions = () => {
      try {
        const stored = localStorage.getItem('us_stocks_active_transactions');
        if (stored) {
          const transactions = JSON.parse(stored);
          const now = Date.now();
          let hasChanges = false;
          
          // Remove transactions older than 10 minutes
          Object.keys(transactions).forEach(key => {
            const transaction = transactions[key];
            if (transaction && (now - transaction.timestamp) > 600000) { // 10 minutes
              console.log('🧹 [HomePage] Cleaning old transaction:', transaction.id);
              delete transactions[key];
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            localStorage.setItem('us_stocks_active_transactions', JSON.stringify(transactions));
          }
        }
      } catch (error) {
        console.error('Error cleaning old transactions:', error);
        localStorage.removeItem('us_stocks_active_transactions');
      }
    };
    
    checkWorldIdAuth();
    cleanOldTransactions();
  }, []);

  // (Removed targeted logout button and related state)

  // Auto-trigger World MiniKit auth on first visit if not authenticated
  const autoAuthAttemptedRef = useRef(false);
  const [isAutoAuthInProgress, setIsAutoAuthInProgress] = useState(false);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (isAuthenticated) return;
    if (autoAuthAttemptedRef.current) return;
    if (typeof window === 'undefined') return;
    let installed = false;
    try { installed = MiniKit.isInstalled(); } catch { installed = false; }
    if (!installed) return; // Do not attempt outside World App

    autoAuthAttemptedRef.current = true;
    setIsAutoAuthInProgress(true);

    (async () => {
      try {
        const res = await fetch('/api/nonce');
        if (!res.ok) throw new Error('Failed to fetch nonce');
        const { nonce } = await res.json();

        const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
          nonce,
          requestId: '0',
          expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
          statement: 'Connect to Jupiter Swap to exchange tokens on Solana',
        });

        if ((finalPayload as any)?.status === 'error') {
          console.warn('World App authentication cancelled or failed');
          return;
        }

        const walletAddress = (finalPayload as any).address as string;
        const username = (MiniKit as any).user?.username || 'World User';
        const cleanUsername = String(username).replace(' User', '');

        const response = await fetch('/api/auth/world-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            username: cleanUsername,
            worldId: (finalPayload as any).address,
            signature: (finalPayload as any).signature,
          }),
        });

        if (!response.ok) {
          try {
            const err = await response.json();
            console.error('Backend authentication failed', err);
          } catch {}
          return;
        }

        const result = await response.json();
        if (result?.success) {
          const authData = {
            token: result.token,
            user: result.user,
            walletCreated: result.walletCreated,
            fullUsername: cleanUsername,
          };
          try {
            localStorage.setItem('worldAuth', JSON.stringify(authData));
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('worldchainAddress', walletAddress);
          } catch {}
          handleAuthSuccess(walletAddress, cleanUsername);
        }
      } catch (e) {
        console.error('Auto World auth error:', e);
      } finally {
        setIsAutoAuthInProgress(false);
      }
    })();
  }, [isCheckingAuth, isAuthenticated]);

  // (Removed targeted logout handler)

  // ===== Megapot Giveaway Integration =====
  const GEO_BLOCKED_COUNTRIES = [
    'AT','AU','BY','CU','DE','ES','FR','GB','IR','KM','KP','MM','NL','RU','SY','UA','VE','PL','US','TH','MY','ID'
  ];
  const [clientCountry, setClientCountry] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const v = localStorage.getItem('megapot_claimed') === 'true';
      console.log('🎟️ [Megapot] init hasClaimed from storage:', v);
      return v;
    } catch { return false; }
  });
  const [showClaimBanner, setShowClaimBanner] = useState<boolean>(false);
  const [hasPurchased, setHasPurchased] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('megapot_has_purchased') === 'true'; } catch { return false; }
  });

  const [eligibility, setEligibility] = useState<
    'unknown' | 'eligible' | 'ineligible' | 'blocked' | 'error'
  >('unknown');
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<{ tx?: string } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const REFERRER_WALLET = process.env.NEXT_PUBLIC_MEGAPOT_REFERRER || '0x4004FfC983b2421c110003805430b52a0be91017';
  const MEGAPOT_HISTORY_URL = `https://megapot.io/history?referrer=${REFERRER_WALLET}`;
  const MINI_APP_WEB_URL = 'https://world.org/mini-app?app_id=app_56969135362e52b5f926be417b9813ee&path=/history';

  // Target World App mini-app to open after successful claim
  const TARGET_MINI_APP_ID = 'app_56969135362e52b5f926be417b9813ee';
  const TARGET_MINI_APP_URL = `worldapp://mini-app?app_id=${TARGET_MINI_APP_ID}`;
  const redirectToMiniApp = () => {
    try {
      // Match AdModal behavior and add a fallback for reliability
      window.open(TARGET_MINI_APP_URL, '_blank');
      // Fallback in case window.open is blocked or ignored
      setTimeout(() => {
        try { window.location.href = TARGET_MINI_APP_URL; } catch {}
      }, 100);
    } catch (err) {
      console.error('[Megapot] Failed to redirect to World App mini-app', err);
    }
  };

  const getEvmWalletAddress = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const candidates = [
        localStorage.getItem('worldchainAddress'),
        localStorage.getItem('walletAddress'),
      ].filter(Boolean) as string[];
      const valid = candidates.find((a) => /^0x[a-fA-F0-9]{40}$/.test(a));
      if (!valid) {
        console.log('⚠️ [Megapot] No valid EVM wallet found in localStorage. Candidates:', candidates);
      } else {
        console.log('🔑 [Megapot] Using EVM wallet address:', valid);
      }
      return valid || null;
    } catch (e) {
      console.error('❌ [Megapot] Error reading EVM wallet address:', e);
      return null;
    }
  };

  // When a transaction succeeds, remember it for showing the claim banner
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    // Show banner as soon as there is any active transaction (processing or success)
    if (activeTransaction) {
      console.log('🎟️ [Megapot] Active transaction detected, showing claim banner placeholder', activeTransaction);
      setShowClaimBanner(true);
      try { localStorage.setItem('megapot_last_purchase_ts', String(Date.now())); } catch {}
    }
    if (activeTransaction?.status === 'success') {
      console.log('🎟️ [Megapot] Purchase SUCCESS detected, keeping claim banner visible');
      setShowClaimBanner(true);
      try { localStorage.setItem('megapot_last_purchase_ts', String(Date.now())); } catch {}
    }
  }, [activeTransaction?.status]);

  // Fallback: if a pending transaction exists in localStorage for this user, show the banner
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    try {
      const raw = localStorage.getItem('us_stocks_active_transactions');
      if (!raw || !userId) return;
      const txs = JSON.parse(raw);
      if (txs && txs[userId]) {
        console.log('🧩 [Megapot] Found transaction in storage for user, enabling banner', txs[userId]);
        setShowClaimBanner(true);
      }
    } catch (e) {
      console.log('🧩 [Megapot] Error reading transactions from storage', e);
    }
  }, [userId]);

  // Snapshot logging: understand why banner is hidden/shown
  const isGeoBlocked = clientCountry ? GEO_BLOCKED_COUNTRIES.includes(clientCountry) : false;
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    try {
      const lastTs = localStorage.getItem('megapot_last_purchase_ts');
      const elapsed = lastTs ? (Date.now() - Number(lastTs)) : null;
      const wallet = getEvmWalletAddress();
      const canShow = showClaimBanner && !hasClaimed && !isGeoBlocked;
      console.log('🎯 [Megapot] Banner state snapshot', {
        showClaimBanner,
        eligibility,
        eligibilityReason,
        hasClaimed,
        clientCountry,
        isGeoBlocked,
        activeTransaction,
        claimSuccess,
        claimError,
        wallet: wallet ? wallet.slice(0, 10) + '...' : null,
        lastPurchaseTs: lastTs,
        elapsedMsSinceLastTs: elapsed,
        canShow,
      });
      if (!canShow) {
        if (!showClaimBanner) console.log('🚫 [Megapot] Hidden: showClaimBanner is false');
        if (hasClaimed) console.log('🚫 [Megapot] Hidden: hasClaimed is true');
        if (isGeoBlocked) console.log('🚫 [Megapot] Hidden: isGeoBlocked is true');
      }
    } catch (e) {
      console.log('🎯 [Megapot] Snapshot logging failed', e);
    }
  }, [showClaimBanner, eligibility, eligibilityReason, hasClaimed, clientCountry, isGeoBlocked, activeTransaction, claimSuccess, claimError]);

  // Listen to storage events to enable banner when BuyModal triggers keys
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    const handler = (e: StorageEvent) => {
      const keys = ['us_stocks_active_transactions', 'megapot_show_banner', 'megapot_last_purchase_ts'];
      if (e.key && keys.includes(e.key)) {
        console.log('🛎️ [Megapot] Storage event received, enabling banner due to key:', e.key);
        setShowClaimBanner(true);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Proactively check Megapot eligibility to hide banners for already-claimed wallets
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    if (hasClaimed) return;
    const wallet = getEvmWalletAddress();
    if (!wallet) return;
    let cancelled = false;
    (async () => {
      try {
        const qs = clientCountry ? `&country=${clientCountry}` : '';
        const res = await fetch(`/api/megapot/eligibility?wallet=${wallet}${qs}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.eligible === true) {
          setEligibility('eligible');
          setEligibilityReason(null);
        } else if (res.status === 403) {
          setEligibility('blocked');
          setEligibilityReason('geo');
        } else if (res.ok && data?.eligible === false) {
          setEligibility('ineligible');
          setEligibilityReason(typeof data?.error === 'string' ? data.error : null);
          try { localStorage.setItem('megapot_claimed', 'true'); } catch {}
          setHasClaimed(true);
          setShowClaimBanner(false);
        } else {
          // Unknown response; keep eligibility unknown to avoid hiding banner incorrectly
          setEligibility('unknown');
        }
      } catch (e) {
        if (!cancelled) {
          setEligibility('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [clientCountry, hasPurchased, userId]);

  // Debug: log initial banner state and timing
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    if (typeof window === 'undefined') return;
    try {
      const lastTs = localStorage.getItem('megapot_last_purchase_ts');
      const elapsedMs = lastTs ? (Date.now() - Number(lastTs)) : null;
      console.log('🧪 [Megapot] Banner init debug', {
        forceBanner: process.env.NEXT_PUBLIC_FORCE_MEGA_BANNER,
        lastPurchaseTs: lastTs,
        elapsedMs,
        showClaimBanner,
      });
    } catch (e) {
      console.log('🧪 [Megapot] Banner init debug error', e);
    }
  }, []);

  // Detect client country robustly: URL override > server (/api/geo) > multi-provider client aggregation
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    const detect = async () => {
      try {
        // Clear stale cookies/overrides and support optional URL override for debugging
        try { document.cookie = 'geo_country=; Max-Age=0; path=/'; } catch {}
        try { localStorage.removeItem('forceCountry'); } catch {}
        let forced: string | null = null;
        try {
          const url = new URL(window.location.href);
          forced = (url.searchParams.get('country') || '').toUpperCase() || null;
          if (url.searchParams.get('reset_geo') === '1') {
            try { document.cookie = 'geo_country=; Max-Age=0; path=/'; } catch {}
          }
        } catch {}
        if (forced) {
          console.log('🌍 [Megapot] Using URL country override:', forced);
          setClientCountry(forced);
        }

        // 1) Try server-side header via /api/geo (cached in cookie)
        try {
          const geoRes = await fetch('/api/geo?refresh=1', { cache: 'no-store' });
          if (geoRes.ok) {
            const g = await geoRes.json();
            if (g?.country) {
              console.log('🌍 [Megapot] Country via /api/geo:', g);
              setClientCountry(String(g.country).toUpperCase());
              // Do not return; continue with client aggregation to respect VPN in browser if different
            }
          }
        } catch (e) {
          console.log('🌍 [Megapot] /api/geo failed:', e);
        }

        // 2) Client aggregation across multiple providers (respects browser VPN)
        const fetchWithTimeout = (url: string, ms = 1500) => {
          const controller = new AbortController();
          const t = setTimeout(() => controller.abort(), ms);
          return fetch(url, { cache: 'no-store', signal: controller.signal })
            .finally(() => clearTimeout(t));
        };

        const providers: Array<Promise<string | null>> = [
          // api.country.is → { country: "XX" }
          fetchWithTimeout('https://api.country.is/').then(async r => {
            if (!r.ok) return null; const j = await r.json().catch(() => ({}));
            return j?.country ? String(j.country).toUpperCase() : null;
          }).catch(() => null),
          // ipwho.is → { country_code: "XX" }
          fetchWithTimeout('https://ipwho.is/').then(async r => {
            if (!r.ok) return null; const j = await r.json().catch(() => ({}));
            return j?.country_code ? String(j.country_code).toUpperCase() : null;
          }).catch(() => null),
          // ipapi.co → { country_code: "XX" }
          fetchWithTimeout('https://ipapi.co/json/').then(async r => {
            if (!r.ok) return null; const j = await r.json().catch(() => ({}));
            return j?.country_code ? String(j.country_code).toUpperCase() : null;
          }).catch(() => null),
          // ipinfo.io (no token) → { country: "XX" }
          fetchWithTimeout('https://ipinfo.io/json').then(async r => {
            if (!r.ok) return null; const j = await r.json().catch(() => ({}));
            return j?.country ? String(j.country).toUpperCase() : null;
          }).catch(() => null),
          // ifconfig.co → plain text country ISO code
          fetchWithTimeout('https://ifconfig.co/country-iso').then(async r => {
            if (!r.ok) return null; const t = (await r.text().catch(() => '')).trim();
            return /^[A-Za-z]{2}$/.test(t) ? t.toUpperCase() : null;
          }).catch(() => null),
          // Cloudflare trace → text with loc=XX
          fetchWithTimeout('https://www.cloudflare.com/cdn-cgi/trace').then(async r => {
            if (!r.ok) return null; const t = await r.text().catch(() => '');
            const m = t.match(/\bloc=([A-Za-z]{2})\b/); return m ? m[1].toUpperCase() : null;
          }).catch(() => null),
        ];

        const results = await Promise.allSettled(providers);
        const codes: string[] = results
          .map(res => res.status === 'fulfilled' ? res.value : null)
          .filter((x): x is string => !!x);
        console.log('🌍 [Megapot] Client aggregation results:', codes);

        if (codes.length > 0) {
          // Majority vote
          const tally: Record<string, number> = {};
          for (const c of codes) tally[c] = (tally[c] || 0) + 1;
          const best = Object.entries(tally).sort((a,b) => b[1]-a[1])[0][0];
          setClientCountry(best);
          try { localStorage.setItem('detectedCountry', best); } catch {}
          console.log('🌍 [Megapot] Aggregated client country:', { best, tally });
          return;
        }

        console.log('🌍 [Megapot] Aggregation yielded no result');
      } catch (e) {
        console.log('🌍 [Megapot] Country detection failed:', e);
      }
    };
    detect();
  }, []);

  // Note: Do not reset Megapot flags; preserve claim/purchase state across sessions

  // Mark first purchase on success; persist flag
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    if (activeTransaction?.status === 'success') {
      console.log('🎟️ [Megapot] First purchase SUCCESS detected → enabling persistent banner');
      setHasPurchased(true);
      try { localStorage.setItem('megapot_has_purchased', 'true'); } catch {}
    }
  }, [activeTransaction?.status]);

  // Whenever eligible and hasPurchased, show banner
  useEffect(() => {
    if (MEGAPOT_HIDDEN) return;
    if (hasPurchased && eligibility === 'eligible' && !hasClaimed) {
      setShowClaimBanner(true);
    }
  }, [hasPurchased, eligibility, hasClaimed]);

  // Eligibility will be checked on claim click; keep banner simple post-purchase

  // Remove proactive eligibility: banner requires first purchase

  const handleClaimClick = async () => {
    const wallet = getEvmWalletAddress();
    if (!wallet) {
      setClaimError('No EVM wallet found');
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(null);
    try {
      console.log('🚀 [Megapot] Claiming free ticket...', { wallet });
      const res = await fetch(`/api/megapot/claim`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      console.log('📬 [Megapot] Claim response:', { status: res.status, data });
      if (!res.ok) {
        const errMsg = data?.error || 'Claim failed';
        setClaimError(errMsg);
        // If upstream indicates already claimed / ineligible, persist and hide
        const alreadyClaimed = (
          (typeof errMsg === 'string' && /already|claimed|ineligible/i.test(errMsg)) ||
          data?.eligible === false
        );
        if (alreadyClaimed) {
          try { localStorage.setItem('megapot_claimed', 'true'); } catch {}
          setHasClaimed(true);
          setShowClaimBanner(false);
          setEligibility('ineligible');
        }
        setIsClaiming(false);
        return;
      }
      if (data?.success) {
        setClaimSuccess({ tx: data.receipt });
        console.log('✅ [Megapot] Ticket claimed successfully:', data.receipt);
        try {
          localStorage.setItem('megapot_claimed', 'true');
        } catch {}
        setHasClaimed(true);
        setShowClaimBanner(false);
          } else if (data?.eligible === false) {
        setClaimError(data?.error || 'Not eligible');
      } else {
        setClaimError('Unexpected response');
      }
    } catch (e: any) {
      console.error('💥 [Megapot] Claim error:', e?.message || e);
      setClaimError(e?.message || 'Unexpected error');
    } finally {
      setIsClaiming(false);
    }
  };

  // Keep success banner visible so the user can click the view button

  useEffect(() => {
    if (activeTransaction?.status === 'success') {
      // Refresh portfolio view and immediately show claim banner UI
      try { localStorage.setItem('megapot_has_purchased', 'true'); } catch {}
      setHasPurchased(true);
      setShowClaimBanner(true);
      try { localStorage.setItem('megapot_last_purchase_ts', String(Date.now())); } catch {}
      refetch();
      // Broadcast a portfolio refresh so child components (e.g., StocksCard) update
      try { window.dispatchEvent(new Event('portfolio:refresh')); } catch {}
      const timer = setTimeout(() => {
        clearTransaction();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeTransaction, refetch, clearTransaction]);

  // Console log the user's Solana address and portfolio details
  useEffect(() => {
    if (portfolioData && portfolioData.stocks.length > 0) {
      console.log('🔑 [HomePage] User ID:', userId);
      console.log('💰 [HomePage] Portfolio Value:', `$${portfolioData.portfolioValue.toFixed(2)}`);
      console.log('📊 [HomePage] Portfolio Details:', {
        totalStocks: portfolioData.totalStocks,
        stocksWithValue: portfolioData.stocksWithValue,
        stocks: portfolioData.stocks.map(stock => ({
          symbol: stock.symbol,
          balance: stock.balance,
          pricePerToken: stock.pricePerToken,
          totalValue: stock.totalValue,
          mint: stock.mint
        }))
      });
      
      // Try to retrieve Solana address from localStorage if available
      if (typeof window !== 'undefined') {
        const walletAddress = localStorage.getItem('walletAddress') || 
                            localStorage.getItem('solanaAddress') ||
                            localStorage.getItem('publicKey');
        if (walletAddress) {
          console.log('🔑 [HomePage] Solana Wallet Address (from localStorage):', walletAddress);
        } else {
          console.log('🔍 [HomePage] Solana Wallet Address not found in localStorage');
        }
      }
    }
  }, [portfolioData, userId]);

  const handleBuyClick = (stockName: string, stockIcon: React.ReactNode) => {
    setSelectedStock({name: stockName, icon: stockIcon});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStock(null);
  };

  // Callback to start tracking when a transaction begins
  const handleTransactionStart = (transferId: string, stockName: string, amount: string) => {
    console.log('🎯 [HomePage] handleTransactionStart called with:', { transferId, stockName, amount });
    console.log('🎯 [HomePage] Current userId:', userId);
    console.log('🎯 [HomePage] Current activeTransaction:', activeTransaction);
    
    if (!userId) {
      console.error('❌ [HomePage] Cannot start tracking - no userId available');
      console.error('❌ [HomePage] Auth status check:');
      console.error('   - worldAuth:', localStorage.getItem('worldAuth'));
      console.error('   - authToken:', localStorage.getItem('authToken'));
      console.error('   - jwt:', localStorage.getItem('jwt'));
    } else {
      console.log('✅ [HomePage] Starting transaction tracking...');
      startTracking(transferId, stockName, amount);
      console.log('✅ [HomePage] Transaction tracking started, closing modal');
      
      // 🆕 Immediately refetch portfolio after successful purchase
      console.log('🔄 [HomePage] Immediately refreshing portfolio after purchase...');
      refetch();
    }
    
    handleCloseModal();
  };

  // Function to map portfolio symbols to stock detail routes
  const getStockRoute = (portfolioSymbol: string) => {
    const symbolMappings: { [key: string]: string } = {
      // Crypto shortcuts
      'sol': 'solana',
      'solana': 'solana',
      'wsol': 'solana',
      'google': 'google',
      'googl': 'google',
      'goog': 'google',
      'alphabet': 'google',
      'alphabet inc.': 'google',
      'tesla': 'tesla',
      'tsla': 'tesla',
      'tesla inc.': 'tesla',
      'apple': 'apple',
      'aapl': 'apple',
      'apple inc.': 'apple',
      'amazon': 'amazon',
      'amzn': 'amazon',
      'amazon.com inc.': 'amazon',
      'spy': 'spy',
      'spdr s&p 500 etf': 'spy',
      'circle': 'circle',
      'crcl': 'circle',
      'circle internet financial': 'circle',
      'hood': 'hood',
      'robinhood': 'hood',
      'robinhood markets inc.': 'hood',
      'meta': 'meta',
      'fb': 'meta',
      'meta platforms inc.': 'meta',
      'microstrategy': 'microstrategy',
      'mstr': 'microstrategy',
      'microstrategy inc.': 'microstrategy',
      'nvidia': 'nvidia',
      'nvda': 'nvidia',
      'nvidia corporation': 'nvidia'
    };
    
    const normalizedSymbol = portfolioSymbol.toLowerCase().trim();
    console.log('🗺️ [getStockRoute] Input symbol:', portfolioSymbol);
    console.log('🗺️ [getStockRoute] Normalized symbol:', normalizedSymbol);
    console.log('🗺️ [getStockRoute] Available mappings:', Object.keys(symbolMappings));
    
    const mappedRoute = symbolMappings[normalizedSymbol] || normalizedSymbol;
    console.log('🗺️ [getStockRoute] Mapped route:', mappedRoute);
    
    return mappedRoute;
  };

const handleStockClick = (stockSymbol: string) => {
  try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {}
  console.log('🎯 [HomePage] handleStockClick called with symbol:', stockSymbol);
  const sym = (stockSymbol || '').toLowerCase();
  // Route crypto holdings to crypto detail pages
  const cryptoSlugs = ['sol', 'solana', 'wsol', 'bonk', 'wif', 'dogwifhat', 'jup', 'jupiter', 'popcat', 'pengu', 'trump', 'melania', 'pump', 'pepe', 'pepecoin', 'fart', 'fartcoin', 'wlfi', 'useless'];
  if (cryptoSlugs.includes(sym)) {
    console.log('🎯 [HomePage] Detected crypto symbol, routing to crypto-detail:', sym);
    // Map common tickers to our route slug
    const mapSlug: Record<string, string> = {
      wif: 'dogwifhat',
      jup: 'jupiter',
      pepe: 'pepecoin',
      fart: 'fartcoin',
    };
    const slug = mapSlug[sym] || (['sol', 'wsol'].includes(sym) ? 'solana' : sym);
    router.push(`/crypto-detail/${slug}`);
    return;
  }
  const route = getStockRoute(stockSymbol);
  console.log('🎯 [HomePage] Mapped route:', route);
  console.log('🎯 [HomePage] Final URL:', `/stock-detail/${route}`);
  router.push(`/stock-detail/${route}`);
};

  const handleCryptoClick = (cryptoSymbol: string) => {
    console.log('🎯 [HomePage] handleCryptoClick called with symbol:', cryptoSymbol);
    router.push(`/crypto-detail/${(cryptoSymbol || 'solana').toLowerCase()}`);
  };

  // Handle successful World ID authentication
  const handleAuthSuccess = (walletAddress: string, username: string) => {
    console.log('✅ [HomePage] Authentication successful, refreshing page state...');
    
    // Re-check authentication state
    const worldAuth = localStorage.getItem('worldAuth');
    const authToken = localStorage.getItem('authToken');
    
    if (worldAuth && authToken) {
      try {
        const authData = JSON.parse(worldAuth);
        if (authData.user && authData.token) {
          setIsAuthenticated(true);
          const id = authData.user._id || authData.user.id;
          setUserId(id);
          setUsername(username.replace(' User', ''));
          console.log('✅ [HomePage] User authenticated with ID:', id);
          try {
            window.dispatchEvent(new CustomEvent('world-auth-success', {
              detail: { userId: id, walletAddress }
            }));
            window.dispatchEvent(new Event('portfolio:refresh'));
          } catch {}
        }
      } catch (error) {
        console.error('❌ [HomePage] Error parsing auth data after success:', error);
      }
    }
  };

  // Function to get token information with its real price,
  const getTokenData = (mint: string, symbol: string, name: string) => {
    const tokenPrice = getPrice(mint);
    return {
      mint,
      symbol,
      name,
      price: tokenPrice ? tokenPrice.priceInUsdc : 0,
      priceFormatted: getPriceFormatted(mint),
      priceChange: tokenPrice ? tokenPrice.priceChangePercent : 0,
      isPositive: tokenPrice ? tokenPrice.priceChangePercent >= 0 : false,
      isLoading: isLoading && !tokenPrice
    };
  };

  // Token configuration with mapping to real addresses
  const yourStocksData = getTokenData(COMMON_TOKENS.GOOGLE, 'Google', 'Alphabet Inc.');
  const allStocksData = [
    getTokenData(COMMON_TOKENS.TESLA, 'Tesla', 'Tesla Inc.'),
    getTokenData(COMMON_TOKENS.SPY, 'SPY', 'SPDR S&P 500 ETF'),
    getTokenData(COMMON_TOKENS.GOOGLE, 'Google', 'Alphabet Inc.'),
    getTokenData(COMMON_TOKENS.APPLE, 'Apple', 'Apple Inc.'),
    getTokenData(COMMON_TOKENS.AMAZON, 'Amazon', 'Amazon.com Inc.'),
    getTokenData(COMMON_TOKENS.CIRCLE, 'Circle', 'Circle Internet Financial'),
    getTokenData(COMMON_TOKENS.ROBINHOOD, 'Hood', 'Robinhood Markets Inc.'),
    getTokenData(COMMON_TOKENS.META, 'Meta', 'Meta Platforms Inc.'),
    getTokenData(COMMON_TOKENS.MICROSTRATEGY, 'MicroStrategy', 'MicroStrategy Inc.'),
    getTokenData(COMMON_TOKENS.NVIDIA, 'Nvidia', 'NVIDIA Corporation')
  ];

  // Crypto tokens
  const solanaData = getTokenData(COMMON_TOKENS.SOL, 'Solana', 'Solana');

  // List of supported cryptos for the Crypto tab
  const CRYPTO_LIST = [
    { key: 'bonk', name: 'BONK', mint: COMMON_TOKENS.BONK, slug: 'bonk' },
    { key: 'dogwifhat', name: 'Dogwifhat', mint: COMMON_TOKENS.WIF, slug: 'dogwifhat' },
    { key: 'jupiter', name: 'Jupiter', mint: COMMON_TOKENS.JUP, slug: 'jupiter' },
    { key: 'popcat', name: 'Popcat', mint: COMMON_TOKENS.POPCAT, slug: 'popcat' },
    { key: 'pengu', name: 'PENGU', mint: COMMON_TOKENS.PENGU, slug: 'pengu' },
    { key: 'trump', name: 'TRUMP', mint: COMMON_TOKENS.TRUMP, slug: 'trump' },
    { key: 'melania', name: 'MELANIA', mint: COMMON_TOKENS.MELANIA, slug: 'melania' },
    { key: 'pump', name: 'Pump', mint: COMMON_TOKENS.PUMP, slug: 'pump' },
    { key: 'pepecoin', name: 'PEPEcoin', mint: COMMON_TOKENS.PEPECOIN, slug: 'pepecoin' },
    { key: 'fartcoin', name: 'Fartcoin', mint: COMMON_TOKENS.FARTCOIN, slug: 'fartcoin' },
    { key: 'wlfi', name: 'WLFI', mint: COMMON_TOKENS.WLFI, slug: 'wlfi' },
    { key: 'useless', name: 'Useless', mint: COMMON_TOKENS.USELESS, slug: 'useless' },
  ] as const;

  // Local price cache for crypto tab (fallback to Jupiter when backend doesn't provide these)
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, string>>({});
  const [cryptoMarketCaps, setCryptoMarketCaps] = useState<Record<string, string>>({});
  const [cryptoChanges, setCryptoChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use local Next.js API proxy to avoid CORS issues in production
        const tokens = CRYPTO_LIST.map((c) => ({ mint: c.mint, symbol: c.name }));
        console.log('🧭 [CryptoPrices] Fetching prices via proxy', { count: tokens.length, tokens });
        let resp = await fetch(`/api/crypto/prices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokens })
        });
        console.log('🧭 [CryptoPrices] Response status', resp.status, resp.statusText);
        if (!resp.ok && (resp.status === 405 || resp.status === 404)) {
          // Fallback to GET with query string if POST not allowed
          const qs = encodeURIComponent(JSON.stringify(tokens));
          console.warn('↩️ [CryptoPrices] Falling back to GET due to', resp.status);
          resp = await fetch(`/api/crypto/prices?tokens=${qs}`);
          console.log('🧭 [CryptoPrices] GET fallback status', resp.status, resp.statusText);
        }
        // Final fallback: call backend directly if proxy route isn't available
        if (!resp.ok) {
          const base = (process?.env?.NEXT_PUBLIC_BACKEND_URL as string) || 'https://world-stocks.onrender.com';
          try {
            console.warn('↩️ [CryptoPrices] Falling back to backend directly at', base);
            resp = await fetch(`${base}/api/jupiter/prices`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ tokens })
            });
            console.log('🧭 [CryptoPrices] Direct backend status', resp.status, resp.statusText);
          } catch (e) {
            console.warn('⚠️ [CryptoPrices] Direct backend call failed', e);
          }
        }
        if (!resp.ok) {
          const txt = await resp.text();
          console.warn('⚠️ [CryptoPrices] Non-OK response body:', txt?.slice(0, 300));
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();
        console.log('🧭 [CryptoPrices] Parsed response keys', Object.keys(data || {}));
        if (!mounted || !data) return;
        const now: Record<string, string> = {};
        for (const c of CRYPTO_LIST) {
          const entry = data[c.name];
          const v = entry?.price || 0;
          if (v > 0) now[c.key] = v >= 1 ? `$${v.toFixed(2)}` : v >= 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(6)}`;
          else console.log(`ℹ️ [CryptoPrices] Missing/zero price for`, c.name, entry);
        }
        setCryptoPrices(now);
        console.log('✅ [CryptoPrices] Loaded prices', now);
      } catch (e) {
        console.warn('⚠️ [HomePage] Failed to fetch crypto prices via backend', e);
        if (mounted) {
          const fallback: Record<string, string> = {};
          for (const c of CRYPTO_LIST) fallback[c.key] = 'N/A';
          setCryptoPrices(fallback);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use local Next.js API proxy to avoid CORS issues in production
        console.log('🧭 [MarketCaps] Fetching market caps via proxy', { mints: CRYPTO_LIST.map(c => c.mint) });
        let resp = await fetch(`/api/crypto/market-caps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mints: CRYPTO_LIST.map(c => c.mint) })
        });
        console.log('🧭 [MarketCaps] Response status', resp.status, resp.statusText);
        if (!resp.ok && (resp.status === 405 || resp.status === 404)) {
          // Fallback to GET with query string if POST not allowed
          const mints = CRYPTO_LIST.map(c => c.mint);
          const qs = encodeURIComponent(JSON.stringify(mints));
          console.warn('↩️ [MarketCaps] Falling back to GET due to', resp.status);
          resp = await fetch(`/api/crypto/market-caps?mints=${qs}`);
          console.log('🧭 [MarketCaps] GET fallback status', resp.status, resp.statusText);
        }
        // Final fallback: call backend directly if proxy route isn't available
        if (!resp.ok) {
          const base = (process?.env?.NEXT_PUBLIC_BACKEND_URL as string) || 'https://world-stocks.onrender.com';
          try {
            const mints = CRYPTO_LIST.map(c => c.mint);
            console.warn('↩️ [MarketCaps] Falling back to backend directly at', base);
            resp = await fetch(`${base}/api/jupiter/market-caps`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ mints })
            });
            console.log('🧭 [MarketCaps] Direct backend status', resp.status, resp.statusText);
          } catch (e) {
            console.warn('⚠️ [MarketCaps] Direct backend call failed', e);
          }
        }
        if (!resp.ok) {
          const txt = await resp.text();
          console.warn('⚠️ [MarketCaps] Non-OK response body:', txt?.slice(0, 300));
          throw new Error(`HTTP ${resp.status}`);
        }
        const result = await resp.json();
        console.log('🧭 [MarketCaps] Parsed response shape', { keys: Object.keys(result || {}), success: result?.success, dataKeys: Object.keys(result?.data || {}) });
        if (!mounted || !result) return;

        // Expected backend response shape:
        // { success: true, data: { [mint]: { marketCapFormatted: string, ... } } }
        const capsByKey: Record<string, string> = {};
        const changesByKey: Record<string, number> = {};

        if (result?.success && result?.data && typeof result.data === 'object') {
          for (const c of CRYPTO_LIST) {
            const byMint = result.data[c.mint];
            // Use formatted market cap if available, otherwise mark as N/A
            capsByKey[c.key] = byMint?.marketCapFormatted || 'N/A MKT CAP';
            if (typeof byMint?.priceChange24h === 'number') {
              changesByKey[c.key] = Number(byMint.priceChange24h);
            }
          }
        } else if (result && typeof result === 'object') {
          // Fallback: some deployments might return a flat map already
          for (const c of CRYPTO_LIST) {
            capsByKey[c.key] = result[c.key] || result[c.mint]?.marketCapFormatted || 'N/A MKT CAP';
            const raw = (result[c.key]?.priceChange24h ?? result[c.mint]?.priceChange24h);
            if (typeof raw === 'number') changesByKey[c.key] = Number(raw);
          }
        }

        setCryptoMarketCaps(capsByKey);
        setCryptoChanges(changesByKey);
        console.log('✅ [MarketCaps] Loaded caps', capsByKey, 'changes', changesByKey);
      } catch (e) {
        console.warn('⚠️ [HomePage] Failed to fetch crypto market caps via backend', e);
        if (mounted) {
          const fallbackCaps: Record<string, string> = {};
          for (const c of CRYPTO_LIST) fallbackCaps[c.key] = 'N/A MKT CAP';
          setCryptoMarketCaps(fallbackCaps);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Debug summary whenever crypto state updates
  useEffect(() => {
    const summary = CRYPTO_LIST.map(c => ({
      key: c.key,
      price: cryptoPrices[c.key],
      marketCap: cryptoMarketCaps[c.key],
      change: cryptoChanges[c.key],
    }));
    console.log('📊 [CryptoDebug] State summary', summary);
  }, [cryptoPrices, cryptoMarketCaps, cryptoChanges]);

  // Calculate portfolio statistics
  const portfolioStats = portfolioData ? (() => {
    const totalValue = portfolioData.portfolioValue;

    // Calculate weighted daily change in USD based on each token's 24h price change
    let weightedChangeUsd = 0;
    portfolioData.stocks.forEach((stock) => {
      const tokenPrice = getPrice(stock.mint);
      if (tokenPrice && tokenPrice.priceChangePercent !== undefined) {
        // 🛡️ Sanitise extreme values to avoid corrupted percentages
        const cappedChange = Math.min(Math.max(tokenPrice.priceChangePercent, -100), 100);
        // Calculate the change in USD for this stock position
        const previousValue = stock.totalValue / (1 + cappedChange / 100);
        const changeInUsd = stock.totalValue - previousValue;
        weightedChangeUsd += changeInUsd;
      }
    });

    const totalChangePercent = totalValue > 0 ? (weightedChangeUsd / (totalValue - weightedChangeUsd)) * 100 : 0;

    return {
      totalValue,
      totalChange: totalChangePercent,
      totalChangeUsd: weightedChangeUsd,
      isPositive: totalChangePercent >= 0,
    };
  })() : null;

  // Precompute filtered stocks and counts for the Your Stocks section
  const stocksWithValue = portfolioData?.stocks ? portfolioData.stocks
    .filter((stock) => stock.totalValue > 0)
    .filter((stock) => {
      const sym = (stock.symbol || '').toLowerCase();
      const name = (stock.name || '').toLowerCase();
      const isSolMint = stock.mint === COMMON_TOKENS.SOL;
      const isSolSymbol = sym === 'sol' || sym === 'wsol' || sym === 'solana';
      const isSolName = name === 'solana';
      return !(isSolMint || isSolSymbol || isSolName);
    }) : [];
  const numStocksWithValue = stocksWithValue.length;

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // No separate login page anymore; auth panel is auto-triggered if needed

  // NVIDIA visible for everyone
  const showNvidia = true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white partner-skin">
      {/* Header, */}
      <header className="flex justify-between items-center mb-8 px-4 pt-4">
        {/* Left side - Welcome message, */}
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👋</span>
          <span className="text-lg font-medium">{t('common.welcome')} {username} !</span>
        </div>
        
        {/* Right side - Info button and Language selector */}
        <div className="flex items-center space-x-3">
          {/* Info button */}
          <button 
            onClick={() => setIsInfoModalOpen(true)}
            className="bg-[#f4f4f5] rounded-lg px-3 py-2 flex items-center justify-center hover:bg-[#e4e4e7] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.08984 9.00008C9.32495 8.33175 9.789 7.76819 10.3998 7.40921C11.0106 7.05024 11.7287 6.91902 12.427 7.03879C13.1253 7.15857 13.7587 7.52161 14.2149 8.06361C14.6712 8.60561 14.9209 9.2916 14.9198 10.0001C14.9198 12.0001 11.9198 13.0001 11.9198 13.0001M12 17H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          {/* Language selector */}
          <div className="relative language-selector">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="bg-[#f4f4f5] rounded-lg px-3 py-2 flex items-center space-x-2 hover:bg-[#e4e4e7] transition-colors"
            >
              {language === 'en' && <USFlag />}
              {language === 'fr' && <FrenchFlag />}
              {language === 'es' && <SpanishFlag />}
              {language === 'id' && <IndonesianFlag />}
              <svg className={`w-3 h-3 text-gray-600 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Language dropdown */}
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    setLanguage('en');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  <USFlag />
                  <span className="text-sm">English</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('fr');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <FrenchFlag />
                  <span className="text-sm">Français</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('es');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <SpanishFlag />
                  <span className="text-sm">Español</span>
                </button>
                <button
                  onClick={() => {
                    setLanguage('id');
                    setIsLanguageDropdownOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 hover:bg-gray-50 transition-colors rounded-b-lg"
                >
                  <IndonesianFlag />
                  <span className="text-sm">Bahasa Indonesia</span>
                </button>
              </div>
            )}
          </div>

          {/* Targeted logout button removed */}
        </div>
      </header>
      
      <div className="container mx-auto max-w-4xl">
        {/* Transaction Tracker - Displayed above StocksCard */}
        <TransactionTracker 
          transaction={activeTransaction}
          onDismiss={clearTransaction}
        />
        
        {/* Address-gated World App banner (visible only to target wallet) */}
        {showWorldBanner && (
          <div className="mx-auto -mt-1 mb-3 w-full" style={{ maxWidth: 390 }}>
            <button
              onClick={openWorldMiniApp}
              className="block w-full rounded-3xl overflow-hidden focus:outline-none"
              aria-label="Open World App Mini-App"
            >
              <Image
                src={worldBanner}
                alt="Open in World App"
                priority
                sizes="(max-width: 390px) 100vw, 390px"
                className="rounded-3xl w-full h-auto"
                style={{ borderRadius: 24, width: '100%', height: 'auto' }}
              />
            </button>
          </div>
        )}
        
        <div className="flex justify-center">
          <StocksCard />
        </div>
        
        {/* Your Stocks Card - Only displays if there are stocks in the portfolio */}
        {!portfolioLoading && !portfolioError && portfolioData && portfolioData.stocks.length > 0 && portfolioData.stocks.filter(stock => stock.totalValue > 0).length > 0 && (
          <>
            {/* Separator line */}
            <div className="w-full h-px bg-[#E4E4E7] mt-6 mb-6"></div>
            
            <div className="bg-white rounded-3xl shadow-sm p-5 max-w-md mx-auto">
              {/* Header row */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[#71717A] font-medium">{t('common.yourStocks')}</h2>
                  <a
                    href="https://xstocks.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Learn more about xStocks"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-black text-black text-xs"
                    title="xStocks"
                  >
                    ?
                  </a>
                </div>
                <div className="text-sm">
                  <span className="text-[#18181B]">{t('common.today')} </span>
                  <span className={portfolioStats?.isPositive ? "text-[#1BC24D] font-bold" : "text-[#EF4444] font-bold"}>
                    {portfolioStats ? `${portfolioStats.totalChange >= 0 ? '+' : ''}${portfolioStats.totalChange.toFixed(2)}%` : "No data"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {/* Display each stock */}
                {(showAllStocks ? stocksWithValue : stocksWithValue.slice(0, 5)).map((stock, index) => (
                  <div 
                    key={stock.mint || index} 
                    className="grid grid-cols-[1fr_90px_48px] items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      console.log('🎯 [Portfolio Stock] Row clicked for:', stock.symbol);
                      handleStockClick(stock.symbol.toLowerCase());
                    }}
                  >
                    {/* Left side - Stock info */}
                    <div className="flex items-center space-x-3">
                      {getStockIcon(stock.symbol)}
                      <div>
                        <div className="text-[#18181B] font-medium text-base">{(() => {
                          // Map symbols to full company names
                      const symbolMappings: { [key: string]: string } = {
                        'sol': 'Solana',
                        'solana': 'Solana',
                        'wsol': 'Solana',
                        'google': 'Google',
                        'googl': 'Google', 
                        'goog': 'Google',
                        'alphabet': 'Google',
                        'alphabet inc.': 'Google',
                            'tesla': 'Tesla',
                            'tsla': 'Tesla',
                            'tesla inc.': 'Tesla',
                            'apple': 'Apple',
                            'aapl': 'Apple',
                            'apple inc.': 'Apple',
                            'amazon': 'Amazon',
                            'amzn': 'Amazon',
                            'amazon.com inc.': 'Amazon',
                            'spy': 'SPY',
                            'spdr s&p 500 etf': 'SPY',
                            'circle': 'Circle',
                            'crcl': 'Circle',
                            'circle internet financial': 'Circle',
                            'hood': 'Hood',
                            'robinhood': 'Hood',
                            'robinhood markets inc.': 'Hood',
                            'meta': 'Meta',
                            'fb': 'Meta',
                            'meta platforms inc.': 'Meta',
                            'microstrategy': 'MicroStrategy',
                            'mstr': 'MicroStrategy',
                            'microstrategy inc.': 'MicroStrategy',
                            'nvidia': 'Nvidia',
                            'nvda': 'Nvidia',
                            'nvidia corporation': 'Nvidia'
                          };
                          const normalizedSymbol = stock.symbol.toLowerCase().trim();
                          return symbolMappings[normalizedSymbol] || stock.symbol;
                        })()}</div>
                        <div className="text-[#71717A] text-sm">
                          ${stock.totalValue.toFixed(2)} {t('common.value')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle - Price info */}
                    <div className="text-right w-[90px]">
                      <div className="text-[#18181B] font-medium text-base">
                        {(() => {
                          const p = Number(stock.pricePerToken) || 0;
                          if (p >= 1) return `$${p.toFixed(2)}`;
                          if (p >= 0.01) return `$${p.toFixed(4)}`;
                          return `$${p.toFixed(6)}`;
                        })()}
                      </div>
                      {(() => {
                        const tokenPrice = getPrice(stock.mint);
                        const priceChange = tokenPrice ? tokenPrice.priceChangePercent : 0;
                        const isPositive = priceChange >= 0;
                        const formattedChange = `${isPositive ? '+' : ''}${priceChange.toFixed(2)}%`;
                        return (
                          <div className={isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                            {formattedChange}
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Right side - Long thin arrows */}
                    <div className="flex justify-end w-[48px]">
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="38" height="38" rx="9" fill="white"/>
                        <rect x="1" y="1" width="38" height="38" rx="9" stroke="#21D55A" strokeWidth="2"/>
                        <path d="M29 24L25 28M25 28L21 24M25 28V12M11 16L15 12M15 12L19 16M15 12V28" stroke="#21D55A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ))}

                
              </div>
            </div>
          </>
        )}
        {/* Placeholder Your Stocks - affiché, quand loading,,,ßß ou aucune donnée en cache */}
        {(portfolioLoading || !portfolioData) && (
          <>
            {/* Separator line (même espace visuel) */}
            <div className="w-full h-px bg-[#E4E4E7] mt-6 mb-6"></div>

            <div className="bg-white rounded-3xl shadow-sm p-5 max-w-md mx-auto animate-pulse">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[#71717A] font-medium">{t('common.yourStocks')}</h2>
                <div className="h-4 w-16 bg-[#E4E4E7] rounded"></div>
              </div>

              {/* 3 lignes skeleton */}
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="grid grid-cols-[1fr_90px_48px] items-center gap-4">
                    {/* left */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#E4E4E7] rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-[#E4E4E7] rounded"></div>
                        <div className="h-3 w-32 bg-[#E4E4E7] rounded"></div>
                      </div>
                    </div>
                    {/* middle */}
                    <div className="h-4 w-[90px] bg-[#E4E4E7] rounded"></div>
                    {/* right */}
                    <div className="h-10 w-12 bg-[#E4E4E7] rounded-lg justify-self-end"></div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Megapot Claim Success Banner */}
        {!MEGAPOT_HIDDEN && claimSuccess && (
          <div className="max-w-md mx-auto mt-4">
            <div className="bg-[#f2fcf9] border border-[#21D55A33] rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 flex items-center justify-center">
                    <img src="/megapot-logo.png" alt="Megapot Logo" width="36" height="36" className="object-contain"/>
                  </div>
                </div>
                <div className="text-[#0F172A] font-semibold">
                  {t('megapot.claimSuccess')}
                </div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <a
                  href={MINI_APP_WEB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center no-underline text-[#18181B] rounded-xl px-4 whitespace-nowrap text-sm`}
                  style={{
                    width: 89,
                    height: 36,
                    background: '#62D65B',
                    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 3px 0px rgba(0,0,0,0.10)'
                  }}
                >
                  {t('megapot.view')}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Megapot Banners (First-Trade or Claim): below Your Stocks, above All Stocks */}
        {(() => {
          if (MEGAPOT_HIDDEN) return null;
          const isGeoBlocked = clientCountry ? GEO_BLOCKED_COUNTRIES.includes(clientCountry) : false;
          if (hasClaimed) return null; // nothing after claim on future visits
          // 1) Before first purchase → show First-Trade banner
          if (!hasPurchased && !isGeoBlocked) {
            return (
              <div className="max-w-md mx-auto mt-4">
                <div className="bg-white border border-[#21D55A33] rounded-2xl px-4 py-3 flex items-center justify-between" style={{
                  background: 'linear-gradient(90deg, rgba(98, 214, 91, 0.38) 0%, rgba(98, 214, 91, 0) 50%, rgba(98, 214, 91, 0.17) 100%)'
                }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 flex items-center justify-center">
                        <img src="/megapot-logo.png" alt="Megapot Logo" width="36" height="36" className="object-contain"/>
                      </div>
                    </div>
                    <div className="text-[#18181B] font-semibold">
                      {t('megapot.firstTradeBanner')}
                    </div>
                  </div>
                  <div className="flex-shrink-0 cad-logo-container relative">
                    <div className="cad-logo-first-wrapper w-12 h-12 flex items-center justify-center relative z-10" style={{
                      transform: 'translateX(0px) translateY(-4px) rotate(12deg) scale(1.4)', opacity: 1, transition: 'all 0.3s ease'
                    }}>
                      <img src="/cad-logo.png" alt="Gift" width="42" height="42" className="object-contain" style={{ filter: 'brightness(1) contrast(1) saturate(1)', borderRadius: 4 }}/>
                    </div>
                    <div className="cad-logo-second-wrapper w-12 h-12 flex items-center justify-center absolute top-0 left-0" style={{
                      transform: 'translateX(2px) translateY(8px) rotate(12deg) scale(1.3)', opacity: 0.6, zIndex: 5, overflow: 'hidden'
                    }}>
                      <img src="/cad-logo.png" alt="Gift shadow" width="42" height="42" className="object-contain" style={{ filter: 'brightness(0.8) contrast(1) saturate(0.8)', borderRadius: 4, clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 30%)' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          // 2) After purchase → show Claim banner with Get button (eligibility checked on claim)
          if ((showClaimBanner || hasPurchased) && !isGeoBlocked && eligibility === 'eligible') {
            return (
              <div className="max-w-md mx-auto mt-4">
                <div className="bg-[#f2fcf9] border border-[#21D55A33] rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-9 h-9 flex items-center justify-center">
                        <img src="/megapot-logo.png" alt="Megapot Logo" width="36" height="36" className="object-contain"/>
                      </div>
                    </div>
                    <div className="text-[#0F172A] font-semibold">
                      {t('megapot.claimCongrats')}
                    </div>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <button
                      onClick={handleClaimClick}
                      disabled={isClaiming}
                      className={`inline-flex items-center justify-center text-[#18181B] rounded-xl px-4 whitespace-nowrap ${isClaiming ? 'text-xs' : 'text-sm'}`}
                      style={{ width: 89, height: 36, background: '#62D65B', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.06), 0px 1px 3px 0px rgba(0,0,0,0.10)' }}
                    >
                      {isClaiming ? t('megapot.claiming') : t('megapot.claimButton')}
                    </button>
                  </div>
                </div>
                {claimError && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="text-[#ef4444] text-sm">{claimError}</div>
                    <button onClick={handleClaimClick} className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#F4F4F5] text-[#18181B] hover:bg-[#E4E4E7]">{t('common.tryAgain')}</button>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* Separator line for All Stocks */}
        <div className="w-full h-px bg-[#E4E4E7] mt-6 mb-6"></div>
        
        {/* Stocks/Crypto Tabs Card */}
        <div className="bg-white rounded-3xl shadow-sm p-5 max-w-md mx-auto mt-4">
          {/* Toggle Buttons */}
          <div className="flex mb-4">
            <button 
              onClick={() => setActiveTab('stocks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'stocks' 
                  ? 'text-[#18181B] bg-white border-[#18181B] font-medium text-sm' 
                  : 'text-[#71717A] bg-white border-white font-medium text-sm'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.875 15.3135H3.12496C2.66472 15.3135 2.29163 15.6866 2.29163 16.1468V16.9801C2.29163 17.4404 2.66472 17.8135 3.12496 17.8135H16.875C17.3352 17.8135 17.7083 17.4404 17.7083 16.9801V16.1468C17.7083 15.6866 17.3352 15.3135 16.875 15.3135Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.37496 8.22878V15.3205M15.625 8.22878V15.3205M12.0833 8.22878V15.3205M7.91663 8.22878V15.3205M9.19996 2.62545L2.72496 6.16712C2.59382 6.23887 2.4844 6.34458 2.40816 6.47316C2.33192 6.60174 2.29167 6.74847 2.29163 6.89795V7.72878C2.29163 7.86139 2.3443 7.98857 2.43807 8.08234C2.53184 8.17611 2.65902 8.22878 2.79163 8.22878H17.2083C17.3409 8.22878 17.4681 8.17611 17.5618 8.08234C17.6556 7.98857 17.7083 7.86139 17.7083 7.72878V6.89795C17.7083 6.74847 17.668 6.60174 17.5918 6.47316C17.5155 6.34458 17.4061 6.23887 17.275 6.16712L10.8 2.62545C10.5547 2.49124 10.2796 2.4209 9.99996 2.4209C9.72036 2.4209 9.44525 2.49124 9.19996 2.62545Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Stocks
            </button>
            <button 
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg border-b-2 transition-colors ${
                activeTab === 'crypto' 
                  ? 'text-[#18181B] bg-white border-[#18181B] font-medium text-sm' 
                  : 'text-[#71717A] bg-white border-white font-medium text-sm'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.50024 9.99902C2.50024 10.9839 2.69424 11.9592 3.07115 12.8691C3.44806 13.7791 4.0005 14.6059 4.69694 15.3023C5.39338 15.9988 6.22018 16.5512 7.13012 16.9281C8.04006 17.305 9.01533 17.499 10.0002 17.499C10.9852 17.499 11.9604 17.305 12.8704 16.9281C13.7803 16.5512 14.6071 15.9988 15.3035 15.3023C16 14.6059 16.5524 13.7791 16.9293 12.8691C17.3063 11.9592 17.5002 10.9839 17.5002 9.99902C17.5002 9.01411 17.3063 8.03884 16.9293 7.1289C16.5524 6.21896 16 5.39216 15.3035 4.69572C14.6071 3.99928 13.7803 3.44684 12.8704 3.06993C11.9604 2.69302 10.9852 2.49902 10.0002 2.49902C9.01533 2.49902 8.04006 2.69302 7.13012 3.06993C6.22018 3.44684 5.39338 3.99928 4.69694 4.69572C4.0005 5.39216 3.44806 6.21896 3.07115 7.1289C2.69424 8.03884 2.50024 9.01411 2.50024 9.99902Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.3335 7.50065C12.1825 7.23879 11.9632 7.0229 11.6989 6.87611C11.4347 6.72932 11.1355 6.65715 10.8335 6.66732H9.16679C8.72476 6.66732 8.30084 6.84291 7.98828 7.15547C7.67572 7.46803 7.50012 7.89196 7.50012 8.33398C7.50012 8.77601 7.67572 9.19993 7.98828 9.5125C8.30084 9.82506 8.72476 10.0007 9.16679 10.0007H10.8335C11.2755 10.0007 11.6994 10.1762 12.012 10.4888C12.3245 10.8014 12.5001 11.2253 12.5001 11.6673C12.5001 12.1093 12.3245 12.5333 12.012 12.8458C11.6994 13.1584 11.2755 13.334 10.8335 13.334H9.16679C8.8647 13.3442 8.56553 13.272 8.3013 13.1252C8.03708 12.9784 7.81775 12.7625 7.66679 12.5007M10.0001 5.83398V14.1673" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Crypto
              <Image 
                src="/new.png" 
                alt="NEW" 
                width={24} 
                height={12} 
                className="ml-1"
              />
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'stocks' && (
            <div>
          
          {/* Tesla Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Tesla info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('tesla'); }}
            >
              {/* Tesla icon */}
              <TeslaIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Tesla</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[0].isLoading ? "Loading..." : allStocksData[0].priceFormatted}
              </div>
              <div className={allStocksData[0].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[0].isLoading ? "..." : `${allStocksData[0].isPositive ? '+' : ''}${allStocksData[0].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Tesla', <TeslaIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* SPY Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - SPY info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('spy'); }}
            >
              {/* SPY icon placeholder */}
              <SPYIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">SPY</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[1].isLoading ? "Loading..." : allStocksData[1].priceFormatted}
              </div>
              <div className={allStocksData[1].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[1].isLoading ? "..." : `${allStocksData[1].isPositive ? '+' : ''}${allStocksData[1].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button, */}
            <button 
              onClick={() => handleBuyClick('SPY', <SPYIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Google Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Google info - Clickable ,*/}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('google'); }}
            >
              {/* Google icon, */}
              <GoogleIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Google</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[2].isLoading ? "Loading..." : allStocksData[2].priceFormatted}
              </div>
              <div className={allStocksData[2].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[2].isLoading ? "..." : `${allStocksData[2].isPositive ? '+' : ''}${allStocksData[2].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Google', <GoogleIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Apple Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Apple info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('apple'); }}
            >
              {/* Apple icon */}
              <AppleIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Apple</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[3].isLoading ? "Loading..." : allStocksData[3].priceFormatted}
              </div>
              <div className={allStocksData[3].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[3].isLoading ? "..." : `${allStocksData[3].isPositive ? '+' : ''}${allStocksData[3].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Apple', <AppleIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Amazon Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Amazon info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('amazon'); }}
            >
              {/* Amazon icon */}
              <AmazonIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Amazon</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[4].isLoading ? "Loading..." : allStocksData[4].priceFormatted}
              </div>
              <div className={allStocksData[4].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[4].isLoading ? "..." : `${allStocksData[4].isPositive ? '+' : ''}${allStocksData[4].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Amazon', <AmazonIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Circle Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Circle info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('circle'); }}
            >
              {/* Circle icon */}
              <CircleIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Circle</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[5].isLoading ? "Loading..." : allStocksData[5].priceFormatted}
              </div>
              <div className={allStocksData[5].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[5].isLoading ? "..." : `${allStocksData[5].isPositive ? '+' : ''}${allStocksData[5].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Circle', <CircleIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Hood Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Hood info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('hood'); }}
            >
              {/* Hood icon */}
              <HoodIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Hood</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[6].isLoading ? "Loading..." : allStocksData[6].priceFormatted}
              </div>
              <div className={allStocksData[6].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[6].isLoading ? "..." : `${allStocksData[6].isPositive ? '+' : ''}${allStocksData[6].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Hood', <HoodIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Meta Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - Meta info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('meta'); }}
            >
              {/* Meta icon */}
              <MetaIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Meta</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[7].priceFormatted}
              </div>
              <div className={allStocksData[7].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[7].isPositive ? '+' : ''}{allStocksData[7].priceChange.toFixed(2)}%
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('Meta', <MetaIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* MicroStrategy Stock */}
          <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4 mb-4">
            {/* Left side - MicroStrategy info - Clickable */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('microstrategy'); }}
            >
              {/* MicroStrategy icon */}
              <MicroStrategyIcon />
              
              {/* Company info */}
              <div>
                <div className="text-[#18181B] font-medium text-base">Strategy</div>
              </div>
            </div>
            
            {/* Middle - Price info */}
            <div className="text-right w-[90px]">
              <div className="text-[#18181B] font-medium text-base">
                {allStocksData[8].isLoading ? "Loading..." : allStocksData[8].priceFormatted}
              </div>
              <div className={allStocksData[8].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                {allStocksData[8].isLoading ? "..." : `${allStocksData[8].isPositive ? '+' : ''}${allStocksData[8].priceChange.toFixed(2)}%`}
              </div>
            </div>
            
            {/* Buy button */}
            <button 
              onClick={() => handleBuyClick('MicroStrategy', <MicroStrategyIcon />)}
              className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
            >
              {t('common.buy')}
            </button>
          </div>
          
          {/* Nvidia Stock - DEV gated by address */}
          {showNvidia && (
            <div className="grid grid-cols-[1fr_90px_96px] items-center gap-4">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {} ; handleStockClick('nvidia'); }}
              >
                <NvidiaIcon />
                
                <div>
                  <div className="text-[#18181B] font-medium text-base">Nvidia</div>
                </div>
              </div>
              
              <div className="text-right w-[90px]">
                <div className="text-[#18181B] font-medium text-base">
                  {allStocksData[9].isLoading ? "Loading..." : allStocksData[9].priceFormatted}
                </div>
                <div className={allStocksData[9].isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                  {allStocksData[9].isLoading ? "..." : `${allStocksData[9].isPositive ? '+' : ''}${allStocksData[9].priceChange.toFixed(2)}%`}
                </div>
              </div>
              
              <button 
                onClick={() => handleBuyClick('Nvidia', <NvidiaIcon />)}
                className="bg-[#F4F4F5] text-[#18181B] px-4 py-2 rounded-lg text-sm font-medium w-[96px] text-center justify-self-end"
              >
                {t('common.buy')}
              </button>
            </div>
          )}
            </div>
          )}

          {/* Crypto Tab Content */}
          {activeTab === 'crypto' && (
            <div>
              {CRYPTO_LIST.map((c) => {
                const isSol = c.key === 'solana';
                const displayPrice = cryptoPrices[c.key] || (isSol ? (solanaData.isLoading ? 'Loading...' : solanaData.priceFormatted) : 'Loading...');
                const isLoading = !cryptoPrices[c.key] && (isSol ? solanaData.isLoading : (cryptoChanges[c.key] === undefined));
                const changeValue = isSol ? solanaData.priceChange : cryptoChanges[c.key];
                const isPositive = isSol ? solanaData.isPositive : (typeof changeValue === 'number' ? changeValue >= 0 : true);
                const changeText = isLoading || typeof changeValue !== 'number' ? '...' : `${isPositive ? '+' : ''}${changeValue.toFixed(2)}%`;
                return (
                  <div key={c.key} className="grid grid-cols-[1fr_120px] items-center gap-4 mb-4">
                    <div
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => { try { sessionStorage.setItem('wld_notify_prompt', '1'); } catch {}; handleCryptoClick(c.slug); }}
                    >
                      {getCryptoIcon(c.key)}
                      <div>
                        <div className="text-[#18181B] font-medium text-base">{c.name}</div>
                        <div className="text-xs text-gray-500">{cryptoMarketCaps[c.key] || 'Loading MKT CAP...'}</div>
                      </div>
                    </div>
                    <div className="text-right w-[120px]">
                      <div className="text-[#18181B] font-medium text-base">
                        {displayPrice}
                      </div>
                      <div className={isPositive ? "text-[#1BC24D] text-sm font-bold" : "text-[#EF4444] text-sm font-bold"}>
                        {isLoading ? "..." : changeText}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Join Our Community Card */}
        <div 
          className="bg-gradient-to-r from-[#F2FFF2] via-white to-[#F2FFF2] rounded-3xl border border-[#E4E4E7] shadow-sm p-5 max-w-md mx-auto mt-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => window.open('https://chat.whatsapp.com/JfxUuYfuOVHHcPnDOrJmBY', '_blank')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-[#18181B] font-medium text-lg mb-1">Join Our Community</h2>
              <p className="text-[#18181B] text-sm">📈 For free stock opportunities and new offerings!</p>
            </div>
            <div className="ml-4">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="8" fill="#21D55A"/>
                <path d="M6 30L7.687 23.837C6.646 22.033 6.099 19.988 6.1 17.891C6.103 11.335 11.438 6 17.993 6C21.174 6.001 24.16 7.24 26.406 9.488C28.651 11.736 29.887 14.724 29.886 17.902C29.883 24.459 24.548 29.794 17.993 29.794C16.003 29.793 14.042 29.294 12.305 28.346L6 30ZM12.597 26.193C14.273 27.188 15.873 27.784 17.989 27.785C23.437 27.785 27.875 23.351 27.878 17.9C27.88 12.438 23.463 8.01 17.997 8.008C12.545 8.008 8.11 12.442 8.108 17.892C8.107 20.117 8.759 21.783 9.854 23.526L8.855 27.174L12.597 26.193ZM23.984 20.729C23.91 20.605 23.712 20.531 23.414 20.382C23.117 20.233 21.656 19.514 21.383 19.415C21.111 19.316 20.913 19.266 20.714 19.564C20.516 19.861 19.946 20.531 19.773 20.729C19.6 20.927 19.426 20.952 19.129 20.803C18.832 20.654 17.874 20.341 16.739 19.328C15.856 18.54 15.259 17.567 15.086 17.269C14.913 16.972 15.068 16.811 15.216 16.663C15.35 16.53 15.513 16.316 15.662 16.142C15.813 15.97 15.862 15.846 15.962 15.647C16.061 15.449 16.012 15.275 15.937 15.126C15.862 14.978 15.268 13.515 15.021 12.92C14.779 12.341 14.534 12.419 14.352 12.41L13.782 12.4C13.584 12.4 13.262 12.474 12.99 12.772C12.718 13.07 11.95 13.788 11.95 15.251C11.95 16.714 13.015 18.127 13.163 18.325C13.312 18.523 15.258 21.525 18.239 22.812C18.948 23.118 19.502 23.301 19.933 23.438C20.645 23.664 21.293 23.632 21.805 23.556C22.376 23.471 23.563 22.837 23.811 22.143C24.059 21.448 24.059 20.853 23.984 20.729Z" fill="white"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Follow us on Social Media Card */}
        <div 
          className="bg-white rounded-3xl shadow-sm p-5 max-w-md mx-auto mt-2 mb-8 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => window.open('https://x.com/stacknapp?s=21', '_blank')}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-[#18181B] font-medium text-lg">Follow us on Social Media</h2>
            </div>
            <div className="ml-4">
              <svg width="40" height="40" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd" stroke="none" strokeWidth="1" transform="translate(112 112)">
                  <path fill="#000" d="M711.111 800H88.89C39.8 800 0 760.2 0 711.111V88.89C0 39.8 39.8 0 88.889 0H711.11C760.2 0 800 39.8 800 88.889V711.11C800 760.2 760.2 800 711.111 800"/>
                  <path fill="#FFF" fillRule="nonzero" d="M628 623H484.942L174 179h143.058zm-126.012-37.651h56.96L300.013 216.65h-56.96z"/>
                  <path fill="#FFF" fillRule="nonzero" d="M219.296885 623 379 437.732409 358.114212 410 174 623z"/>
                  <path fill="#FFF" fillRule="nonzero" d="M409 348.387347 429.212986 377 603 177 558.330417 177z"/>
                </g>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Buy Modal */}
        {selectedStock && (
          <BuyModal 
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            stockName={selectedStock.name}
            stockIcon={selectedStock.icon}
            onTransactionStart={handleTransactionStart}
            onPortfolioRefresh={refetch}
          />
        )}
        
        {/* Info Modal */}
        {isInfoModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="bg-white w-full h-full overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-[#71717A] text-lg font-medium">{t('common.information')}</h2>
                <button 
                  onClick={() => setIsInfoModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#E4E4E7] flex items-center justify-center hover:bg-[#D1D1D6] transition-colors"
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M12 4L4 12M4 4L12 12" 
                      stroke="#71717A" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* First section */}
                <div>
                  <h3 className="text-[#18181B] font-bold text-lg mb-3">{t('info.whatIsTokenization')}</h3>
                  <p className="text-[#18181B] mb-4 leading-relaxed">
                    {t('info.tokenizationDesc')}
                  </p>
                  
                  {/* Example card */}
                  <div className="bg-[#f2fcf9] rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.6667 6.76063C10.6667 5.81764 10.2921 4.91327 9.62529 4.24648C8.9585 3.57968 8.05413 3.20508 7.11114 3.20508H1.7778V16.5384H8.00002C8.70727 16.5384 9.38555 16.8194 9.88564 17.3195C10.3857 17.8196 10.6667 18.4978 10.6667 19.2051M10.6667 6.76063V19.2051M10.6667 6.76063C10.6667 5.81764 11.0413 4.91327 11.7081 4.24648C12.3749 3.57968 13.2793 3.20508 14.2222 3.20508H19.5556V16.5384H13.3334C12.6261 16.5384 11.9478 16.8194 11.4477 17.3195C10.9476 17.8196 10.6667 18.4978 10.6667 19.2051M5.33336 7.64952H7.11114M5.33336 11.2051H7.11114M14.2222 7.64952H16M14.2222 11.2051H16" stroke="#62D65B" strokeWidth="1.77333" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <div className="text-[#62d65b] font-medium mb-2">{t('info.example')}</div>
                        <p className="text-[#18181b] leading-relaxed">
                          {t('info.exampleDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Separator */}
                <div className="h-px bg-gray-200"></div>
                
                {/* How WLD Flow Works */}
                <div>
                  <h3 className="text-[#18181B] font-bold text-lg mb-3">{t('info.howWldFlowWorks')}</h3>
                  <p className="text-[#18181B] leading-relaxed">
                    {t('info.howWldFlowWorksDesc')}
                  </p>
                </div>
                
                {/* Separator */}
                <div className="h-px bg-gray-200"></div>
                
                {/* What fees should I expect */}
                <div>
                  <h3 className="text-[#18181B] font-bold text-lg mb-3">{t('info.whatFees')}</h3>
                  <p className="text-[#18181B] leading-relaxed">
                    {t('info.whatFeesDesc')}
                  </p>
                </div>
                
                {/* Separator */}
                <div className="h-px bg-gray-200"></div>
                
                {/* Investment Disclaimer */}
                <div>
                  <h3 className="text-[#18181B] font-bold text-lg mb-3">{t('info.importantInformation')}</h3>
                  <p className="text-[#18181B] leading-relaxed">
                    {t('stockDetail.investingDisclaimer')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
