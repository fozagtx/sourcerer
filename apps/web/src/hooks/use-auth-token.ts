"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import bs58 from "bs58";
import { toast } from "sonner";
import { messageFromApiErrorBody } from "@/lib/api/client-message";

const STORAGE_KEY = "sourcerer-auth-token";

export function useAuthToken() {
  const wallet = useWallet();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet.publicKey) {
      setToken(null);
      return;
    }
    const key = `${STORAGE_KEY}:${wallet.publicKey.toBase58()}`;
    setToken(localStorage.getItem(key));
  }, [wallet.publicKey]);

  const signIn = useCallback(async (): Promise<string | null> => {
    if (!wallet.publicKey || !wallet.signMessage) {
      toast.error("Wallet doesn't support message signing");
      return null;
    }
    try {
      const walletStr = wallet.publicKey.toBase58();
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: walletStr }),
      });
      const nonceText = await nonceRes.text();
      if (!nonceRes.ok) {
        throw new Error(messageFromApiErrorBody(nonceText) || "Nonce request failed");
      }
      const { message } = JSON.parse(nonceText) as { message: string };
      const sig = await wallet.signMessage(new TextEncoder().encode(message));
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: walletStr, signature: bs58.encode(sig) }),
      });
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) {
        throw new Error(messageFromApiErrorBody(verifyText) || "Verify failed");
      }
      const { token } = JSON.parse(verifyText) as { token: string };
      localStorage.setItem(`${STORAGE_KEY}:${walletStr}`, token);
      setToken(token);
      return token;
    } catch (err) {
      console.error(err);
      toast.error("Sign-in failed");
      return null;
    }
  }, [wallet]);

  return { token, signIn };
}
