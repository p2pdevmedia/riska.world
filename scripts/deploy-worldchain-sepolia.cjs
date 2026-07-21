const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;

const WORLDCHAIN_SEPOLIA_CHAIN_ID = 4801n;
const DEFAULT_MOCK_USDC_MINT_AMOUNT = "20000";
const DEFAULT_GOVERNANCE_SUPPLY = "1000000";

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

function readLatestDeployment(networkName) {
  const latestPath = path.join(__dirname, "..", "deployments", networkName, "latest.json");

  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(latestPath, "utf8"));
  } catch {
    return null;
  }
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
  const policyHumanVerifier = process.env.RISKA_POLICY_HUMAN_VERIFIER;
  if (!ethers.isAddress(policyHumanVerifier)) {
    throw new Error("RISKA_POLICY_HUMAN_VERIFIER must be the address for POLICY_HUMAN_SIGNING_KEY before deploying PolicyManager.");
  }
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log(`Network: ${hre.network.name} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("Deployer has 0 World Chain Sepolia ETH. Fund it from https://www.alchemy.com/faucets/world-chain-sepolia and rerun this script.");
  }

  const mockUsdcMintRecipient = process.env.MOCK_USDC_MINT_TO || deployerAddress;
  const mockUsdcMintAmount = process.env.MOCK_USDC_MINT_AMOUNT || DEFAULT_MOCK_USDC_MINT_AMOUNT;
  const governanceSupply = process.env.RISKA_GOVERNANCE_SUPPLY || DEFAULT_GOVERNANCE_SUPPLY;
  const deployTestHelpers = process.env.DEPLOY_TEST_HELPERS === "true";

  const previousDeployment = readLatestDeployment("worldchain-sepolia");
  const previousMockUsdc = previousDeployment?.contracts?.mockUsdc?.address;
  const mockUsdc = previousMockUsdc
    ? {
        address: previousMockUsdc,
        instance: await ethers.getContractAt("MockUSDC", previousMockUsdc),
        transactionHash: null
      }
    : await deployContract("MockUSDC");
  const beneficiaryRegistry = await deployContract("RiskaBeneficiaryRegistry");
  const premiumVault = await deployContract("RiskaPremiumVault", [mockUsdc.address, beneficiaryRegistry.address]);
  const policyManager = await deployContract("RiskaPolicyManager", [
    beneficiaryRegistry.address,
    premiumVault.address,
    policyHumanVerifier
  ]);
  const deployedPolicyHumanVerifier = await policyManager.instance.policyHumanVerifier();
  if (ethers.getAddress(deployedPolicyHumanVerifier) !== ethers.getAddress(policyHumanVerifier)) {
    throw new Error("Deployed PolicyManager human verifier does not match RISKA_POLICY_HUMAN_VERIFIER.");
  }
  const yieldStrategyManager = await deployContract("RiskaYieldStrategyManager", [
    mockUsdc.address,
    premiumVault.address
  ]);
  const governanceToken = await deployContract("RiskaGovernanceToken", [
    deployerAddress,
    ethers.parseEther(governanceSupply)
  ]);
  const protocolGovernor = await deployContract("RiskaProtocolGovernor", [governanceToken.address]);
  const protocolConfig = await deployContract("RiskaProtocolConfig", [
    mockUsdc.address,
    protocolGovernor.address,
    deployerAddress,
    1000
  ]);
  const userVaultFactory = await deployContract("RiskaUserVaultFactory", [protocolConfig.address]);

  const setupTransactions = {
    beneficiaryRegistrySetPolicyManager: await runTransaction(
      "BeneficiaryRegistry.setPolicyManager",
      beneficiaryRegistry.instance.setPolicyManager(policyManager.address)
    ),
    premiumVaultSetPolicyManager: await runTransaction(
      "PremiumVault.setPolicyManager",
      premiumVault.instance.setPolicyManager(policyManager.address)
    ),
    premiumVaultSetYieldStrategyManager: await runTransaction(
      "PremiumVault.setYieldStrategyManager",
      premiumVault.instance.setYieldStrategyManager(yieldStrategyManager.address)
    ),
    yieldStrategyManagerSetPolicyManager: await runTransaction(
      "YieldStrategyManager.setPolicyManager",
      yieldStrategyManager.instance.setPolicyManager(policyManager.address)
    ),
    policyManagerSetYieldStrategyManager: await runTransaction(
      "PolicyManager.setYieldStrategyManager",
      policyManager.instance.setYieldStrategyManager(yieldStrategyManager.address)
    )
  };

  const mockUsdcMintTx = previousMockUsdc
    ? null
    : await runTransaction(
        "MockUSDC.mint",
        mockUsdc.instance.mint(mockUsdcMintRecipient, ethers.parseUnits(mockUsdcMintAmount, 6))
      );
  const governanceDelegationTx = await runTransaction(
    "RiskaGovernanceToken.delegate",
    governanceToken.instance.delegate(deployerAddress)
  );

  let policyMathHarness = null;
  let mockYieldAdapter = null;
  let addMockYieldStrategyTx = null;

  if (deployTestHelpers) {
    policyMathHarness = await deployContract("RiskaPolicyMathHarness");
    mockYieldAdapter = await deployContract("MockYieldAdapter", [
      mockUsdc.address,
      yieldStrategyManager.address
    ]);
    addMockYieldStrategyTx = await runTransaction(
      "YieldStrategyManager.addStrategy(MockYieldAdapter)",
      yieldStrategyManager.instance.addStrategy(
        mockYieldAdapter.address,
        "Mock USDC lending",
        "ipfs://mock-usdc-lending",
        ethers.parseUnits("25000", 6)
      )
    );
  }

  const blockNumber = await ethers.provider.getBlockNumber();
  const deployment = {
    network: hre.network.name,
    chainId: chainId.toString(),
    deployedAt: new Date().toISOString(),
    blockNumber,
    deployer: deployerAddress,
    policyHumanVerifier,
    explorerBaseUrl: "https://worldchain-sepolia.explorer.alchemy.com/address/",
    contracts: {
      mockUsdc: contractRecord(mockUsdc),
      beneficiaryRegistry: contractRecord(beneficiaryRegistry),
      premiumVault: contractRecord(premiumVault),
      policyManager: contractRecord(policyManager),
      yieldStrategyManager: contractRecord(yieldStrategyManager),
      governanceToken: contractRecord(governanceToken),
      protocolGovernor: contractRecord(protocolGovernor),
      protocolConfig: contractRecord(protocolConfig),
      userVaultFactory: contractRecord(userVaultFactory),
      ...(previousDeployment?.contracts?.testnetTokenFaucet
        ? { testnetTokenFaucet: previousDeployment.contracts.testnetTokenFaucet }
        : {}),
      ...(policyMathHarness ? { policyMathHarness: contractRecord(policyMathHarness) } : {}),
      ...(mockYieldAdapter ? { mockYieldAdapter: contractRecord(mockYieldAdapter) } : {})
    },
    setupTransactions: {
      ...setupTransactions,
      governanceDelegation: governanceDelegationTx,
      ...(addMockYieldStrategyTx ? { yieldStrategyManagerAddMockStrategy: addMockYieldStrategyTx } : {})
    },
    testMint: previousDeployment?.testMint ?? {
      token: mockUsdc.address,
      recipient: mockUsdcMintRecipient,
      amount: mockUsdcMintAmount,
      transactionHash: mockUsdcMintTx
    },
    ...(previousDeployment?.testAuxiliaryTokens
      ? { testAuxiliaryTokens: previousDeployment.testAuxiliaryTokens }
      : {}),
    ...(previousDeployment?.testAuxiliaryMint
      ? { testAuxiliaryMint: previousDeployment.testAuxiliaryMint }
      : {})
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
