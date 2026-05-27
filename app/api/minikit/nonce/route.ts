import { randomBytes } from "crypto";

import { NextResponse } from "next/server";

import {
  RISKA_SIWE_COOKIE_NAME,
  RISKA_SIWE_NONCE_TTL_SECONDS,
  RISKA_WALLET_AUTH_STATEMENT
} from "@/lib/world/minikit-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + RISKA_SIWE_NONCE_TTL_SECONDS * 1000);
  const response = NextResponse.json({
    nonce,
    statement: RISKA_WALLET_AUTH_STATEMENT,
    expiresAt: expiresAt.toISOString()
  });

  response.cookies.set(RISKA_SIWE_COOKIE_NAME, nonce, {
    httpOnly: true,
    maxAge: RISKA_SIWE_NONCE_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
