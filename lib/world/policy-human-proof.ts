import { keccak256, stringToHex } from "viem";

type PolicyHumanResponse = {
  identifier?: string;
  nullifier?: string;
  signal_hash?: string;
};

export function normalizeNullifier(nullifier: string) {
  return BigInt(nullifier).toString(10);
}

export function selectPolicyHumanResponse(
  responses: readonly PolicyHumanResponse[],
  expectedSignalHash: string
) {
  const normalizedSignalHash = expectedSignalHash.toLowerCase();

  return responses.find(
    (response) =>
      response.identifier === "proof_of_human" &&
      typeof response.nullifier === "string" &&
      response.nullifier.length > 0 &&
      response.signal_hash?.toLowerCase() === normalizedSignalHash
  );
}

export function derivePolicyNullifier({ action, nullifier }: { action: string; nullifier: string }) {
  const normalizedNullifier = normalizeNullifier(nullifier);

  return {
    nullifier: normalizedNullifier,
    nullifierHash: keccak256(stringToHex(`${action}:${normalizedNullifier}`))
  };
}
