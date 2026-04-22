"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type SupportedChain = "solana" | "bsc";

interface ChainCtx {
  chain: SupportedChain;
  setChain: (c: SupportedChain) => void;
}

const Ctx = createContext<ChainCtx | null>(null);
const STORAGE_KEY = "sourcerer-chain";

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chain, setChainState] = useState<SupportedChain>("solana");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedChain | null;
      if (stored === "bsc" || stored === "solana") setChainState(stored);
    } catch {}
  }, []);

  const value = useMemo<ChainCtx>(
    () => ({
      chain,
      setChain: (c: SupportedChain) => {
        setChainState(c);
        try {
          localStorage.setItem(STORAGE_KEY, c);
        } catch {}
      },
    }),
    [chain],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChain(): ChainCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChain must be used inside <ChainProvider>");
  return v;
}
