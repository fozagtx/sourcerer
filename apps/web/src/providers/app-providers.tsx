"use client";

import { ReactNode, useState, useEffect } from "react";
import { ReactLenis } from "lenis/react";
import { QueryProvider } from "@/providers/query-provider";
import { ChainProvider, useChain } from "@/providers/chain-provider";
import { SolanaWalletProvider } from "@/providers/wallet-provider";
import { EvmProvider } from "@/providers/evm-provider";

const STORAGE_KEY = "sourcerer-chain";

function WalletGate({ children }: { children: ReactNode }) {
  const { chain } = useChain();

  if (chain === "bsc") {
    return <EvmProvider>{children}</EvmProvider>;
  }

  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}

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
          <WalletGate>{children}</WalletGate>
        </ChainProvider>
      </QueryProvider>
    </ReactLenis>
  );
}
