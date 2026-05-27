const { expect } = require("chai");
const { ethers } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);

describe("RiskaPolicyMath", function () {
  let math;

  beforeEach(async function () {
    const MathHarness = await ethers.getContractFactory("RiskaPolicyMathHarness");
    math = await MathHarness.deploy();
  });

  it("anchors the Riska 30 base constants", async function () {
    expect(await math.monthlyPremium()).to.equal(usdc("30"));
    expect(await math.waitingPeriodMonths()).to.equal(12);
    expect(await math.contributionMonths()).to.equal(360);
    expect(await math.retirementPayoutMonths()).to.equal(120);
    expect(await math.fullTermPrincipal()).to.equal(usdc("10800"));
    expect(await math.holderMonthlyPayout()).to.equal(usdc("90"));
  });

  it("tracks paid principal from the 30 USDC monthly premium", async function () {
    expect(await math.paidPrincipal(0)).to.equal(usdc("0"));
    expect(await math.paidPrincipal(2)).to.equal(usdc("60"));
    expect(await math.paidPrincipal(12)).to.equal(usdc("360"));
    expect(await math.paidPrincipal(360)).to.equal(usdc("10800"));

    await expect(math.paidPrincipal(361)).to.be.revertedWith("PAID_MONTHS_TOO_HIGH");
  });

  it("pays nothing to beneficiaries before 12 paid months", async function () {
    expect(await math.beneficiaryPayoutBeforeMaturity(0)).to.equal(usdc("0"));
    expect(await math.beneficiaryPayoutBeforeMaturity(2)).to.equal(usdc("0"));
    expect(await math.beneficiaryPayoutBeforeMaturity(11)).to.equal(usdc("0"));
  });

  it("pays 80% of paid premiums to beneficiaries from month 12 until maturity", async function () {
    expect(await math.beneficiaryPayoutBeforeMaturity(12)).to.equal(usdc("288"));
    expect(await math.beneficiaryPayoutBeforeMaturity(24)).to.equal(usdc("576"));
    expect(await math.beneficiaryPayoutBeforeMaturity(60)).to.equal(usdc("1440"));
    expect(await math.beneficiaryPayoutBeforeMaturity(120)).to.equal(usdc("2880"));
    expect(await math.beneficiaryPayoutBeforeMaturity(240)).to.equal(usdc("5760"));
    expect(await math.beneficiaryPayoutBeforeMaturity(359)).to.equal(usdc("8616"));

    await expect(math.beneficiaryPayoutBeforeMaturity(360)).to.be.revertedWith("USE_MATURED_PAYOUT");
  });

  it("pays 90% of matured or remaining balance to beneficiaries after maturity", async function () {
    expect(await math.beneficiaryPayoutAfterMaturity(usdc("10800"))).to.equal(usdc("9720"));
    expect(await math.beneficiaryPayoutAfterMaturity(usdc("8100"))).to.equal(usdc("7290"));
    expect(await math.beneficiaryPayoutAfterMaturity(usdc("90"))).to.equal(usdc("81"));
  });

  it("requires beneficiary shares to total 100%", async function () {
    expect(await math.validateBeneficiaryShares([10_000])).to.equal(true);
    expect(await math.validateBeneficiaryShares([5_000, 5_000])).to.equal(true);
    expect(await math.validateBeneficiaryShares([4_000, 3_000, 3_000])).to.equal(true);

    expect(await math.validateBeneficiaryShares([])).to.equal(false);
    expect(await math.validateBeneficiaryShares([8_000, 1_000])).to.equal(false);
    expect(await math.validateBeneficiaryShares([5_000, 0, 5_000])).to.equal(false);
  });
});
