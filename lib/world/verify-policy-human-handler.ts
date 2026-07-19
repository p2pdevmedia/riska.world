import type { IDKitResult } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { cookies } from "next/headers";
import { getAddress } from "viem";
import { keccak256, stringToHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NextResponse } from "next/server";

import {
  RISKA_WORLD_ID_ENVIRONMENT,
  RISKA_WORLD_ID_POLICY_ACTION,
  normalizeWorldIdSignal
} from "@/lib/world/idkit";
import { normalizeNullifier } from "@/lib/world/policy-human-registry";
import { readWalletSession } from "@/lib/world/wallet-session";

type VerifyPolicyHumanRequest = {
  idkitResponse?: IDKitResult;
  walletAddress?: string;
};

type VerificationResponsePayload = {
  code?: string;
  detail?: string;
  error?: string;
  success?: boolean;
};

type NullifierResponse = {
  nullifier: string;
};

const POLICY_HUMAN_AUTHORIZATION_SESSION_SECONDS = 30 * 24 * 60 * 60;

export async function postVerifyPolicyHuman(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyPolicyHumanRequest | null;
  const idkitResponse = body?.idkitResponse;
  const walletAddress = body?.walletAddress;

  if (!idkitResponse || !walletAddress) {
    return NextResponse.json(
      { success: false, error: "Missing World ID proof or wallet address." },
      { status: 400 }
    );
  }

  const rpId = process.env.WORLD_ID_RP_ID;

  if (!rpId) {
    return NextResponse.json(
      { success: false, error: "WORLD_ID_RP_ID is not configured." },
      { status: 503 }
    );
  }

  const action = "action" in idkitResponse ? idkitResponse.action : undefined;

  if (action !== RISKA_WORLD_ID_POLICY_ACTION) {
    return NextResponse.json(
      { success: false, error: "World ID action does not match Riska policy gate." },
      { status: 400 }
    );
  }

  if (idkitResponse.environment !== RISKA_WORLD_ID_ENVIRONMENT) {
    return NextResponse.json(
      { success: false, error: "World ID environment does not match this deployment." },
      { status: 400 }
    );
  }

  const walletSession = readWalletSession(cookies());
  const allowsUnsignedBrowserWallet = RISKA_WORLD_ID_ENVIRONMENT === "staging";

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
  const signalMatches = responses.some(
    (response) => response.signal_hash?.toLowerCase() === expectedSignalHash
  );

  if (!signalMatches) {
    return NextResponse.json(
      { success: false, error: "World ID proof is not bound to the connected wallet." },
      { status: 400 }
    );
  }

  const verifyResponse = await fetch(`https://developer.world.org/api/v4/verify/${rpId}`, {
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

  const nullifierResponse = responses.find(hasNullifier) as NullifierResponse | undefined;
  const nullifierHex = nullifierResponse?.nullifier;

  if (!nullifierHex) {
    return NextResponse.json(
      { success: false, error: "World ID proof does not include a uniqueness nullifier." },
      { status: 400 }
    );
  }

  const nullifier = normalizeNullifier(nullifierHex);
  const credentialIdentifiers = responses.map((response) => response.identifier);
  const signingKey = process.env.POLICY_HUMAN_SIGNING_KEY as `0x${string}` | undefined;
  const policyManager = process.env.RISKA_WORLDCHAIN_SEPOLIA_POLICY_MANAGER as `0x${string}` | undefined;
  if (!signingKey || !policyManager) {
    return NextResponse.json(
      { success: false, code: "policy_human_attestation_unavailable", error: "Identity authorization is temporarily unavailable." },
      { status: 503 }
    );
  }
  const nullifierHash = keccak256(stringToHex(`${RISKA_WORLD_ID_POLICY_ACTION}:${nullifier}`));
  const deadline = BigInt(Math.floor(Date.now() / 1000) + POLICY_HUMAN_AUTHORIZATION_SESSION_SECONDS);
  const authorization = await privateKeyToAccount(signingKey).signTypedData({
    domain: { name: "RiskaPolicyManager", version: "1", chainId: 4801, verifyingContract: policyManager },
    types: { PolicyHumanAuthorization: [
      { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "deadline", type: "uint256" }
    ] },
    primaryType: "PolicyHumanAuthorization",
    message: { holder: normalizedWallet as `0x${string}`, nullifierHash, deadline }
  });

  return NextResponse.json({
    success: true,
    policyGateStatus: "verified_unique_human",
    reservation: { credentialIdentifiers, nullifier, protocolVersion: idkitResponse.protocol_version, reservedAt: new Date().toISOString(), walletAddress: normalizedWallet, nullifierHash, deadline: deadline.toString(), authorization }
  });
}

function hasNullifier(response: unknown): response is NullifierResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "nullifier" in response &&
    typeof (response as NullifierResponse).nullifier === "string"
  );
}
