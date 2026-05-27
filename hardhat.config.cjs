require("@nomicfoundation/hardhat-toolbox");
const fs = require("fs");
const path = require("path");

function loadEnvFile(fileName) {
  const filePath = path.join(__dirname, fileName);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

[".env", ".env.local", ".env.worldchain-sepolia.local"].forEach(loadEnvFile);

function privateKeyAccounts(privateKey) {
  if (!privateKey) {
    return [];
  }

  const normalized = privateKey.trim().startsWith("0x")
    ? privateKey.trim()
    : `0x${privateKey.trim()}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error("WORLDCHAIN_SEPOLIA_PRIVATE_KEY must be a 32-byte hex private key.");
  }

  return [normalized];
}

/** @type import("hardhat/config").HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    worldchainSepolia: {
      url: process.env.WORLDCHAIN_SEPOLIA_RPC_URL ?? "https://worldchain-sepolia.g.alchemy.com/public",
      chainId: 4801,
      accounts: privateKeyAccounts(process.env.WORLDCHAIN_SEPOLIA_PRIVATE_KEY)
    }
  },
  mocha: {
    timeout: 40_000
  }
};
