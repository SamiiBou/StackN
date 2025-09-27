'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';

interface MiniKitWrapperProps {
  children: React.ReactNode;
}

export default function MiniKitWrapper({ children }: MiniKitWrapperProps) {
  return (
    <MiniKitProvider>
      {children}
    </MiniKitProvider>
  );
} 