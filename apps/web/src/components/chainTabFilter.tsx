"use client";

import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";

type Filter = "all" | "solana" | "bsc";

export function ChainTabFilter({
  children,
  chainOf,
}: {
  children: ReactNode;
  chainOf: Record<string, "solana" | "bsc" | undefined>;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const childArr = Array.isArray(children) ? children : [children];

  const filtered = useMemo(() => {
    if (filter === "all") return childArr;
    return childArr.filter((c: any) => {
      const key = String(c?.key ?? "");
      return chainOf[key] === filter;
    });
  }, [childArr, chainOf, filter]);

  return (
    <div>
      <div className="comic-panel mb-3 flex flex-wrap items-center gap-1 rounded-[999px] !bg-black/35 p-1 text-caption !shadow-[4px_4px_0_rgba(0,0,0,0.35)]">
        {(
          [
            { id: "all" as const, label: "all chains" },
            { id: "solana" as const, label: "solana" },
            { id: "bsc" as const, label: "bnb chain" },
          ]
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setFilter(o.id)}
            className={clsx(
              "rounded-pill px-3 py-1.5 font-medium lowercase transition-all duration-150 ease-in-out",
              filter === o.id
                ? "bg-[#e6392a] text-white shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered}</div>
    </div>
  );
}
