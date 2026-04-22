"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthToken } from "@/hooks/use-auth-token";
import { formatTimeAgo, shortAddress } from "@/lib/format";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export function CommentSection({ mint }: { mint: string }) {
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const wallet = useWallet();
  const { token, signIn } = useAuthToken();

  const { data = [] } = useQuery<Comment[]>({
    queryKey: ["comments", mint],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${mint}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 10_000,
  });

  async function post() {
    if (!body.trim()) return;
    if (!token) {
      const t = await signIn();
      if (!t) return;
    }
    const res = await fetch(`/api/tokens/${mint}/comments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token ?? ""}`,
      },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      toast.error("Failed to post");
      return;
    }
    setBody("");
    qc.invalidateQueries({ queryKey: ["comments", mint] });
  }

  return (
    <div className="comic-panel shadow-elev1">
      <div className="border-b border-surface-border px-4 py-3">
        <p className="eyebrow">COMMENTS</p>
      </div>
      <div className="divide-y divide-surface-border">
        {data.length === 0 ? (
          <div className="p-4 text-center text-caption text-muted">Be the first to comment</div>
        ) : (
          data.map((c) => (
            <div key={c.id} className="px-4 py-3 text-body-md">
              <div className="mb-1 flex items-center gap-2 font-mono text-caption text-muted">
                <span>{shortAddress(c.author)}</span>
                <span>·</span>
                <span>{formatTimeAgo(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-ink">{c.body}</p>
            </div>
          ))
        )}
      </div>
      {wallet.publicKey ? (
        <div className="flex gap-2 border-t border-surface-border p-3">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Say something sharp…"
            className="flex-1 rounded-pill border border-surface-border bg-canvas-light px-3 py-2 text-body-md text-ink outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={post}
            className="rounded-pill bg-brand-500 px-4 py-2 text-ui font-normal text-white transition-all duration-150 ease-in-out hover:bg-white hover:text-brand-500"
          >
            Post
          </button>
        </div>
      ) : (
        <div className="p-4 text-center text-caption text-muted">Connect wallet to comment</div>
      )}
    </div>
  );
}
