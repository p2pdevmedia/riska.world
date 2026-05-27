import type { WalletAuthResult } from "@worldcoin/minikit-js/commands";
import { verifySiweMessage } from "@worldcoin/minikit-js/siwe";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  RISKA_SIWE_COOKIE_NAME,
  RISKA_WALLET_AUTH_STATEMENT
} from "@/lib/world/minikit-auth";
import {
  RISKA_WALLET_SESSION_COOKIE_NAME,
  createWalletSessionCookie
} from "@/lib/world/wallet-session";

type CompleteSiweRequest = {
  nonce?: string;
  payload?: WalletAuthResult;
};

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as CompleteSiweRequest | null;
  const nonce = body?.nonce;
  const payload = body?.payload;

  if (!nonce || !payload) {
    return NextResponse.json(
      { isValid: false, error: "Missing Wallet Auth payload." },
      { status: 400 }
    );
  }

  const expectedNonce = cookies().get(RISKA_SIWE_COOKIE_NAME)?.value;

  if (!expectedNonce || expectedNonce !== nonce) {
    return NextResponse.json(
      { isValid: false, error: "Invalid or expired nonce." },
      { status: 400 }
    );
  }

  try {
    const verification = await verifySiweMessage(
      payload,
      nonce,
      RISKA_WALLET_AUTH_STATEMENT
    );

    if (!verification.isValid || !verification.siweMessageData.address) {
      return NextResponse.json(
        { isValid: false, error: "Wallet Auth signature could not be verified." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      isValid: true,
      address: verification.siweMessageData.address,
      chainId: verification.siweMessageData.chain_id
    });
    const walletSession = createWalletSessionCookie(verification.siweMessageData.address);

    response.cookies.set(RISKA_SIWE_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/"
    });
    response.cookies.set(RISKA_WALLET_SESSION_COOKIE_NAME, walletSession.value, {
      httpOnly: true,
      maxAge: walletSession.maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        isValid: false,
        error: error instanceof Error ? error.message : "Wallet Auth verification failed."
      },
      { status: 400 }
    );
  }
}
