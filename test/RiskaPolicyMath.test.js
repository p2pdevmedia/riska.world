const { expect } = require("chai");
const { ethers } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);

describe("RiskaPolicyMath", function () {
  let math;

  beforeEach(async function () {
    const MathHarness = await ethers.getContractFactory("RiskaPolicyMathHarness");
    math = await MathHarness.deploy();
  });

  it("anchors the flexible policy constants", async function () {
    expect(await math.minimumMonthlyUnit()).to.equal(usdc("30"));
    expect(await math.minimumPolicyMonths()).to.equal(360);
    expect(await math.payoutMonths()).to.equal(120);
    expect(await math.minimumPolicyPrincipal()).to.equal(usdc("10800"));
    expect(await math.deathBeneficiaryBps()).to.equal(8000);
    expect(await math.deathFeeBps()).to.equal(2000);
  });

  it("estimates monthly payout from the full remaining balance", async function () {
    expect(await math.monthlyPayout(usdc("10800"))).to.equal(usdc("90"));
    expect(await math.monthlyPayout(usdc("12000"))).to.equal(usdc("100"));
    expect(await math.monthlyPayout(usdc("10800") + 1n)).to.equal(usdc("90"));
  });

  it("charges death fees only against remaining minimum principal", async function () {
    expect(await math.deathPayout(usdc("10800"), 0)).to.deep.equal([usdc("8640"), usdc("2160")]);
    expect(await math.deathPayout(usdc("10800"), usdc("1000"))).to.deep.equal([usdc("9640"), usdc("2160")]);
    expect(await math.deathPayout(usdc("10710"), usdc("1190"))).to.deep.equal([usdc("9758"), usdc("2142")]);
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
