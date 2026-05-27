"use client";

import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  parseUnits,
  type Hash
} from "viem";
import { worldchainSepolia } from "viem/chains";

import {
  RISKA_POLICY_TERMS_HASH,
  WORLDCHAIN_SEPOLIA_RPC_URL,
  type RiskaTestnetConfigResponse,
  type RiskaTestnetDeployment
} from "@/lib/riska-testnet";
import {
  createWorldchainSepoliaWalletClient,
  switchToWorldchainSepolia
} from "@/lib/web3/metamask";

export type TestnetBeneficiaryInput = {
  percent: number;
  wallet: string;
};

export type TestnetIssuanceStatus =
  | "loading_contracts"
  | "switching_network"
  | "checking_usdc"
  | "minting_usdc"
  | "approving_usdc"
  | "opening_policy"
  | "issued";

export type TestnetIssuanceResult = {
  policyId: string;
  txHashes: {
    approval?: Hash;
    mint?: Hash;
    openPolicy: Hash;
  };
};

const FIRST_PREMIUM = parseUnits("30", 6);

const publicClient = createPublicClient({
  chain: worldchainSepolia,
  transport: http(WORLDCHAIN_SEPOLIA_RPC_URL)
});

const erc20Abi = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

const policyManagerAbi = [
  {
    inputs: [
      { name: "beneficiaries", type: "address[]" },
      { name: "sharesBps", type: "uint16[]" },
      { name: "termsHash", type: "bytes32" }
    ],
    name: "openPolicy",
    outputs: [{ name: "policyId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "policyOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function getRiskaTestnetDeployment(): Promise<RiskaTestnetDeployment> {
  const response = await fetch("/api/contracts/worldchain-sepolia", {
    cache: "no-store"
  });
  const payload = (await response.json()) as RiskaTestnetConfigResponse;

  if (!response.ok || !payload.configured || !payload.deployment) {
    throw new Error(payload.error ?? "World Chain Sepolia contracts are not configured.");
  }

  return payload.deployment;
}

export async function issueTestnetPolicy({
  beneficiaries,
  holder,
  onStatus
}: {
  beneficiaries: TestnetBeneficiaryInput[];
  holder: string;
  onStatus?: (status: TestnetIssuanceStatus) => void;
}): Promise<TestnetIssuanceResult> {
  onStatus?.("loading_contracts");
  const deployment = await getRiskaTestnetDeployment();
  const mockUsdc = deployment.contracts.mockUsdc?.address;
  const premiumVault = deployment.contracts.premiumVault?.address;
  const policyManager = deployment.contracts.policyManager?.address;

  if (!mockUsdc || !premiumVault || !policyManager) {
    throw new Error("The testnet deployment is missing MockUSDC, PremiumVault, or PolicyManager.");
  }

  onStatus?.("switching_network");
  await switchToWorldchainSepolia();

  const walletClient = await createWorldchainSepoliaWalletClient();
  const [connectedAccount] = await walletClient.requestAddresses();
  const account = getAddress(connectedAccount);
  const normalizedHolder = getAddress(holder);

  if (account !== normalizedHolder) {
    throw new Error("The browser wallet account does not match the wallet authenticated in the enrollment flow.");
  }

  const beneficiaryAddresses = beneficiaries.map((beneficiary) => getAddress(beneficiary.wallet));
  const sharesBps = beneficiaries.map((beneficiary) => beneficiary.percent * 100);

  if (sharesBps.reduce((total, share) => total + share, 0) !== 10_000) {
    throw new Error("Beneficiary shares must total 100% before issuing a policy.");
  }

  const txHashes: Partial<TestnetIssuanceResult["txHashes"]> = {};

  onStatus?.("checking_usdc");
  let [balance, allowance] = await Promise.all([
    publicClient.readContract({
      abi: erc20Abi,
      address: mockUsdc,
      args: [account],
      functionName: "balanceOf"
    }),
    publicClient.readContract({
      abi: erc20Abi,
      address: mockUsdc,
      args: [account, premiumVault],
      functionName: "allowance"
    })
  ]);

  if (balance < FIRST_PREMIUM) {
    const amountToMint = FIRST_PREMIUM - balance;
    onStatus?.("minting_usdc");
    txHashes.mint = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: mockUsdc,
      args: [account, amountToMint],
      functionName: "mint"
    });
    await publicClient.waitForTransactionReceipt({ hash: txHashes.mint });
    balance = await publicClient.readContract({
      abi: erc20Abi,
      address: mockUsdc,
      args: [account],
      functionName: "balanceOf"
    });

    if (balance < FIRST_PREMIUM) {
      throw new Error(`This wallet needs at least 30 MockUSDC. Current balance: ${formatUnits(balance, 6)} mUSDC.`);
    }
  }

  if (allowance < FIRST_PREMIUM) {
    onStatus?.("approving_usdc");
    txHashes.approval = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: mockUsdc,
      args: [premiumVault, FIRST_PREMIUM],
      functionName: "approve"
    });
    await publicClient.waitForTransactionReceipt({ hash: txHashes.approval });
  }

  onStatus?.("opening_policy");
  const openPolicyHash = await walletClient.writeContract({
    abi: policyManagerAbi,
    account,
    address: policyManager,
    args: [beneficiaryAddresses, sharesBps, RISKA_POLICY_TERMS_HASH],
    functionName: "openPolicy"
  });
  txHashes.openPolicy = openPolicyHash;
  await publicClient.waitForTransactionReceipt({ hash: openPolicyHash });

  const policyId = await publicClient.readContract({
    abi: policyManagerAbi,
    address: policyManager,
    args: [account],
    functionName: "policyOf"
  });

  onStatus?.("issued");

  return {
    policyId: policyId.toString(),
    txHashes: {
      approval: txHashes.approval,
      mint: txHashes.mint,
      openPolicy: openPolicyHash
    }
  };
}

export function formatTestnetContractError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { details?: unknown; message?: unknown; shortMessage?: unknown };
    return String(candidate.shortMessage ?? candidate.details ?? candidate.message ?? "Unknown contract error.");
  }

  return "Unknown contract error.";
}
