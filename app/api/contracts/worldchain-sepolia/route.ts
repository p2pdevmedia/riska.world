import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import {
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  WORLDCHAIN_SEPOLIA_EXPLORER_URL,
  type RiskaTestnetConfigResponse,
  type RiskaTestnetAuxiliaryTokenRecord,
  type RiskaTestnetContractName,
  type RiskaTestnetContractRecord,
  type RiskaTestnetContracts,
  type RiskaTestnetDeployment
} from "@/lib/riska-testnet";

export const dynamic = "force-dynamic";

const deploymentPath = path.join(process.cwd(), "deployments", "worldchain-sepolia", "latest.json");
const contractNames: RiskaTestnetContractName[] = [
  "mockUsdc",
  "beneficiaryRegistry",
  "premiumVault",
  "policyManager",
  "yieldStrategyManager",
  "testnetTokenFaucet"
];

export async function GET() {
  const deployment = readDeploymentFile() ?? readDeploymentEnv();
  const response: RiskaTestnetConfigResponse = deployment
    ? { configured: true, deployment }
    : {
        configured: false,
        error: "World Chain Sepolia contracts are not deployed yet."
      };

  return NextResponse.json(response);
}

function readDeploymentFile(): RiskaTestnetDeployment | null {
  if (!fs.existsSync(deploymentPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Partial<RiskaTestnetDeployment>;
    const contracts = normalizeContracts(parsed.contracts);
    const testAuxiliaryTokens = normalizeTestAuxiliaryTokens(parsed.testAuxiliaryTokens);

    if (!hasRequiredContracts(contracts)) {
      return null;
    }

    return {
      blockNumber: parsed.blockNumber,
      chainId: String(parsed.chainId ?? WORLDCHAIN_SEPOLIA_CHAIN_ID),
      contracts,
      deployedAt: parsed.deployedAt,
      deployer: normalizeOptionalAddress(parsed.deployer),
      explorerBaseUrl: parsed.explorerBaseUrl ?? WORLDCHAIN_SEPOLIA_EXPLORER_URL,
      network: parsed.network ?? "worldchainSepolia",
      policyHumanVerifier: normalizeOptionalAddress(parsed.policyHumanVerifier ?? parsed.verifier),
      ...(Object.keys(testAuxiliaryTokens).length > 0 ? { testAuxiliaryTokens } : {}),
      verifier: normalizeOptionalAddress(parsed.verifier)
    };
  } catch {
    return null;
  }
}

function readDeploymentEnv(): RiskaTestnetDeployment | null {
  const contracts = normalizeContracts({
    mockUsdc: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_MOCK_USDC },
    beneficiaryRegistry: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_BENEFICIARY_REGISTRY },
    premiumVault: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_PREMIUM_VAULT },
    policyManager: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_POLICY_MANAGER },
    yieldStrategyManager: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_YIELD_STRATEGY_MANAGER },
    testnetTokenFaucet: { address: process.env.RISKA_WORLDCHAIN_SEPOLIA_TESTNET_TOKEN_FAUCET }
  });

  if (!hasRequiredContracts(contracts)) {
    return null;
  }

  return {
    chainId: String(WORLDCHAIN_SEPOLIA_CHAIN_ID),
    contracts,
    explorerBaseUrl: WORLDCHAIN_SEPOLIA_EXPLORER_URL,
    network: "worldchainSepolia"
  };
}

function normalizeContracts(input: unknown): RiskaTestnetContracts {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Partial<Record<RiskaTestnetContractName, Partial<RiskaTestnetContractRecord>>>;

  return contractNames.reduce<RiskaTestnetContracts>((contracts, name) => {
    const contract = record[name];
    const address = normalizeOptionalAddress(contract?.address);

    if (address) {
      contracts[name] = {
        address,
        transactionHash:
          typeof contract?.transactionHash === "string" && contract.transactionHash.startsWith("0x")
            ? (contract.transactionHash as `0x${string}`)
            : null
      };
    }

    return contracts;
  }, {});
}

function normalizeTestAuxiliaryTokens(input: unknown): Record<string, RiskaTestnetAuxiliaryTokenRecord> {
  if (!input || typeof input !== "object") {
    return {};
  }

  const record = input as Record<string, Partial<RiskaTestnetAuxiliaryTokenRecord>>;

  return Object.entries(record).reduce<Record<string, RiskaTestnetAuxiliaryTokenRecord>>((tokens, [key, token]) => {
    const address = normalizeOptionalAddress(token.address);
    const decimals = Number(token.decimals);
    const name = typeof token.name === "string" && token.name.trim() ? token.name : undefined;
    const symbol = typeof token.symbol === "string" && token.symbol.trim() ? token.symbol : undefined;

    if (!address || !name || !symbol || !Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
      return tokens;
    }

    tokens[key] = {
      address,
      decimals,
      mintTransactionHash: normalizeOptionalHash(token.mintTransactionHash),
      name,
      symbol,
      transactionHash: normalizeOptionalHash(token.transactionHash)
    };

    return tokens;
  }, {});
}

function normalizeOptionalAddress(address: unknown): `0x${string}` | undefined {
  return typeof address === "string" && isAddress(address) ? getAddress(address) : undefined;
}

function normalizeOptionalHash(hash: unknown): `0x${string}` | null {
  return typeof hash === "string" && hash.startsWith("0x") ? (hash as `0x${string}`) : null;
}

function hasRequiredContracts(contracts: RiskaTestnetContracts) {
  return Boolean(
    contracts.mockUsdc?.address &&
      contracts.beneficiaryRegistry?.address &&
      contracts.premiumVault?.address &&
      contracts.policyManager?.address
  );
}
