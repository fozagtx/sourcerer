# Sourcerer Anchor Program

Bonding-curve memecoin launcher on Solana.

## Layout

```
programs/sourcerer/
  Cargo.toml            # workspace
  Anchor.toml           # cluster/program config
  programs/sourcerer/   # the Rust program
    src/
      lib.rs            # entrypoint
      constants.rs      # seeds + curve params
      curve.rs          # virtual constant-product math
      state.rs          # Config, BondingCurve, events
      errors.rs
      instructions/
        initialize.rs
        create_token.rs
        trade.rs        # buy + sell
        graduate.rs
  tests/sourcerer.ts    # mocha integration tests
```

## Instructions

| ix              | description |
|-----------------|-------------|
| `initialize`    | one-time: set fee recipient, fee bps, graduation threshold |
| `create_token`  | mint a new SPL Token-2022 + metadata + bonding curve PDA |
| `buy`           | swap SOL → tokens along virtual curve |
| `sell`          | swap tokens → SOL along virtual curve |
| `graduate`      | mark curve complete, revoke authorities (Raydium seed done off-chain) |

## Build & test

```bash
anchor build
anchor test           # spins up a local validator
```

## Deploy devnet

```bash
anchor deploy --provider.cluster devnet
```

## Curve parameters

| param                    | value                      |
|--------------------------|----------------------------|
| decimals                 | 6                          |
| total supply             | 1,000,000,000              |
| curve-owned supply       | 793,100,000                |
| virtual SOL reserves     | 30 SOL                     |
| virtual token reserves   | 1,073,000,000              |
| fee (default)            | 1% (100 bps, configurable) |
| graduation threshold     | 85 SOL (configurable)      |
