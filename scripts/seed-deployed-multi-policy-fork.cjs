const fs = require("node:fs");
const path = require("node:path");

const { ethers } = require("ethers");

const deployment = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "deployments", "worldchain-sepolia", "latest.json"), "utf8")
);

const rpcUrl = process.env.FORK_RPC_URL ?? "http://127.0.0.1:8545";
const policyManagerAddress = deployment.contracts.policyManager.address;
const premiumVaultAddress = deployment.contracts.premiumVault.address;
const mockUsdcAddress = deployment.contracts.mockUsdc.address;
const faucetAddress = deployment.contracts.testnetTokenFaucet.address;
const termsHash = "0x109b7832342e1cf21e6ae5a43bd1d5c09a26d74551ebb9bf0d53c0de09dd4538";
const firstPremium = 30n * 10n ** 6n;

const policyManagerAbi = [
  "function owner() view returns (address)",
  "function setPolicyHumanVerifier(address nextPolicyHumanVerifier)",
  "function nextPolicyId() view returns (uint256)",
  "function policyOf(address holder) view returns (uint256)",
  "function policies(uint256) view returns (address holder, bytes32 nullifierHash, bytes32 termsHash, uint16 payoutsMade, uint256 openedAt, uint256 lastHolderInteractionAt, uint256 nextPayoutAt, uint256 remainingMinimumPrincipal, uint256 remainingExtraPrincipal, uint256 monthlyPayoutAmount, uint8 status)",
  "function openPolicy(address[] beneficiaries, uint16[] sharesBps, bytes32 termsHash, bytes32 nullifierHash, uint256 deadline, bytes authorization) returns (uint256)"
];
const erc20Abi = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];
const faucetAbi = [
  "function claim()",
  "function claimed(address account) view returns (bool)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  if (network.chainId !== 4801n) {
    throw new Error(`Fork must use World Chain Sepolia chain ID 4801; received ${network.chainId}.`);
  }

  const manager = new ethers.Contract(policyManagerAddress, policyManagerAbi, provider);
  const baselineNextPolicyId = await manager.nextPolicyId();
  if (baselineNextPolicyId !== 2n) {
    throw new Error(`Expected the production fork to start with one policy; nextPolicyId is ${baselineNextPolicyId}.`);
  }

  const owner = await manager.owner();
  try {
    await provider.send("hardhat_setBalance", [owner, "0x3635c9adc5dea00000"]);
    await provider.send("hardhat_impersonateAccount", [owner]);
  } catch {
    await provider.send("evm_setAccountBalance", [owner, "0x3635c9adc5dea00000"]);
  }
  const ownerSigner = await provider.getSigner(owner);

  const verifier = ethers.Wallet.createRandom();
  await (await manager.connect(ownerSigner).setPolicyHumanVerifier(verifier.address)).wait();

  const holders = [await provider.getSigner(1), await provider.getSigner(2)];
  const issued = [];

  for (let index = 0; index < holders.length; index += 1) {
    const holder = holders[index];
    const holderAddress = await holder.getAddress();
    const faucet = new ethers.Contract(faucetAddress, faucetAbi, holder);
    if (!(await faucet.claimed(holderAddress))) {
      await (await faucet.claim()).wait();
    }

    const usdc = new ethers.Contract(mockUsdcAddress, erc20Abi, holder);
    if ((await usdc.balanceOf(holderAddress)) < firstPremium) {
      throw new Error(`Faucet did not fund ${holderAddress} with enough MockUSDC.`);
    }
    await (await usdc.approve(premiumVaultAddress, firstPremium)).wait();

    const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(`riska-fork-person-${index + 2}`));
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const authorization = await verifier.signTypedData(
      {
        name: "RiskaPolicyManager",
        version: "1",
        chainId: 4801,
        verifyingContract: policyManagerAddress
      },
      {
        PolicyHumanAuthorization: [
          { name: "holder", type: "address" },
          { name: "nullifierHash", type: "bytes32" },
          { name: "deadline", type: "uint256" }
        ]
      },
      { holder: holderAddress, nullifierHash, deadline }
    );

    await (
      await manager.connect(holder).openPolicy([], [], termsHash, nullifierHash, deadline, authorization)
    ).wait();
    issued.push({ holder: holderAddress, policyId: (await manager.policyOf(holderAddress)).toString() });
  }

  const nextPolicyId = await manager.nextPolicyId();
  const policies = [];
  for (let policyId = 1n; policyId < nextPolicyId; policyId += 1n) {
    const policy = await manager.policies(policyId);
    policies.push({ holder: policy.holder, policyId: policyId.toString() });
  }

  if (nextPolicyId !== 4n || new Set(policies.map((policy) => policy.holder.toLowerCase())).size !== 3) {
    throw new Error(`Expected three policies for three distinct holders; got ${JSON.stringify(policies)}.`);
  }

  console.log(JSON.stringify({ adminOwner: owner, issued, policies, policyCount: 3 }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
