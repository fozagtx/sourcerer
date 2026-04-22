"use client";

import { useQuery } from "@tanstack/react-query";
import { formatNumber, shortAddress } from "@/lib/format";

interface Holder {
  owner: string;
  balance: string;
  pct: number;
}

export function HoldersList({ mint }: { mint: string }) {
  const { data = [] } = useQuery<Holder[]>({
    queryKey: ["holders", mint],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${mint}/holders`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15_000,
  });

  return (
    <div className="comic-panel shadow-elev1">
      <div className="border-b border-surface-border px-4 py-3">
        <p className="eyebrow">TOP HOLDERS</p>
      </div>
      <div className="divide-y divide-surface-border text-body-md">
        {data.length === 0 ? (
          <div className="p-4 text-center text-caption text-muted">No holders yet</div>
        ) : (
          data.slice(0, 10).map((h, i) => (
            <div key={h.owner} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="w-5 font-mono text-caption text-muted">#{i + 1}</span>
                <span className="font-mono text-caption text-ink">{shortAddress(h.owner)}</span>
              </div>
              <div className="flex items-center gap-3 text-caption">
                <span className="font-medium text-ink">{formatNumber(Number(h.balance) / 1e6)}</span>
                <span className="w-12 text-right font-mono text-muted">{h.pct.toFixed(2)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
