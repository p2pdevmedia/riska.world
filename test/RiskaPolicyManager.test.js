const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);
const termsHash = ethers.keccak256(ethers.toUtf8Bytes("riska-policy-terms-v1"));
const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("death-evidence"));

async function deployFixture() {
  const [owner, verifier, holder, beneficiaryA, beneficiaryB, stranger] = await ethers.getSigners();

  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const token = await MockUSDC.deploy();

  const RiskaBeneficiaryRegistry = await ethers.getContractFactory("RiskaBeneficiaryRegistry");
  const beneficiaryRegistry = await RiskaBeneficiaryRegistry.deploy();

  const RiskaDeathVerifier = await ethers.getContractFactory("RiskaDeathVerifier");
  const deathVerifier = await RiskaDeathVerifier.deploy(verifier.address);

  const RiskaPremiumVault = await ethers.getContractFactory("RiskaPremiumVault");
  const premiumVault = await RiskaPremiumVault.deploy(await token.getAddress(), await beneficiaryRegistry.getAddress());

  const RiskaPolicyManager = await ethers.getContractFactory("RiskaPolicyManager");
  const manager = await RiskaPolicyManager.deploy(
    await beneficiaryRegistry.getAddress(),
    await deathVerifier.getAddress(),
    await premiumVault.getAddress()
  );

  await beneficiaryRegistry.connect(owner).setPolicyManager(await manager.getAddress());
  await deathVerifier.connect(owner).setPolicyManager(await manager.getAddress());
  await premiumVault.connect(owner).setPolicyManager(await manager.getAddress());

  await token.mint(holder.address, usdc("20000"));
  await token.connect(holder).approve(await premiumVault.getAddress(), usdc("20000"));

  return {
    owner,
    verifier,
    holder,
    beneficiaryA,
    beneficiaryB,
    stranger,
    token,
    beneficiaryRegistry,
    deathVerifier,
    premiumVault,
    manager
  };
}

async function openPolicy(ctx, beneficiaries, shares) {
  await ctx.manager.connect(ctx.owner).setEligibility(ctx.holder.address, true, true);
  await ctx.manager.connect(ctx.holder).openPolicy(beneficiaries, shares, termsHash);
  return 1;
}

async function reportVerifyAndSettleDeath(ctx, policyId, evidence = evidenceHash) {
  await ctx.deathVerifier.connect(ctx.stranger).reportDeath(policyId, evidence);
  await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
  await network.provider.send("evm_mine");
  await ctx.deathVerifier.connect(ctx.verifier).verifyDeath(policyId);
  await ctx.manager.connect(ctx.stranger).settleVerifiedDeath(policyId);
}

describe("RiskaPolicyManager", function () {
  it("requires KYC and World ID eligibility before opening a policy", async function () {
    const ctx = await deployFixture();

    await expect(
      ctx.manager.connect(ctx.holder).openPolicy([ctx.beneficiaryA.address], [10_000], termsHash)
    ).to.be.revertedWith("KYC_NOT_APPROVED");

    await ctx.manager.connect(ctx.owner).setEligibility(ctx.holder.address, true, false);
    await expect(
      ctx.manager.connect(ctx.holder).openPolicy([ctx.beneficiaryA.address], [10_000], termsHash)
    ).to.be.revertedWith("WORLD_ID_NOT_VERIFIED");
  });

  it("opens one policy per verified holder and stores beneficiary shares", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    const policy = await ctx.manager.policies(policyId);
    expect(policy.holder).to.equal(ctx.holder.address);
    expect(policy.paidMonths).to.equal(1);
    expect(policy.paidPrincipal).to.equal(usdc("30"));
    expect(policy.remainingPrincipal).to.equal(usdc("30"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("30"));
    expect(await ctx.token.balanceOf(await ctx.premiumVault.getAddress())).to.equal(usdc("30"));

    expect(await ctx.manager.beneficiaryCount(policyId)).to.equal(2);
    expect(await ctx.manager.beneficiaryAt(policyId, 0)).to.deep.equal([ctx.beneficiaryA.address, 6_000n]);
    expect(await ctx.manager.beneficiaryAt(policyId, 1)).to.deep.equal([ctx.beneficiaryB.address, 4_000n]);

    await expect(
      ctx.manager.connect(ctx.holder).openPolicy([ctx.beneficiaryA.address], [10_000], termsHash)
    ).to.be.revertedWith("POLICY_EXISTS");
  });

  it("rejects invalid beneficiary splits", async function () {
    const ctx = await deployFixture();
    await ctx.manager.connect(ctx.owner).setEligibility(ctx.holder.address, true, true);

    await expect(
      ctx.manager.connect(ctx.holder).openPolicy([ctx.beneficiaryA.address, ctx.beneficiaryB.address], [8_000, 1_000], termsHash)
    ).to.be.revertedWith("INVALID_SHARES");

    await expect(
      ctx.manager.connect(ctx.holder).openPolicy([ctx.beneficiaryA.address, ctx.beneficiaryB.address], [10_000], termsHash)
    ).to.be.revertedWith("BENEFICIARY_LENGTH");
  });

  it("rejects duplicate or excessive beneficiaries in the registry", async function () {
    const ctx = await deployFixture();
    await ctx.manager.connect(ctx.owner).setEligibility(ctx.holder.address, true, true);

    await expect(
      ctx.manager
        .connect(ctx.holder)
        .openPolicy([ctx.beneficiaryA.address, ctx.beneficiaryA.address], [5_000, 5_000], termsHash)
    ).to.be.revertedWith("DUPLICATE_BENEFICIARY");

    const tooManyBeneficiaries = Array.from({ length: 9 }, (_, index) => ethers.Wallet.createRandom().address);
    const tooManyShares = [1_200, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100, 1_100];

    await expect(
      ctx.manager.connect(ctx.holder).openPolicy(tooManyBeneficiaries, tooManyShares, termsHash)
    ).to.be.revertedWith("TOO_MANY_BENEFICIARIES");
  });

  it("only lets the policy manager operate registry and vault internals", async function () {
    const ctx = await deployFixture();

    await expect(
      ctx.beneficiaryRegistry
        .connect(ctx.stranger)
        .setBeneficiaries(1, [ctx.beneficiaryA.address], [10_000])
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
  });

  it("requires report, dispute window, and Riska Team verification before settlement", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);

    await expect(ctx.manager.connect(ctx.stranger).settleVerifiedDeath(policyId)).to.be.revertedWith("DEATH_NOT_VERIFIED");

    await ctx.deathVerifier.connect(ctx.stranger).reportDeath(policyId, evidenceHash);
    await expect(ctx.deathVerifier.connect(ctx.verifier).verifyDeath(policyId)).to.be.revertedWith("DISPUTE_WINDOW_OPEN");
    await expect(ctx.manager.connect(ctx.stranger).settleVerifiedDeath(policyId)).to.be.revertedWith("DEATH_NOT_VERIFIED");

    const disputeHash = ethers.keccak256(ethers.toUtf8Bytes("death-dispute"));
    await ctx.deathVerifier.connect(ctx.beneficiaryA).disputeDeath(policyId, disputeHash);
    let report = await ctx.deathVerifier.deathReports(policyId);
    expect(report.status).to.equal(2);

    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");

    await ctx.deathVerifier.connect(ctx.verifier).verifyDeath(policyId);
    report = await ctx.deathVerifier.deathReports(policyId);
    expect(report.status).to.equal(3);

    await ctx.manager.connect(ctx.stranger).settleVerifiedDeath(policyId);
    report = await ctx.deathVerifier.deathReports(policyId);
    expect(report.status).to.equal(5);
  });

  it("allows Riska Team to reject a report and lets a new report replace it", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);
    const secondEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes("second-death-evidence"));

    await ctx.deathVerifier.connect(ctx.stranger).reportDeath(policyId, evidenceHash);
    await ctx.deathVerifier.connect(ctx.verifier).rejectDeath(policyId);

    let report = await ctx.deathVerifier.deathReports(policyId);
    expect(report.status).to.equal(4);

    await ctx.deathVerifier.connect(ctx.beneficiaryA).reportDeath(policyId, secondEvidenceHash);
    report = await ctx.deathVerifier.deathReports(policyId);
    expect(report.status).to.equal(1);
    expect(report.evidenceHash).to.equal(secondEvidenceHash);
  });

  it("only lets the policy manager consume a verified death report", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);

    await ctx.deathVerifier.connect(ctx.stranger).reportDeath(policyId, evidenceHash);
    await network.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");
    await ctx.deathVerifier.connect(ctx.verifier).verifyDeath(policyId);

    await expect(ctx.deathVerifier.connect(ctx.stranger).consumeVerifiedDeath(policyId)).to.be.revertedWith(
      "ONLY_POLICY_MANAGER"
    );
  });

  it("pays no beneficiaries when verified death occurs before 12 paid months", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);

    await reportVerifyAndSettleDeath(ctx, policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(0);
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("30"));

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(6);
  });

  it("pays 80% of paid premiums to beneficiaries after the waiting period", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 11);
    await reportVerifyAndSettleDeath(ctx, policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("172.8"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("115.2"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("72"));

    const policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(5);
  });

  it("matures after 360 paid months and pays the holder 90 USDC monthly", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 359);

    let policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(3);
    expect(policy.paidPrincipal).to.equal(usdc("10800"));
    expect(policy.remainingPrincipal).to.equal(usdc("10800"));

    await ctx.manager.connect(ctx.holder).activateRetirement(policyId);
    await ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId);

    policy = await ctx.manager.policies(policyId);
    expect(policy.status).to.equal(4);
    expect(policy.payoutsMade).to.equal(1);
    expect(policy.remainingPrincipal).to.equal(usdc("10710"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(usdc("10710"));
  });

  it("pays 90% of matured balance to beneficiaries before retirement activation", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 359);
    await reportVerifyAndSettleDeath(ctx, policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("5832"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("3888"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("1080"));
  });

  it("pays 90% of remaining balance to beneficiaries during retirement payout", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 359);
    await ctx.manager.connect(ctx.holder).activateRetirement(policyId);
    await ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId);
    await reportVerifyAndSettleDeath(ctx, policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("5783.4"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("3855.6"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("1071"));
  });

  it("keeps the 90% post-maturity formula when inactivity review starts during payout", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address, ctx.beneficiaryB.address], [6_000, 4_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 359);
    await ctx.manager.connect(ctx.holder).activateRetirement(policyId);
    await ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId);
    await ctx.manager.connect(ctx.owner).flagInactiveReview(policyId);
    await reportVerifyAndSettleDeath(ctx, policyId);

    expect(await ctx.token.balanceOf(ctx.beneficiaryA.address)).to.equal(usdc("5783.4"));
    expect(await ctx.token.balanceOf(ctx.beneficiaryB.address)).to.equal(usdc("3855.6"));
    expect(await ctx.premiumVault.totalPrincipalLiability()).to.equal(0);
    expect(await ctx.premiumVault.protocolReserveBalance()).to.equal(usdc("1071"));
  });

  it("enforces monthly payout cadence after the first retirement claim", async function () {
    const ctx = await deployFixture();
    const policyId = await openPolicy(ctx, [ctx.beneficiaryA.address], [10_000]);

    await ctx.manager.connect(ctx.holder).payPremium(policyId, 359);
    await ctx.manager.connect(ctx.holder).activateRetirement(policyId);
    await ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId);

    await expect(ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId)).to.be.revertedWith("PAYOUT_NOT_READY");

    await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");

    await ctx.manager.connect(ctx.holder).claimRetirementPayout(policyId);
    const policy = await ctx.manager.policies(policyId);
    expect(policy.payoutsMade).to.equal(2);
  });
});
