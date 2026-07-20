import assert from "node:assert/strict";
import test from "node:test";

import { derivePolicyNullifier, selectPolicyHumanResponse } from "../lib/world/policy-human-proof.ts";

const signalHash = `0x${"ab".repeat(32)}`;

test("selects the proof_of_human response bound to the wallet instead of the first nullifier", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "passport", nullifier: "0x01", signal_hash: signalHash },
    { identifier: "proof_of_human", nullifier: "0x02", signal_hash: `0x${"cd".repeat(32)}` },
    { identifier: "proof_of_human", nullifier: "0x03", signal_hash: signalHash.toUpperCase() }
  ], signalHash);

  assert.equal(selected?.nullifier, "0x03");
});

test("rejects a proof_of_human response that is not bound to the wallet", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "proof_of_human", nullifier: "0x01", signal_hash: `0x${"cd".repeat(32)}` }
  ], signalHash);

  assert.equal(selected, undefined);
});

test("three distinct World ID nullifiers produce three distinct contract keys", () => {
  const identities = ["0x01", "0x02", "0x03"].map((nullifier) =>
    derivePolicyNullifier({ action: "riska-policy-human-v1", nullifier })
  );

  assert.equal(new Set(identities.map((identity) => identity.nullifier)).size, 3);
  assert.equal(new Set(identities.map((identity) => identity.nullifierHash)).size, 3);
});

test("the same identity and action remain deterministic", () => {
  const first = derivePolicyNullifier({ action: "riska-policy-human-v1", nullifier: "0x01" });
  const second = derivePolicyNullifier({ action: "riska-policy-human-v1", nullifier: "1" });

  assert.deepEqual(first, second);
});
