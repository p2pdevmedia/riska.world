import { createHash } from "node:crypto";

import { getPrisma } from "@/lib/prisma";
import { normalizeNullifier } from "@/lib/world/policy-human-proof";

export { normalizeNullifier };

export type PolicyHumanReservation = {
  action: string;
  credentialIdentifiers: string[];
  nullifier: string;
  nullifierHex: string;
  protocolVersion: string;
  reservedAt: string;
  walletAddress: string;
};

type ReservationResult =
  | { ok: true; reservation: PolicyHumanReservation }
  | { ok: false };

/**
 * Atomically reserves one World ID nullifier for an action.
 *
 * The database's composite unique constraint, rather than process memory,
 * arbitrates simultaneous requests from any number of app instances. The raw
 * nullifier is never persisted; only a namespaced SHA-256 digest is stored.
 */
export async function reservePolicyHuman(
  reservation: Omit<PolicyHumanReservation, "reservedAt">
): Promise<ReservationResult> {
  const reservedAt = new Date().toISOString();

  try {
    await getPrisma().policyHumanReservation.create({
      data: {
        action: reservation.action,
        credentialIdentifiers: reservation.credentialIdentifiers,
        nullifierHash: hashNullifier(reservation.action, reservation.nullifier),
        protocolVersion: reservation.protocolVersion,
        walletAddress: reservation.walletAddress
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { ok: false };
    throw error;
  }

  return { ok: true, reservation: { ...reservation, reservedAt } };
}

function hashNullifier(action: string, nullifier: string) {
  return createHash("sha256").update(`${action}:${nullifier}`).digest("hex");
}

function isUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
