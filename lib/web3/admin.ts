"use client";

import { createPublicClient, formatUnits, getAddress, http, isAddress, type Address, type Hash } from "viem";
import { worldchainSepolia } from "viem/chains";

import { WORLDCHAIN_SEPOLIA_RPC_URL } from "@/lib/riska-testnet";
import { getRiskaTestnetDeployment } from "@/lib/web3/riska-testnet";
import { createWorldchainSepoliaWalletClient, switchToWorldchainSepolia } from "@/lib/web3/metamask";

const publicClient = createPublicClient({ chain: worldchainSepolia, transport: http(WORLDCHAIN_SEPOLIA_RPC_URL) });

const ownableAbi = [
  { inputs: [], name: "owner", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "newOwner", type: "address" }], name: "transferOwnership", outputs: [], stateMutability: "nonpayable", type: "function" }
] as const;

const policyManagerAdminAbi = [
  ...ownableAbi,
  { inputs: [], name: "nextPolicyId", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "", type: "uint256" }], name: "policies", stateMutability: "view", type: "function",
    outputs: [
      { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "termsHash", type: "bytes32" },
      { name: "payoutsMade", type: "uint16" }, { name: "openedAt", type: "uint256" }, { name: "lastHolderInteractionAt", type: "uint256" },
      { name: "nextPayoutAt", type: "uint256" }, { name: "remainingMinimumPrincipal", type: "uint256" }, { name: "remainingExtraPrincipal", type: "uint256" },
      { name: "monthlyPayoutAmount", type: "uint256" }, { name: "status", type: "uint8" }
    ]
  },
  {
    inputs: [{ name: "", type: "uint256" }], name: "deathNotices", stateMutability: "view", type: "function",
    outputs: [{ name: "reporter", type: "address" }, { name: "reportedAt", type: "uint256" }, { name: "active", type: "bool" }]
  },
  { inputs: [{ name: "policyId", type: "uint256" }], name: "totalPrincipal", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "policyId", type: "uint256" }], name: "beneficiaryCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "policyId", type: "uint256" }, { name: "index", type: "uint256" }], name: "beneficiaryAt", outputs: [{ name: "account", type: "address" }, { name: "shareBps", type: "uint16" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "policyId", type: "uint256" }], name: "deathClaimableAt", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "policyId", type: "uint256" }], name: "reportDeath", outputs: [], stateMutability: "nonpayable", type: "function" }
] as const;

const premiumVaultAdminAbi = [
  ...ownableAbi,
  { inputs: [], name: "protocolReserveBalance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "protocolYieldReserveBalance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], name: "withdrawProtocolReserve", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], name: "withdrawProtocolYieldReserve", outputs: [], stateMutability: "nonpayable", type: "function" }
] as const;

export type AdminOwners = { beneficiaryRegistry: Address; policyManager: Address; premiumVault: Address };
export type AdminWorldIdReservation = {
  action: string;
  credentialIdentifiers: string[];
  nullifierHash: string;
  protocolVersion: string;
  reservedAt: string;
  walletAddress: Address;
};
export type AdminPolicy = { id: string; holder: Address; openedAt: number; principal: bigint; status: number; deathReported: boolean; worldId: AdminWorldIdReservation | null };
export type AdminPolicyDetail = AdminPolicy & { beneficiaries: Array<{ account: Address; shareBps: number }>; death: { active: boolean; reporter: Address; reportedAt: number; claimableAt: number }; monthlyPayoutAmount: bigint; nextPayoutAt: number; remainingExtraPrincipal: bigint; remainingMinimumPrincipal: bigint; payoutsMade: number; termsHash: `0x${string}`; worldId: AdminWorldIdReservation | null };
export type AdminOverview = { owners: AdminOwners; policyCount: number; protocolReserveBalance: bigint; protocolYieldReserveBalance: bigint; authorized: boolean };
export type AdminContractKey = keyof AdminOwners;

async function deploymentContracts() {
  const deployment = await getRiskaTestnetDeployment();
  const { beneficiaryRegistry, policyManager, premiumVault } = deployment.contracts;
  if (!beneficiaryRegistry?.address || !policyManager?.address || !premiumVault?.address) throw new Error("Faltan contratos base en el despliegue.");
  return { beneficiaryRegistry: beneficiaryRegistry.address, policyManager: policyManager.address, premiumVault: premiumVault.address };
}

async function getWorldIdReservations(wallets: string[]): Promise<Record<string, AdminWorldIdReservation>> {
  if (wallets.length === 0) {
    return {};
  }

  const response = await fetch(`/api/admin/world-id-reservations?wallets=${encodeURIComponent(wallets.join(","))}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("No se pudieron cargar las verificaciones de World ID.");
  }

  const payload = (await response.json()) as {
    reservations?: Record<string, AdminWorldIdReservation>;
  };

  return payload.reservations ?? {};
}

export async function getAdminOverview(account?: string | null): Promise<AdminOverview> {
  const contracts = await deploymentContracts();
  const [policyManagerOwner, premiumVaultOwner, beneficiaryRegistryOwner, nextPolicyId, protocolReserveBalance, protocolYieldReserveBalance] = await Promise.all([
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "owner" }),
    publicClient.readContract({ address: contracts.premiumVault, abi: premiumVaultAdminAbi, functionName: "owner" }),
    publicClient.readContract({ address: contracts.beneficiaryRegistry, abi: ownableAbi, functionName: "owner" }),
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "nextPolicyId" }),
    publicClient.readContract({ address: contracts.premiumVault, abi: premiumVaultAdminAbi, functionName: "protocolReserveBalance" }),
    publicClient.readContract({ address: contracts.premiumVault, abi: premiumVaultAdminAbi, functionName: "protocolYieldReserveBalance" })
  ]);
  const owners = { policyManager: policyManagerOwner, premiumVault: premiumVaultOwner, beneficiaryRegistry: beneficiaryRegistryOwner };
  const normalized = account && isAddress(account) ? getAddress(account).toLowerCase() : null;
  return { owners, policyCount: Number(nextPolicyId - 1n), protocolReserveBalance, protocolYieldReserveBalance, authorized: Boolean(normalized && Object.values(owners).every((owner) => owner.toLowerCase() === normalized)) };
}

export async function getAdminPolicies(page: number, pageSize = 20): Promise<{ policies: AdminPolicy[]; policyCount: number }> {
  const contracts = await deploymentContracts();
  const nextId = await publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "nextPolicyId" });
  const policyCount = Number(nextId - 1n);
  const start = Math.max(1, page * pageSize + 1);
  const ids = Array.from({ length: Math.max(0, Math.min(pageSize, policyCount - start + 1)) }, (_, index) => BigInt(start + index));
  const policies = await Promise.all(ids.map(async (id) => {
    const [policy, death, principal] = await Promise.all([
      publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "policies", args: [id] }),
      publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "deathNotices", args: [id] }),
      publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "totalPrincipal", args: [id] })
    ]);
    return { id: id.toString(), holder: policy[0], openedAt: Number(policy[4]), principal, status: Number(policy[10]), deathReported: death[2] };
  }));
  const worldIdReservations = await getWorldIdReservations(policies.map((policy) => policy.holder));
  return {
    policies: policies.map((policy) => ({
      ...policy,
      worldId: worldIdReservations[policy.holder.toLowerCase()] ?? null
    })),
    policyCount
  };
}

export async function getAdminPolicy(id: string): Promise<AdminPolicyDetail> {
  const contracts = await deploymentContracts();
  const policyId = BigInt(id);
  if (policyId < 1n) throw new Error("ID de póliza inválido.");
  const [policy, death, principal, count, claimableAt] = await Promise.all([
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "policies", args: [policyId] }),
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "deathNotices", args: [policyId] }),
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "totalPrincipal", args: [policyId] }),
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "beneficiaryCount", args: [policyId] }),
    publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "deathClaimableAt", args: [policyId] })
  ]);
  if (policy[0] === "0x0000000000000000000000000000000000000000") throw new Error("La póliza no existe.");
  const beneficiaries = await Promise.all(Array.from({ length: Number(count) }, async (_, index) => {
    const entry = await publicClient.readContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, functionName: "beneficiaryAt", args: [policyId, BigInt(index)] });
    return { account: entry[0], shareBps: Number(entry[1]) };
  }));
  const worldIdReservation = await getWorldIdReservations([policy[0]]);
  return { id, holder: policy[0], termsHash: policy[2], payoutsMade: Number(policy[3]), openedAt: Number(policy[4]), nextPayoutAt: Number(policy[6]), remainingMinimumPrincipal: policy[7], remainingExtraPrincipal: policy[8], monthlyPayoutAmount: policy[9], status: Number(policy[10]), principal, deathReported: death[2], beneficiaries, death: { active: death[2], reporter: death[0], reportedAt: Number(death[1]), claimableAt: Number(claimableAt) }, worldId: worldIdReservation[policy[0].toLowerCase()] ?? null };
}

async function write(action: (account: Address) => Promise<Hash>, account: string) {
  if (!isAddress(account)) throw new Error("Conecta una wallet válida.");
  await switchToWorldchainSepolia();
  const hash = await action(getAddress(account));
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function reportAdminDeath(policyId: string, account: string) {
  const contracts = await deploymentContracts();
  return write(async (wallet) => (await createWorldchainSepoliaWalletClient()).writeContract({ address: contracts.policyManager, abi: policyManagerAdminAbi, account: wallet, functionName: "reportDeath", args: [BigInt(policyId)] }), account);
}

export async function withdrawAdminFee(kind: "reserve" | "yield", recipient: string, amount: bigint, account: string) {
  if (!isAddress(recipient) || amount <= 0n) throw new Error("Indica un destinatario y monto válidos.");
  const contracts = await deploymentContracts();
  const functionName = kind === "reserve" ? "withdrawProtocolReserve" : "withdrawProtocolYieldReserve";
  return write(async (wallet) => (await createWorldchainSepoliaWalletClient()).writeContract({ address: contracts.premiumVault, abi: premiumVaultAdminAbi, account: wallet, functionName, args: [getAddress(recipient), amount] }), account);
}

export async function transferAdminOwnership(contract: AdminContractKey, recipient: string, account: string) {
  if (!isAddress(recipient)) throw new Error("La nueva wallet no es válida.");
  const contracts = await deploymentContracts();
  const abi = contract === "premiumVault" ? premiumVaultAdminAbi : contract === "policyManager" ? policyManagerAdminAbi : ownableAbi;
  return write(async (wallet) => (await createWorldchainSepoliaWalletClient()).writeContract({ address: contracts[contract], abi, account: wallet, functionName: "transferOwnership", args: [getAddress(recipient)] }), account);
}

export function formatAdminUsdc(value: bigint) { return `${formatUnits(value, 6)} USDC`; }
export function shortAddress(value: string) { return `${value.slice(0, 6)}…${value.slice(-4)}`; }
export function shortWorldId(value: string) { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value; }
export const policyStatus = ["None", "Active", "Payout active", "Death settled", "Closed"];
