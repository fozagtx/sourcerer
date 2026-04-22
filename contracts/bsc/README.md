# Sourcerer BSC Contracts

Solidity bonding-curve memecoin launcher for BNB Chain, sibling of the Solana Anchor program.

## Layout

```
contracts/bsc/
  foundry.toml
  remappings.txt
  src/
    SourcererToken.sol      # ERC20 with 18 decimals + tokenURI
    SourcererFactory.sol    # factory + bonding curve + graduation to PancakeSwap
  script/Deploy.s.sol
  test/SourcererFactory.t.sol
```

## Setup

```bash
cd contracts/bsc
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
forge build
forge test
```

## Deploy

```bash
# testnet
DEPLOYER_PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url bsc_testnet --broadcast

# mainnet
DEPLOYER_PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url bsc --broadcast --verify
```

## Curve parameters

| param                    | value                 |
|--------------------------|-----------------------|
| decimals                 | 18                    |
| total supply             | 1,000,000,000         |
| curve-owned supply       | 793,100,000           |
| LP-bound supply          | 206,900,000           |
| virtual BNB reserves     | 30 BNB                |
| virtual token reserves   | 1,073,000,000         |
| fee (default)            | 1% (100 bps)          |
| graduation threshold     | 85 BNB                |
| LP destination           | `0x...dEaD` (burned)  |

The factory auto-graduates during `buy` the moment the threshold is crossed; anyone can also call `graduate(token)` explicitly as a fallback.
