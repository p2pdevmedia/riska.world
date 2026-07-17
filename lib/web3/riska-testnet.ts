"use client";

import {
  createPublicClient,
  formatUnits,
  getAddress,
  http,
  isAddress,
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
  | "checking_token"
  | "approving_usdc"
  | "approving_token"
  | "opening_policy"
  | "issued";

export type TestnetPolicyAction =
  | "deposit"
  | "withdrawExtra"
  | "depositToken"
  | "withdrawToken"
  | "depositYield"
  | "withdrawYield"
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
  auxiliaryTokens: Array<{
    address: `0x${string}`;
    balance: bigint;
    decimals: number;
    symbol: string;
  }>;
  yieldPositions: Array<{
    active: boolean;
    costBasis: bigint;
    depositCap: bigint;
    depositsEnabled: boolean;
    estimatedAssets: bigint;
    metadataURI: string;
    name: string;
    shares: bigint;
    strategyId: number;
    totalCostBasis: bigint;
    totalShares: bigint;
  }>;
  yieldStrategies: Array<{
    active: boolean;
    depositCap: bigint;
    depositsEnabled: boolean;
    name: string;
    strategyId: number;
  }>;
  remainingExtraPrincipal: bigint;
  remainingMinimumPrincipal: bigint;
  status: number;
  termsHash: `0x${string}`;
  totalPrincipal: bigint;
};

export type RiskaTestnetCashflow = {
  amount: bigint;
  kind: "deposit" | "withdraw";
  timestamp: number;
};

type ContractAddresses = {
  mockUsdc: `0x${string}`;
  policyManager: `0x${string}`;
  premiumVault: `0x${string}`;
  yieldStrategyManager?: `0x${string}`;
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
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const policyOpenedEvent = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "policyId", type: "uint256" },
    { indexed: true, name: "holder", type: "address" },
    { indexed: true, name: "termsHash", type: "bytes32" }
  ],
  name: "PolicyOpened",
  type: "event"
} as const;

const policyDepositEvent = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "policyId", type: "uint256" },
    { indexed: true, name: "holder", type: "address" },
    { indexed: false, name: "amount", type: "uint256" },
    { indexed: false, name: "minimumPrincipalAdded", type: "uint256" },
    { indexed: false, name: "extraPrincipalAdded", type: "uint256" }
  ],
  name: "PolicyDeposit",
  type: "event"
} as const;

const extraWithdrawnEvent = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "policyId", type: "uint256" },
    { indexed: true, name: "holder", type: "address" },
    { indexed: false, name: "amount", type: "uint256" }
  ],
  name: "ExtraWithdrawn",
  type: "event"
} as const;

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
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "amount", type: "uint256" }
    ],
    name: "withdrawExtra",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "depositToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "strategyId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "minSharesOut", type: "uint256" }
    ],
    name: "depositYield",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "strategyId", type: "uint256" },
      { name: "shares", type: "uint256" },
      { name: "minAssetsOut", type: "uint256" }
    ],
    name: "withdrawYield",
    outputs: [{ name: "returnedAssets", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    name: "withdrawToken",
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
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "auxiliaryTokenCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "index", type: "uint256" }
    ],
    name: "auxiliaryTokenAt",
    outputs: [
      { name: "token", type: "address" },
      { name: "balance", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "yieldStrategyCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "index", type: "uint256" }
    ],
    name: "yieldStrategyAt",
    outputs: [
      { name: "strategyId", type: "uint256" },
      { name: "shares", type: "uint256" },
      { name: "costBasis", type: "uint256" }
    ],
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

const yieldStrategyManagerAbi = [
  {
    inputs: [],
    name: "strategyCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "strategyId", type: "uint256" }],
    name: "strategyAt",
    outputs: [
      { name: "adapter", type: "address" },
      { name: "name", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "depositCap", type: "uint256" },
      { name: "totalCostBasis", type: "uint256" },
      { name: "totalShares", type: "uint256" },
      { name: "active", type: "bool" },
      { name: "depositsEnabled", type: "bool" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "strategyId", type: "uint256" },
      { name: "shares", type: "uint256" }
    ],
    name: "previewRedeem",
    outputs: [{ name: "assets", type: "uint256" }],
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

  if (id === 0n) {
    throw new Error("This wallet does not have a Riska policy yet.");
  }

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
  const auxiliaryTokens = await getPolicyAuxiliaryTokens(policyManager, id);
  const yieldPositions = await getPolicyYieldPositions({
    policyId: id,
    policyManager,
    yieldStrategyManager: deployment.contracts.yieldStrategyManager?.address
  });
  const yieldStrategies = await getYieldStrategies(deployment.contracts.yieldStrategyManager?.address);

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
    auxiliaryTokens,
    yieldPositions,
    yieldStrategies,
    remainingExtraPrincipal: policy[7],
    remainingMinimumPrincipal: policy[6],
    status: policy[9],
    termsHash: policy[1],
    totalPrincipal
  };
}

export async function getTestnetPolicyCashflow(policyId: string): Promise<RiskaTestnetCashflow[]> {
  const deployment = await getRiskaTestnetDeployment();
  const { policyManager } = getRequiredContracts(deployment);
  const id = BigInt(policyId);
  const fromBlock = BigInt(deployment.blockNumber ?? 0);

  const [opened, deposits, withdrawals] = await Promise.all([
    publicClient.getLogs({
      address: policyManager,
      args: { policyId: id },
      event: policyOpenedEvent,
      fromBlock
    }),
    publicClient.getLogs({
      address: policyManager,
      args: { policyId: id },
      event: policyDepositEvent,
      fromBlock
    }),
    publicClient.getLogs({
      address: policyManager,
      args: { policyId: id },
      event: extraWithdrawnEvent,
      fromBlock
    })
  ]);

  const movements = [
    ...opened.map((log) => ({ amount: FIRST_PREMIUM, blockNumber: log.blockNumber, kind: "deposit" as const })),
    ...deposits.map((log) => ({ amount: log.args.amount ?? 0n, blockNumber: log.blockNumber, kind: "deposit" as const })),
    ...withdrawals.map((log) => ({ amount: log.args.amount ?? 0n, blockNumber: log.blockNumber, kind: "withdraw" as const }))
  ];
  const blockTimestamps = new Map<bigint, number>();

  await Promise.all(
    [...new Set(movements.map((movement) => movement.blockNumber))].map(async (blockNumber) => {
      const block = await publicClient.getBlock({ blockNumber });
      blockTimestamps.set(blockNumber, Number(block.timestamp));
    })
  );

  return movements
    .map((movement) => ({
      amount: movement.amount,
      kind: movement.kind,
      timestamp: blockTimestamps.get(movement.blockNumber) ?? 0
    }))
    .sort((left, right) => left.timestamp - right.timestamp);
}

async function getYieldStrategies(yieldStrategyManager?: `0x${string}`) {
  if (!yieldStrategyManager) return [];

  try {
    const count = await publicClient.readContract({
      abi: yieldStrategyManagerAbi,
      address: yieldStrategyManager,
      functionName: "strategyCount"
    });
    const strategies = await Promise.all(
      Array.from({ length: Number(count) }, (_, index) =>
        publicClient.readContract({
          abi: yieldStrategyManagerAbi,
          address: yieldStrategyManager,
          args: [BigInt(index)],
          functionName: "strategyAt"
        })
      )
    );

    return strategies.map((strategy, strategyId) => ({
      active: strategy[6],
      depositCap: strategy[3],
      depositsEnabled: strategy[7],
      name: strategy[1],
      strategyId
    }));
  } catch {
    return [];
  }
}

export async function getTestnetPolicyIdForHolder({
  holder
}: {
  holder: string;
}): Promise<string | null> {
  const deployment = await getRiskaTestnetDeployment();
  const { policyManager } = getRequiredContracts(deployment);
  const account = getAddress(holder);
  const policyId = await readPolicyIdForHolder(policyManager, account);

  return policyId === 0n ? null : policyId.toString();
}

async function getPolicyAuxiliaryTokens(policyManager: `0x${string}`, policyId: bigint) {
  const count = await publicClient.readContract({
    abi: policyManagerAbi,
    address: policyManager,
    args: [policyId],
    functionName: "auxiliaryTokenCount"
  });

  const tokenRows = await Promise.all(
    Array.from({ length: Number(count) }, (_, index) =>
      publicClient.readContract({
        abi: policyManagerAbi,
        address: policyManager,
        args: [policyId, BigInt(index)],
        functionName: "auxiliaryTokenAt"
      })
    )
  );

  return Promise.all(
    tokenRows
      .filter(([, balance]) => balance > 0n)
      .map(async ([address, balance]) => {
        const metadata = await readTokenMetadata(address);

        return {
          address,
          balance,
          decimals: metadata.decimals,
          symbol: metadata.symbol
        };
      })
  );
}

async function getPolicyYieldPositions({
  policyId,
  policyManager,
  yieldStrategyManager
}: {
  policyId: bigint;
  policyManager: `0x${string}`;
  yieldStrategyManager?: `0x${string}`;
}): Promise<RiskaTestnetPolicyView["yieldPositions"]> {
  if (!yieldStrategyManager) {
    return [];
  }

  try {
    const count = await publicClient.readContract({
      abi: policyManagerAbi,
      address: policyManager,
      args: [policyId],
      functionName: "yieldStrategyCount"
    });

    const rows = await Promise.all(
      Array.from({ length: Number(count) }, (_, index) =>
        publicClient.readContract({
          abi: policyManagerAbi,
          address: policyManager,
          args: [policyId, BigInt(index)],
          functionName: "yieldStrategyAt"
        })
      )
    );

    const activeRows = rows.filter(([, shares]) => shares > 0n);

    return Promise.all(
      activeRows.map(async ([strategyId, shares, costBasis]) => {
        const [strategy, estimatedAssets] = await Promise.all([
          publicClient.readContract({
            abi: yieldStrategyManagerAbi,
            address: yieldStrategyManager,
            args: [strategyId],
            functionName: "strategyAt"
          }),
          publicClient
            .readContract({
              abi: yieldStrategyManagerAbi,
              address: yieldStrategyManager,
              args: [strategyId, shares],
              functionName: "previewRedeem"
            })
            .catch(() => 0n)
        ]);

        return {
          active: strategy[6],
          costBasis,
          depositCap: strategy[3],
          depositsEnabled: strategy[7],
          estimatedAssets,
          metadataURI: strategy[2],
          name: strategy[1],
          shares,
          strategyId: Number(strategyId),
          totalCostBasis: strategy[4],
          totalShares: strategy[5]
        };
      })
    );
  } catch {
    return [];
  }
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
  const existingPolicyId = await readPolicyIdForHolder(contracts.policyManager, account);

  if (existingPolicyId > 0n) {
    throw new Error("This wallet already has a Riska policy. Use the policy dashboard instead of opening a new one.");
  }

  if (sharesBps.reduce((total, share) => total + share, 0) !== 10_000) {
    throw new Error("Beneficiary shares must total 100% before issuing a policy.");
  }

  const txHashes = await ensureMockUsdcBalanceAndAllowance({
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

  const policyId = await waitForPolicyIdForHolder(contracts.policyManager, account);

  onStatus?.("issued");

  return {
    policyId: policyId.toString(),
    txHashes: {
      approval: txHashes.approval,
      openPolicy: openPolicyHash
    }
  };
}

export async function runTestnetPolicyAction({
  action,
  amount,
  holder,
  onStatus,
  policyId,
  strategyId,
  tokenAddress
}: {
  action: TestnetPolicyAction;
  amount?: string;
  holder: string;
  onStatus?: (status: TestnetPolicyActionStatus) => void;
  policyId: string;
  strategyId?: number;
  tokenAddress?: string;
}) {
  onStatus?.("loading_contracts");
  const deployment = await getRiskaTestnetDeployment();
  const contracts = getRequiredContracts(deployment);
  const account = await getConnectedAccount(holder, onStatus);
  const walletClient = await createWorldchainSepoliaWalletClient();
  const id = BigInt(policyId);
  let hash: Hash;

  if (action === "deposit" || action === "withdrawExtra" || action === "depositYield" || action === "withdrawYield") {
    const parsedAmount = parseUnits(amount ?? "0", 6);
    if (parsedAmount <= 0n) {
      throw new Error("Amount must be greater than 0 USDC.");
    }

    if (action === "deposit") {
      await ensureMockUsdcBalanceAndAllowance({
        account,
        amount: parsedAmount,
        contracts,
        onStatus
      });
    }

    if ((action === "depositYield" || action === "withdrawYield") && strategyId === undefined) {
      throw new Error("Select a yield strategy first.");
    }

    onStatus?.("sending_transaction");
    if (action === "depositYield") {
      hash = await walletClient.writeContract({
        abi: policyManagerAbi,
        account,
        address: contracts.policyManager,
        args: [id, BigInt(strategyId ?? 0), parsedAmount, 0n],
        functionName: "depositYield"
      });
    } else if (action === "withdrawYield") {
      hash = await walletClient.writeContract({
        abi: policyManagerAbi,
        account,
        address: contracts.policyManager,
        args: [id, BigInt(strategyId ?? 0), parsedAmount, 0n],
        functionName: "withdrawYield"
      });
    } else {
      hash = await walletClient.writeContract({
        abi: policyManagerAbi,
        account,
        address: contracts.policyManager,
        args: [id, parsedAmount],
        functionName: action
      });
    }
  } else if (action === "depositToken" || action === "withdrawToken") {
    if (!tokenAddress || !isAddress(tokenAddress)) {
      throw new Error("Enter a valid ERC20 token address.");
    }

    const token = getAddress(tokenAddress);
    const metadata = await readTokenMetadata(token);
    const parsedAmount = parseUnits(amount ?? "0", metadata.decimals);

    if (parsedAmount <= 0n) {
      throw new Error(`Amount must be greater than 0 ${metadata.symbol}.`);
    }

    if (action === "depositToken") {
      await ensureTokenBalanceAndAllowance({
        account,
        amount: parsedAmount,
        decimals: metadata.decimals,
        onStatus,
        spender: contracts.premiumVault,
        symbol: metadata.symbol,
        token
      });
    }

    onStatus?.("sending_transaction");
    hash = await walletClient.writeContract({
      abi: policyManagerAbi,
      account,
      address: contracts.policyManager,
      args: [id, token, parsedAmount],
      functionName: action
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
  return formatTokenAmount(value, 6);
}

export function formatTokenAmount(value: bigint, decimals: number) {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
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
  const yieldStrategyManager = deployment.contracts.yieldStrategyManager?.address;

  if (!mockUsdc || !premiumVault || !policyManager) {
    throw new Error("The testnet deployment is missing MockUSDC, PremiumVault, or PolicyManager.");
  }

  return { mockUsdc, policyManager, premiumVault, yieldStrategyManager };
}

async function readPolicyIdForHolder(policyManager: `0x${string}`, account: `0x${string}`) {
  return publicClient.readContract({
    abi: policyManagerAbi,
    address: policyManager,
    args: [account],
    functionName: "policyOf"
  });
}

async function waitForPolicyIdForHolder(policyManager: `0x${string}`, account: `0x${string}`) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const policyId = await readPolicyIdForHolder(policyManager, account);

    if (policyId > 0n) {
      return policyId;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error("The policy transaction was confirmed, but the policy ID is not available yet. Refresh the dashboard in a moment.");
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

async function readTokenMetadata(token: `0x${string}`) {
  const [decimalsResult, symbolResult] = await Promise.allSettled([
    publicClient.readContract({
      abi: erc20Abi,
      address: token,
      functionName: "decimals"
    }),
    publicClient.readContract({
      abi: erc20Abi,
      address: token,
      functionName: "symbol"
    })
  ]);

  return {
    decimals: decimalsResult.status === "fulfilled" ? Number(decimalsResult.value) : 18,
    symbol: symbolResult.status === "fulfilled" && symbolResult.value ? symbolResult.value : "TOKEN"
  };
}

async function ensureMockUsdcBalanceAndAllowance({
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
  const [balance, allowance] = await Promise.all([
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
    throw new Error(
      `This wallet needs ${formatUsdcAmount(amount)} MockUSDC before interacting with the policy contract. Current balance: ${formatUsdcAmount(balance)} MockUSDC.`
    );
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

async function ensureTokenBalanceAndAllowance({
  account,
  amount,
  decimals,
  onStatus,
  spender,
  symbol,
  token
}: {
  account: `0x${string}`;
  amount: bigint;
  decimals: number;
  onStatus?: (status: TestnetPolicyActionStatus) => void;
  spender: `0x${string}`;
  symbol: string;
  token: `0x${string}`;
}) {
  const walletClient = await createWorldchainSepoliaWalletClient();

  onStatus?.("checking_token");
  const [balance, allowance] = await Promise.all([
    publicClient.readContract({
      abi: erc20Abi,
      address: token,
      args: [account],
      functionName: "balanceOf"
    }),
    publicClient.readContract({
      abi: erc20Abi,
      address: token,
      args: [account, spender],
      functionName: "allowance"
    })
  ]);

  if (balance < amount) {
    throw new Error(
      `This wallet needs ${formatTokenAmount(amount, decimals)} ${symbol} before depositing this token. Current balance: ${formatTokenAmount(balance, decimals)} ${symbol}.`
    );
  }

  if (allowance < amount) {
    onStatus?.("approving_token");
    const hash = await walletClient.writeContract({
      abi: erc20Abi,
      account,
      address: token,
      args: [spender, amount],
      functionName: "approve"
    });
    await publicClient.waitForTransactionReceipt({ hash });
  }
}
