const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const { ethers } = hre;

async function waitForVerifier(policyManager, expectedVerifier) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const configuredVerifier = await policyManager.policyHumanVerifier();
    if (ethers.getAddress(configuredVerifier) === ethers.getAddress(expectedVerifier)) {
      return configuredVerifier;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error("PolicyManager verifier rotation was confirmed but is not visible from the RPC yet.");
}

async function main() {
  const nextVerifier = process.env.RISKA_POLICY_HUMAN_VERIFIER;
  if (!ethers.isAddress(nextVerifier)) {
    throw new Error("RISKA_POLICY_HUMAN_VERIFIER must be a valid public address.");
  }

  const deploymentDirectory = process.env.RISKA_DEPLOYMENT_DIRECTORY || "worldchain-sepolia";
  if (!/^[a-z0-9-]+$/i.test(deploymentDirectory)) {
    throw new Error("RISKA_DEPLOYMENT_DIRECTORY must be a simple deployments directory name.");
  }
  const deploymentPath = path.join(__dirname, "..", "deployments", deploymentDirectory, "latest.json");
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const policyManagerAddress = deployment.contracts?.policyManager?.address;
  if (!ethers.isAddress(policyManagerAddress)) {
    throw new Error("The latest deployment does not contain a valid PolicyManager address.");
  }

  const [owner] = await ethers.getSigners();
  if (!owner) throw new Error("No World Chain Sepolia owner wallet is configured.");

  const policyManager = await ethers.getContractAt("RiskaPolicyManager", policyManagerAddress);
  const onchainOwner = await policyManager.owner();
  if (ethers.getAddress(onchainOwner) !== ethers.getAddress(await owner.getAddress())) {
    throw new Error("The configured wallet is not the PolicyManager owner.");
  }

  const previousVerifier = await policyManager.policyHumanVerifier();
  if (ethers.getAddress(previousVerifier) === ethers.getAddress(nextVerifier)) {
    deployment.policyHumanVerifier = ethers.getAddress(nextVerifier);
    fs.writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);
    console.log(`Policy human verifier already configured: ${nextVerifier}`);
    return;
  }

  const transaction = await policyManager.setPolicyHumanVerifier(nextVerifier);
  const receipt = await transaction.wait();
  await waitForVerifier(policyManager, nextVerifier);

  deployment.policyHumanVerifier = ethers.getAddress(nextVerifier);
  deployment.verifierRotations = [
    ...(deployment.verifierRotations ?? []),
    {
      previousVerifier: ethers.getAddress(previousVerifier),
      nextVerifier: ethers.getAddress(nextVerifier),
      transactionHash: receipt.hash,
      rotatedAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`Policy human verifier rotated to ${nextVerifier}`);
  console.log(`Transaction: ${receipt.hash}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
