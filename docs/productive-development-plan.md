# Riska Productive Development Plan

**Date:** May 28, 2026
**Status:** Flexible policy account model for Spark Grant, staging tests, and audit-readiness
**Product name:** Riska
**Token / app / foundation name:** RISKA

## 1. Product Decisions Captured

Riska is a flexible USDC policy account for verified humans.

- Market vision: global distribution through World App and World Chain.
- Production legal reality: live insurance or retirement sales still require jurisdiction-by-jurisdiction clearance.
- Identity rule: one policy per World ID verified human.
- Entry rule: any verified human can open a policy; the product flow has no separate admin eligibility step.
- Payment asset: USDC on World Chain as the policy accounting asset.
- Auxiliary tokens: after the USDC minimum is covered, the holder may custody non-USDC ERC20 tokens in the policy. These tokens do not count toward USDC principal, do not change monthly payout, carry no Riska fee, and pass 100% to beneficiaries on death settlement.
- Minimum policy principal: 10,800 USDC.
- Minimum policy unit: 30 USDC.
- Minimum model: `30 USDC * 360 = 10,800 USDC`.
- Deposits: any holder deposit fills the minimum first; amounts above 10,800 USDC become extra principal.
- Extra principal: increases future monthly payout, can be withdrawn in parts at any time while the policy is active or in payout, and is not fee-bearing.
- Non-USDC token custody: holder can deposit and withdraw other ERC20 tokens after the USDC minimum is covered; beneficiaries receive those token balances 100% on death settlement.
- Holder payout: available once the minimum is fully funded.
- Payout duration: 120 monthly payments.
- Claim-all: holder can withdraw all remaining principal after the minimum is funded or once payout is active; Riska retains 20% only from remaining minimum principal, extra principal has no fee, and living holder depletion resets the same policy to active and reusable.
- Heartbeat: holder can prove life without claiming money for that month.
- Beneficiaries: multiple beneficiaries with configurable percentages.
- Beneficiary changes: holder may change beneficiaries while the policy is active or in payout.
- Death flow: a configured beneficiary reports death, waits 12 months, and can claim only if the holder does not interact.
- Minimum-principal fee: claim-all and death settlement retain 20% of remaining minimum principal only; extra principal and auxiliary ERC20 tokens are not fee-bearing.
- Main death flow: beneficiary report plus 12 months without holder interaction.
- Current audit stage: AI-agent review, internal hardening, testnet deployment, and staging user testing.

## 2. Base Financial Model

```text
Minimum monthly unit = 30 USDC
Minimum months = 360
Minimum policy principal = 30 * 360 = 10,800 USDC
Payout months = 120
Baseline monthly payout after minimum funding = 10,800 / 120 = 90 USDC
```

Deposits are allocated in two buckets:

```text
remainingMinimumPrincipal = min(totalDeposits, 10,800 USDC)
remainingExtraPrincipal = max(totalDeposits - 10,800 USDC, 0)
totalPrincipal = remainingMinimumPrincipal + remainingExtraPrincipal
monthlyPayout = totalPrincipal / 120
```

The final monthly claim pays any dust left by integer division. If the holder withdraws extra principal after payout activation, the remaining balance is divided across the remaining payout months.

Canonical auxiliary token rule:

- Non-USDC ERC20 tokens are custody-only policy assets.
- They can be deposited only after the 10,800 USDC minimum is covered.
- They can be withdrawn in parts by the living holder with no fee.
- They never count toward `remainingMinimumPrincipal`, `remainingExtraPrincipal`, `totalPrincipal`, or monthly payout.
- They never enter the minimum-principal fee base.
- On death settlement, every tracked auxiliary token balance is distributed 100% to beneficiaries using the configured beneficiary shares.

## 3. Holder Actions

- `deposit(policyId, amount)`: deposits any USDC amount before payout activation.
- `activatePayout(policyId)`: allowed once the minimum principal is fully funded.
- `claimMonthly(policyId)`: pays the next monthly amount with no fee.
- `withdrawExtra(policyId, amount)`: lets the holder withdraw part of `remainingExtraPrincipal` with no fee; during payout it reschedules the remaining monthly amount.
- `depositToken(policyId, token, amount)`: stores a non-USDC ERC20 token after the USDC minimum is covered; the token is custody-only, does not affect payout math, and passes 100% to beneficiaries on death settlement.
- `withdrawToken(policyId, token, amount)`: withdraws part of a stored non-USDC token balance with no fee.
- `claimAll(policyId)`: pays all remaining holder principal minus 20% of remaining minimum principal, leaves extra principal fee-free, and resets the same policy to an active zero-balance state.
- `heartbeat(policyId)`: records holder interaction and cancels any pending death report.
- `updateBeneficiaries(policyId, beneficiaries, sharesBps)`: updates beneficiary splits and cancels any pending death report.

USDC deposits after payout activation are not allowed in the current model. Extra-principal withdrawals and auxiliary-token custody actions are allowed before or during payout. A future version can add USDC top-ups during payout only after new accounting and UX rules are specified.

## 4. Beneficiary Death Flow

Riska separates death notice from death payout.

- A death report can be submitted only by a configured beneficiary.
- A death report is allowed only after the policy has existed at least `12 * 30 days`.
- The report starts a second `12 * 30 days` no-interaction window.
- Any holder interaction cancels the pending report.
- If the holder does not interact during the window, a configured beneficiary can claim.
- The contract uses the beneficiary-driven notice window for beneficiary payout.

Death payout:

```text
retainedFee = remainingMinimumPrincipal * 20%
beneficiaryPayout = remainingExtraPrincipal + remainingMinimumPrincipal - retainedFee
```

Holder claim-all uses the same minimum-principal fee base:

```text
retainedFee = remainingMinimumPrincipal * 20%
holderPayout = remainingExtraPrincipal + remainingMinimumPrincipal - retainedFee
```

Auxiliary ERC20 tokens are separate from USDC principal. On death settlement, every stored auxiliary token balance is sent 100% to beneficiaries according to the same beneficiary percentages, with no protocol fee.

Examples:

| Remaining minimum | Remaining extra | Beneficiary payout | Protocol reserve |
| ---: | ---: | ---: | ---: |
| 10,800 USDC | 0 USDC | 8,640 USDC | 2,160 USDC |
| 10,800 USDC | 1,000 USDC | 9,640 USDC | 2,160 USDC |
| 10,710 USDC | 1,190 USDC | 9,758 USDC | 2,142 USDC |

## 5. Non-Negotiable Safety Rules

- No real-money launch without contract tests, fuzz tests, invariant tests, and a documented threat model.
- No real-money launch with a single externally owned owner wallet.
- Production admin must use multisig, timelock, emergency pause, and clearly separated roles.
- Upgradeability must be explicit: proxy type, upgrade admin, delay, rollback plan, and storage layout tests.
- Non-payment or missed claims must not mark a user as dead by itself.
- Beneficiary payout requires beneficiary report plus the 12-month no-interaction window.
- Auxiliary token balances must remain outside the minimum-principal fee base and pass 100% to beneficiaries on death settlement.
- Holder heartbeat must remain a simple, low-cost way to cancel a false or stale report.
- Principal liabilities, protocol reserve, yield reserve, and treasury accounting must stay separate.
- Yield deployment must use strict allowlists, caps per protocol, emergency withdrawal paths, loss accounting, and monitoring.
- Launch target is World Chain mainnet production, but real-money production still needs legal clearance, operational controls, and explicit risk disclosures.

## 6. Productive Architecture Target

Current testnet modules:

- `RiskaPolicyManager`: creates policies, enforces flexible lifecycle, partial extra withdrawals, auxiliary token custody, reusable living depletion, and module coordination.
- `RiskaPolicyMath`: constants and payout math.
- `RiskaBeneficiaryRegistry`: manages beneficiaries and percentages.
- `RiskaPremiumVault`: holds USDC and auxiliary ERC20 tokens, separates principal liability from protocol reserve, and pays auxiliary token balances 100% to beneficiaries on death settlement.

Future production modules:

- `WorldIdGate`: on-chain or durable backend enforcement of one verified human per active policy.
- `PolicyTermsRegistry`: stores hashes and versions of legal policy terms.
- `YieldStrategyManager`: deploys only approved surplus/liability-backed funds into allowlisted protocols.
- `RiskController`: enforces strategy caps, exposure limits, liquidity requirements, and health checks.
- `GovernanceTimelock`: controls upgrades, parameter changes, fee routing, and emergency permissions.
- `PaymentAdapter`: converts WLD or fiat on-ramp flows into USDC before policy accounting.

## 7. Development Phases

### Phase 0: Product Specification Freeze

- Freeze flexible policy math, beneficiary death flow, heartbeat semantics, and fee base.
- Define exact legal wording for demo vs real policy.
- Define production Mini App boundaries and user disclosures.
- Define yield strategy policy, allowed protocols, caps, and loss waterfall.

### Phase 1: Contract Hardening

- Keep Hardhat tests for all current flows.
- Add fuzz tests for beneficiary percentages, payout math, death report timing, and claim-all.
- Add invariants: vault liability equals sum of policy principals, no unauthorized payout, no double death claim, no active death report after holder interaction, and no beneficiary split can exceed 100%.
- Add persistent World ID/nullifier storage before production.

### Phase 2: Production Mini App

- Integrate World ID verification in production mode.
- Build World App compatible onboarding and dashboard.
- Add policy state, minimum progress, extra principal, auxiliary token custody, partial extra withdrawal, heartbeat, payout actions, reusable-policy state, beneficiary death report state, and clear 100% auxiliary-token beneficiary settlement copy.
- Keep a clearly labeled simulation/training mode for grant reviewers and users not ready to transact.
- Collect grant metrics: verified starts, quote completion, beneficiary completion, policy opens, dashboard return rate, and trust feedback.

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

## 8. Remaining Questions

- Confirm whether future versions allow deposits after payout activation.
- Confirm whether beneficiaries can be updated during payout in production or only before payout.
- Confirm fiat on-ramp provider.
- Confirm yield strategy allowlist and whether funds can be deployed to lending protocols, vaults, RWAs, or only highly liquid DeFi markets.
- Confirm loss waterfall if a yield protocol loses funds.
- Confirm whether RISKA token uses voting checkpoints/delegation or a custom governance model.
