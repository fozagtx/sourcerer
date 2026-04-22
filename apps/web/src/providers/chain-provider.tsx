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
  const [chain, setChainRaw] = useState<SupportedChain | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedChain | null;
      setChainRaw(stored === "bsc" || stored === "solana" ? stored : "solana");
    } catch {
      setChainRaw("solana");
    }
    setMounted(true);
  }, []);

  const setChain = useMemo(
    () => (c: SupportedChain) => {
      setChainRaw(c);
      try {
        localStorage.setItem(STORAGE_KEY, c);
      } catch {}
    },
    [],
  );

  const value = useMemo<ChainCtx>(
    () => ({ chain: chain ?? "solana", setChain }),
    [chain, setChain],
  );

  if (!mounted) {
    return (
      <Ctx.Provider value={{ chain: "solana", setChain: () => {} }}>
        {children}
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChain(): ChainCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChain must be used inside <ChainProvider>");
  return v;
}
