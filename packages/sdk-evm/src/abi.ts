export const sourcererFactoryAbi = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name_", type: "string" },
      { name: "symbol_", type: "string" },
      { name: "uri_", type: "string" },
    ],
    outputs: [{ name: "token", type: "address" }],
  },
  {
    type: "function",
    name: "buy",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "minTokensOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "sell",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensIn", type: "uint256" },
      { name: "minBnbOut", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "graduate",
    stateMutability: "nonpayable",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "quoteBuy",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "bnbIn", type: "uint256" },
    ],
    outputs: [
      { name: "tokensOut", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "quoteSell",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "tokensIn", type: "uint256" },
    ],
    outputs: [
      { name: "bnbOut", type: "uint256" },
      { name: "fee", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "curves",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "creator", type: "address" },
      { name: "virtualBnb", type: "uint128" },
      { name: "virtualTokens", type: "uint128" },
      { name: "realBnb", type: "uint128" },
      { name: "realTokens", type: "uint128" },
      { name: "complete", type: "bool" },
      { name: "createdAt", type: "uint64" },
    ],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    type: "event",
    name: "TokenCreated",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "uri", type: "string", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Traded",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "trader", type: "address", indexed: true },
      { name: "isBuy", type: "bool", indexed: false },
      { name: "bnbAmount", type: "uint256", indexed: false },
      { name: "tokenAmount", type: "uint256", indexed: false },
      { name: "feeAmount", type: "uint256", indexed: false },
      { name: "virtualBnb", type: "uint128", indexed: false },
      { name: "virtualTokens", type: "uint128", indexed: false },
      { name: "realBnb", type: "uint128", indexed: false },
      { name: "realTokens", type: "uint128", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Graduated",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "pair", type: "address", indexed: false },
      { name: "bnbAmount", type: "uint256", indexed: false },
      { name: "tokenAmount", type: "uint256", indexed: false },
    ],
  },
] as const;

export const sourcererTokenAbi = [
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
