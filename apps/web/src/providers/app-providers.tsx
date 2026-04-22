"use client";

import { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { QueryProvider } from "@/providers/query-provider";
import { ChainProvider } from "@/providers/chain-provider";
import { SolanaWalletProvider } from "@/providers/wallet-provider";
import { EvmProvider } from "@/providers/evm-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.065,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.35,
      }}
    >
      <QueryProvider>
        <ChainProvider>
          <EvmProvider>
            <SolanaWalletProvider>{children}</SolanaWalletProvider>
          </EvmProvider>
        </ChainProvider>
      </QueryProvider>
    </ReactLenis>
  );
}
