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
    address: "0xc027aB5095aAF53eF394d2e0C745641c9878cCC1",
    explorerUrl: `${worldchainSepoliaExplorer}/0xc027aB5095aAF53eF394d2e0C745641c9878cCC1`,
    sourceFile: "contracts/RiskaThirtyYearPolicy.sol",
    sourceIncluded: true
  },
  {
    id: "policyManager",
    slug: "policy-manager",
    network: "World Chain Sepolia",
    address: "0x884d22b2b6d8445Eb51e0917A09A25C8C42355e4",
    explorerUrl: `${worldchainSepoliaExplorer}/0x884d22b2b6d8445Eb51e0917A09A25C8C42355e4`,
    sourceFile: "contracts/RiskaPolicyManager.sol",
    sourceIncluded: true
  },
  {
    id: "beneficiaryRegistry",
    slug: "beneficiary-registry",
    network: "World Chain Sepolia",
    address: "0xb7A050E4Dd747789A3e600A0327D8D18670b7194",
    explorerUrl: `${worldchainSepoliaExplorer}/0xb7A050E4Dd747789A3e600A0327D8D18670b7194`,
    sourceFile: "contracts/RiskaBeneficiaryRegistry.sol",
    sourceIncluded: true
  },
  {
    id: "deathVerifier",
    slug: "death-verifier",
    network: "World Chain Sepolia",
    address: "0x0D15Cd5d64fBD47464F93F00EAcA94ffe0e46ff3",
    explorerUrl: `${worldchainSepoliaExplorer}/0x0D15Cd5d64fBD47464F93F00EAcA94ffe0e46ff3`,
    sourceFile: "contracts/RiskaDeathVerifier.sol",
    sourceIncluded: true
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Sepolia",
    address: "0x5A1CFBe35A48533744C2c926673B35874415f5F8",
    explorerUrl: `${worldchainSepoliaExplorer}/0x5A1CFBe35A48533744C2c926673B35874415f5F8`,
    sourceFile: "contracts/RiskaPremiumVault.sol",
    sourceIncluded: true
  },
  {
    id: "mockUsdc",
    slug: "mock-usdc",
    network: "World Chain Sepolia",
    address: "0x2404B3b077f03FF93f498bDB287847e625244362",
    explorerUrl: `${worldchainSepoliaExplorer}/0x2404B3b077f03FF93f498bDB287847e625244362`,
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
