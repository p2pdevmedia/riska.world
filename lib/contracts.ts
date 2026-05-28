export type ContractId =
  | "policyManager"
  | "beneficiaryRegistry"
  | "premiumVault";

export type ContractSlug =
  | "policy-manager"
  | "beneficiary-registry"
  | "premium-vault";

export type ContractDefinition = {
  id: ContractId;
  slug: ContractSlug;
  address?: `0x${string}`;
  network: string;
  explorerUrl?: string;
  sourceFile?: string;
  sourceIncluded: boolean;
};

const worldchainSepoliaExplorer = "https://worldchain-sepolia.explorer.alchemy.com/address";

export const contracts: ContractDefinition[] = [
  {
    id: "policyManager",
    slug: "policy-manager",
    network: "World Chain Sepolia",
    address: "0x8976d1e5617635a5Fdfe8c96bDFb3B71dE8C2780",
    explorerUrl: `${worldchainSepoliaExplorer}/0x8976d1e5617635a5Fdfe8c96bDFb3B71dE8C2780`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0x5e7246B3283558d8603Fdf4f84A6A1D33Eff9B84",
    explorerUrl: `${worldchainSepoliaExplorer}/0x5e7246B3283558d8603Fdf4f84A6A1D33Eff9B84`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0x201E0E4eeA5a0517C8Df69ee4f84b7c366e4Dcb2",
    explorerUrl: `${worldchainSepoliaExplorer}/0x201E0E4eeA5a0517C8Df69ee4f84b7c366e4Dcb2`,
    sourceFile: "contracts/RiskaPremiumVault.sol",
    sourceIncluded: true
  }
];

export function getContractPath(contract: ContractDefinition) {
  return `/contracts/${contract.slug}`;
}

export function getContractBySlug(slug: string) {
  return contracts.find((contract) => contract.slug === slug);
}
