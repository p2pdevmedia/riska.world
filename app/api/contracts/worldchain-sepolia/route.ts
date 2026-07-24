import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { getAddress, isAddress } from "viem";

import {
  WORLDCHAIN_SEPOLIA_CHAIN_ID,
  WORLDCHAIN_SEPOLIA_EXPLORER_URL,
  WORLDCHAIN_EXPLORER_URL,
  WORLDCHAIN_RPC_URL,
  WORLDCHAIN_SEPOLIA_RPC_URL,
  WORLDCHAIN_CHAIN_ID,
  type RiskaTestnetConfigResponse,
  type RiskaTestnetAuxiliaryTokenRecord,
  type RiskaTestnetContractName,
  type RiskaTestnetContractRecord,
  type RiskaTestnetContracts,
  type RiskaTestnetDeployment
} from "@/lib/riska-testnet";

export const dynamic = "force-dynamic";

const contractNames: RiskaTestnetContractName[] = [
  "mockUsdc",
  "beneficiaryRegistry",
  "premiumVault",
  "policyManager",
  "yieldStrategyManager",
  "testnetTokenFaucet"
];

export async function GET(request: Request) {
  const requestedEnvironment = new URL(request.url).searchParams.get("environment");
  const environment = requestedEnvironment === "production" || requestedEnvironment === "prod-test" ? "production" : "testnet";
  const deployment = readDeploymentFile(environment) ?? readDeploymentEnv(environment);
  const response: RiskaTestnetConfigResponse = deployment
    ? { configured: true, deployment }
    : {
        configured: false,
        error: "World Chain Sepolia contracts are not deployed yet."
      };

  return NextResponse.json(response);
}

function readDeploymentFile(environment: "production" | "testnet"): RiskaTestnetDeployment | null {
  const deploymentPath = path.join(process.cwd(), "deployments", environment === "production" ? "worldchain" : "worldchain-sepolia", "latest.json");
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
      environment,
      rpcUrl: parsed.rpcUrl ?? (environment === "production" ? WORLDCHAIN_RPC_URL : WORLDCHAIN_SEPOLIA_RPC_URL),
      policyHumanVerifier: normalizeOptionalAddress(parsed.policyHumanVerifier ?? parsed.verifier),
      ...(Object.keys(testAuxiliaryTokens).length > 0 ? { testAuxiliaryTokens } : {}),
      verifier: normalizeOptionalAddress(parsed.verifier)
    };
  } catch {
    return null;
  }
}

function readDeploymentEnv(environment: "production" | "testnet"): RiskaTestnetDeployment | null {
  const isProduction = environment === "production";
  const suffix = "";
  const prefix = isProduction ? "RISKA_WORLDCHAIN" : "RISKA_WORLDCHAIN_SEPOLIA";
  const contracts = normalizeContracts({
    mockUsdc: { address: process.env[`${prefix}_${isProduction ? "USDC" : "MOCK_USDC"}${suffix}`] },
    beneficiaryRegistry: { address: process.env[`${prefix}_BENEFICIARY_REGISTRY${suffix}`] },
    premiumVault: { address: process.env[`${prefix}_PREMIUM_VAULT${suffix}`] },
    policyManager: { address: process.env[`${prefix}_POLICY_MANAGER${suffix}`] },
    yieldStrategyManager: { address: process.env[`${prefix}_YIELD_STRATEGY_MANAGER${suffix}`] },
    testnetTokenFaucet: { address: isProduction ? undefined : process.env[`${prefix}_TESTNET_TOKEN_FAUCET${suffix}`] }
  });

  if (!hasRequiredContracts(contracts)) {
    return null;
  }

  return {
    environment,
    chainId: String(isProduction ? WORLDCHAIN_CHAIN_ID : WORLDCHAIN_SEPOLIA_CHAIN_ID),
    contracts,
    explorerBaseUrl: isProduction ? WORLDCHAIN_EXPLORER_URL : WORLDCHAIN_SEPOLIA_EXPLORER_URL,
    network: isProduction ? "worldchain" : "worldchainSepolia",
    rpcUrl: isProduction ? WORLDCHAIN_RPC_URL : WORLDCHAIN_SEPOLIA_RPC_URL
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
