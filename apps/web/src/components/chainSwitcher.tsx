"use client";

import { useChain, type SupportedChain } from "@/providers/chain-provider";
import clsx from "clsx";

const OPTIONS: Array<{ id: SupportedChain; label: string; sub: string }> = [
  { id: "solana", label: "SOL", sub: "Solana" },
  { id: "bsc", label: "BNB", sub: "BNB Chain" },
];

export function ChainSwitcher({
  className,
  tone = "surface",
}: {
  className?: string;
  tone?: "surface" | "scene";
}) {
  const { chain, setChain } = useChain();
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-pill p-0.5 text-caption font-medium shadow-elev1",
        tone === "surface" && "border border-surface-border bg-surface-elevated",
        tone === "scene" && "border border-white/25 bg-black/20 backdrop-blur-sm",
        className,
      )}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => setChain(o.id)}
          className={clsx(
            "rounded-pill px-2.5 py-1 transition-all duration-150 ease-in-out",
            tone === "surface" &&
              (chain === o.id
                ? "bg-brand-500 text-white"
                : "text-muted hover:bg-canvas-light hover:text-ink"),
            tone === "scene" &&
              (chain === o.id
                ? "bg-[#e6392a] text-white shadow-md"
                : "text-white/75 hover:bg-white/10 hover:text-white"),
          )}
          aria-pressed={chain === o.id}
          title={o.sub}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
