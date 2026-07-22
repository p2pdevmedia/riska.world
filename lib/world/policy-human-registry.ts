import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";
import { normalizeNullifier } from "@/lib/world/policy-human-proof";

export { normalizeNullifier };

export type PolicyHumanReservation = {
  action: string;
  credentialIdentifiers: string[];
  nullifier: string;
  protocolVersion: string;
  walletAddress: string;
  expiresAt: Date;
};

type ReservationResult = { ok: true } | { ok: false };

/**
 * Atomically reserves one World ID nullifier for an action.
 *
 * The database's composite unique constraint, rather than process memory,
 * arbitrates simultaneous requests from any number of app instances. The raw
 * nullifier is never persisted; only a namespaced SHA-256 digest is stored.
 */
export async function reservePolicyHuman(reservation: PolicyHumanReservation): Promise<ReservationResult> {
  const rows = await getPrisma().$queryRaw<{ id: string }[]>(Prisma.sql`
    INSERT INTO "PolicyHumanReservation" (
      "id", "action", "nullifierHash", "walletAddress", "protocolVersion", "credentialIdentifiers", "expiresAt"
    ) VALUES (
      ${crypto.randomUUID()},
      ${reservation.action},
      ${hashNullifier(reservation.action, reservation.nullifier)},
      ${reservation.walletAddress},
      ${reservation.protocolVersion},
      ${JSON.stringify(reservation.credentialIdentifiers)}::jsonb,
      ${reservation.expiresAt}
    )
    ON CONFLICT ("action", "nullifierHash") DO UPDATE
    SET
      "walletAddress" = EXCLUDED."walletAddress",
      "protocolVersion" = EXCLUDED."protocolVersion",
      "credentialIdentifiers" = EXCLUDED."credentialIdentifiers",
      "createdAt" = CURRENT_TIMESTAMP,
      "expiresAt" = EXCLUDED."expiresAt"
    WHERE "PolicyHumanReservation"."expiresAt" <= CURRENT_TIMESTAMP
    RETURNING "id"
  `);

  return rows.length === 1 ? { ok: true } : { ok: false };
}

function hashNullifier(action: string, nullifier: string) {
  return createHash("sha256").update(`${action}:${nullifier}`).digest("hex");
}
