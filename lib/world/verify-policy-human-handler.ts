import type { IDKitResult } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { cookies } from "next/headers";
import { createPublicClient, getAddress, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NextResponse } from "next/server";

import {
  getWorldIdEnvironmentForDeployment,
  RISKA_WORLD_ID_POLICY_ACTION,
  normalizeWorldIdSignal
} from "@/lib/world/idkit";
import {
  derivePolicyNullifier,
  hasVerifiedPolicyHumanResult,
  selectPolicyHumanResponse,
} from "@/lib/world/policy-human-proof";
import { policyHumanEnvironment } from "@/lib/world/server-env";
import { readWalletSession } from "@/lib/world/wallet-session";

type VerifyPolicyHumanRequest = {
  deployment?: "production" | "testnet" | "prod-test";
  idkitResponse?: IDKitResult;
  walletAddress?: string;
};

type VerificationResponsePayload = {
  code?: string;
  detail?: string;
  error?: string;
  results?: Array<{
    identifier?: string;
    nullifier?: string;
    success?: boolean;
  }>;
  success?: boolean;
};

const POLICY_HUMAN_AUTHORIZATION_SESSION_SECONDS = 30 * 24 * 60 * 60;
const policyNullifierRegistryAbi = [
  {
    inputs: [{ name: "", type: "bytes32" }],
    name: "policyOfNullifierHash",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export async function postVerifyPolicyHuman(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyPolicyHumanRequest | null;
  const deployment = body?.deployment === "production" || body?.deployment === "prod-test" ? "production" : "testnet";
  const expectedWorldIdEnvironment = getWorldIdEnvironmentForDeployment(deployment);
  const idkitResponse = body?.idkitResponse;
  const walletAddress = body?.walletAddress;

  if (!idkitResponse || !walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing World ID proof or wallet address." },
      { status: 400 }
    );
  }

  const serverEnvironment = policyHumanEnvironment(deployment);

  if (!serverEnvironment) {
    return NextResponse.json(
      { success: false, error: "World ID policy verification is not configured." },
      { status: 503 }
    );
  }

  const action = "action" in idkitResponse ? idkitResponse.action : undefined;
  const expectedProtocolVersion = deployment === "testnet" ? "3.0" : "4.0";
  const expectedIdentifier = deployment === "testnet" ? "orb" : "proof_of_human";

  if (action !== RISKA_WORLD_ID_POLICY_ACTION) {
    return NextResponse.json(
      { success: false, error: "World ID action does not match Riska policy gate." },
      { status: 400 }
    );
  }

  if (idkitResponse.environment !== expectedWorldIdEnvironment) {
    return NextResponse.json(
      { success: false, error: "World ID environment does not match this deployment." },
      { status: 400 }
    );
  }

  if (idkitResponse.protocol_version !== expectedProtocolVersion || "session_id" in idkitResponse) {
    return NextResponse.json(
      {
        success: false,
        code: "world_id_proof_required",
        error: deployment === "testnet"
          ? "Riska TEST requires a World ID Orb simulator proof."
          : "Riska PROD requires a World ID 4.0 uniqueness proof."
      },
      { status: 400 }
    );
  }

  const walletSession = readWalletSession(cookies());
  const allowsUnsignedBrowserWallet = expectedWorldIdEnvironment === "staging";

  if (!walletSession && process.env.NODE_ENV === "production" && !allowsUnsignedBrowserWallet) {
    return NextResponse.json(
      {
        success: false,
        code: "wallet_session_required",
        error: "Wallet Auth session is required before World ID verification."
      },
      { status: 401 }
    );
  }

  let normalizedWallet: string;

  try {
    normalizedWallet = getAddress(walletSession?.address ?? walletAddress);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid wallet address for World ID signal." },
      { status: 400 }
    );
  }

  if (walletSession && walletAddress) {
    try {
      if (getAddress(walletAddress) !== walletSession.address) {
        return NextResponse.json(
          { success: false, error: "World ID wallet does not match the Wallet Auth session." },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address for World ID signal." },
        { status: 400 }
      );
    }
  }

  const expectedSignalHash = hashSignal(normalizeWorldIdSignal(normalizedWallet)).toLowerCase();
  const responses = idkitResponse.responses ?? [];
  const policyHumanResponse = selectPolicyHumanResponse(
    responses,
    expectedSignalHash,
    expectedIdentifier
  );

  if (!policyHumanResponse) {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_policy_human_proof",
        error: "World ID proof of human is missing or is not bound to the connected wallet."
      },
      { status: 400 }
    );
  }

  const verifyResponse = await fetch(`https://developer.world.org/api/v4/verify/${serverEnvironment.rpId}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "riska.world/0.1 world-id"
    },
    body: JSON.stringify(idkitResponse)
  });

  const verifyPayload = (await verifyResponse.json().catch(() => null)) as VerificationResponsePayload | null;

  if (!verifyResponse.ok) {
    return NextResponse.json(
      {
        success: false,
        error: verifyPayload?.error ?? verifyPayload?.detail ?? "World ID proof verification failed.",
        code: verifyPayload?.code
      },
      { status: 400 }
    );
  }

  const hasVerifiedHumanResult = hasVerifiedPolicyHumanResult(
    verifyPayload?.results ?? [],
    policyHumanResponse.identifier!
  );

  if (!hasVerifiedHumanResult) {
    console.error("[world-id] verifier did not validate the selected proof-of-human response", {
      protocolVersion: idkitResponse.protocol_version,
      responseIdentifiers: responses.map((response) => response.identifier)
    });
    return NextResponse.json(
      {
        success: false,
        code: "invalid_policy_human_proof",
        error: "World ID did not verify the proof-of-human response."
      },
      { status: 400 }
    );
  }

  let nullifier: string;
  let nullifierHash: `0x${string}`;

  try {
    ({ nullifier, nullifierHash } = derivePolicyNullifier({
      action: RISKA_WORLD_ID_POLICY_ACTION,
      nullifier: policyHumanResponse.nullifier!
    }));
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_policy_human_proof",
        error: "World ID returned an invalid proof-of-human nullifier."
      },
      { status: 400 }
    );
  }
  const credentialIdentifiers = responses.map((response) => response.identifier);
  const { policyManager, rpcUrl, signingKey } = serverEnvironment;

  let existingPolicyId: bigint;

  try {
    const publicClient = createPublicClient({
      transport: http(rpcUrl)
    });
    existingPolicyId = await publicClient.readContract({
      abi: policyNullifierRegistryAbi,
      address: policyManager,
      args: [nullifierHash],
      functionName: "policyOfNullifierHash"
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "policy_registry_unavailable",
        error: "The policy registry could not be checked. Please try verification again."
      },
      { status: 503 }
    );
  }

  if (existingPolicyId > 0n) {
    console.info("[world-id] policy nullifier already used", {
      existingPolicyId: existingPolicyId.toString(),
      protocolVersion: idkitResponse.protocol_version
    });
    return NextResponse.json(
      {
        success: false,
        alreadyReserved: true,
        code: "nullifier_already_used",
        error: "This World ID identity already opened a policy for another wallet.",
        policyId: existingPolicyId.toString()
      },
      { status: 409 }
    );
  }

  // The contract is the source of truth for nullifier uniqueness. This read is
  // only a user-friendly preflight; openPolicy enforces the same invariant
  // atomically on-chain when the wallet submits the transaction.
  const deadline = BigInt(Math.floor(Date.now() / 1000) + POLICY_HUMAN_AUTHORIZATION_SESSION_SECONDS);

  const policyHumanSigner = privateKeyToAccount(signingKey);
  const authorization = await policyHumanSigner.signTypedData({
    domain: { name: "RiskaPolicyManager", version: "1", chainId: 4801, verifyingContract: policyManager },
    types: { PolicyHumanAuthorization: [
      { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "deadline", type: "uint256" }
    ] },
    primaryType: "PolicyHumanAuthorization",
    message: { holder: normalizedWallet as `0x${string}`, nullifierHash, deadline }
  });

  console.info("[world-id] policy human authorization issued", {
    credentialIdentifiers,
    protocolVersion: idkitResponse.protocol_version,
    walletAddress: normalizedWallet
  });

  return NextResponse.json({
    success: true,
    policyGateStatus: "verified_unique_human",
    reservation: {
      credentialIdentifiers,
      nullifier,
      protocolVersion: idkitResponse.protocol_version,
      reservedAt: new Date().toISOString(),
      walletAddress: normalizedWallet,
      nullifierHash,
      deadline: deadline.toString(),
      authorization,
      policyHumanVerifier: policyHumanSigner.address,
      policyManager
    }
  });
}
