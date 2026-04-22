import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { expect } from "chai";
import { Sourcerer } from "../target/types/sourcerer";

const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

describe("sourcerer", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Sourcerer as Program<Sourcerer>;
  const admin = provider.wallet;

  const feeRecipient = Keypair.generate();

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );

  it("initializes config", async () => {
    await program.methods
      .initialize(100, new BN(LAMPORTS_PER_SOL).muln(85))
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        feeRecipient: feeRecipient.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const cfg = await program.account.config.fetch(configPda);
    expect(cfg.feeBps).to.equal(100);
  });

  it("creates a token and trades on the bonding curve", async () => {
    const mint = Keypair.generate();

    const [curvePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), mint.publicKey.toBuffer()],
      program.programId,
    );
    const [solVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("curve-vault"), mint.publicKey.toBuffer()],
      program.programId,
    );
    const curveTokenVault = getAssociatedTokenAddressSync(
      mint.publicKey,
      curvePda,
      true,
    );

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mint.publicKey.toBuffer()],
      METADATA_PROGRAM_ID,
    );

    await program.methods
      .createToken("Sourcerer Pepe", "SPEPE", "https://example.com/metadata.json")
      .accounts({
        creator: admin.publicKey,
        mint: mint.publicKey,
        bondingCurve: curvePda,
        curveTokenVault,
        curveSolVault: solVaultPda,
        metadata: metadataPda,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    const curve = await program.account.bondingCurve.fetch(curvePda);
    expect(curve.complete).to.equal(false);
    expect(curve.realSolReserves.toNumber()).to.equal(0);

    const traderAta = getAssociatedTokenAddressSync(mint.publicKey, admin.publicKey);
    await program.methods
      .buy(new BN(LAMPORTS_PER_SOL), new BN(0))
      .accounts({
        trader: admin.publicKey,
        config: configPda,
        feeRecipient: feeRecipient.publicKey,
        mint: mint.publicKey,
        bondingCurve: curvePda,
        curveTokenVault,
        curveSolVault: solVaultPda,
        traderTokenAccount: traderAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const curveAfter = await program.account.bondingCurve.fetch(curvePda);
    expect(curveAfter.realSolReserves.toNumber()).to.be.greaterThan(0);
  });
});
