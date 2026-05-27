import type { IDKitResult } from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { cookies } from "next/headers";
import { getAddress } from "viem";
import { NextResponse } from "next/server";

import {
  RISKA_WORLD_ID_ENVIRONMENT,
  RISKA_WORLD_ID_POLICY_ACTION,
  normalizeWorldIdSignal
} from "@/lib/world/idkit";
import {
  normalizeNullifier,
  reservePolicyHuman
} from "@/lib/world/policy-human-registry";
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

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

  if (!walletSession && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Wallet Auth session is required before World ID verification." },
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

  const verifyPayload = (await verifyResponse.json().catch(() => null)) as
    | VerificationResponsePayload
    | null;

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
  const reservation = reservePolicyHuman({
    action: RISKA_WORLD_ID_POLICY_ACTION,
    credentialIdentifiers,
    nullifier,
    nullifierHex,
    protocolVersion: idkitResponse.protocol_version,
    walletAddress: normalizedWallet
  });

  if (!reservation.ok) {
    return NextResponse.json(
      {
        success: false,
        alreadyReserved: true,
        error: "This verified human is already reserved for a Riska policy.",
        reservation: reservation.reservation
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    success: true,
    policyGateStatus: "verified_unique_human",
    reservation: reservation.reservation
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
