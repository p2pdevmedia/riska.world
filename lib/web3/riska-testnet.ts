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

export type TestnetPolicyAction =
  | "deposit"
  | "activatePayout"
  | "claimMonthly"
  | "claimAll"
  | "heartbeat"
  | "reportDeath"
  | "claimDeath";

export type TestnetPolicyActionStatus =
  | TestnetIssuanceStatus
  | "sending_transaction"
  | "confirming_transaction"
  | "refreshing_policy";

export type TestnetIssuanceResult = {
  policyId: string;
  txHashes: {
    approval?: Hash;
    mint?: Hash;
    openPolicy: Hash;
  };
};

export type RiskaTestnetPolicyView = {
  deathNotice: {
    active: boolean;
    claimableAt: number;
    reportedAt: number;
    reporter: `0x${string}`;
  };
  holder: `0x${string}`;
  isViewerBeneficiary: boolean;
  lastHolderInteractionAt: number;
  monthlyPayoutAmount: bigint;
  monthlyPayoutEstimate: bigint;
  nextPayoutAt: number;
  openedAt: number;
  payoutsMade: number;
  policyId: string;
  remainingExtraPrincipal: bigint;
  remainingMinimumPrincipal: bigint;
  status: number;
  termsHash: `0x${string}`;
  totalPrincipal: bigint;
};

type ContractAddresses = {
  mockUsdc: `0x${string}`;
  policyManager: `0x${string}`;
  premiumVault: `0x${string}`;
};

const FIRST_PREMIUM = parseUnits("30", 6);
export const MINIMUM_POLICY_PRINCIPAL = parseUnits("10800", 6);

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
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "activatePayout",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "claimMonthly",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "claimAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "heartbeat",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "reportDeath",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "claimDeath",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "policyOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "policies",
    outputs: [
      { name: "holder", type: "address" },
      { name: "termsHash", type: "bytes32" },
      { name: "payoutsMade", type: "uint16" },
      { name: "openedAt", type: "uint256" },
      { name: "lastHolderInteractionAt", type: "uint256" },
      { name: "nextPayoutAt", type: "uint256" },
      { name: "remainingMinimumPrincipal", type: "uint256" },
      { name: "remainingExtraPrincipal", type: "uint256" },
      { name: "monthlyPayoutAmount", type: "uint256" },
      { name: "status", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "deathNotices",
    outputs: [
      { name: "reporter", type: "address" },
      { name: "reportedAt", type: "uint256" },
      { name: "active", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "totalPrincipal",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "monthlyPayoutEstimate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "deathClaimableAt",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "account", type: "address" }
    ],
    name: "isBeneficiary",
    outputs: [{ name: "", type: "bool" }],
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

export async function getTestnetPolicy({
  policyId,
  viewer
}: {
  policyId: string;
  viewer?: string | null;
}): Promise<RiskaTestnetPolicyView> {
  const deployment = await getRiskaTestnetDeployment();
  const { policyManager } = getRequiredContracts(deployment);
  const id = BigInt(policyId);
  const viewerAddress = viewer ? getAddress(viewer) : null;

  const [policy, deathNotice, totalPrincipal, monthlyPayoutEstimate, deathClaimableAt, isViewerBeneficiary] =
    await Promise.all([
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [id],
        functionName: "policies"
      }),
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [id],
        functionName: "deathNotices"
      }),
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [id],
        functionName: "totalPrincipal"
      }),
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [id],
        functionName: "monthlyPayoutEstimate"
      }),
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [id],
        functionName: "deathClaimableAt"
      }),
      viewerAddress
        ? publicClient.readContract({
            abi: policyManagerAbi,
            address: policyManager,
            args: [id, viewerAddress],
            functionName: "isBeneficiary"
          })
        : Promise.resolve(false)
    ]);

  return {
    deathNotice: {
      active: deathNotice[2],
      claimableAt: Number(deathClaimableAt),
      reportedAt: Number(deathNotice[1]),
      reporter: deathNotice[0]
    },
    holder: policy[0],
    isViewerBeneficiary,
    lastHolderInteractionAt: Number(policy[4]),
    monthlyPayoutAmount: policy[8],
    monthlyPayoutEstimate,
    nextPayoutAt: Number(policy[5]),
    openedAt: Number(policy[3]),
    payoutsMade: Number(policy[2]),
    policyId,
    remainingExtraPrincipal: policy[7],
    remainingMinimumPrincipal: policy[6],
    status: policy[9],
    termsHash: policy[1],
    totalPrincipal
  };
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
  const contracts = getRequiredContracts(deployment);
  const reportStatus = onStatus as ((status: TestnetPolicyActionStatus) => void) | undefined;
  const account = await getConnectedAccount(holder, reportStatus);
  const beneficiaryAddresses = beneficiaries.map((beneficiary) => getAddress(beneficiary.wallet));
  const sharesBps = beneficiaries.map((beneficiary) => beneficiary.percent * 100);

  if (sharesBps.reduce((total, share) => total + share, 0) !== 10_000) {
    throw new Error("Beneficiary shares must total 100% before issuing a policy.");
  }

  const txHashes = await ensureMockUsdcAndAllowance({
    account,
    amount: FIRST_PREMIUM,
    contracts,
    onStatus: reportStatus
  });

  const walletClient = await createWorldchainSepoliaWalletClient();

  onStatus?.("opening_policy");
  const openPolicyHash = await walletClient.writeContract({
    abi: policyManagerAbi,
    account,
    address: contracts.policyManager,
    args: [beneficiaryAddresses, sharesBps, RISKA_POLICY_TERMS_HASH],
    functionName: "openPolicy"
  });
  txHashes.openPolicy = openPolicyHash;
  await publicClient.waitForTransactionReceipt({ hash: openPolicyHash });

  const policyId = await publicClient.readContract({
    abi: policyManagerAbi,
    address: contracts.policyManager,
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

export async function runTestnetPolicyAction({
  action,
  amount,
  holder,
  onStatus,
  policyId
}: {
  action: TestnetPolicyAction;
  amount?: string;
  holder: string;
  onStatus?: (status: TestnetPolicyActionStatus) => void;
  policyId: string;
}) {
  onStatus?.("loading_contracts");
  const deployment = await getRiskaTestnetDeployment();
  const contracts = getRequiredContracts(deployment);
  const account = await getConnectedAccount(holder, onStatus);
  const walletClient = await createWorldchainSepoliaWalletClient();
  const id = BigInt(policyId);
  let hash: Hash;

  if (action === "deposit") {
    const parsedAmount = parseUnits(amount ?? "0", 6);
    if (parsedAmount <= 0n) {
      throw new Error("Deposit amount must be greater than 0 USDC.");
    }

    await ensureMockUsdcAndAllowance({
      account,
      amount: parsedAmount,
      contracts,
      onStatus
    });

    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id, parsedAmount],
      functionName: "deposit"
    });
  } else if (action === "activatePayout") {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "activatePayout"
    });
  } else if (action === "claimMonthly") {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "claimMonthly"
    });
  } else if (action === "claimAll") {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "claimAll"
    });
  } else if (action === "heartbeat") {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "heartbeat"
    });
  } else if (action === "reportDeath") {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "reportDeath"
    });
  } else {
    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id],
      functionName: "claimDeath"
    });
  }

  onStatus?.("confirming_transaction");
  await publicClient.waitForTransactionReceipt({ hash });
  onStatus?.("refreshing_policy");

  return hash;
}

export function formatUsdcAmount(value: bigint) {
  const [whole, fraction = ""] = formatUnits(value, 6).split(".");
  const trimmedFraction = fraction.replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export function formatTestnetContractError(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { details?: unknown; message?: unknown; shortMessage?: unknown };
    return String(candidate.shortMessage ?? candidate.details ?? candidate.message ?? "Unknown contract error.");
  }

  return "Unknown contract error.";
}

function getRequiredContracts(deployment: RiskaTestnetDeployment): ContractAddresses {
  const mockUsdc = deployment.contracts.mockUsdc?.address;
  const premiumVault = deployment.contracts.premiumVault?.address;
  const policyManager = deployment.contracts.policyManager?.address;

  if (!mockUsdc || !premiumVault || !policyManager) {
    throw new Error("The testnet deployment is missing MockUSDC, PremiumVault, or PolicyManager.");
  }

  return { mockUsdc, policyManager, premiumVault };
}

async function getConnectedAccount(
  expectedAccount: string,
  onStatus?: (status: TestnetPolicyActionStatus) => void
): Promise<`0x${string}`> {
  onStatus?.("switching_network");
  await switchToWorldchainSepolia();

  const walletClient = await createWorldchainSepoliaWalletClient();
  const [connectedAccount] = await walletClient.requestAddresses();
  const account = getAddress(connectedAccount);
  const normalizedExpected = getAddress(expectedAccount);

  if (account !== normalizedExpected) {
    throw new Error("The browser wallet account does not match the wallet authenticated in the enrollment flow.");
  }

  return account;
}

async function ensureMockUsdcAndAllowance({
  account,
  amount,
  contracts,
  onStatus
}: {
  account: `0x${string}`;
  amount: bigint;
  contracts: ContractAddresses;
  onStatus?: (status: TestnetPolicyActionStatus) => void;
}) {
  const txHashes: Partial<TestnetIssuanceResult["txHashes"]> = {};
  const walletClient = await createWorldchainSepoliaWalletClient();

  onStatus?.("checking_usdc");
  let [balance, allowance] = await Promise.all([
    publicClient.readContract({
      abi: erc20Abi,
      address: contracts.mockUsdc,
      args: [account],
      functionName: "balanceOf"
    }),
    publicClient.readContract({
      abi: erc20Abi,
      address: contracts.mockUsdc,
      args: [account, contracts.premiumVault],
      functionName: "allowance"
    })
  ]);

  if (balance < amount) {
    const amountToMint = amount - balance;
    onStatus?.("minting_usdc");
    txHashes.mint = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: contracts.mockUsdc,
      args: [account, amountToMint],
      functionName: "mint"
    });
    await publicClient.waitForTransactionReceipt({ hash: txHashes.mint });
    balance = await publicClient.readContract({
      abi: erc20Abi,
      address: contracts.mockUsdc,
      args: [account],
      functionName: "balanceOf"
    });

    if (balance < amount) {
      throw new Error(`This wallet needs at least ${formatUsdcAmount(amount)} MockUSDC.`);
    }
  }

  if (allowance < amount) {
    onStatus?.("approving_usdc");
    txHashes.approval = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: contracts.mockUsdc,
      args: [contracts.premiumVault, amount],
      functionName: "approve"
    });
    await publicClient.waitForTransactionReceipt({ hash: txHashes.approval });
  }

  return txHashes;
}
