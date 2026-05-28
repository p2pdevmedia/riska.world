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
    address: "0xF0Ab6785B2DE77D91b2921e4749923Df12fd21d9",
    explorerUrl: `${worldchainSepoliaExplorer}/0xF0Ab6785B2DE77D91b2921e4749923Df12fd21d9`,
    sourceFile: "contracts/RiskaThirtyYearPolicy.sol",
    sourceIncluded: true
  },
  {
    id: "policyManager",
    slug: "policy-manager",
    network: "World Chain Sepolia",
    address: "0x369Ca7c53F0cA2960328f8347ce16963569782c9",
    explorerUrl: `${worldchainSepoliaExplorer}/0x369Ca7c53F0cA2960328f8347ce16963569782c9`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0x136634699F1633b57711935c01485F37448FB26a",
    explorerUrl: `${worldchainSepoliaExplorer}/0x136634699F1633b57711935c01485F37448FB26a`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "deathVerifier",
    slug: "death-verifier",
    network: "World Chain Sepolia",
    address: "0x6080DFF3900Be904D8fcFd2B7A83E317D8b2de99",
    explorerUrl: `${worldchainSepoliaExplorer}/0x6080DFF3900Be904D8fcFd2B7A83E317D8b2de99`,
    sourceFile: "contracts/RiskaDeathVerifier.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0x69b56B3Cc1A938851948173400Dc0C410102849E",
    explorerUrl: `${worldchainSepoliaExplorer}/0x69b56B3Cc1A938851948173400Dc0C410102849E`,
    sourceFile: "contracts/RiskaPremiumVault.sol",
    sourceIncluded: true
  },
  {
    id: "mockUsdc",
    slug: "mock-usdc",
    network: "World Chain Sepolia",
    address: "0x370981a7c40B133cEe8d34A7bd08650A0b00A36C",
    explorerUrl: `${worldchainSepoliaExplorer}/0x370981a7c40B133cEe8d34A7bd08650A0b00A36C`,
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
