import { worldchain, worldchainSepolia } from "viem/chains";

export type RiskaEnvironment = "testnet" | "production";

export type RiskaTestnetContractName =
  | "mockUsdc"
  | "beneficiaryRegistry"
  | "premiumVault"
  | "policyManager"
  | "yieldStrategyManager"
  | "testnetTokenFaucet";

export type RiskaTestnetContractRecord = {
  address: `0x${string}`;
  transactionHash?: `0x${string}` | null;
};

export type RiskaTestnetContracts = Partial<Record<RiskaTestnetContractName, RiskaTestnetContractRecord>>;

export type RiskaTestnetAuxiliaryTokenRecord = {
  address: `0x${string}`;
  decimals: number;
  mintTransactionHash?: `0x${string}` | null;
  name: string;
  symbol: string;
  transactionHash?: `0x${string}` | null;
};

export type RiskaTestnetDeployment = {
  environment?: RiskaEnvironment;
  blockNumber?: number;
  chainId: string;
  contracts: RiskaTestnetContracts;
  deployedAt?: string;
  deployer?: `0x${string}`;
  explorerBaseUrl: string;
  network: string;
  rpcUrl?: string;
  policyHumanVerifier?: `0x${string}`;
  testAuxiliaryTokens?: Record<string, RiskaTestnetAuxiliaryTokenRecord>;
  /** @deprecated Use policyHumanVerifier. */
  verifier?: `0x${string}`;
};

export type RiskaTestnetConfigResponse = {
  configured: boolean;
  deployment?: RiskaTestnetDeployment;
  error?: string;
};

export const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801;
export const WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX = "0x12c1";
export const WORLDCHAIN_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL ??
  "https://worldchain-sepolia.g.alchemy.com/public";
export const WORLDCHAIN_SEPOLIA_EXPLORER_URL = "https://worldchain-sepolia.explorer.alchemy.com/address/";
export const WORLDCHAIN_CHAIN_ID = 480;
export const WORLDCHAIN_CHAIN_ID_HEX = "0x1e0";
export const WORLDCHAIN_RPC_URL =
  process.env.NEXT_PUBLIC_WORLDCHAIN_RPC_URL ??
  "https://worldchain-mainnet.g.alchemy.com/public";
export const WORLDCHAIN_EXPLORER_URL = "https://worldchain.explorer.alchemy.com/address/";
export const RISKA_POLICY_TERMS_HASH =
  "0x109b7832342e1cf21e6ae5a43bd1d5c09a26d74551ebb9bf0d53c0de09dd4538";

export function getWorldChainForChainId(chainId: string | number) {
  return Number(chainId) === WORLDCHAIN_CHAIN_ID ? worldchain : worldchainSepolia;
}

export function getWorldChainRpcUrl(chainId: string | number, deploymentRpcUrl?: string) {
  if (deploymentRpcUrl) return deploymentRpcUrl;
  return Number(chainId) === WORLDCHAIN_CHAIN_ID ? WORLDCHAIN_RPC_URL : WORLDCHAIN_SEPOLIA_RPC_URL;
}
