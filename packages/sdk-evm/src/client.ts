import {
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  getAddress,
  parseEventLogs,
} from "viem";
import { sourcererFactoryAbi, sourcererTokenAbi } from "./abi";
import {
  VIRTUAL_BNB_RESERVES,
  VIRTUAL_TOKEN_RESERVES,
  applyFeeBps,
  bnbOutForTokensIn,
  tokensOutForBnbIn,
} from "./curve";

export interface EvmCurveState {
  creator: Address;
  virtualBnb: bigint;
  virtualTokens: bigint;
  realBnb: bigint;
  realTokens: bigint;
  complete: boolean;
  createdAt: number;
}

export class SourcererEvmClient {
  readonly factory: Address;
  readonly pub: PublicClient;
  readonly wallet?: WalletClient;

  constructor(args: { factory: Address; publicClient: PublicClient; walletClient?: WalletClient }) {
    this.factory = getAddress(args.factory);
    this.pub = args.publicClient;
    this.wallet = args.walletClient;
  }

  async feeBps(): Promise<number> {
    const v = await this.pub.readContract({
      address: this.factory,
      abi: sourcererFactoryAbi,
      functionName: "feeBps",
    });
    return Number(v);
  }

  async getCurve(token: Address): Promise<EvmCurveState | null> {
    try {
      const r = (await this.pub.readContract({
        address: this.factory,
        abi: sourcererFactoryAbi,
        functionName: "curves",
        args: [token],
      })) as readonly [Address, bigint, bigint, bigint, bigint, boolean, bigint];
      return {
        creator: r[0],
        virtualBnb: r[1],
        virtualTokens: r[2],
        realBnb: r[3],
        realTokens: r[4],
        complete: r[5],
        createdAt: Number(r[6]),
      };
    } catch {
      return null;
    }
  }

  async quoteBuy(token: Address, bnbIn: bigint): Promise<{ tokensOut: bigint; fee: bigint }> {
    const curve = await this.getCurve(token);
    const vb = curve?.virtualBnb ?? VIRTUAL_BNB_RESERVES;
    const vt = curve?.virtualTokens ?? VIRTUAL_TOKEN_RESERVES;
    const feeBps = await this.feeBps();
    const { net, fee } = applyFeeBps(bnbIn, feeBps);
    return { tokensOut: tokensOutForBnbIn(vb, vt, net), fee };
  }

  async quoteSell(token: Address, tokensIn: bigint): Promise<{ bnbOut: bigint; fee: bigint }> {
    const curve = await this.getCurve(token);
    const vb = curve?.virtualBnb ?? VIRTUAL_BNB_RESERVES;
    const vt = curve?.virtualTokens ?? VIRTUAL_TOKEN_RESERVES;
    const feeBps = await this.feeBps();
    const gross = bnbOutForTokensIn(vb, vt, tokensIn);
    const { net, fee } = applyFeeBps(gross, feeBps);
    return { bnbOut: net, fee };
  }

  async createToken(params: {
    name: string;
    symbol: string;
    uri: string;
    account: Address;
  }): Promise<{ hash: Hash; token?: Address }> {
    if (!this.wallet) throw new Error("walletClient required");
    const hash = await this.wallet.writeContract({
      address: this.factory,
      abi: sourcererFactoryAbi,
      functionName: "createToken",
      args: [params.name, params.symbol, params.uri],
      account: params.account,
      chain: null,
    });
    const receipt = await this.pub.waitForTransactionReceipt({ hash });
    const events = parseEventLogs({
      abi: sourcererFactoryAbi,
      logs: receipt.logs,
      eventName: "TokenCreated",
    });
    const token = (events[0] as any)?.args?.token as Address | undefined;
    return { hash, token };
  }

  async buy(params: {
    token: Address;
    bnbIn: bigint;
    minTokensOut: bigint;
    account: Address;
  }): Promise<Hash> {
    if (!this.wallet) throw new Error("walletClient required");
    return this.wallet.writeContract({
      address: this.factory,
      abi: sourcererFactoryAbi,
      functionName: "buy",
      args: [params.token, params.minTokensOut],
      value: params.bnbIn,
      account: params.account,
      chain: null,
    });
  }

  async sell(params: {
    token: Address;
    tokensIn: bigint;
    minBnbOut: bigint;
    account: Address;
  }): Promise<Hash> {
    if (!this.wallet) throw new Error("walletClient required");
    return this.wallet.writeContract({
      address: this.factory,
      abi: sourcererFactoryAbi,
      functionName: "sell",
      args: [params.token, params.tokensIn, params.minBnbOut],
      account: params.account,
      chain: null,
    });
  }

  async ensureApproval(params: {
    token: Address;
    owner: Address;
    amount: bigint;
  }): Promise<Hash | null> {
    if (!this.wallet) throw new Error("walletClient required");
    const allowance = (await this.pub.readContract({
      address: params.token,
      abi: sourcererTokenAbi,
      functionName: "allowance",
      args: [params.owner, this.factory],
    })) as bigint;
    if (allowance >= params.amount) return null;
    return this.wallet.writeContract({
      address: params.token,
      abi: sourcererTokenAbi,
      functionName: "approve",
      args: [this.factory, params.amount],
      account: params.owner,
      chain: null,
    });
  }
}

export function decodeFactoryEvent(log: { topics: readonly `0x${string}`[]; data: `0x${string}` }) {
  return decodeEventLog({
    abi: sourcererFactoryAbi,
    data: log.data,
    topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
  });
}
