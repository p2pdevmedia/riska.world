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
    address: "0x34cbF7A191DeD947810D7095a9e0e08897f84c73",
    explorerUrl: `${worldchainSepoliaExplorer}/0x34cbF7A191DeD947810D7095a9e0e08897f84c73`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0xc96506624EffC7669d304C87695f9F1A860Fe539",
    explorerUrl: `${worldchainSepoliaExplorer}/0xc96506624EffC7669d304C87695f9F1A860Fe539`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0xfe83d9f40528DD6e2EF0063949FC81621b421Bdc",
    explorerUrl: `${worldchainSepoliaExplorer}/0xfe83d9f40528DD6e2EF0063949FC81621b421Bdc`,
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
