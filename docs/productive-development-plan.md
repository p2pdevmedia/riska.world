# Riska Productive Development Plan

**Date:** May 26, 2026  
**Status:** Working product plan for Spark Grant, production Mini App, and audit-readiness  
**Product name:** Riska  
**Token / app / foundation name:** RISKA

## 1. Product Decisions Captured

Riska is a 30-year life protection product with a retirement-style programmed payout.

- Market vision: global distribution through World App and World Chain.
- Production legal reality: live insurance sales must still be cleared jurisdiction by jurisdiction.
- Identity rule: one policy per World ID verified human.
- Eligibility rule: no real-money policy activation before World ID verification, legal clearance, and operational approval for the launch jurisdiction.
- Payment asset: USDC on World Chain as the accounting asset.
- Entry assets: WLD and fiat on-ramp may be accepted through adapters, but should convert to USDC before policy accounting.
- Monthly premium: 30 USDC.
- Contribution term: 30 years, 360 monthly periods.
- Retirement payout duration: 10 years, 120 monthly periods.
- Beneficiaries: multiple beneficiaries with configurable percentages.
- Beneficiary changes: holder may change beneficiaries until death, subject to on-chain authorization rules.
- Custody: smart contracts hold the policy funds.
- Yield strategy: policy funds may be deployed into allowlisted protocols to earn yield. Yield funds protocol economics, reserves, operations, and future growth; the user-facing base promise remains defined in USDC principal rules.
- Contracts: upgradeable contracts are expected for production.
- Initial death verification: Riska team acts as the verifier/oracle.
- Dispute / verification window: 3 months.
- Inactivity review window: 12 months with no premium payment or no monthly payout claim can trigger a death-review workflow, but death status still requires a death report and Riska Team verification.
- Production target: World Chain mainnet Mini App.
- Age rule: no age limit, including real-money production, subject to final legal and risk review.
- Current audit stage: AI-agent review and internal hardening only.

## 2. Base Financial Model

This is the base principal model. It defines the user-facing payout schedule without assuming that yield is guaranteed to the policyholder.

```text
Monthly premium = 30 USDC
Contribution months = 360
Total scheduled contributions = 30 * 360 = 10,800 USDC
Retirement payout months = 120
Retirement payout = 10,800 / 120 = 90 USDC per month
```

Fee model:

- The 30 USDC monthly premium is treated as protected policy principal for the base promise.
- Riska should not take ordinary protocol fees from protected principal if the maturity promise is 100% principal return.
- Protocol economics should come from yield spread, treasury subsidy, sponsor subsidy, or explicit external fees.
- Yield is not guaranteed to the user unless future legal terms explicitly say otherwise.
- Yield-bearing strategies must be allowlisted, capped, monitored, and removable through governance/timelock controls.

Base maturity outcome:

```text
Fully paid principal = 10,800 USDC
Holder payout = 100% of fully paid principal over 120 months
Monthly holder payout = 90 USDC
```

## 3. Beneficiary Payout Model

Current production rule:

- Death before 12 paid months: no beneficiary payout.
- Death from month 12 until maturity: beneficiaries receive 80% of paid premiums.
- Survival to maturity: holder receives 100% of paid scheduled premium balance over 10 years.
- Death after maturity but before activating retirement payouts: beneficiaries receive 90% of the matured balance.
- Death during retirement payouts: beneficiaries receive 90% of the remaining retirement balance.

Formula:

```text
paidPremium = paidMonths * 30 USDC

if paidMonths < 12:
  beneficiaryPayout = 0

if 12 <= paidMonths < 360:
  beneficiaryPayout = paidPremium * 80%

if paidMonths >= 360 and retirement is not activated:
  beneficiaryPayout = 10,800 * 90% = 9,720 USDC

if retirement is active and holder death is verified:
  beneficiaryPayout = remainingRetirementBalance * 90%

if holder survives and activates retirement:
  holderPayout = 10,800 USDC over 120 months = 90 USDC/month
```

Example table:

| Event time | Premiums paid | Beneficiary payout before maturity | Holder retirement payout if survives |
| --- | ---: | ---: | ---: |
| Month 2 | 60 USDC | 0 USDC | Not matured |
| Month 12 | 360 USDC | 288 USDC | Not matured |
| Month 24 | 720 USDC | 576 USDC | Not matured |
| Year 5 | 1,800 USDC | 1,440 USDC | Not matured |
| Year 10 | 3,600 USDC | 2,880 USDC | Not matured |
| Year 20 | 7,200 USDC | 5,760 USDC | Not matured |
| Year 30 | 10,800 USDC | 8,640 USDC if death before maturity rule applies | 10,800 USDC total, paid as 90 USDC/month |
| After maturity, before activation | 10,800 USDC | 9,720 USDC | Not activated |

This model is solvent by construction at the base-principal level because beneficiary payouts are less than contributed principal. Yield strategies can improve protocol economics, but they introduce protocol, liquidity, smart-contract, bridge, oracle, and counterparty risk. Those risks must be isolated from the base policy promise.

## 4. Inactivity and Death Review

Riska must separate inactivity from verified death.

- If a holder stops paying premiums for 12 months, the policy can enter an inactivity review state.
- If a matured holder does not claim monthly retirement payouts for 12 months, the policy can enter an inactivity review state.
- Inactivity alone must not transfer funds to beneficiaries.
- A person, institution, or authorized reporter must submit a death report.
- Riska Team must verify the report, attach an evidence hash, and open the 3-month dispute window.
- Only after verification and the dispute window can the contract mark the policy as death-settled and pay beneficiaries.

Recommended future statuses:

- `Active`
- `GracePeriod`
- `InactiveReview`
- `DeathReported`
- `DisputeWindow`
- `DeathVerified`
- `Matured`
- `RetirementPayout`
- `Closed`

## 5. Non-Negotiable Safety Rules

These rules are required before any real family money is accepted:

- No real-money launch without contract tests, fuzz tests, invariant tests, and a documented threat model.
- No real-money launch with a single externally owned owner wallet.
- Production admin must use multisig, timelock, emergency pause, and clearly separated roles.
- Upgradeability must be explicit: proxy type, upgrade admin, delay, rollback plan, storage layout tests.
- Non-payment or missed claims must not mark a user as dead by itself. It can trigger inactivity review only.
- Death payout requires manual verification, evidence hash, verifier signature, and the 3-month dispute window.
- Retirement principal must be separated from fees, reserve capital, and yield accounting in contract modules.
- Yield deployment must use strict allowlists, caps per protocol, emergency withdrawal paths, loss accounting, and monitoring.
- The system must expose reserves, liabilities, available liquidity, and policy counts.
- Launch target is World Chain mainnet production, but real-money production still needs legal clearance, operational controls, and explicit risk disclosures.

## 6. Current Strategic Tension

The stated vision says "no limit" and "worldwide." That can be the long-term direction, but it should not be the first real-money launch rule.

Recommended interpretation:

- Grant/product demo: worldwide World App experience with production-grade UX.
- Production target: World Chain mainnet.
- Operational reality: risk limits, strategy caps, pause controls, legal clearance, and monitoring still protect families even if the long-term vision is worldwide and uncapped.
- Scale: limits can increase after legal, actuarial, security, and yield-strategy reviews.

## 7. RISKA Token Governance

Current direction:

- Total supply: exactly 100,000 RISKA tokens.
- Decimals: 0.
- Transferability: transferable from day 1.
- Initial ownership: Riska owner/foundation controls all tokens.
- Purpose: governance over contracts, protocol parameters, partner access, enterprise distribution, and future decentralization.

Security and grant positioning:

- If one party controls all tokens, this is centralized administration, not decentralized governance.
- This can be acceptable for early-stage control and enterprise sales if it is disclosed clearly.
- Do not market the token as an investment or yield source during the grant stage.
- Use multisig and timelock even if the token supply is centrally held.
- Separate emergency pause power from ordinary parameter governance.
- Define a future decentralization path before presenting Riska as community-governed.

## 8. Productive Architecture Target

Required production modules:

- `RiskaPolicyManager`: creates policies, enforces lifecycle, coordinates modules.
- `RiskaToken`: RISKA governance token.
- `WorldIdGate`: enforces one verified human per active policy.
- `BeneficiaryRegistry`: manages multiple beneficiaries and percentages.
- `PolicyTermsRegistry`: stores hashes and versions of legal policy terms.
- `DeathVerifier`: manages death reports, evidence hashes, dispute windows, and verifier roles.
- `PremiumVault`: holds USDC and separates protected principal, yield reserves, fees, and payout capital.
- `YieldStrategyManager`: deploys only approved surplus/liability-backed funds into allowlisted protocols under caps and withdrawal rules.
- `RiskController`: enforces strategy caps, exposure limits, liquidity requirements, and health checks.
- `GovernanceTimelock`: controls upgrades, parameter changes, verifier changes, and fee routing.
- `EmergencyPause`: pauses risky actions without allowing arbitrary fund seizure.
- `PaymentAdapter`: converts WLD or fiat on-ramp flows into USDC before policy accounting.

## 9. Development Phases

### Phase 0: Product Specification Freeze

- Finalize premium, payout, beneficiary, waiting-period, death-verification, and maturity rules.
- Define exact legal wording for demo vs real policy.
- Define production Mini App boundaries and user disclosures.
- Define RISKA token supply, roles, and governance limitations.
- Define yield strategy policy, allowed protocols, caps, and loss waterfall.

### Phase 1: Contract Hardening

- Add Foundry or Hardhat contract toolchain.
- Add ERC20 mocks and USDC-decimal tests.
- Rewrite the contracts around the target modular production architecture.
- Add unit tests for policy opening, premium payment, lapse, death report, maturity, payout, and surrender.
- Add fuzz tests for beneficiary percentages, payout math, and payment periods.
- Add invariants: accounting must cover principal liabilities, no unauthorized payout, no double death claim, no yield strategy can exceed caps, and no beneficiary split can exceed 100%.
- Replace single-beneficiary model with multi-beneficiary registry.

### Phase 2: Production Mini App

- Integrate World ID verification.
- Build World App compatible onboarding.
- Add World Chain mainnet transaction flows with backend verification.
- Add policy quote, beneficiary setup, maturity projection, premium payment, and death-claim flow.
- Keep a clearly labeled simulation/training mode for grant reviewers and users not ready to transact.
- Collect grant metrics: verified starts, quote completion, beneficiary completion, dashboard return rate, trust score.

### Phase 3: Audit-Readiness

- Produce system map, contract map, test plan, threat model, and known risks.
- Run static analysis, fuzzing, invariant tests, and AI-agent review.
- Produce an audit package with scope, commit hash, deployment scripts, and expected invariants.
- Commission external human smart contract audit before real funds.

### Phase 4: Limited Real-Money Pilot

- Launch only after legal and security clearance.
- Use hard caps for user count, policy size, total deposits, and daily payouts.
- Use multisig and timelock for admin actions.
- Monitor on-chain invariants and off-chain operational events.
- Publish transparency dashboard.

### Phase 5: Scale

- Expand jurisdictions gradually.
- Add stronger verifier network.
- Add actuarial review and reserve policy.
- Add bug bounty.
- Re-audit after major contract changes.

## 10. Remaining Questions

- Confirm whether RISKA token uses voting checkpoints/delegation or a custom governance model.
- Confirm whether the 80% beneficiary payout is calculated from paid principal only or from paid principal plus a portion of earned yield.
- Confirm whether beneficiaries receive nothing before 12 months, or whether premiums are refunded to the holder estate.
- Confirm fiat on-ramp provider.
- Confirm whether users can enter at any age with the same 30 USDC premium, or whether risk controls/yield assumptions vary by age.
- Confirm whether Riska wants traditional life-insurance-style leverage later, where beneficiaries can receive more than paid premiums.
- Confirm the yield strategy allowlist and whether funds can be deployed to lending protocols, vaults, RWAs, or only highly liquid DeFi markets.
- Confirm loss waterfall if a yield protocol loses funds.
