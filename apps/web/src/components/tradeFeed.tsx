"use client";

import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatSol, formatTimeAgo, shortAddress } from "@/lib/format";
import clsx from "clsx";

interface Trade {
  signature: string;
  trader: string;
  isBuy: boolean;
  solAmount: string;
  tokenAmount: string;
  timestamp: string;
}

export function TradeFeed({ mint }: { mint: string }) {
  const { data = [] } = useQuery<Trade[]>({
    queryKey: ["trades", mint],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${mint}/trades`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5_000,
  });

  return (
    <div className="comic-panel shadow-elev1">
      <div className="border-b border-surface-border px-4 py-3">
        <p className="eyebrow">RECENT TRADES</p>
      </div>
      <div className="max-h-80 divide-y divide-surface-border overflow-y-auto text-body-md">
        {data.length === 0 ? (
          <div className="p-6 text-center text-caption text-muted">No trades yet</div>
        ) : (
          data.map((t) => (
            <div key={t.signature} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "rounded-pill px-2.5 py-0.5 font-mono text-micro uppercase tracking-wider",
                    t.isBuy ? "bg-flu-green/15 text-flu-green" : "bg-brand-light/50 text-brand-600",
                  )}
                >
                  {t.isBuy ? "BUY" : "SELL"}
                </span>
                <span className="font-mono text-caption text-muted">{shortAddress(t.trader)}</span>
              </div>
              <div className="flex gap-4 text-right text-caption">
                <div>
                  <div className="text-muted">Native</div>
                  <div className="font-medium text-ink">{formatSol(BigInt(t.solAmount))}</div>
                </div>
                <div>
                  <div className="text-muted">Tokens</div>
                  <div className="font-medium text-ink">{formatNumber(Number(t.tokenAmount) / 1e6)}</div>
                </div>
                <div className="w-20 text-muted">{formatTimeAgo(t.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
