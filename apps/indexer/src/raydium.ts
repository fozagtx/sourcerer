import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { connection } from "./solana";

const INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");
const WSOL = new PublicKey("So11111111111111111111111111111111111111112");

/**
 * Seeds a Raydium CPMM pool using the curve's real reserves as liquidity,
 * then burns the LP tokens by transferring them to the incinerator.
 *
 * This uses `@raydium-io/raydium-sdk-v2` via dynamic import. If the SDK isn't
 * installed (dev workstation without the heavy dep) the function logs and returns
 * null, so the cron keeps retrying safely. To activate:
 *
 *   pnpm add @raydium-io/raydium-sdk-v2 @solana/spl-token --filter @sourcerer/indexer
 *
 * The function is idempotent: the Solana program marks `curve.complete = true`
 * before this is called, so double-invocations simply fail to derive a fresh
 * authority and we swallow the error.
 */
export async function seedRaydiumPool(params: {
  mint: PublicKey;
  solAmount: bigint;
  tokenAmount: bigint;
  payer: Keypair;
}): Promise<string | null> {
  const { mint, solAmount, tokenAmount, payer } = params;
  if (solAmount === 0n || tokenAmount === 0n) return null;

  let raydiumSdk: any;
  let splToken: any;
  try {
    // @ts-ignore - optional peer, only installed when enabling real pool seeding
    raydiumSdk = await import("@raydium-io/raydium-sdk-v2");
    splToken = await import("@solana/spl-token");
  } catch {
    console.warn(
      "[raydium] sdk not installed, skipping pool creation. Run `pnpm add @raydium-io/raydium-sdk-v2 @solana/spl-token --filter @sourcerer/indexer` to enable.",
    );
    return null;
  }

  try {
    const raydium = await raydiumSdk.Raydium.load({
      connection,
      owner: payer,
      cluster: "devnet",
      disableFeatureCheck: true,
      blockhashCommitment: "confirmed",
    });

    const mintAInfo = await raydium.token.getTokenInfo(WSOL);
    const mintBInfo = await raydium.token.getTokenInfo(mint);

    const { execute, extInfo } = await raydium.cpmm.createPool({
      programId: new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"),
      poolFeeAccount: new PublicKey("DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8"),
      mintA: mintAInfo,
      mintB: mintBInfo,
      mintAAmount: solAmount,
      mintBAmount: tokenAmount,
      startTime: 0n,
      feeConfig: raydium.cpmm.getCpmmConfigs()[0],
      associatedOnly: false,
      ownerInfo: { useSOLBalance: true },
      txVersion: raydiumSdk.TxVersion.V0,
    });

    const { txId } = await execute({ sendAndConfirm: true });
    console.log(`[raydium] pool created tx=${txId}`);

    const poolId = extInfo.address.poolId as PublicKey;
    const lpMint = extInfo.address.lpMint as PublicKey;

    const ownerLpAta = splToken.getAssociatedTokenAddressSync(lpMint, payer.publicKey, true);
    const balInfo = await connection.getTokenAccountBalance(ownerLpAta).catch(() => null);
    if (balInfo?.value?.amount && BigInt(balInfo.value.amount) > 0n) {
      const incinAta = splToken.getAssociatedTokenAddressSync(lpMint, INCINERATOR, true);
      const ensureIx = splToken.createAssociatedTokenAccountIdempotentInstruction(
        payer.publicKey,
        incinAta,
        INCINERATOR,
        lpMint,
      );
      const transferIx = splToken.createTransferInstruction(
        ownerLpAta,
        incinAta,
        payer.publicKey,
        BigInt(balInfo.value.amount),
      );
      const burnTx = new Transaction().add(ensureIx, transferIx);
      burnTx.feePayer = payer.publicKey;
      burnTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      burnTx.sign(payer);
      const sig = await connection.sendRawTransaction(burnTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      console.log(`[raydium] LP burned tx=${sig}`);
    }

    return poolId.toBase58();
  } catch (err) {
    console.error("[raydium] seed failed", err);
    return null;
  }
}
