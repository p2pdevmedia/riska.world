import assert from "node:assert/strict";
import test from "node:test";

import {
  derivePolicyNullifier,
  hasVerifiedPolicyHumanResult,
  selectPolicyHumanResponse
} from "../lib/world/policy-human-proof.ts";
import {
  getWorldIdEnvironmentForDeployment,
  getWorldIdSimulatorIdentitySelectorUrl
} from "../lib/world/idkit.ts";

const signalHash = `0x${"ab".repeat(32)}`;

test("selects the proof_of_human response bound to the wallet instead of the first nullifier", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "passport", nullifier: "0x01", signal_hash: signalHash },
    { identifier: "proof_of_human", nullifier: "0x02", signal_hash: `0x${"cd".repeat(32)}` },
    { identifier: "proof_of_human", nullifier: "0x03", signal_hash: signalHash.toUpperCase() }
  ], signalHash, "proof_of_human");

  assert.equal(selected?.nullifier, "0x03");
});

test("rejects a proof_of_human response that is not bound to the wallet", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "proof_of_human", nullifier: "0x01", signal_hash: `0x${"cd".repeat(32)}` }
  ], signalHash, "proof_of_human");

  assert.equal(selected, undefined);
});

test("selects a legacy Orb response only for the TEST credential", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "orb", nullifier: "0x04", signal_hash: signalHash }
  ], signalHash, "orb");

  assert.equal(selected?.nullifier, "0x04");
  assert.equal(selectPolicyHumanResponse([
    { identifier: "orb", nullifier: "0x04", signal_hash: signalHash }
  ], signalHash, "proof_of_human"), undefined);
});

test("does not accept other legacy credential levels as policy-human proof", () => {
  const selected = selectPolicyHumanResponse([
    { identifier: "device", nullifier: "0x05", signal_hash: signalHash },
    { identifier: "document", nullifier: "0x06", signal_hash: signalHash }
  ], signalHash, "orb");

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

test("requires the World verifier to validate the selected v4 response", () => {
  const verified = hasVerifiedPolicyHumanResult([
    { identifier: "passport", success: true },
    { identifier: "proof_of_human", success: false },
    { identifier: "proof_of_human", success: true }
  ], "proof_of_human");

  assert.equal(verified, true);
});

test("rejects the selected response when the World verifier did not validate it", () => {
  const verified = hasVerifiedPolicyHumanResult([
    { identifier: "proof_of_human", success: false }
  ], "proof_of_human");

  assert.equal(verified, false);
});

test("rewrites the staging simulator link to the explicit identity selector", () => {
  const connectUrl = "https://world.org/verify?t=wld&i=request-1&k=signature";
  const simulatorUrl = `https://simulator.worldcoin.org/?connect_url=${encodeURIComponent(connectUrl)}`;

  assert.equal(
    getWorldIdSimulatorIdentitySelectorUrl(simulatorUrl),
    `https://simulator.worldcoin.org/select-id?connect_url=${encodeURIComponent(connectUrl)}`
  );
});

test("does not rewrite unrelated links as simulator identity selectors", () => {
  assert.equal(getWorldIdSimulatorIdentitySelectorUrl("https://world.org/verify"), null);
});

test("maps the TEST and PROD selectors to their matching World ID environments", () => {
  assert.equal(getWorldIdEnvironmentForDeployment("testnet"), "staging");
  assert.equal(getWorldIdEnvironmentForDeployment("prod-test"), "production");
});
