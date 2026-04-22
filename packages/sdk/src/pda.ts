import { PublicKey } from "@solana/web3.js";
import { SOURCERER_PROGRAM_ID, SEEDS, TOKEN_METADATA_PROGRAM_ID } from "./constants";

export function configPda(programId = SOURCERER_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([SEEDS.config], programId);
}

export function bondingCurvePda(mint: PublicKey, programId = SOURCERER_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.bondingCurve, mint.toBuffer()],
    programId,
  );
}

export function curveSolVaultPda(mint: PublicKey, programId = SOURCERER_PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [SEEDS.curveVault, mint.toBuffer()],
    programId,
  );
}

export function metadataPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID,
  );
}
