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
  | { ok: false; reservation: PolicyHumanReservation };

type RegistryGlobal = typeof globalThis & {
  __riskaPolicyHumanRegistry?: Map<string, PolicyHumanReservation>;
};

const registryGlobal = globalThis as RegistryGlobal;

const policyHumanRegistry =
  registryGlobal.__riskaPolicyHumanRegistry ?? new Map<string, PolicyHumanReservation>();

if (process.env.NODE_ENV !== "production") {
  registryGlobal.__riskaPolicyHumanRegistry = policyHumanRegistry;
}

export function reservePolicyHuman(
  reservation: Omit<PolicyHumanReservation, "reservedAt">
): ReservationResult {
  const key = getReservationKey(reservation.action, reservation.nullifier);
  const existingReservation = policyHumanRegistry.get(key);

  if (existingReservation) {
    return { ok: false, reservation: existingReservation };
  }

  const nextReservation = {
    ...reservation,
    reservedAt: new Date().toISOString()
  };

  policyHumanRegistry.set(key, nextReservation);

  return { ok: true, reservation: nextReservation };
}

export function normalizeNullifier(nullifier: string) {
  return BigInt(nullifier).toString(10);
}

function getReservationKey(action: string, nullifier: string) {
  return `${action}:${nullifier}`;
}
