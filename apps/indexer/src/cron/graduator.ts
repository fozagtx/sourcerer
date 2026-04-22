import { prisma } from "@sourcerer/db";
import { getClient, connection } from "../solana";
import { PublicKey, Transaction, ComputeBudgetProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { bondingCurvePda } from "@sourcerer/sdk";
import { seedRaydiumPool } from "../raydium";
import { loadKeypair } from "../solana";

/**
 * Walks every non-graduated Solana token, fetches its on-chain curve state, and if
 * `real_sol_reserves >= graduation_lamports` calls the `graduate` instruction,
 * then seeds a Raydium CPMM pool and burns the LP.
 */
export async function runGraduator(): Promise<void> {
  const client = getClient();
  const payer = loadKeypair();
  if (!client || !payer) {
    console.log("[graduator] skipped (no keypair configured)");
    return;
  }

  const candidates = await prisma.token.findMany({
    where: { graduated: false, chain: "solana" },
    select: { mint: true },
    take: 200,
  });

  for (const { mint } of candidates) {
    try {
      const mintPk = new PublicKey(mint);
      const curve = await client.fetchCurve(mintPk);
      if (!curve) continue;
      if (!curve.complete) continue;

      const allConfigs = await (client.program.account as any).config.all();
      const cfgKey = allConfigs[0]?.publicKey;
      if (!cfgKey) continue;

      const ix = await (client.program.methods as any)
        .graduate()
        .accounts({
          payer: payer.publicKey,
          config: cfgKey,
          mint: mintPk,
          bondingCurve: bondingCurvePda(mintPk)[0],
        })
        .instruction();

      const tx = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }))
        .add(ix);
      await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });

      const poolAddress = await seedRaydiumPool({
        mint: mintPk,
        solAmount: curve.realSolReserves,
        tokenAmount: curve.realTokenReserves,
        payer,
      });

      await prisma.token.update({
        where: { mint },
        data: { graduated: true, graduatedAt: new Date(), raydiumPool: poolAddress ?? null },
      });
      console.log(`[graduator] graduated ${mint} → pool ${poolAddress ?? "(pending)"}`);
    } catch (err) {
      console.warn(`[graduator] ${mint} failed`, err);
    }
  }
}

if (require.main === module) {
  runGraduator().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
