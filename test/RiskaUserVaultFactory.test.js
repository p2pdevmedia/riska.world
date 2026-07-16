const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);

async function deployFixture() {
  const [deployer, user, other, feeRecipient] = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();

  const RiskaGovernanceToken = await ethers.getContractFactory("RiskaGovernanceToken");
  const governanceToken = await RiskaGovernanceToken.deploy(deployer.address, ethers.parseEther("1000000"));
  await governanceToken.delegate(deployer.address);

  const RiskaProtocolGovernor = await ethers.getContractFactory("RiskaProtocolGovernor");
  const governor = await RiskaProtocolGovernor.deploy(await governanceToken.getAddress());

  const RiskaProtocolConfig = await ethers.getContractFactory("RiskaProtocolConfig");
  const config = await RiskaProtocolConfig.deploy(
    await token.getAddress(),
    await governor.getAddress(),
    feeRecipient.address,
    1000
  );

  const RiskaUserVaultFactory = await ethers.getContractFactory("RiskaUserVaultFactory");
  const factory = await RiskaUserVaultFactory.deploy(await config.getAddress());

  const MockERC4626Vault = await ethers.getContractFactory("MockERC4626Vault");
  const yieldVault = await MockERC4626Vault.deploy(await token.getAddress());

  await token.mint(user.address, usdc("1000"));
  return { deployer, user, other, feeRecipient, token, governanceToken, governor, config, factory, yieldVault };
}

async function govern({ governor, deployer }, target, calldata, description) {
  const targets = [target];
  const values = [0];
  const calldatas = [calldata];
  const descriptionHash = ethers.id(description);
  await governor.connect(deployer).propose(targets, values, calldatas, description);
  const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

  await network.provider.send("hardhat_mine", ["0x1C21"]); // voting delay + one block
  await governor.connect(deployer).castVote(proposalId, 1);
  await network.provider.send("hardhat_mine", ["0xC4E2"]); // voting period + one block
  await governor.connect(deployer).execute(targets, values, calldatas, descriptionHash);
}

describe("RiskaUserVaultFactory", function () {
  it("creates one independently owned vault for each user", async function () {
    const ctx = await deployFixture();

    await expect(ctx.factory.connect(ctx.user).createVault())
      .to.emit(ctx.factory, "UserVaultCreated");
    const vaultAddress = await ctx.factory.vaultOf(ctx.user.address);
    const vault = await ethers.getContractAt("RiskaUserVault", vaultAddress);

    expect(await vault.owner()).to.equal(ctx.user.address);
    expect(await vault.paymentToken()).to.equal(await ctx.token.getAddress());
    await expect(ctx.factory.connect(ctx.user).createVault()).to.be.revertedWith("VAULT_EXISTS");
  });

  it("keeps idle USDC in the user's vault until the user opts into an allowed yield vault", async function () {
    const ctx = await deployFixture();
    await ctx.factory.connect(ctx.user).createVault();
    const vault = await ethers.getContractAt("RiskaUserVault", await ctx.factory.vaultOf(ctx.user.address));
    await ctx.token.connect(ctx.user).approve(await vault.getAddress(), usdc("100"));
    await vault.connect(ctx.user).deposit(usdc("100"));

    await expect(vault.connect(ctx.user).depositToYield(await ctx.yieldVault.getAddress(), usdc("50"), 0))
      .to.be.revertedWith("VAULT_NOT_ALLOWED");

    const calldata = ctx.config.interface.encodeFunctionData("setYieldVault", [await ctx.yieldVault.getAddress(), true]);
    await govern(ctx, await ctx.config.getAddress(), calldata, "Allow the USDC MetaMorpho vault");

    await vault.connect(ctx.user).depositToYield(await ctx.yieldVault.getAddress(), usdc("50"), usdc("50"));
    expect(await vault.idleAssets()).to.equal(usdc("50"));
    expect((await vault.yieldPositions(await ctx.yieldVault.getAddress())).shares).to.equal(usdc("50"));
  });

  it("charges the governance-defined fee only on realized yield", async function () {
    const ctx = await deployFixture();
    await ctx.factory.connect(ctx.user).createVault();
    const vault = await ethers.getContractAt("RiskaUserVault", await ctx.factory.vaultOf(ctx.user.address));
    await ctx.token.connect(ctx.user).approve(await vault.getAddress(), usdc("100"));
    await vault.connect(ctx.user).deposit(usdc("100"));
    const calldata = ctx.config.interface.encodeFunctionData("setYieldVault", [await ctx.yieldVault.getAddress(), true]);
    await govern(ctx, await ctx.config.getAddress(), calldata, "Allow yield vault");
    await vault.connect(ctx.user).depositToYield(await ctx.yieldVault.getAddress(), usdc("100"), 0);

    await ctx.token.mint(await ctx.yieldVault.getAddress(), usdc("20"));
    await vault.connect(ctx.user).withdrawFromYield(await ctx.yieldVault.getAddress(), usdc("100"), 0);

    // ERC-4626 share conversion rounds down by one base unit in this mock.
    expect(await ctx.token.balanceOf(ctx.feeRecipient.address)).to.equal(usdc("2") - 1n);
    expect(await vault.idleAssets()).to.equal(usdc("118"));
  });

  it("rejects direct parameter changes outside a successful governance vote", async function () {
    const ctx = await deployFixture();
    await expect(ctx.config.connect(ctx.deployer).setYieldFeeBps(500)).to.be.revertedWith("ONLY_GOVERNANCE");
    await expect(ctx.config.connect(ctx.other).setAccountCreationEnabled(false)).to.be.revertedWith("ONLY_GOVERNANCE");
  });
});
