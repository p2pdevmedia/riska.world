const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;
const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801n;

function readLatestDeployment() {
  const latestPath = path.join(__dirname, "..", "deployments", "worldchain-sepolia", "latest.json");
  if (!fs.existsSync(latestPath)) throw new Error("Missing World Chain Sepolia deployment file.");
  return { latestPath, deployment: JSON.parse(fs.readFileSync(latestPath, "utf8")) };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== WORLDCHAIN_SEPOLIA_CHAIN_ID) throw new Error("Refusing to deploy outside World Chain Sepolia.");
  if (!deployer) throw new Error("No World Chain Sepolia deployer is configured.");

  const { latestPath, deployment } = readLatestDeployment();
  const tokens = {
    usdc: deployment.contracts?.mockUsdc?.address,
    btc: deployment.testAuxiliaryTokens?.mockBtc?.address,
    eth: deployment.testAuxiliaryTokens?.mockEth?.address,
    sol: deployment.testAuxiliaryTokens?.mockSol?.address
  };

  if (Object.values(tokens).some((address) => !ethers.isAddress(address))) {
    throw new Error("Mock USDC, mBTC, mETH, and mSOL must be deployed before creating the faucet.");
  }

  const deployerAddress = await deployer.getAddress();
  const ownershipAbi = ["function owner() view returns (address)", "function transferOwnership(address newOwner)"];
  const tokenContracts = Object.fromEntries(
    Object.entries(tokens).map(([key, address]) => [key, new ethers.Contract(address, ownershipAbi, deployer)])
  );

  for (const [symbol, token] of Object.entries(tokenContracts)) {
    const owner = await token.owner();
    if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
      throw new Error(`The configured deployer does not own ${symbol}. Current owner: ${owner}`);
    }
  }

  const factory = await ethers.getContractFactory("TestnetTokenFaucet");
  const faucet = await factory.deploy(tokens.usdc, tokens.btc, tokens.eth, tokens.sol);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();

  const ownershipTransactions = {};
  for (const [symbol, token] of Object.entries(tokenContracts)) {
    const tx = await token.transferOwnership(faucetAddress);
    const receipt = await tx.wait();
    ownershipTransactions[symbol] = receipt.hash;
  }

  deployment.contracts = {
    ...deployment.contracts,
    testnetTokenFaucet: {
      address: faucetAddress,
      transactionHash: faucet.deploymentTransaction()?.hash ?? null
    }
  };
  deployment.testnetTokenFaucet = {
    amounts: { usdc: "15000", btc: "2", eth: "5", sol: "50" },
    ownershipTransactions,
    deployedAt: new Date().toISOString(),
    testnetOnly: true
  };
  fs.writeFileSync(latestPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(`Testnet token faucet deployed at ${faucetAddress}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
