const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;

const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801n;
const DEFAULT_MINT_AMOUNT = "20000";
const DEFAULT_TOKENS = [
  { key: "mockBtc", name: "Mock Bitcoin", symbol: "mBTC", decimals: 8 },
  { key: "mockEth", name: "Mock Ether", symbol: "mETH", decimals: 18 },
  { key: "mockSol", name: "Mock Solana", symbol: "mSOL", decimals: 9 }
];

async function deployMockToken({ name, symbol, decimals }) {
  const factory = await ethers.getContractFactory("MockERC20");
  const contract = await factory.deploy(name, symbol, decimals);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();

  console.log(`${symbol} deployed at ${address}`);

  return {
    instance: contract,
    address,
    transactionHash: tx?.hash ?? null
  };
}

async function runTransaction(label, transactionPromise) {
  const tx = await transactionPromise;
  const receipt = await tx.wait();

  console.log(`${label}: ${receipt.hash}`);

  return receipt.hash;
}

function readLatestDeployment() {
  const latestPath = path.join(__dirname, "..", "deployments", "worldchain-sepolia", "latest.json");

  if (!fs.existsSync(latestPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(latestPath, "utf8"));
}

function writeAuxiliaryTokenDeployment(summary) {
  const networkDir = path.join(__dirname, "..", "deployments", "worldchain-sepolia");
  const latestPath = path.join(networkDir, "latest.json");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const summaryPath = path.join(networkDir, `${timestamp}-mock-auxiliary-tokens.json`);

  fs.mkdirSync(networkDir, { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

  const latest = readLatestDeployment();

  if (latest) {
    latest.testAuxiliaryTokens = summary.tokens;
    latest.testAuxiliaryMint = {
      amount: summary.amount,
      mintedAt: summary.deployedAt,
      recipient: summary.recipient,
      tokens: Object.fromEntries(
        Object.entries(summary.tokens).map(([key, token]) => [
          key,
          {
            address: token.address,
            mintTransactionHash: token.mintTransactionHash,
            symbol: token.symbol
          }
        ])
      )
    };

    fs.writeFileSync(latestPath, `${JSON.stringify(latest, null, 2)}\n`);
  }

  console.log(`Auxiliary token deployment saved to ${summaryPath}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer account configured. Run npm run wallet:create:worldchain-sepolia first.");
  }

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  const allowNonWorldchainSepolia = process.env.ALLOW_NON_WORLDCHAIN_SEPOLIA === "true";

  if (chainId !== WORLDCHAIN_SEPOLIA_CHAIN_ID && !allowNonWorldchainSepolia) {
    throw new Error(`Refusing to deploy to chain id ${chainId}. Expected World Chain Sepolia ${WORLDCHAIN_SEPOLIA_CHAIN_ID}.`);
  }

  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const recipient = process.env.MOCK_AUX_TOKENS_MINT_TO || deployerAddress;
  const mintAmount = process.env.MOCK_AUX_TOKENS_MINT_AMOUNT || DEFAULT_MINT_AMOUNT;

  if (!ethers.isAddress(recipient)) {
    throw new Error(`Invalid MOCK_AUX_TOKENS_MINT_TO address: ${recipient}`);
  }

  console.log(`Network: ${hre.network.name} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`Mint recipient: ${recipient}`);
  console.log(`Mint amount: ${mintAmount} each`);

  if (balance === 0n) {
    throw new Error("Deployer has 0 World Chain Sepolia ETH.");
  }

  const tokens = {};

  for (const tokenConfig of DEFAULT_TOKENS) {
    const deployed = await deployMockToken(tokenConfig);
    const rawAmount = ethers.parseUnits(mintAmount, tokenConfig.decimals);
    const mintTransactionHash = await runTransaction(
      `${tokenConfig.symbol}.mint`,
      deployed.instance.mint(recipient, rawAmount)
    );

    tokens[tokenConfig.key] = {
      address: deployed.address,
      decimals: tokenConfig.decimals,
      name: tokenConfig.name,
      symbol: tokenConfig.symbol,
      transactionHash: deployed.transactionHash,
      mintTransactionHash
    };
  }

  const blockNumber = await ethers.provider.getBlockNumber();
  const summary = {
    network: hre.network.name,
    chainId: chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber,
    deployer: deployerAddress,
    recipient,
    amount: mintAmount,
    explorerBaseUrl: "https://worldchain-sepolia.explorer.alchemy.com/address/",
    tokens
  };

  if (process.env.SKIP_DEPLOYMENT_WRITE === "true") {
    console.log("Deployment file write skipped.");
    return;
  }

  writeAuxiliaryTokenDeployment(summary);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
