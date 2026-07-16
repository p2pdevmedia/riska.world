const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;

const WORLD_CHAIN_ID = 480n;
const WORLD_CHAIN_USDC = "0x79A02482A880bCE3F13e09Da970dC34db4CD24d1";
const ERC4626_ASSET_ABI = ["function asset() view returns (address)"];

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function writeDeployment(payload) {
  const directory = path.join(__dirname, "..", "deployments", "worldchain");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `morpho-usdc-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Configuration saved to ${file}`);
}

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== WORLD_CHAIN_ID) {
    throw new Error(`Refusing to configure Morpho outside World Chain mainnet (expected ${WORLD_CHAIN_ID}, got ${network.chainId}).`);
  }

  const strategyManager = required("RISKA_YIELD_STRATEGY_MANAGER");
  const morphoVault = required("MORPHO_USDC_VAULT");
  const depositCap = ethers.parseUnits(required("MORPHO_USDC_DEPOSIT_CAP"), 6);
  const metadataURI = process.env.MORPHO_USDC_METADATA_URI || "";

  if (!ethers.isAddress(strategyManager) || !ethers.isAddress(morphoVault)) {
    throw new Error("RISKA_YIELD_STRATEGY_MANAGER and MORPHO_USDC_VAULT must be valid addresses.");
  }

  const vault = new ethers.Contract(morphoVault, ERC4626_ASSET_ABI, ethers.provider);
  const vaultAsset = await vault.asset();
  if (vaultAsset.toLowerCase() !== WORLD_CHAIN_USDC.toLowerCase()) {
    throw new Error(`Vault asset mismatch. Expected World Chain USDC ${WORLD_CHAIN_USDC}, got ${vaultAsset}.`);
  }

  const Adapter = await ethers.getContractFactory("RiskaERC4626YieldAdapter");
  const adapter = await Adapter.deploy(morphoVault, strategyManager);
  await adapter.waitForDeployment();

  const manager = await ethers.getContractAt("RiskaYieldStrategyManager", strategyManager);
  const tx = await manager.addStrategy(
    await adapter.getAddress(),
    "Morpho USDC Vault",
    metadataURI,
    depositCap
  );
  const receipt = await tx.wait();

  const strategyId = await manager.strategyCount() - 1n;
  const [deployer] = await ethers.getSigners();
  const payload = {
    network: hre.network.name,
    chainId: network.chainId.toString(),
    configuredAt: new Date().toISOString(),
    deployer: await deployer.getAddress(),
    usdc: WORLD_CHAIN_USDC,
    morphoVault,
    adapter: await adapter.getAddress(),
    yieldStrategyManager: strategyManager,
    strategyId: strategyId.toString(),
    depositCap: process.env.MORPHO_USDC_DEPOSIT_CAP,
    metadataURI,
    transactions: {
      adapterDeployment: adapter.deploymentTransaction().hash,
      strategyAdded: receipt.hash
    }
  };

  writeDeployment(payload);
  console.log(`Morpho USDC strategy ${strategyId} configured with adapter ${payload.adapter}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
