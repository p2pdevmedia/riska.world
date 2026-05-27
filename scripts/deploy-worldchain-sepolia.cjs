const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;

const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801n;
const DEFAULT_MOCK_USDC_MINT_AMOUNT = "20000";

async function deployContract(name, args = []) {
  const factory = await ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction();

  console.log(`${name} deployed at ${address}`);

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

function writeDeployment(networkName, deployment) {
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const networkDir = path.join(deploymentsDir, networkName);

  fs.mkdirSync(networkDir, { recursive: true });

  const timestampedPath = path.join(networkDir, `${timestamp}.json`);
  const latestPath = path.join(networkDir, "latest.json");
  const payload = `${JSON.stringify(deployment, null, 2)}\n`;

  fs.writeFileSync(timestampedPath, payload);
  fs.writeFileSync(latestPath, payload);

  console.log(`Deployment saved to ${latestPath}`);
}

function contractRecord(deployedContract) {
  return {
    address: deployedContract.address,
    transactionHash: deployedContract.transactionHash
  };
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

  console.log(`Network: ${hre.network.name} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Deployer has 0 World Chain Sepolia ETH. Fund it from https://www.alchemy.com/faucets/world-chain-sepolia and rerun this script.");
  }

  const verifierAddress = process.env.RISKA_DEATH_VERIFIER_ADDRESS || deployerAddress;
  const mockUsdcMintRecipient = process.env.MOCK_USDC_MINT_TO || deployerAddress;
  const mockUsdcMintAmount = process.env.MOCK_USDC_MINT_AMOUNT || DEFAULT_MOCK_USDC_MINT_AMOUNT;
  const deployTestHelpers = process.env.DEPLOY_TEST_HELPERS === "true";

  console.log(`Death verifier: ${verifierAddress}`);

  const mockUsdc = await deployContract("MockUSDC");
  const beneficiaryRegistry = await deployContract("RiskaBeneficiaryRegistry");
  const deathVerifier = await deployContract("RiskaDeathVerifier", [verifierAddress]);
  const premiumVault = await deployContract("RiskaPremiumVault", [mockUsdc.address, beneficiaryRegistry.address]);
  const policyManager = await deployContract("RiskaPolicyManager", [
    beneficiaryRegistry.address,
    deathVerifier.address,
    premiumVault.address
  ]);
  const thirtyYearPolicy = await deployContract("RiskaThirtyYearPolicy", [mockUsdc.address, verifierAddress]);

  const setupTransactions = {
    beneficiaryRegistrySetPolicyManager: await runTransaction(
      "BeneficiaryRegistry.setPolicyManager",
      beneficiaryRegistry.instance.setPolicyManager(policyManager.address)
    ),
    deathVerifierSetPolicyManager: await runTransaction(
      "DeathVerifier.setPolicyManager",
      deathVerifier.instance.setPolicyManager(policyManager.address)
    ),
    premiumVaultSetPolicyManager: await runTransaction(
      "PremiumVault.setPolicyManager",
      premiumVault.instance.setPolicyManager(policyManager.address)
    )
  };

  const mintedAmount = ethers.parseUnits(mockUsdcMintAmount, 6);
  const mockUsdcMintTx = await runTransaction(
    "MockUSDC.mint",
    mockUsdc.instance.mint(mockUsdcMintRecipient, mintedAmount)
  );

  let policyMathHarness = null;

  if (deployTestHelpers) {
    policyMathHarness = await deployContract("RiskaPolicyMathHarness");
  }

  const blockNumber = await ethers.provider.getBlockNumber();
  const deployment = {
    network: hre.network.name,
    chainId: chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber,
    deployer: deployerAddress,
    verifier: verifierAddress,
    explorerBaseUrl: "https://worldchain-sepolia.explorer.alchemy.com/address/",
    contracts: {
      mockUsdc: contractRecord(mockUsdc),
      beneficiaryRegistry: contractRecord(beneficiaryRegistry),
      deathVerifier: contractRecord(deathVerifier),
      premiumVault: contractRecord(premiumVault),
      policyManager: contractRecord(policyManager),
      thirtyYearPolicy: contractRecord(thirtyYearPolicy),
      ...(policyMathHarness ? { policyMathHarness: contractRecord(policyMathHarness) } : {})
    },
    setupTransactions,
    testMint: {
      token: mockUsdc.address,
      recipient: mockUsdcMintRecipient,
      amount: mockUsdcMintAmount,
      transactionHash: mockUsdcMintTx
    }
  };

  if (process.env.SKIP_DEPLOYMENT_WRITE === "true") {
    console.log("Deployment file write skipped.");
    return;
  }

  writeDeployment("worldchain-sepolia", deployment);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
