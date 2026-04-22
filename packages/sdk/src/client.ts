import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import idl from "./idl/sourcerer.json";
import {
  SOURCERER_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  VIRTUAL_SOL_RESERVES,
  VIRTUAL_TOKEN_RESERVES,
} from "./constants";
import { bondingCurvePda, configPda, curveSolVaultPda, metadataPda } from "./pda";
import { tokensOutForSolIn, solOutForTokensIn, applyFeeBps } from "./curve";

export interface BondingCurveState {
  mint: PublicKey;
  creator: PublicKey;
  virtualSolReserves: bigint;
  virtualTokenReserves: bigint;
  realSolReserves: bigint;
  realTokenReserves: bigint;
  totalSupply: bigint;
  complete: boolean;
  createdAt: number;
}

export class SourcererClient {
  readonly program: Program;
  readonly connection: Connection;

  constructor(provider: AnchorProvider, programId: PublicKey = SOURCERER_PROGRAM_ID) {
    this.connection = provider.connection;
    const patched = { ...(idl as any), address: programId.toBase58() };
    this.program = new Program(patched as Idl, provider);
  }

  static programId = SOURCERER_PROGRAM_ID;

  async fetchCurve(mint: PublicKey): Promise<BondingCurveState | null> {
    const [curvePda] = bondingCurvePda(mint);
    try {
      const raw: any = await (this.program.account as any).bondingCurve.fetch(curvePda);
      return {
        mint: raw.mint,
        creator: raw.creator,
        virtualSolReserves: BigInt(raw.virtualSolReserves.toString()),
        virtualTokenReserves: BigInt(raw.virtualTokenReserves.toString()),
        realSolReserves: BigInt(raw.realSolReserves.toString()),
        realTokenReserves: BigInt(raw.realTokenReserves.toString()),
        totalSupply: BigInt(raw.totalSupply.toString()),
        complete: raw.complete,
        createdAt: Number(raw.createdAt),
      };
    } catch {
      return null;
    }
  }

  async createTokenIx(params: {
    creator: PublicKey;
    mint: PublicKey;
    name: string;
    symbol: string;
    uri: string;
  }): Promise<TransactionInstruction> {
    const { creator, mint, name, symbol, uri } = params;
    const [curve] = bondingCurvePda(mint);
    const [solVault] = curveSolVaultPda(mint);
    const [meta] = metadataPda(mint);
    const curveTokenVault = getAssociatedTokenAddressSync(mint, curve, true);

    return this.program.methods
      .createToken(name, symbol, uri)
      .accounts({
        creator,
        mint,
        bondingCurve: curve,
        curveTokenVault,
        curveSolVault: solVault,
        metadata: meta,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction();
  }

  async buyIx(params: {
    trader: PublicKey;
    mint: PublicKey;
    solIn: bigint;
    minTokensOut: bigint;
  }): Promise<TransactionInstruction> {
    const { trader, mint, solIn, minTokensOut } = params;
    const [cfg] = configPda();
    const config: any = await (this.program.account as any).config.fetch(cfg);
    const [curve] = bondingCurvePda(mint);
    const [solVault] = curveSolVaultPda(mint);
    const curveTokenVault = getAssociatedTokenAddressSync(mint, curve, true);
    const traderAta = getAssociatedTokenAddressSync(mint, trader);

    return this.program.methods
      .buy(new BN(solIn.toString()), new BN(minTokensOut.toString()))
      .accounts({
        trader,
        config: cfg,
        feeRecipient: config.feeRecipient,
        mint,
        bondingCurve: curve,
        curveTokenVault,
        curveSolVault: solVault,
        traderTokenAccount: traderAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async sellIx(params: {
    trader: PublicKey;
    mint: PublicKey;
    tokensIn: bigint;
    minSolOut: bigint;
  }): Promise<TransactionInstruction> {
    const { trader, mint, tokensIn, minSolOut } = params;
    const [cfg] = configPda();
    const config: any = await (this.program.account as any).config.fetch(cfg);
    const [curve] = bondingCurvePda(mint);
    const [solVault] = curveSolVaultPda(mint);
    const curveTokenVault = getAssociatedTokenAddressSync(mint, curve, true);
    const traderAta = getAssociatedTokenAddressSync(mint, trader);

    return this.program.methods
      .sell(new BN(tokensIn.toString()), new BN(minSolOut.toString()))
      .accounts({
        trader,
        config: cfg,
        feeRecipient: config.feeRecipient,
        mint,
        bondingCurve: curve,
        curveTokenVault,
        curveSolVault: solVault,
        traderTokenAccount: traderAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async quoteBuy(
    mint: PublicKey,
    solIn: bigint,
    feeBps: number,
  ): Promise<{ tokensOut: bigint; fee: bigint }> {
    const curve = await this.fetchCurve(mint);
    const vs = curve?.virtualSolReserves ?? VIRTUAL_SOL_RESERVES;
    const vt = curve?.virtualTokenReserves ?? VIRTUAL_TOKEN_RESERVES;
    const { net, fee } = applyFeeBps(solIn, feeBps);
    return { tokensOut: tokensOutForSolIn(vs, vt, net), fee };
  }

  async quoteSell(
    mint: PublicKey,
    tokensIn: bigint,
    feeBps: number,
  ): Promise<{ solOut: bigint; fee: bigint }> {
    const curve = await this.fetchCurve(mint);
    const vs = curve?.virtualSolReserves ?? VIRTUAL_SOL_RESERVES;
    const vt = curve?.virtualTokenReserves ?? VIRTUAL_TOKEN_RESERVES;
    const gross = solOutForTokensIn(vs, vt, tokensIn);
    const { net, fee } = applyFeeBps(gross, feeBps);
    return { solOut: net, fee };
  }
}

export function newMintKeypair(): Keypair {
  return Keypair.generate();
}

export { Transaction };
