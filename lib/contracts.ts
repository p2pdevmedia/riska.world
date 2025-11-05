export type ContractId =
  | "policyManager"
  | "claimsBridge"
  | "premiumVault";

export type ContractDefinition = {
  id: ContractId;
  address: `0x${string}`;
  network: string;
  explorerUrl?: string;
  docsUrl?: string;
};

export const contracts: ContractDefinition[] = [
  {
    id: "policyManager",
    network: "World Chain Mainnet",
    address: "0x1C8d8Ff83C7C08443dE006B6f2467F2A457769C7",
    explorerUrl:
      "https://explorer.worldchain.network/address/0x1C8d8Ff83C7C08443dE006B6f2467F2A457769C7",
    docsUrl: "https://docs.riska.world/contracts/policy-manager"
  },
  {
    id: "claimsBridge",
    network: "World Chain Mainnet",
    address: "0x7A61cA870Ac1E23Bc7D09E3B4835F1C36F7A2d90",
    explorerUrl:
      "https://explorer.worldchain.network/address/0x7A61cA870Ac1E23Bc7D09E3B4835F1C36F7A2d90",
    docsUrl: "https://docs.riska.world/contracts/claims-bridge"
  },
  {
    id: "premiumVault",
    network: "World Chain Mainnet",
    address: "0x5B3f55C4948EA605CE2d2d6A651e6aB6f41d96f0",
    explorerUrl:
      "https://explorer.worldchain.network/address/0x5B3f55C4948EA605CE2d2d6A651e6aB6f41d96f0",
    docsUrl: "https://docs.riska.world/contracts/premium-vault"
  }
];
