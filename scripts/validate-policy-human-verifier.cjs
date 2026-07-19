const fs = require("fs");
const path = require("path");
const { getAddress } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

function loadEnvFile(fileName) {
  const filePath = path.join(__dirname, "..", fileName);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");

const signingKey = process.env.POLICY_HUMAN_SIGNING_KEY;
if (!signingKey) {
  if (process.env.VERCEL_ENV) {
    throw new Error("POLICY_HUMAN_SIGNING_KEY is required to validate the PolicyManager human verifier.");
  }

  console.log("Policy human verifier validation skipped outside Vercel; the private key is not stored locally.");
  process.exit(0);
}

const normalizedSigningKey = signingKey.startsWith("0x") ? signingKey : `0x${signingKey}`;
if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedSigningKey)) {
  throw new Error("POLICY_HUMAN_SIGNING_KEY must be a 32-byte hex private key.");
}

const deploymentPath = path.join(__dirname, "..", "deployments", "worldchain-sepolia", "latest.json");
const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
const configuredVerifier = deployment.policyHumanVerifier;

if (!configuredVerifier) {
  throw new Error("The World Chain Sepolia deployment does not declare policyHumanVerifier.");
}

const derivedVerifier = privateKeyToAccount(normalizedSigningKey).address;
if (getAddress(derivedVerifier) !== getAddress(configuredVerifier)) {
  throw new Error(
    `POLICY_HUMAN_SIGNING_KEY resolves to ${derivedVerifier}, but the deployed PolicyManager expects ${configuredVerifier}.`
  );
}

console.log(`Policy human verifier validated: ${derivedVerifier}`);
