const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);
const termsHash = ethers.keccak256(ethers.toUtf8Bytes("riska-policy-terms-v2-flexible"));

const PAYMENT_PERIOD = 30 * 24 * 60 * 60;
const DEATH_REPORT_DELAY = 12 * PAYMENT_PERIOD;
const STATUS = {
  Active: 1n,
  PayoutActive: 2n,
  DeathSettled: 3n,
  Closed: 4n
};

async function advance(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

async function deployFixture({ policyHumanSigner } = {}) {
  const [owner, holder, beneficiaryA, beneficiaryB, beneficiaryC, stranger] = await ethers.getSigners();
  const verifier = policyHumanSigner ?? owner;

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();
  const altToken = await MockUSDC.deploy();

  const RiskaBeneficiaryRegistry = await ethers.getContractFactory("RiskaBeneficiaryRegistry");
  const beneficiaryRegistry = await RiskaBeneficiaryRegistry.deploy();

  const RiskaPremiumVault = await ethers.getContractFactory("RiskaPremiumVault");
  const premiumVault = await RiskaPremiumVault.deploy(await token.getAddress(), await beneficiaryRegistry.getAddress());

  const RiskaPolicyManager = await ethers.getContractFactory("RiskaPolicyManager");
  const manager = await RiskaPolicyManager.deploy(
    await beneficiaryRegistry.getAddress(),
    await premiumVault.getAddress(),
    verifier.address
  );

  const RiskaYieldStrategyManager = await ethers.getContractFactory("RiskaYieldStrategyManager");
  const yieldStrategyManager = await RiskaYieldStrategyManager.deploy(
    await token.getAddress(),
    await premiumVault.getAddress()
  );

  await beneficiaryRegistry.connect(owner).setPolicyManager(await manager.getAddress());
  await premiumVault.connect(owner).setPolicyManager(await manager.getAddress());
  await premiumVault.connect(owner).setYieldStrategyManager(await yieldStrategyManager.getAddress());
  await yieldStrategyManager.connect(owner).setPolicyManager(await manager.getAddress());
  await manager.connect(owner).setYieldStrategyManager(await yieldStrategyManager.getAddress());

  const MockYieldAdapter = await ethers.getContractFactory("MockYieldAdapter");
  const yieldAdapter = await MockYieldAdapter.deploy(
    await token.getAddress(),
    await yieldStrategyManager.getAddress()
  );
  await yieldStrategyManager
    .connect(owner)
    .addStrategy(await yieldAdapter.getAddress(), "Mock USDC lending", "ipfs://mock-usdc-lending", usdc("25000"));

  await token.mint(holder.address, usdc("50000"));
  await token.connect(holder).approve(await premiumVault.getAddress(), usdc("50000"));
  await altToken.mint(holder.address, usdc("10000"));
  await altToken.connect(holder).approve(await premiumVault.getAddress(), usdc("10000"));

  return {
    owner,
    policyHumanSigner: verifier,
    holder,
    beneficiaryA,
    beneficiaryB,
    beneficiaryC,
    stranger,
    token,
    altToken,
    beneficiaryRegistry,
    premiumVault,
    manager,
    yieldAdapter,
    yieldStrategyId: 0,
    yieldStrategyManager
  };
}

async function deployErc4626YieldFixture() {
  const [owner] = await ethers.getSigners();
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();
  const MockERC4626Vault = await ethers.getContractFactory("MockERC4626Vault");
  const vault = await MockERC4626Vault.deploy(await token.getAddress());
  const RiskaERC4626YieldAdapter = await ethers.getContractFactory("RiskaERC4626YieldAdapter");
  const adapter = await RiskaERC4626YieldAdapter.deploy(await vault.getAddress(), owner.address);

  await token.mint(owner.address, usdc("1000"));
  await token.approve(await adapter.getAddress(), usdc("1000"));

  return { owner, token, vault, adapter };
}

async function openPolicy(ctx, beneficiaries = [ctx.beneficiaryA.address], shares = [10_000]) {
  const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(`test-nullifier-${ctx.holder.address}`));
  const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
  const signature = await ctx.policyHumanSigner.signTypedData(
    { name: "RiskaPolicyManager", version: "1", chainId: 31337, verifyingContract: await ctx.manager.getAddress() },
    { PolicyHumanAuthorization: [
      { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "deadline", type: "uint256" }
    ] },
    { holder: ctx.holder.address, nullifierHash, deadline }
  );
  await ctx.manager.connect(ctx.holder).openPolicy(beneficiaries, shares, termsHash, nullifierHash, deadline, signature);
  return 1;
}

async function fundMinimum(ctx, policyId, extra = "0") {
  await ctx.manager.connect(ctx.holder).deposit(policyId, usdc("10770") + usdc(extra));
}

async function reportAfterPolicyAge(ctx, policyId, reporter = ctx.beneficiaryA) {
  await advance(DEATH_REPORT_DELAY);
  await ctx.manager.connect(reporter).reportDeath(policyId);
}

describe("RiskaPolicyManager", function () {
  it("uses the ERC-4626 surface required by a Morpho USDC vault", async function () {
    const { owner, token, vault, adapter } = await deployErc4626YieldFixture();

    expect(await adapter.asset()).to.equal(await token.getAddress());
    await adapter.connect(owner).deposit(usdc("1000"));
    expect(await vault.balanceOf(await adapter.getAddress())).to.equal(usdc("1000"));
    expect(await adapter.totalAssets()).to.equal(usdc("1000"));

    await adapter.connect(owner).redeem(usdc("1000"));
    expect(await token.balanceOf(owner.address)).to.equal(usdc("1000"));
  });

  it("keeps MockUSDC minting under the deployer instead of user wallets", async function () {
    const ctx = await deployFixture();

    await expect(ctx.token.connect(ctx.holder).mint(ctx.holder.address, usdc("1")))
      .to.be.revertedWithCustomError(ctx.token, "OwnableUnauthorizedAccount")
      .withArgs(ctx.holder.address);
  });

  it("opens a policy directly from the holder wallet without an admin gate", async function () {
    const ctx = await deployFixture();

    await openPolicy(ctx);

    const policy = await ctx.manager.policies(1);
    expect(policy.holder).to.equal(ctx.holder.address);
    expect(policy.status).to.equal(STATUS.Active);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("30"));
    expect(await ctx.manager.policyOf(ctx.holder.address)).to.equal(1);
  });

  it("opens one policy per verified holder and stores beneficiary shares", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    const policy = await ctx.manager.policies(policyId);
    expect(policy.holder).to.equal(ctx.holder.address);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("30"));
    expect(policy.remainingExtraPrincipal).to.equal(0);
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("30"));
    expect(await ctx.token.balanceOf(await ctx.premiumVault.getAddress())).to.equal(usdc("30"));

    expect(await ctx.manager.beneficiaryCount(policyId)).to.equal(2);
    expect(await ctx.manager.beneficiaryAt(policyId, 0)).to.deep.equal([ctx.beneficiaryA.address, 6_000n]);
    expect(await ctx.manager.beneficiaryAt(policyId, 1)).to.deep.equal([ctx.beneficiaryB.address, 4_000n]);

    await expect(
      openPolicy(ctx)
    ).to.be.revertedWith("POLICY_EXISTS");
  });

  it("opens without beneficiaries and lets the holder add them later", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [], []);

    expect(await ctx.manager.beneficiaryCount(policyId)).to.equal(0);
    expect((await ctx.manager.policies(policyId)).remainingMinimumPrincipal).to.equal(usdc("30"));

    await ctx.manager
      .connect(ctx.holder)
      .updateBeneficiaries(policyId, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    expect(await ctx.manager.beneficiaryCount(policyId)).to.equal(2);
    expect(await ctx.manager.beneficiaryAt(policyId, 0)).to.deep.equal([ctx.beneficiaryA.address, 6_000n]);
    expect(await ctx.manager.beneficiaryAt(policyId, 1)).to.deep.equal([ctx.beneficiaryB.address, 4_000n]);
  });

  it("opens without beneficiaries when the human authorization uses the configured verifier", async function () {
    const [, , , , , backendSigner] = await ethers.getSigners();
    const ctx = await deployFixture({ policyHumanSigner: backendSigner });

    const policyId = await openPolicy(ctx, [], []);

    expect(await ctx.manager.policyHumanVerifier()).to.equal(backendSigner.address);
    expect(await ctx.manager.beneficiaryCount(policyId)).to.equal(0);
    expect((await ctx.manager.policies(policyId)).remainingMinimumPrincipal).to.equal(usdc("30"));
  });

  it("rejects invalid beneficiary splits", async function () {
    const ctx = await deployFixture();

    await expect(
      openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [8_000, 1_000])
    ).to.be.revertedWith("INVALID_SHARES");

    await expect(
      openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [10_000])
    ).to.be.revertedWith("BENEFICIARY_LENGTH");
  });

  it("rejects duplicate or excessive beneficiaries in the registry", async function () {
    const ctx = await deployFixture();

    await expect(
      openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryA.address], [5_000, 5_000])
    ).to.be.revertedWith("DUPLICATE_BENEFICIARY");

    const tooManyBeneficiaries = Array.from({ length: 9 }, () => ethers.Wallet.createRandom().address);
    const tooManyShares = [1_200, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100];

    await expect(
      openPolicy(ctx, tooManyBeneficiaries, tooManyShares)
    ).to.be.revertedWith("TOO_MANY_BENEFICIARIES");
  });

  it("only lets the policy manager operate registry and vault internals", async function () {
    const ctx = await deployFixture();

    await expect(
      ctx.beneficiaryRegistry.connect(ctx.stranger).setBeneficiaries(1, [ctx.beneficiaryA.address], [10_000])
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).collectPremium(1, ctx.holder.address, usdc("30"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).payHolder(1, ctx.holder.address, usdc("30"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).settleBeneficiaryPayout(1, usdc("30"), usdc("24"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).collectAuxiliaryToken(1, ctx.holder.address, await ctx.altToken.getAddress(), usdc("1"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).payAuxiliaryTokenHolder(1, ctx.holder.address, await ctx.altToken.getAddress(), usdc("1"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");

    await expect(
      ctx.premiumVault.connect(ctx.stranger).settleAuxiliaryTokenBeneficiaries(1, await ctx.altToken.getAddress(), usdc("1"))
    ).to.be.revertedWith("ONLY_POLICY_MANAGER");
  });

  it("allocates deposits to minimum principal first, then extra principal", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await ctx.manager.connect(ctx.holder).deposit(policyId, usdc("10770"));

    let policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(0);

    await ctx.manager.connect(ctx.holder).deposit(policyId, usdc("1000"));

    policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("1000"));
    expect(await ctx.manager.totalPrincipal(policyId)).to.equal(usdc("11800"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11800"));
  });

  it("does not activate payout before the minimum policy is funded", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await expect(ctx.manager.connect(ctx.holder).activatePayout(policyId)).to.be.revertedWith("MINIMUM_NOT_FUNDED");
  });

  it("activates payout once funded and blocks new deposits afterward", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1200");
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.PayoutActive);
    expect(policy.monthlyPayoutAmount).to.equal(usdc("100"));

    await expect(ctx.manager.connect(ctx.holder).deposit(policyId, usdc("1"))).to.be.revertedWith("DEPOSITS_CLOSED");
  });

  it("pays monthly over 120 claims and sends final dust on the last claim", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "0.000001");
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.monthlyPayoutAmount).to.equal(usdc("90"));

    for (let i = 0; i < 119; i++) {
      if (i > 0) {
        await advance(PAYMENT_PERIOD);
      }
      await ctx.manager.connect(ctx.holder).claimMonthly(policyId);
    }

    expect(await ctx.manager.totalPrincipal(policyId)).to.equal(usdc("90") + 1n);

    await advance(PAYMENT_PERIOD);
    const before = await ctx.token.balanceOf(ctx.holder.address);
    await ctx.manager.connect(ctx.holder).claimMonthly(policyId);
    const after = await ctx.token.balanceOf(ctx.holder.address);

    expect(after - before).to.equal(usdc("90") + 1n);
    policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.Active);
    expect(policy.payoutsMade).to.equal(0);
    expect(policy.monthlyPayoutAmount).to.equal(0);
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
  });

  it("lets the holder claim all remaining principal with a minimum-only fee and reuse the policy", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1200");

    const before = await ctx.token.balanceOf(ctx.holder.address);
    await ctx.manager.connect(ctx.holder).claimAll(policyId);
    const after = await ctx.token.balanceOf(ctx.holder.address);

    expect(after - before).to.equal(usdc("9840"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("2160"));

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.Active);
    expect(policy.remainingMinimumPrincipal).to.equal(0);
    expect(policy.remainingExtraPrincipal).to.equal(0);
    expect(policy.payoutsMade).to.equal(0);
    expect(policy.monthlyPayoutAmount).to.equal(0);

    await ctx.manager.connect(ctx.holder).deposit(policyId, usdc("10800"));
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);

    const reactivatedPolicy = await ctx.manager.policies(policyId);
    expect(reactivatedPolicy.status).to.equal(STATUS.PayoutActive);
    expect(reactivatedPolicy.monthlyPayoutAmount).to.equal(usdc("90"));
    expect(await ctx.manager.policyOf(ctx.holder.address)).to.equal(policyId);

    await expect(
      openPolicy(ctx)
    ).to.be.revertedWith("POLICY_EXISTS");
  });

  it("charges claim-all only on the remaining minimum after payout has started", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1200");
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);
    await ctx.manager.connect(ctx.holder).claimMonthly(policyId);

    const before = await ctx.token.balanceOf(ctx.holder.address);
    await ctx.manager.connect(ctx.holder).claimAll(policyId);
    const after = await ctx.token.balanceOf(ctx.holder.address);

    expect(after - before).to.equal(usdc("9758"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("2142"));

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.Active);
    expect(policy.remainingMinimumPrincipal).to.equal(0);
    expect(policy.remainingExtraPrincipal).to.equal(0);
  });

  it("lets the holder withdraw extra principal in parts with no fee", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1200");

    const before = await ctx.token.balanceOf(ctx.holder.address);
    await ctx.manager.connect(ctx.holder).withdrawExtra(policyId, usdc("450"));
    const after = await ctx.token.balanceOf(ctx.holder.address);

    expect(after - before).to.equal(usdc("450"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11550"));
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(0);

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.Active);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("750"));
  });

  it("reschedules payout when extra principal is withdrawn during payout", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1200");
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);
    await ctx.manager.connect(ctx.holder).claimMonthly(policyId);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.monthlyPayoutAmount).to.equal(usdc("100"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("1190"));

    await ctx.manager.connect(ctx.holder).withdrawExtra(policyId, usdc("590"));

    policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.PayoutActive);
    expect(policy.remainingExtraPrincipal).to.equal(usdc("600"));
    expect(policy.monthlyPayoutAmount).to.equal(usdc("95.042016"));
    expect(await ctx.manager.monthlyPayoutEstimate(policyId)).to.equal(usdc("95.042016"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11310"));
  });

  it("deploys opt-in policy principal into an allowlisted yield strategy", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), usdc("1000"));

    const position = await ctx.manager.yieldPositions(policyId, ctx.yieldStrategyId);
    expect(position.shares).to.equal(usdc("1000"));
    expect(position.costBasis).to.equal(usdc("1000"));
    expect(await ctx.manager.yieldPrincipalAllocated(policyId)).to.equal(usdc("1000"));
    expect(await ctx.manager.totalPrincipal(policyId)).to.equal(usdc("11800"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11800"));
    expect(await ctx.premiumVault.totalYieldPrincipal()).to.equal(usdc("1000"));
    expect(await ctx.premiumVault.idlePrincipalLiability()).to.equal(usdc("10800"));
    expect(await ctx.token.balanceOf(await ctx.yieldAdapter.getAddress())).to.equal(usdc("1000"));

    const strategy = await ctx.yieldStrategyManager.strategyAt(ctx.yieldStrategyId);
    expect(strategy.totalCostBasis).to.equal(usdc("1000"));
    expect(strategy.totalShares).to.equal(usdc("1000"));
  });

  it("realizes yield with a 10% protocol fee and credits 90% to extra principal", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);
    await ctx.token.mint(await ctx.yieldAdapter.getAddress(), usdc("200"));
    await ctx.yieldAdapter.connect(ctx.owner).setAssetsPerShare(ethers.parseEther("1.2"));

    await ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, usdc("1200"));

    const policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("1180"));
    expect(await ctx.manager.totalPrincipal(policyId)).to.equal(usdc("11980"));
    expect(await ctx.manager.yieldPrincipalAllocated(policyId)).to.equal(0);
    expect(await ctx.premiumVault.totalYieldPrincipal()).to.equal(0);
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11980"));
    expect(await ctx.premiumVault.protocolYieldReserveBalance()).to.equal(usdc("20"));

    const ownerBefore = await ctx.token.balanceOf(ctx.owner.address);
    await ctx.premiumVault.connect(ctx.owner).withdrawProtocolYieldReserve(ctx.owner.address, usdc("20"));
    const ownerAfter = await ctx.token.balanceOf(ctx.owner.address);
    expect(ownerAfter - ownerBefore).to.equal(usdc("20"));
    expect(await ctx.premiumVault.protocolYieldReserveBalance()).to.equal(0);
  });

  it("applies realized yield losses to extra principal before minimum principal", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);
    await ctx.yieldAdapter.connect(ctx.owner).setAssetsPerShare(ethers.parseEther("0.7"));
    await ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, 0);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("700"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("11500"));
    expect(await ctx.premiumVault.protocolYieldReserveBalance()).to.equal(0);

    const ctxMinimumOnly = await deployFixture();
    const minimumOnlyPolicyId = await openPolicy(ctxMinimumOnly);
    await fundMinimum(ctxMinimumOnly, minimumOnlyPolicyId);
    await ctxMinimumOnly.manager
      .connect(ctxMinimumOnly.holder)
      .depositYield(minimumOnlyPolicyId, ctxMinimumOnly.yieldStrategyId, usdc("1000"), 0);
    await ctxMinimumOnly.yieldAdapter.connect(ctxMinimumOnly.owner).setAssetsPerShare(ethers.parseEther("0.5"));
    await ctxMinimumOnly.manager
      .connect(ctxMinimumOnly.holder)
      .withdrawAllYield(minimumOnlyPolicyId, ctxMinimumOnly.yieldStrategyId, 0);

    policy = await ctxMinimumOnly.manager.policies(minimumOnlyPolicyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10300"));
    expect(policy.remainingExtraPrincipal).to.equal(0);
    expect(await ctxMinimumOnly.premiumVault.totalPrincipalLiability()).to.equal(usdc("10300"));
  });

  it("does not charge yield fees while a position only recovers to its cost basis", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);

    await ctx.yieldAdapter.connect(ctx.owner).setAssetsPerShare(ethers.parseEther("0.8"));
    await ctx.manager.connect(ctx.holder).withdrawYield(policyId, ctx.yieldStrategyId, usdc("500"), 0);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.remainingExtraPrincipal).to.equal(usdc("900"));
    expect(await ctx.premiumVault.protocolYieldReserveBalance()).to.equal(0);

    await ctx.yieldAdapter.connect(ctx.owner).setAssetsPerShare(ethers.parseEther("1"));
    await ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, 0);

    policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("900"));
    expect(await ctx.premiumVault.protocolYieldReserveBalance()).to.equal(0);
  });

  it("enforces strategy caps, deposit disablement, and withdrawal slippage guards", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.yieldStrategyManager.connect(ctx.owner).setStrategyCap(ctx.yieldStrategyId, usdc("500"));
    await expect(
      ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0)
    ).to.be.revertedWith("STRATEGY_CAP_EXCEEDED");

    await ctx.yieldStrategyManager.connect(ctx.owner).setStrategyCap(ctx.yieldStrategyId, usdc("25000"));
    await ctx.yieldStrategyManager.connect(ctx.owner).setStrategyStatus(ctx.yieldStrategyId, true, false);
    await expect(
      ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("100"), 0)
    ).to.be.revertedWith("DEPOSITS_DISABLED");

    await ctx.yieldStrategyManager.connect(ctx.owner).setStrategyStatus(ctx.yieldStrategyId, true, true);
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);
    await ctx.yieldStrategyManager.connect(ctx.owner).setStrategyStatus(ctx.yieldStrategyId, true, false);
    await expect(
      ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, usdc("1001"))
    ).to.be.revertedWith("SLIPPAGE_ASSETS");

    await ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, usdc("1000"));
    expect(await ctx.manager.yieldPrincipalAllocated(policyId)).to.equal(0);
  });

  it("blocks payout and extra withdrawals while yield positions are open", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);

    await expect(ctx.manager.connect(ctx.holder).activatePayout(policyId)).to.be.revertedWith("OPEN_YIELD_POSITION");
    await expect(ctx.manager.connect(ctx.holder).claimAll(policyId)).to.be.revertedWith("OPEN_YIELD_POSITION");
    await expect(ctx.manager.connect(ctx.holder).withdrawExtra(policyId, usdc("1"))).to.be.revertedWith("OPEN_YIELD_POSITION");

    await ctx.manager.connect(ctx.holder).withdrawAllYield(policyId, ctx.yieldStrategyId, 0);
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);
    expect((await ctx.manager.policies(policyId)).status).to.equal(STATUS.PayoutActive);
  });

  it("lets a claim-ready beneficiary close yield before death settlement", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await fundMinimum(ctx, policyId, "1000");
    await ctx.manager.connect(ctx.holder).depositYield(policyId, ctx.yieldStrategyId, usdc("1000"), 0);
    await reportAfterPolicyAge(ctx, policyId, ctx.beneficiaryA);
    await advance(DEATH_REPORT_DELAY);

    await expect(ctx.manager.connect(ctx.beneficiaryA).claimDeath(policyId)).to.be.revertedWith("OPEN_YIELD_POSITION");
    await ctx.manager.connect(ctx.beneficiaryB).withdrawAllYield(policyId, ctx.yieldStrategyId, 0);
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(true);

    await ctx.manager.connect(ctx.beneficiaryA).claimDeath(policyId);
    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("5784"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("3856"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect((await ctx.manager.policies(policyId)).status).to.equal(STATUS.DeathSettled);
  });

  it("stores auxiliary tokens only after the USDC minimum is covered", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);
    const altTokenAddress = await ctx.altToken.getAddress();

    await expect(
      ctx.manager.connect(ctx.holder).depositToken(policyId, altTokenAddress, usdc("250"))
    ).to.be.revertedWith("MINIMUM_NOT_FUNDED");

    await expect(
      ctx.manager.connect(ctx.holder).depositToken(policyId, await ctx.token.getAddress(), usdc("250"))
    ).to.be.revertedWith("MINIMUM_NOT_FUNDED");

    await fundMinimum(ctx, policyId);

    await expect(
      ctx.manager.connect(ctx.holder).depositToken(policyId, await ctx.token.getAddress(), usdc("250"))
    ).to.be.revertedWith("USE_USDC_DEPOSIT");

    await ctx.manager.connect(ctx.holder).depositToken(policyId, altTokenAddress, usdc("250"));

    expect(await ctx.manager.auxiliaryTokenBalances(policyId, altTokenAddress)).to.equal(usdc("250"));
    expect(await ctx.manager.auxiliaryTokenCount(policyId)).to.equal(1);
    expect(await ctx.manager.auxiliaryTokenAt(policyId, 0)).to.deep.equal([altTokenAddress, usdc("250")]);
    expect(await ctx.premiumVault.auxiliaryTokenLiability(altTokenAddress)).to.equal(usdc("250"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("10800"));
    expect(await ctx.manager.monthlyPayoutEstimate(policyId)).to.equal(usdc("90"));
  });

  it("lets the holder withdraw auxiliary tokens with no fee", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);
    const altTokenAddress = await ctx.altToken.getAddress();

    await fundMinimum(ctx, policyId);
    await ctx.manager.connect(ctx.holder).depositToken(policyId, altTokenAddress, usdc("250"));

    const before = await ctx.altToken.balanceOf(ctx.holder.address);
    await ctx.manager.connect(ctx.holder).withdrawToken(policyId, altTokenAddress, usdc("75"));
    const after = await ctx.altToken.balanceOf(ctx.holder.address);

    expect(after - before).to.equal(usdc("75"));
    expect(await ctx.manager.auxiliaryTokenBalances(policyId, altTokenAddress)).to.equal(usdc("175"));
    expect(await ctx.premiumVault.auxiliaryTokenLiability(altTokenAddress)).to.equal(usdc("175"));
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(0);
  });

  it("only configured beneficiaries can report death", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await expect(ctx.manager.connect(ctx.stranger).reportDeath(policyId)).to.be.revertedWith("ONLY_BENEFICIARY");

    await advance(DEATH_REPORT_DELAY);
    await expect(ctx.manager.connect(ctx.stranger).reportDeath(policyId)).to.be.revertedWith("ONLY_BENEFICIARY");

    await ctx.manager.connect(ctx.beneficiaryA).reportDeath(policyId);
    const notice = await ctx.manager.deathNotices(policyId);
    expect(notice.active).to.equal(true);
  });

  it("does not allow beneficiary death reports during the first 12 months", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await expect(ctx.manager.connect(ctx.beneficiaryA).reportDeath(policyId)).to.be.revertedWith("POLICY_TOO_NEW");
  });

  it("does not allow death claims before the 12-month no-interaction window ends", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx);

    await reportAfterPolicyAge(ctx, policyId);
    await expect(ctx.manager.connect(ctx.beneficiaryA).claimDeath(policyId)).to.be.revertedWith("DEATH_CLAIM_NOT_READY");
  });

  it("cancels a pending death report when the holder interacts", async function () {
    let ctx = await deployFixture();
    let policyId = await openPolicy(ctx);
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).heartbeat(policyId);
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).deposit(policyId, usdc("1"));
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).updateBeneficiaries(policyId, [ctx.beneficiaryB.address], [10_000]);
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);
    expect(await ctx.manager.beneficiaryAt(policyId, 0)).to.deep.equal([ctx.beneficiaryB.address, 10_000n]);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await fundMinimum(ctx, policyId, "1200");
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).claimMonthly(policyId);
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await fundMinimum(ctx, policyId, "1200");
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).claimAll(policyId);
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await fundMinimum(ctx, policyId, "1200");
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).withdrawExtra(policyId, usdc("1"));
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await fundMinimum(ctx, policyId);
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).depositToken(policyId, await ctx.altToken.getAddress(), usdc("1"));
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);

    ctx = await deployFixture();
    policyId = await openPolicy(ctx);
    await fundMinimum(ctx, policyId);
    await ctx.manager.connect(ctx.holder).depositToken(policyId, await ctx.altToken.getAddress(), usdc("5"));
    await reportAfterPolicyAge(ctx, policyId);
    await ctx.manager.connect(ctx.holder).withdrawToken(policyId, await ctx.altToken.getAddress(), usdc("1"));
    expect((await ctx.manager.deathNotices(policyId)).active).to.equal(false);
  });

  it("pays death claims with 20% retained only from remaining minimum principal", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await fundMinimum(ctx, policyId, "1200");
    await ctx.manager.connect(ctx.holder).depositToken(policyId, await ctx.altToken.getAddress(), usdc("1200"));
    await ctx.manager.connect(ctx.holder).activatePayout(policyId);
    await ctx.manager.connect(ctx.holder).claimMonthly(policyId);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.remainingMinimumPrincipal).to.equal(usdc("10710"));
    expect(policy.remainingExtraPrincipal).to.equal(usdc("1190"));

    await reportAfterPolicyAge(ctx, policyId, ctx.beneficiaryA);
    await advance(DEATH_REPORT_DELAY);
    await ctx.manager.connect(ctx.beneficiaryB).claimDeath(policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("5854.8"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("3903.2"));
    expect(await ctx.altToken.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("720"));
    expect(await ctx.altToken.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("480"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("2142"));
    expect(await ctx.premiumVault.auxiliaryTokenLiability(await ctx.altToken.getAddress())).to.equal(0);
    expect(await ctx.manager.auxiliaryTokenBalances(policyId, await ctx.altToken.getAddress())).to.equal(0);

    policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(STATUS.DeathSettled);
  });
});
