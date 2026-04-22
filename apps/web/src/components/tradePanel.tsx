"use client";

import { useState, useTransition } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Wallet as AnchorWallet } from "@coral-xyz/anchor";
import { SourcererClient } from "@sourcerer/sdk";
import { SourcererEvmClient } from "@sourcerer/sdk-evm";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { parseEther, parseUnits } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { toast } from "sonner";
import clsx from "clsx";
import { clientEnv } from "@/lib/env";

type Side = "buy" | "sell";
type ChainKind = "solana" | "bsc";

const BUY_PRESETS: Record<ChainKind, number[]> = {
  solana: [0.1, 0.5, 1, 5],
  bsc: [0.05, 0.1, 0.5, 1],
};

export function TradePanel({
  mint,
  symbol,
  graduated,
  chain,
}: {
  mint: string;
  symbol: string;
  graduated: boolean;
  chain: ChainKind;
}) {
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState<string>("");
  const [slippageBps, setSlippageBps] = useState<number>(100);
  const [pending, startTx] = useTransition();

  const { connection } = useConnection();
  const solWallet = useWallet();
  const evmAccount = useAccount();
  const evmPub = usePublicClient();
  const { data: evmWallet } = useWalletClient();

  const native = chain === "solana" ? "SOL" : "BNB";

  function presets() {
    return side === "buy" ? BUY_PRESETS[chain] : [25, 50, 75, 100];
  }

  async function submitSolana(amt: number) {
    if (!solWallet.publicKey || !solWallet.signTransaction) {
      toast.error("Connect Solana wallet");
      return;
    }
    const provider = new AnchorProvider(
      connection,
      solWallet as unknown as AnchorWallet,
      { commitment: "confirmed" },
    );
    const client = new SourcererClient(provider);
    const mintPk = new PublicKey(mint);
    let ix;
    if (side === "buy") {
      const solIn = BigInt(Math.floor(amt * LAMPORTS_PER_SOL));
      const quote = await client.quoteBuy(mintPk, solIn, 100);
      const minOut = (quote.tokensOut * BigInt(10_000 - slippageBps)) / 10_000n;
      ix = await client.buyIx({ trader: solWallet.publicKey, mint: mintPk, solIn, minTokensOut: minOut });
    } else {
      const tokensIn = BigInt(Math.floor(amt * 1_000_000));
      const quote = await client.quoteSell(mintPk, tokensIn, 100);
      const minOut = (quote.solOut * BigInt(10_000 - slippageBps)) / 10_000n;
      ix = await client.sellIx({ trader: solWallet.publicKey, mint: mintPk, tokensIn, minSolOut: minOut });
    }
    const tx = new Transaction().add(ix);
    tx.feePayer = solWallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signed = await solWallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, "confirmed");
  }

  async function submitBsc(amt: number) {
    if (!evmAccount.address || !evmPub || !evmWallet) {
      toast.error("Connect EVM wallet");
      return;
    }
    const factory = clientEnv.NEXT_PUBLIC_SOURCERER_BSC_FACTORY;
    if (!factory) {
      toast.error("BSC factory not configured");
      return;
    }
    const client = new SourcererEvmClient({
      factory: factory as `0x${string}`,
      publicClient: evmPub as any,
      walletClient: evmWallet as any,
    });
    const token = mint as `0x${string}`;

    if (side === "buy") {
      const bnbIn = parseEther(amt.toString());
      const { tokensOut } = await client.quoteBuy(token, bnbIn);
      const minOut = (tokensOut * BigInt(10_000 - slippageBps)) / 10_000n;
      await client.buy({ token, bnbIn, minTokensOut: minOut, account: evmAccount.address });
    } else {
      const tokensIn = parseUnits(amt.toString(), 18);
      await client.ensureApproval({ token, owner: evmAccount.address, amount: tokensIn });
      const { bnbOut } = await client.quoteSell(token, tokensIn);
      const minOut = (bnbOut * BigInt(10_000 - slippageBps)) / 10_000n;
      await client.sell({ token, tokensIn, minBnbOut: minOut, account: evmAccount.address });
    }
  }

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter an amount");
      return;
    }
    startTx(async () => {
      try {
        if (chain === "solana") await submitSolana(amt);
        else await submitBsc(amt);
        toast.success(`${side === "buy" ? "Bought" : "Sold"} ✓`);
        setAmount("");
      } catch (err: any) {
        console.error(err);
        toast.error(err.shortMessage ?? err.message ?? "Transaction failed");
      }
    });
  }

  if (graduated) {
    const venue = chain === "solana" ? "Raydium" : "PancakeSwap";
    return (
      <div className="comic-panel comic-panel--dark p-4 text-center text-body-md text-white">
        <p className="eyebrow mb-2 text-flu-green">GRADUATED</p>
        This token cleared the curve. Trade it on {venue}.
      </div>
    );
  }

  return (
    <div className="comic-panel p-4">
      <p className="eyebrow mb-3">TRADE</p>
      <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-pill border border-surface-border p-0.5">
        <button
          type="button"
          onClick={() => setSide("buy")}
          className={clsx(
            "rounded-pill py-2 text-ui font-medium transition-all duration-150 ease-in-out",
            side === "buy" ? "bg-brand-500 text-white" : "text-muted hover:bg-canvas-light hover:text-ink",
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide("sell")}
          className={clsx(
            "rounded-pill py-2 text-ui font-medium transition-all duration-150 ease-in-out",
            side === "sell" ? "bg-brand-600 text-white" : "text-muted hover:bg-canvas-light hover:text-ink",
          )}
        >
          Sell
        </button>
      </div>

      <label className="mb-1 block font-mono text-micro uppercase tracking-wider text-brand-500">
        Amount ({side === "buy" ? native : symbol})
      </label>
      <div className="mb-3 flex items-center gap-2 rounded-intermediate border border-surface-border bg-canvas-light px-3 py-2">
        <input
          type="number"
          min={0}
          step={side === "buy" ? "0.001" : "1"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-ink outline-none placeholder:text-utility-61"
          placeholder="0.0"
        />
        <span className="font-mono text-caption text-muted">{side === "buy" ? native : symbol}</span>
      </div>

      <div className="mb-3 flex gap-1">
        {presets().map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p.toString())}
            className="flex-1 rounded-pill border border-surface-border bg-canvas-light px-2 py-1.5 text-caption text-ink transition-all duration-150 ease-in-out hover:border-brand-500/50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between text-caption text-muted">
        <span className="font-mono uppercase tracking-wider">Slippage</span>
        <div className="flex gap-1">
          {[50, 100, 300].map((bps) => (
            <button
              key={bps}
              type="button"
              onClick={() => setSlippageBps(bps)}
              className={clsx(
                "rounded-pill px-2.5 py-1 font-mono text-micro transition-all duration-150 ease-in-out",
                slippageBps === bps
                  ? "bg-brand-500/15 text-brand-600"
                  : "hover:bg-canvas-alt hover:text-ink",
              )}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className={clsx(
          "w-full rounded-pill py-2.5 text-ui font-normal transition-all duration-150 ease-in-out disabled:opacity-60",
          side === "buy"
            ? "bg-brand-500 text-white hover:bg-white hover:text-brand-500"
            : "bg-brand-600 text-white hover:bg-white hover:text-brand-600",
        )}
      >
        {pending ? "Submitting…" : side === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`}
      </button>
    </div>
  );
}
