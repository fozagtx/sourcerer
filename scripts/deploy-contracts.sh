#!/usr/bin/env bash
# Deploy Solana program (devnet) + BSC factory (testnet). From repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1 — install it and retry."
    exit 1
  fi
}

require_cmd anchor
require_cmd forge

echo ">>> Building + deploying Anchor program (devnet)…"
cd "$ROOT/programs/sourcerer"
anchor build
ANCHOR_DEPLOY=(anchor deploy --provider.cluster devnet)
if [[ -n "${ANCHOR_WALLET:-}" ]]; then
  ANCHOR_DEPLOY+=(--provider.wallet "$ANCHOR_WALLET")
fi
"${ANCHOR_DEPLOY[@]}"

echo ""
echo ">>> Deploying SourcererFactory (BSC testnet)…"
cd "$ROOT/contracts/bsc"
if [[ -z "${DEPLOYER_PRIVATE_KEY:-}" ]]; then
  echo "Error: set DEPLOYER_PRIVATE_KEY to your funded testnet wallet (hex from pnpm run wallet:new)."
  exit 1
fi

forge script script/Deploy.s.sol:DeployScript --rpc-url bsc_testnet --broadcast

echo ""
echo "Done. Copy the factory address from the logs into:"
echo "  NEXT_PUBLIC_SOURCERER_BSC_FACTORY"
echo "  SOURCERER_BSC_FACTORY"
echo "in apps/web .env.local (and indexer env if used)."
