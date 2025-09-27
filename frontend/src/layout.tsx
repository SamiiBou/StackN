import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MiniKitWrapper from "@/components/MiniKitWrapper";
import { LanguageProvider } from '@/context/LanguageContext';
import { WalletContextProvider } from "@/context/WalletProvider";
import { DaimoPayProvider } from "@/components/DaimoPayProvider";
import { Toaster } from "react-hot-toast";
import PlatformDetector from "@/components/PlatformDetector";
import ConsoleFilter from "@/components/ConsoleFilter";
import PrefetchProvider from "@/components/PrefetchProvider";
import SolanaWalletStorageSync from "@/components/SolanaWalletStorageSync";
import PartnerUrlBanner from "@/components/PartnerUrlBanner";
import PartnerUrlEmitter from "@/components/PartnerUrlEmitter";
import Eruda from "@/components/Eruda";
import ErudaToggle from "@/components/ErudaToggle";
import TurnkeyClientProvider from "@/components/TurnkeyClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jupiter Swap & Bridge",
  description: "Swap tokens on Solana and bridge from World Chain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Eruda enabled={process.env.NEXT_PUBLIC_ENABLE_ERUDA === "true"} />
        {/* Provide manual toggle so on-device QA can enable/disable quickly */}
        {process.env.NEXT_PUBLIC_ENABLE_ERUDA === "true" && <ErudaToggle />}
        {/* Filter console to show only Mega pot related logs */}
        <ConsoleFilter />
        <PlatformDetector />
        <MiniKitWrapper>
          <TurnkeyClientProvider>
            <WalletContextProvider>
              <LanguageProvider>
                <PrefetchProvider>
                  <DaimoPayProvider>
                    <div className="min-h-screen partner-skin">
                      <SolanaWalletStorageSync />
                      {/* Partner-only URL banner (shows when ?partner=1). Wrap in Suspense per Next docs. */}
                      <Suspense fallback={null}>
                        <PartnerUrlBanner />
                      </Suspense>
                      {/* Emits current URL to parent so partner host can update its header */}
                      <Suspense fallback={null}>
                        <PartnerUrlEmitter />
                      </Suspense>
                      {children}
                    </div>
                  </DaimoPayProvider>
                </PrefetchProvider>
              </LanguageProvider>
            </WalletContextProvider>
          </TurnkeyClientProvider>
        </MiniKitWrapper>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151'
            },
          }}
        />
      </body>
    </html>
  );
}
