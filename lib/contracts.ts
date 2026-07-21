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
    address: "0x6dA383792c2e3A41d699e35D07F75Ca0440f491f",
    explorerUrl: `${worldchainSepoliaExplorer}/0x6dA383792c2e3A41d699e35D07F75Ca0440f491f`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0xf248E6AF10ED470B82C3b3c0192e2BbA3d54d06B",
    explorerUrl: `${worldchainSepoliaExplorer}/0xf248E6AF10ED470B82C3b3c0192e2BbA3d54d06B`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0x9Af67a6E29FFCAA17eDB226E2297570eA8b4E691",
    explorerUrl: `${worldchainSepoliaExplorer}/0x9Af67a6E29FFCAA17eDB226E2297570eA8b4E691`,
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
