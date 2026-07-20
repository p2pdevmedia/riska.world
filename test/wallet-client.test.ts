import assert from "node:assert/strict";
import test from "node:test";

import { createTransactionWalletClient } from "../lib/web3/wallet-client.ts";

const termsHash = "0x109b7832342e1cf21e6ae5a43bd1d5c09a26d74551ebb9bf0d53c0de09dd4538";
const account = "0x99d58aa8dd8311c3706d619176bb3bf2008148c3";
const policyManager = "0xaca401bE0C48Bb89231367D82770B3Ff25E70CA2";

const policyAbi = [{
  inputs: [{ name: "termsHash", type: "bytes32" }],
  name: "openPolicyRegressionProbe",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function"
}] as const;

test("does not request eth_chainId while submitting a contract transaction", async () => {
  const methods: string[] = [];
  const provider = {
    async request({ method }: { method: string }) {
      methods.push(method);

      if (method === "eth_chainId") {
        // Reproduces the injected-provider response that caused Viem to parse
        // the policy terms hash as a JavaScript number outside the safe range.
        return termsHash;
      }

      if (method === "eth_sendTransaction") {
        return `0x${"12".repeat(32)}`;
      }

      throw new Error(`Unexpected RPC method: ${method}`);
    }
  };

  const walletClient = createTransactionWalletClient(provider);
  const hash = await walletClient.writeContract({
    abi: policyAbi,
    account,
    address: policyManager,
    args: [termsHash],
    functionName: "openPolicyRegressionProbe"
  });

  assert.equal(hash, `0x${"12".repeat(32)}`);
  assert.deepEqual(methods, ["eth_sendTransaction"]);
});
