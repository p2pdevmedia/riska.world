import { signRequest } from "@worldcoin/idkit/signing";
import { NextResponse } from "next/server";

import { RISKA_WORLD_ID_POLICY_ACTION } from "@/lib/world/idkit";
import { requiredEnvironment } from "@/lib/world/server-env";

type RpSignatureRequest = {
  action?: string;
};

export async function postRpSignature(request: Request) {
  const body = (await request.json().catch(() => null)) as RpSignatureRequest | null;
  const action = body?.action ?? RISKA_WORLD_ID_POLICY_ACTION;

  if (action !== RISKA_WORLD_ID_POLICY_ACTION) {
    return NextResponse.json(
      { configured: false, error: "Unsupported World ID action." },
      { status: 400 }
    );
  }

  const env = requiredEnvironment(["WORLD_ID_RP_ID", "RP_SIGNING_KEY"]);

  if (!env) {
    return NextResponse.json(
      {
        configured: false,
        error: "World ID RP configuration is missing.",
        requiredEnv: ["WORLD_ID_RP_ID", "RP_SIGNING_KEY"]
      },
      { status: 503 }
    );
  }

  try {
    const { sig, nonce, createdAt, expiresAt } = signRequest({
      signingKeyHex: env.RP_SIGNING_KEY,
      action,
      ttl: 300
    });

    return NextResponse.json({
      configured: true,
      action,
      rpContext: {
        rp_id: env.WORLD_ID_RP_ID,
        nonce,
        created_at: createdAt,
        expires_at: expiresAt,
        signature: sig
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : "Unable to sign World ID request."
      },
      { status: 500 }
    );
  }
}
