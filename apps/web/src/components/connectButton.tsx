"use client";

import dynamic from "next/dynamic";
import { useChain } from "@/providers/chain-provider";

const SolanaWalletButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const RainbowConnectButton = dynamic(
  async () => (await import("@rainbow-me/rainbowkit")).ConnectButton,
  { ssr: false },
);

export function ConnectButton() {
  const { chain } = useChain();
  if (chain === "bsc") {
    return (
      <RainbowConnectButton
        accountStatus="address"
        chainStatus="icon"
        showBalance={false}
      />
    );
  }
  return <SolanaWalletButton />;
}
