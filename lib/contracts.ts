export type ContractId =
  | "thirtyYearPolicy"
  | "policyManager"
  | "beneficiaryRegistry"
  | "deathVerifier"
  | "premiumVault"
  | "mockUsdc";

export type ContractSlug =
  | "riska-thirty-year-policy"
  | "policy-manager"
  | "beneficiary-registry"
  | "death-verifier"
  | "premium-vault"
  | "mock-usdc";

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
    id: "thirtyYearPolicy",
    slug: "riska-thirty-year-policy",
    network: "World Chain Sepolia",
    address: "0x96ae3c2ECDcfC267731f12294BEee978dEaBfF9b",
    explorerUrl: `${worldchainSepoliaExplorer}/0x96ae3c2ECDcfC267731f12294BEee978dEaBfF9b`,
    sourceFile: "contracts/RiskaThirtyYearPolicy.sol",
    sourceIncluded: true
  },
  {
    id: "policyManager",
    slug: "policy-manager",
    network: "World Chain Sepolia",
    address: "0x86296480ee14F2FBD6fae299c799771a7F1aFc0b",
    explorerUrl: `${worldchainSepoliaExplorer}/0x86296480ee14F2FBD6fae299c799771a7F1aFc0b`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0xf55E879fD7Bcab699bA72D1e23c8E008c6DAD9a2",
    explorerUrl: `${worldchainSepoliaExplorer}/0xf55E879fD7Bcab699bA72D1e23c8E008c6DAD9a2`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "deathVerifier",
    slug: "death-verifier",
    network: "World Chain Sepolia",
    address: "0x770148E7cE0ADb9A9F4F5Ffc33e9f5eAA44283a4",
    explorerUrl: `${worldchainSepoliaExplorer}/0x770148E7cE0ADb9A9F4F5Ffc33e9f5eAA44283a4`,
    sourceFile: "contracts/RiskaDeathVerifier.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0x9D1C6B0569eC0049506Bea3696A3Ece681447079",
    explorerUrl: `${worldchainSepoliaExplorer}/0x9D1C6B0569eC0049506Bea3696A3Ece681447079`,
    sourceFile: "contracts/RiskaPremiumVault.sol",
    sourceIncluded: true
  },
  {
    id: "mockUsdc",
    slug: "mock-usdc",
    network: "World Chain Sepolia",
    address: "0xFBCB358948A1873AaEA771e0c1E6177498f497D9",
    explorerUrl: `${worldchainSepoliaExplorer}/0xFBCB358948A1873AaEA771e0c1E6177498f497D9`,
    sourceFile: "contracts/test/MockUSDC.sol",
    sourceIncluded: true
  }
];

export function getContractPath(contract: ContractDefinition) {
  return `/contracts/${contract.slug}`;
}

export function getContractBySlug(slug: string) {
  return contracts.find((contract) => contract.slug === slug);
}
