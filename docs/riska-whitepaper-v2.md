# Riska 30: Life Protection with Programmed Income

**Version:** 2.0  
**Date:** May 2026  
**Prepared by:** Riska Foundation  
**Network:** World Chain  
**Primary product:** 30-year life protection contract with programmed income after maturity

## Abstract

Riska 30 is a long-duration protection protocol for verified humans. The product combines family protection and future income in one transparent contract: the holder pays 30 USDC per month for up to 30 years; if verified death occurs after the 12-month waiting period and before maturity, beneficiaries receive 80% of paid premiums; if the holder completes the term, the holder receives 100% of scheduled principal through 10 years of programmed income.

The design is intentionally narrower than a general insurance marketplace. Riska 30 focuses on one high-trust use case: helping a person avoid leaving a financial burden to family while building a future payout stream. World ID can reduce duplicate-account abuse, World Chain can provide low-cost settlement, and smart contracts can expose policy state, premium allocation, maturity, and payout rules for audit.

This paper describes the product, policy lifecycle, capital model, verification layer, grant-aligned implementation roadmap, and the compliance boundaries required before public sale.

## 1. Problem

Life protection and retirement products are often hard to understand, slow to settle, and opaque about fees, reserves, surrender value, and payout mechanics. Families usually discover the real quality of a policy at the worst possible time: after a death, illness, or income disruption.

Riska 30 reframes the product around a simple promise:

- If the holder dies before maturity, the family receives support.
- If the holder reaches maturity, the holder receives programmed income.
- Every state transition is visible: active, grace period, lapsed, death paid, matured, retirement payout, or closed.

The goal is not to replace regulated insurers at launch. The first goal is to build a transparent, verifiable prototype for long-duration protection that can be reviewed, tested, and improved before jurisdiction-specific distribution.

## 2. Product Thesis

Riska 30 is a life protection contract with an in-life benefit. It is not presented as a state pension or lifetime annuity. The first implementation uses programmed withdrawals from an accumulated balance after the 30-year term.

This narrower scope matters. A lifetime annuity requires longevity risk modeling and stronger reserve assumptions. A programmed-income model is easier to audit because the payout source is the tracked retirement balance.

Core product rule:

1. The holder opens a 30-year policy and sets beneficiaries.
2. Each premium is accounted as protected USDC principal for the base policy promise.
3. If verified death occurs before 12 paid months, beneficiaries receive no policy payout.
4. If verified death occurs from month 12 until maturity, beneficiaries receive 80% of paid premiums.
5. If the policy reaches maturity, the holder activates 100% principal return through 120 monthly payouts over 10 years.
6. If verified death occurs after maturity but before activation, or during the payout phase, beneficiaries receive 90% of the matured or remaining balance.

## 3. Why World Chain

Riska 30 is designed for World Chain because the product benefits from human verification, low-friction wallet onboarding, and a grant ecosystem focused on applications for real humans.

World Foundation grants are available on a rolling basis and support teams building meaningful applications on World Chain. The Spark Track looks for a clear problem, a working demo or prototype, and realistic milestones. The Scale Track is aimed at live Mini Apps with active verified users, usage data, retention, and a 10x growth plan.

Riska 30 should therefore be built as a Mini App-compatible product path:

- World ID for unique-human onboarding and anti-duplication controls.
- World App distribution for reachable consumer onboarding.
- World Chain contracts for transparent policy state and settlement.
- Stablecoin-denominated accounting for premiums and payouts where legally permitted.
- Real-money activation only after jurisdiction-specific legal and operational clearance.
- Usage metrics that can evolve from prototype validation to active-user evidence.

## 4. Policy Lifecycle

The policy lifecycle is explicit and deterministic.

### Active

The holder has paid enough premium to keep coverage current. The policy remains active, and paid USDC principal continues to accumulate toward the 30-year maturity promise.

### Grace Period

The holder missed a scheduled payment but remains inside a published grace period. Beneficiary protection remains active until the grace period expires.

### Lapsed

The holder missed payments beyond the grace period. Death protection is suspended or routed into an inactivity review flow. Paid principal remains accountable and can be handled only under the policy terms.

### Death Paid

A verifier confirms death under the policy rules. If death occurs after the 12-month waiting period and before maturity, beneficiaries receive 80% of paid premiums. If death occurs after maturity or during the payout phase, beneficiaries receive 90% of the matured or remaining balance.

### Inactivity Review

If no premium is paid for 12 months, or if a matured holder does not claim scheduled monthly payouts for 12 months, the policy can enter inactivity review. Inactivity alone does not prove death and does not authorize beneficiary payment. A reporter must submit a death report, and Riska Team must verify the claim with evidence before settlement.

### Matured

The policy reaches the 30-year term and becomes eligible for programmed income. Maturity is time-based and does not require an oracle.

### Retirement Payout

The holder activates scheduled payouts from protected principal. The production model uses fixed scheduled withdrawals, not lifetime income.

### Closed

The policy has fully paid, been surrendered under defined rules, or settled after death.

## 5. Premium Allocation

The base model treats each 30 USDC monthly premium as protected USDC principal for the user-facing policy promise. Yield and protocol economics must be accounted separately from that protected principal.

| Bucket | Purpose | Accounting treatment |
| --- | --- | --- |
| Protected principal | Funds the holder's future programmed income and the base beneficiary formula | Tracked as a policy liability |
| Yield reserve | Funds operations, protocol fees, risk buffers, audits, and growth | Generated only through allowlisted strategies and tracked separately |
| Protocol treasury | Funds verification, maintenance, governance, and future decentralization | Withdrawable only under governance or administrator rules |

Base example:

If a holder pays 30 USDC per month for 360 months, total scheduled principal is 10,800 USDC. At maturity, the holder receives 10,800 USDC over 120 monthly payouts, or 90 USDC per month. Riska's operating economics come from yield spread, treasury subsidy, sponsor subsidy, or explicit external fees rather than reducing the protected principal.

## 6. Death Verification

The contract cannot determine death by itself. It records verification events and applies payout rules.

The first production version can start with Riska Team as approved verifier to reduce complexity, but every death settlement should require a reporter, evidence hash, manual verification, and a 3-month dispute window. Production should move toward stronger verification:

- Multiple independent reporters.
- Evidence hashes linked to off-chain records.
- Dispute windows for conflicting reports.
- Bonded verifier roles, potentially staked in RISKA.
- Governance-controlled verifier updates.

On-chain storage should be minimal. Sensitive evidence stays off-chain, while the contract stores only the policy id, event type, timestamp, verifier, and evidence hash.

If a jurisdiction later requires additional compliance review, that process should stay outside the base onboarding flow and expose only minimal approval references to the protocol.

## 7. Capital and Solvency

Riska 30 must separate protected principal liabilities, yield strategy capital, treasury balances, and beneficiary obligations.

Protected principal belongs to the policy lifecycle. It should not be treated as free treasury capital. The contract system should expose:

- Total protected principal liability.
- Fee balance.
- Yield reserve.
- Strategy exposure by protocol.
- Available risk liquidity.
- Beneficiary payout exposure.
- Capacity limits for new policies.

A basic liquidity rule:

Available liquidity = token balance + withdrawable strategy value - protected principal liabilities - reserved beneficiary obligations - fee balance

Beneficiary payouts should only be paid when available liquidity is sufficient and the policy rules are satisfied. New policy issuance and yield deployment should halt when exposure would exceed safe limits.

The actuarial and yield-risk model remains a separate workstream. Grant funding should support prototyping, user validation, security review, yield-strategy risk review, and compliance preparation before broad public distribution.

## 8. Smart Contract Architecture

The current MVP contract, `RiskaThirtyYearPolicy`, implements an early lifecycle. Production contracts should be rewritten around the final policy model:

- Plan creation with 30 USDC monthly premium, 12-month waiting period, beneficiary payout formula, payout duration, and policy terms hash.
- Policy opening with holder, World ID eligibility, legal terms acceptance, and multiple beneficiaries.
- Premium collection and accounting.
- Grace period, inactivity review, and death-report status.
- Verified death settlement with evidence hash and 3-month dispute window.
- Maturity activation after 30 years.
- Programmed retirement payouts over 10 years.
- Yield strategy deployment and withdrawal.
- Fee withdrawal only from yield/treasury accounting, not protected principal.

Future modules:

- `WorldIdGate`: verifies unique-human eligibility.
- `BeneficiaryRegistry`: manages beneficiary percentages and updates.
- `DeathVerifier`: coordinates multiple death reports and dispute windows.
- `PremiumVault`: segregates reserves and payout capital.
- `YieldStrategyManager`: manages allowlisted yield deployment and withdrawals.
- `RiskController`: enforces strategy caps, liquidity thresholds, and health checks.
- `GovernanceTimelock`: controls parameters with delay and transparency.
- `PolicyTermsRegistry`: stores legal document hashes and versioning.

## 9. Electronic Policy Terms

The legal contract and smart contract must work together.

The electronic policy should define:

- Holder and beneficiary rights.
- Premium schedule.
- Grace period.
- Waiting period and beneficiary payout formula.
- Retirement-balance rules.
- Maturity date.
- Programmed payout duration.
- Evidence and verification process.
- Lapse, surrender, and closure rules.
- Yield strategy risks and whether yield belongs to the protocol, the reserve, or the policyholder.
- Jurisdiction and compliance disclosures.

The document hash should be stored on-chain at plan creation. Users should sign human-readable policy terms before paying the first premium.

## 10. RISKA Incentive Layer

RISKA should support protocol reliability, enterprise distribution, and future decentralization, not distract from the user promise.

Initial RISKA design:

- Token name: RISKA.
- Fixed supply: 100,000 tokens.
- Decimals: 0.
- Transferable from day 1.
- Initial ownership: Riska owner/foundation controls all tokens.
- Governance starts centralized and can later decentralize through treasury, partner, or community distribution.

Potential RISKA roles:

- Governance over plan parameters, verifier sets, yield-strategy allowlists, fee routing, and upgrade timelocks.
- Enterprise partner access and commercial alignment.
- Verifier staking in later phases, where misconduct can be penalized.
- Incentive alignment for long-term capital and distribution partners.

The grant-stage product should not depend on token speculation. The strongest grant argument is the public-good utility: verified humans can access transparent protection logic that is easier to audit than legacy opaque policies.

## 11. Mini App Roadmap

### Phase 1: Production architecture prototype

- Build the Riska 30 landing page and downloadable white paper.
- Implement wallet connection, World ID path, beneficiary setup, and policy preview.
- Rewrite production-oriented contracts around the final payout formula.
- Deploy controlled production-test contracts on World Chain mainnet when required by Mini App testing.
- Simulate and/or execute premium payments, grace period, inactivity review, maturity, and death settlement.
- Add a basic policy dashboard.

### Phase 2: Production Mini App demo

- Add World ID verification.
- Package the onboarding flow for World App.
- Create a clearly labeled simulation/training mode for users and grant reviewers.
- Add production transaction flow, backend verification, and policy activation checks.
- Collect feedback from verified users.
- Produce retention, completion, and trust metrics.

### Phase 3: Pilot readiness

- Add verifier workflow and evidence-hash dashboard.
- Commission smart contract review.
- Produce actuarial, yield-risk, and liquidity assumptions.
- Prepare jurisdiction-specific legal analysis.
- Define live production controls, strategy caps, user protections, and reserve rules.

### Phase 4: Scale path

- Launch broader production only after legal, security, yield-risk, and operational clearance.
- Track verified-user activation, premium intent, beneficiary setup completion, and retention.
- Prepare a Scale Track grant case based on live usage and a 10x growth plan.

## 12. Grant Alignment

Riska 30 is positioned for a World Foundation Spark Track application first.

The project addresses a concrete problem: families need understandable protection that pays quickly and transparently, while users also want a future benefit if they survive the term.

The working product/demo should show:

- A clear policy quote.
- World ID-gated onboarding.
- Beneficiary setup.
- Premium, yield, and protected-principal disclosure.
- On-chain policy creation.
- Death verification with evidence-hash workflow.
- Maturity and programmed payout simulation.

Milestones should be scoped to a defined timeline:

- Month 1: final product specification, contract rewrite, policy dashboard, downloadable white paper.
- Month 2: World ID integration, Mini App production flow, beneficiary setup, and simulation/training mode.
- Month 3: World Chain mainnet production-test deployment, AI-agent security review, audit package, and grant reporting metrics.

## 13. Risks and Open Questions

### Regulatory classification

Life protection and retirement products are regulated in most jurisdictions. Riska 30 must not be publicly sold as insurance, pension, or annuity without legal clearance.

### Verification reliability

Death verification is sensitive. A 12-month inactivity period can trigger review, but it must not prove death by itself. Production requires robust evidence standards, a reporter, Riska Team verification, dispute handling, and careful beneficiary notification.

### Solvency

Beneficiary payouts, protected principal, and yield strategies require reserve discipline. Protected principal must be segregated from treasury capital, and yield strategy losses need a predefined loss waterfall.

### User trust

The product asks users to think in decades. The interface must be unusually clear about what is guaranteed, what is conditional, and what depends on legal approval.

### Yield risk

Using policy funds in lending or yield protocols introduces smart-contract risk, liquidity risk, bridge risk, oracle risk, governance risk, and counterparty risk. Riska must publish strategy caps, health checks, emergency exits, and user-facing disclosures.

### Token design

RISKA incentives must be secondary to product trust. Token mechanics should not create regulatory or reputational risk.

## 14. Conclusion

Riska 30 narrows the original Riska vision into a product that is easier to explain, prototype, audit, and evaluate for grant funding.

The promise is direct: after the waiting period, protect beneficiaries through a published payout formula, then pay the holder 100% of scheduled principal through programmed income after maturity. World ID can reduce duplicate-account abuse, World Chain can make policy state transparent, and a Mini App can turn the concept into a production-grade consumer flow.

The next milestone is not mass-market launch. The next milestone is a credible, verifiable demo: a working policy lifecycle, a clear user interface, a downloadable white paper, and a grant application grounded in measurable progress.

## References

1. World Foundation Grants, "Empowering builders turning real usage into lasting products", https://world.org/grants
2. World Developer Docs, "Grants Program", https://docs.world.org/world-chain/developers/grants
3. World Developer Docs, "World ID", https://docs.world.org/world-id
4. World Developer Docs, "Mini Apps", https://docs.world.org/mini-apps
5. Bitcoin White Paper, S. Nakamoto, 2008, https://bitcoin.org/bitcoin.pdf
6. OECD, "Innovation in Peer-to-Peer Risk Pooling", 2023
