"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Wallet as AnchorWallet } from "@coral-xyz/anchor";
import { SourcererClient, newMintKeypair } from "@sourcerer/sdk";
import { SourcererEvmClient } from "@sourcerer/sdk-evm";
import { Transaction } from "@solana/web3.js";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChain } from "@/providers/chain-provider";
import { clientEnv } from "@/lib/env";

interface Initial {
  name: string;
  symbol: string;
  prompt: string;
  newsId?: string;
}

interface AiConcept {
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  posterUrls: string[];
  metadataUri: string;
  conceptSource?: "openrouter" | "openai" | "demo";
  warnings?: string[];
}

export function CreateTokenForm({ initial }: { initial: Initial }) {
  const { chain } = useChain();
  const [prompt, setPrompt] = useState(initial.prompt);
  const [name, setName] = useState(initial.name);
  const [symbol, setSymbol] = useState(initial.symbol);
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [posterUrls, setPosterUrls] = useState<string[]>([]);
  const [metadataUri, setMetadataUri] = useState("");
  const [generating, setGenerating] = useState(false);
  const [deploying, startDeploy] = useTransition();

  const { connection } = useConnection();
  const solWallet = useWallet();
  const evmAccount = useAccount();
  const evmPub = usePublicClient();
  const { data: evmWallet } = useWalletClient();
  const router = useRouter();

  const connected = chain === "solana" ? !!solWallet.publicKey : evmAccount.isConnected;

  async function generate() {
    if (!prompt.trim()) {
      toast.error("Drop a keyword or headline first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/token-concept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: prompt, newsId: initial.newsId }),
      });
      const raw = await res.text();
      if (!res.ok) {
        let msg = raw || `Request failed (${res.status})`;
        try {
          const j = JSON.parse(raw) as { error?: unknown };
          if (typeof j.error === "string") msg = j.error;
          else if (j.error != null) msg = JSON.stringify(j.error);
        } catch {
          /* keep msg */
        }
        throw new Error(msg);
      }
      const c: AiConcept = JSON.parse(raw) as AiConcept;
      setName(c.name);
      setSymbol(c.symbol);
      setDescription(c.description);
      setLogoUrl(c.logoUrl);
      setPosterUrls(c.posterUrls);
      setMetadataUri(c.metadataUri);
      if (c.warnings?.length) {
        c.warnings.forEach((w) => toast.message(w, { duration: 6_000 }));
      }
      toast.success(
        c.conceptSource === "demo"
          ? "Concept generated (demo / partial)"
          : c.conceptSource === "openrouter"
            ? "Concept generated (OpenRouter)"
            : "Concept generated",
      );
    } catch (err: any) {
      toast.error(err.message ?? "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function pinMetadataIfMissing(): Promise<string> {
    if (metadataUri) return metadataUri;
    const pinRes = await fetch("/api/metadata/pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, symbol, description, image: logoUrl, posters: posterUrls }),
    });
    const pin = await pinRes.json();
    return pin.uri as string;
  }

  async function deploySolana() {
    if (!solWallet.publicKey || !solWallet.signTransaction) {
      toast.error("Connect your Solana wallet");
      return;
    }
    const uri = await pinMetadataIfMissing();
    const mintKp = newMintKeypair();
    const provider = new AnchorProvider(
      connection,
      solWallet as unknown as AnchorWallet,
      { commitment: "confirmed" },
    );
    const client = new SourcererClient(provider);
    const ix = await client.createTokenIx({
      creator: solWallet.publicKey,
      mint: mintKp.publicKey,
      name,
      symbol,
      uri,
    });
    const tx = new Transaction().add(ix);
    tx.feePayer = solWallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.partialSign(mintKp);
    const signed = await solWallet.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(sig, "confirmed");
    toast.success("Token deployed");
    router.push(`/token/${mintKp.publicKey.toBase58()}`);
  }

  async function deployBsc() {
    if (!evmAccount.address || !evmPub || !evmWallet) {
      toast.error("Connect your EVM wallet");
      return;
    }
    const factory = clientEnv.NEXT_PUBLIC_SOURCERER_BSC_FACTORY;
    if (!factory) {
      toast.error("BSC factory not configured");
      return;
    }
    const uri = await pinMetadataIfMissing();
    const client = new SourcererEvmClient({
      factory: factory as `0x${string}`,
      publicClient: evmPub as any,
      walletClient: evmWallet as any,
    });
    const { token } = await client.createToken({
      name,
      symbol,
      uri,
      account: evmAccount.address,
    });
    if (!token) {
      toast.error("Could not locate new token address");
      return;
    }
    toast.success("Token deployed on BNB Chain");
    router.push(`/token/${token}`);
  }

  async function deploy() {
    if (!name || !symbol) {
      toast.error("Name and symbol are required");
      return;
    }
    startDeploy(async () => {
      try {
        if (chain === "solana") await deploySolana();
        else await deployBsc();
      } catch (err: any) {
        console.error(err);
        toast.error(err.shortMessage ?? err.message ?? "Deploy failed");
      }
    });
  }

  const nativeSymbol = chain === "solana" ? "SOL" : "BNB";
  const feeHint =
    chain === "solana"
      ? "~0.02 SOL rent + fees. No mystery line items."
      : "Pennies in BNB gas. Still beats a bridge queue.";

  return (
    <div className="comic-panel space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">chain</p>
          <p className="text-body-md font-medium text-ink">
            {chain === "solana" ? "Solana" : "BNB Chain"} · {nativeSymbol}
          </p>
        </div>
        <p className="rounded-pill border border-surface-border bg-canvas-light px-3 py-1.5 font-mono text-micro uppercase tracking-wider text-muted">
          switch in header
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="keyword, vibe, or paste a full headline"
          className="min-w-0 flex-1 rounded-pill border border-surface-border bg-canvas-light px-4 py-3 text-ui text-ink outline-none transition-all duration-150 ease-in-out focus:border-brand-500"
        />
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand-500 px-5 py-3 text-ui font-normal text-white transition-all duration-150 ease-in-out hover:bg-white hover:text-brand-500 disabled:opacity-60"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          generate package
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[140px_1fr]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-32 w-32 overflow-hidden rounded-card border border-surface-border bg-canvas-alt">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-caption text-utility-61">
                Logo
              </div>
            )}
          </div>
          <p className="text-center font-mono text-caption text-muted">generate to fill the bay</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono text-micro uppercase tracking-wider text-brand-500">
              Full name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 32))}
              placeholder="Enter token name"
              className="w-full rounded-intermediate border border-surface-border bg-canvas-light px-3 py-2 text-body-md text-ink outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-micro uppercase tracking-wider text-brand-500">
              Symbol
            </label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase().slice(0, 10))}
              placeholder="TICKER"
              className="w-full rounded-intermediate border border-surface-border bg-canvas-light px-3 py-2 font-mono text-body-md text-ink outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-micro uppercase tracking-wider text-brand-500">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-intermediate border border-surface-border bg-canvas-light px-3 py-2 text-body-md text-ink outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {posterUrls.length > 0 && (
        <div>
          <label className="mb-2 block font-mono text-micro uppercase tracking-wider text-brand-500">
            Meme posters
          </label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {posterUrls.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt="" className="aspect-square w-full rounded-intermediate object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-surface-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">{feeHint}</p>
        <button
          type="button"
          onClick={deploy}
          disabled={deploying || !connected}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-brand-500 px-6 py-2.5 text-ui font-normal text-white transition-all duration-150 ease-in-out hover:bg-white hover:text-brand-500 disabled:opacity-60"
        >
          {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {connected ? `Deploy on ${chain === "solana" ? "Solana" : "BNB Chain"}` : "Connect wallet"}
        </button>
      </div>
    </div>
  );
}
