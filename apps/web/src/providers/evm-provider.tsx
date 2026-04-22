"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider, createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { useMemo, type ReactNode } from "react";
import { clientEnv } from "@/lib/env";

export function EvmProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => {
    const chain = clientEnv.NEXT_PUBLIC_BSC_CHAIN_ID === 56 ? bsc : bscTestnet;
    const projectId = clientEnv.NEXT_PUBLIC_WALLETCONNECT_ID;

    if (projectId && projectId !== "sourcerer-demo") {
      return getDefaultConfig({
        appName: "Sourcerer",
        projectId,
        chains: [chain] as const,
        transports: { [chain.id]: http(clientEnv.NEXT_PUBLIC_BSC_RPC) },
        ssr: true,
      });
    }

    // No WalletConnect id: skip the WC connector (it breaks in browsers without
    // projectId and crashes SSR with indexedDB errors).
    const connectors = connectorsForWallets(
      [
        {
          groupName: "Popular",
          wallets: [injectedWallet, metaMaskWallet, coinbaseWallet],
        },
      ],
      { appName: "Sourcerer", projectId: "sourcerer-demo" },
    );

    return createConfig({
      chains: [chain],
      connectors,
      transports: {
        [bsc.id]: http(clientEnv.NEXT_PUBLIC_BSC_RPC),
        [bscTestnet.id]: http(clientEnv.NEXT_PUBLIC_BSC_RPC),
      },
      ssr: true,
    });
  }, []);

  // Silence unused import if WC path isn't taken.
  void walletConnectWallet;

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#e6392a",
          accentColorForeground: "#FFFFFF",
          borderRadius: "large",
          fontStack: "system",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
