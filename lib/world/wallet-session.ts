import { createHmac, timingSafeEqual } from "crypto";

import { getAddress } from "viem";

export const RISKA_WALLET_SESSION_COOKIE_NAME = "riska_wallet_session";
export const RISKA_WALLET_SESSION_TTL_SECONDS = 60 * 60;

export type WalletSession = {
  address: string;
  expiresAt: number;
};

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function createWalletSessionCookie(address: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + RISKA_WALLET_SESSION_TTL_SECONDS;
  const session: WalletSession = {
    address: getAddress(address),
    expiresAt
  };
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = signPayload(payload);

  return {
    maxAge: RISKA_WALLET_SESSION_TTL_SECONDS,
    value: `${payload}.${signature}`
  };
}

export function readWalletSession(cookies: CookieReader): WalletSession | null {
  const cookie = cookies.get(RISKA_WALLET_SESSION_COOKIE_NAME)?.value;

  if (!cookie) {
    return null;
  }

  const [payload, signature] = cookie.split(".");

  if (!payload || !signature || !isValidSignature(payload, signature)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as WalletSession;

    if (!session.address || session.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      address: getAddress(session.address),
      expiresAt: session.expiresAt
    };
  } catch {
    return null;
  }
}

function signPayload(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function isValidSignature(payload: string, signature: string) {
  const expectedSignature = signPayload(payload);
  const expected = Buffer.from(expectedSignature);
  const received = Buffer.from(signature);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function getSessionSecret() {
  const secret =
    process.env.RISKA_SESSION_SECRET ??
    process.env.RP_SIGNING_KEY ??
    (process.env.NODE_ENV === "production" ? undefined : "riska-development-session-secret");

  if (!secret) {
    throw new Error("RISKA_SESSION_SECRET or RP_SIGNING_KEY is required for wallet sessions.");
  }

  return secret;
}
