const fs = require("fs");
const path = require("path");
const { Wallet } = require("ethers");

const envPath = path.join(__dirname, "..", ".env.worldchain-sepolia.local");
const force = process.argv.includes("--force");
const defaultRpcUrl = "https://worldchain-sepolia.g.alchemy.com/public";

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

const existingEnv = readEnv(envPath);

if (existingEnv.WORLDCHAIN_SEPOLIA_PRIVATE_KEY && !force) {
  const wallet = new Wallet(existingEnv.WORLDCHAIN_SEPOLIA_PRIVATE_KEY);

  console.log("Existing World Chain Sepolia test wallet found.");
  console.log(`Address: ${wallet.address}`);
  console.log(`Config: ${envPath}`);
  console.log("Use --force to replace it with a new wallet.");
  process.exit(0);
}

const wallet = Wallet.createRandom();
const envContent = [
  "# Local test wallet for World Chain Sepolia. This file is git-ignored.",
  "# Do not fund this wallet on mainnet.",
  `WORLDCHAIN_SEPOLIA_RPC_URL=${existingEnv.WORLDCHAIN_SEPOLIA_RPC_URL ?? defaultRpcUrl}`,
  `WORLDCHAIN_SEPOLIA_PRIVATE_KEY=${wallet.privateKey}`,
  `RISKA_DEATH_VERIFIER_ADDRESS=${wallet.address}`,
  ""
].join("\n");

fs.writeFileSync(envPath, envContent, { mode: 0o600 });
fs.chmodSync(envPath, 0o600);

console.log("Created World Chain Sepolia test wallet.");
console.log(`Address: ${wallet.address}`);
console.log(`Config: ${envPath}`);
console.log("Private key was written only to the local git-ignored config file.");
