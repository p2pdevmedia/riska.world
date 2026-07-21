import { getAddress, isAddress } from "viem";
import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ReservationRow = {
  action: string;
  credentialIdentifiers: unknown;
  createdAt: Date;
  nullifierHash: string;
  protocolVersion: string;
  walletAddress: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallets = url.searchParams.get("wallets")?.split(",").map((wallet) => wallet.trim()).filter(Boolean) ?? [];

  if (wallets.length === 0) {
    return NextResponse.json({ reservations: {} });
  }

  const normalizedWallets = Array.from(
    new Set(
      wallets
        .filter((wallet) => isAddress(wallet))
        .map((wallet) => getAddress(wallet))
    )
  );

  if (normalizedWallets.length === 0) {
    return NextResponse.json({ reservations: {} });
  }

  const rows = await getPrisma().policyHumanReservation.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      walletAddress: {
        in: normalizedWallets
      }
    }
  }) as ReservationRow[];

  const reservations: Record<string, {
    action: string;
    credentialIdentifiers: string[];
    nullifierHash: string;
    protocolVersion: string;
    reservedAt: string;
    walletAddress: string;
  }> = {};

  for (const row of rows) {
    const walletKey = getAddress(row.walletAddress).toLowerCase();

    if (reservations[walletKey]) {
      continue;
    }

    reservations[walletKey] = {
      action: row.action,
      credentialIdentifiers: normalizeCredentialIdentifiers(row.credentialIdentifiers),
      nullifierHash: row.nullifierHash,
      protocolVersion: row.protocolVersion,
      reservedAt: row.createdAt.toISOString(),
      walletAddress: getAddress(row.walletAddress)
    };
  }

  return NextResponse.json({ reservations });
}

function normalizeCredentialIdentifiers(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}
