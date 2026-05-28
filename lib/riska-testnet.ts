export type RiskaTestnetContractName =
  | "mockUsdc"
  | "beneficiaryRegistry"
  | "premiumVault"
  | "policyManager";

export type RiskaTestnetContractRecord = {
  address: `0x${string}`;
  transactionHash?: `0x${string}` | null;
};

export type RiskaTestnetContracts = Partial<Record<RiskaTestnetContractName, RiskaTestnetContractRecord>>;

export type RiskaTestnetDeployment = {
  blockNumber?: number;
  chainId: string;
  contracts: RiskaTestnetContracts;
  deployedAt?: string;
  deployer?: `0x${string}`;
  explorerBaseUrl: string;
  network: string;
  verifier?: `0x${string}`;
};

export type RiskaTestnetConfigResponse = {
  configured: boolean;
  deployment?: RiskaTestnetDeployment;
  error?: string;
};

export const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801;
export const WORLDCHAIN_SEPOLIA_CHAIN_ID_HEX = "0x12c1";
export const WORLDCHAIN_SEPOLIA_RPC_URL = "https://worldchain-sepolia.g.alchemy.com/public";
export const WORLDCHAIN_SEPOLIA_EXPLORER_URL = "https://worldchain-sepolia.explorer.alchemy.com/address/";
export const RISKA_POLICY_TERMS_HASH =
  "0x109b7832342e1cf21e6ae5a43bd1d5c09a26d74551ebb9bf0d53c0de09dd4538";
