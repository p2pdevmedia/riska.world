export type ContractId =
  | "thirtyYearPolicy"
  | "policyManager"
  | "deathVerifier"
  | "premiumVault";

export type ContractSlug =
  | "riska-thirty-year-policy"
  | "policy-manager"
  | "death-verifier"
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

export const contracts: ContractDefinition[] = [
  {
    id: "thirtyYearPolicy",
    slug: "riska-thirty-year-policy",
    network: "World Chain Testnet-ready",
    sourceFile: "contracts/RiskaThirtyYearPolicy.sol",
    sourceIncluded: true
  },
  {
    id: "policyManager",
    slug: "policy-manager",
    network: "World Chain Mainnet",
    address: "0x1C8d8Ff83C7C08443dE006B6f2467F2A457769C7",
    explorerUrl: "https://worldscan.org/address/0x1C8d8Ff83C7C08443dE006B6f2467F2A457769C7",
    sourceIncluded: false
  },
  {
    id: "deathVerifier",
    slug: "death-verifier",
    network: "World Chain Mainnet",
    address: "0x7A61cA870Ac1E23Bc7D09E3B4835F1C36F7A2d90",
    explorerUrl: "https://worldscan.org/address/0x7A61cA870Ac1E23Bc7D09E3B4835F1C36F7A2d90",
    sourceIncluded: false
  },
  {
    id: "premiumVault",
    slug: "premium-vault",
    network: "World Chain Mainnet",
    address: "0x5B3f55C4948EA605CE2d2d6A651e6aB6f41d96f0",
    explorerUrl: "https://worldscan.org/address/0x5B3f55C4948EA605CE2d2d6A651e6aB6f41d96f0",
    sourceIncluded: false
  }
];

export function getContractPath(contract: ContractDefinition) {
  return `/contracts/${contract.slug}`;
}

export function getContractBySlug(slug: string) {
  return contracts.find((contract) => contract.slug === slug);
}
