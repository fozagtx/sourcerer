/**
 * Generates a fresh Solana keypair file + EVM private key for funding and contract deploys.
 * Run from repo root: pnpm run wallet:new
 *
 * Never commit files under .keys/
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Keypair } from "@solana/web3.js";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const root = process.cwd();
const keysDir = join(root, ".keys");
if (!existsSync(keysDir)) mkdirSync(keysDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const solKp = Keypair.generate();
const solPath = join(keysDir, `solana-devnet-${stamp}.json`);
writeFileSync(solPath, JSON.stringify(Array.from(solKp.secretKey)));

const evmPk = generatePrivateKey();
const evm = privateKeyToAccount(evmPk);

console.log(`
=== Sourcerer deploy wallets (fund on devnet / BSC testnet) ===

Solana public key:  ${solKp.publicKey.toBase58()}
Keypair file:       ${solPath}

EVM address:        ${evm.address}
Private key (hex):  ${evmPk}

--- Next steps ---
1) Solana devnet: solana airdrop 2 ${solKp.publicKey.toBase58()} --url devnet
   (or use faucet) then deploy:
   ANCHOR_WALLET=${solPath} pnpm run anchor:deploy:devnet
   # or: anchor deploy --provider.cluster devnet --provider.wallet ${solPath}

2) BSC testnet: send test BNB to ${evm.address}
   export DEPLOYER_PRIVATE_KEY='${evmPk}'
   pnpm run bsc:deploy:testnet

⚠️  Keep .keys/ secret; it is gitignored.
`);
