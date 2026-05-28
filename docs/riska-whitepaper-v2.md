# Riska 30: Flexible Protection and Programmed Income

**Version:** 2.1
**Date:** May 2026
**Prepared by:** Riska Foundation
**Network:** World Chain
**Primary product:** flexible USDC policy account for verified humans

## Abstract

Riska 30 is a transparent policy account for World ID verified humans. Any verified human can open a policy, configure beneficiaries, and fund a 10,800 USDC minimum over time or upfront. Deposits above the minimum become extra principal, increasing the holder's future monthly payout. Extra principal can be withdrawn in parts with no fee. Once the minimum is fully funded, the holder can activate 120 monthly payments or claim all remaining principal.

The beneficiary flow is intentionally simple: a configured beneficiary can report death only after the policy has existed for 12 months. If the holder does not interact with the contract for another 12 months, beneficiaries can claim. A holder heartbeat, deposit, beneficiary update, monthly claim, or claim-all cancels the pending report. The protocol fee on death claims is 20% of remaining minimum principal only; extra principal is not fee-bearing.

This paper describes the product, policy lifecycle, capital model, World Chain fit, grant-aligned implementation roadmap, and the compliance boundaries required before public sale.

## 1. Problem

Life protection and long-term income products are often hard to understand, slow to settle, and opaque about fees, reserves, surrender value, and payout mechanics. Families usually discover the real quality of a policy at the worst possible time.

Riska reframes the product around explicit state:

- Any verified human can open one policy.
- The minimum policy is 10,800 USDC.
- Extra deposits increase future monthly payout and can be withdrawn in parts.
- Holder withdrawals have no fee.
- Beneficiary death claims require a 12-month notice window with no holder interaction.
- Fees are charged only on death claims and only on remaining minimum principal.

The goal is not to replace regulated insurers at launch. The first goal is to build a transparent, verifiable prototype for protection and programmed income that can be reviewed, tested, and improved before jurisdiction-specific distribution.

## 2. Product Thesis

Riska 30 is a life protection contract with an in-life benefit. It is not presented as a state pension or lifetime annuity. The first implementation uses programmed withdrawals from a tracked USDC balance.

Core product rule:

1. The holder opens a policy and sets beneficiaries.
2. Deposits fill the 10,800 USDC minimum first.
3. Extra deposits above 10,800 USDC become extra principal.
4. Once the minimum is funded, the holder can activate 120 monthly payments.
5. The holder can withdraw extra principal in parts, claim monthly, claim all remaining principal, or heartbeat.
6. If the holder empties the policy while alive, the same policy resets to active and can be funded again.
7. A beneficiary can report death after the policy is at least 12 months old.
8. Beneficiaries can claim only after 12 more months with no holder interaction.
9. Death payout equals extra principal plus 80% of remaining minimum principal.

## 3. Why World Chain

Riska is designed for World Chain because the product benefits from human verification, low-friction wallet onboarding, and a grant ecosystem focused on applications for real humans.

Riska should be built as a Mini App-compatible product path:

- World ID for unique-human onboarding and anti-duplication controls.
- World App distribution for reachable consumer onboarding.
- World Chain contracts for transparent policy state and settlement.
- Stablecoin-denominated accounting for deposits and payouts where legally permitted.
- Real-money activation only after jurisdiction-specific legal and operational clearance.
- Usage metrics that can evolve from prototype validation to active-user evidence.

## 4. Policy Lifecycle

### Open

The holder passes the World ID flow in the app, signs the terms hash, sets beneficiaries, and opens one policy from the authenticated wallet.

### Funding

The holder deposits USDC before payout activation. Deposits fill `remainingMinimumPrincipal` until it reaches 10,800 USDC. Additional deposits increase `remainingExtraPrincipal`. Extra principal can be withdrawn in partial amounts with no fee.

### Payout Active

Once the minimum is fully funded, the holder can activate payout. The monthly amount is snapshotted as:

```text
monthlyPayout = totalPrincipal / 120
```

The final claim pays any remaining dust.

If extra principal is withdrawn during payout, the remaining principal is divided across the remaining payout months.

### Holder Heartbeat

The holder can interact without withdrawing funds. Heartbeat updates the holder's last-interaction timestamp and cancels a pending beneficiary death report.

### Beneficiary Death Notice

A configured beneficiary can report death only after the policy has existed for `12 * 30 days`. The report starts a no-interaction window of another `12 * 30 days`.

### Death Claim

If the holder does not interact during the report window, beneficiaries can claim. Payout is distributed by configured beneficiary percentages.

```text
retainedFee = remainingMinimumPrincipal * 20%
beneficiaryPayout = remainingExtraPrincipal + remainingMinimumPrincipal - retainedFee
```

### Reusable or Closed

If a living holder uses claim-all or reaches the final monthly payout, the policy returns to an active zero-balance state. The same one-human policy can then be funded and activated again. Death settlement is terminal for the current policy.

## 5. Capital and Accounting

The base model treats deposited USDC as policy principal. Yield and protocol economics must be accounted separately from that principal.

| Bucket | Purpose | Accounting treatment |
| --- | --- | --- |
| Minimum principal | Funds the base policy promise | Tracked per policy until paid out or death-settled |
| Extra principal | Increases future holder payout and beneficiary death payout | Tracked separately and never fee-bearing |
| Protocol reserve | Receives retained death fee from remaining minimum principal | Tracked separately in the vault |
| Yield reserve | Future source for operations, risk buffers, audits, and growth | Must be separated from principal liabilities |

Base examples:

| Holder balance at death | Beneficiary payout | Protocol reserve |
| ---: | ---: | ---: |
| 10,800 minimum + 0 extra | 8,640 USDC | 2,160 USDC |
| 10,800 minimum + 1,000 extra | 9,640 USDC | 2,160 USDC |
| 10,710 minimum + 1,190 extra | 9,758 USDC | 2,142 USDC |

## 6. Death Notice Reliability

The contract does not determine biological death. It gives beneficiaries a way to start a notice period and gives the holder a simple way to cancel stale or false reports.

The main flow is beneficiary-driven. Future production versions may add evidence handling, legal documentation, notification services, or optional review processes when required by a jurisdiction, but those processes should not become an opaque manual gate in the base smart-contract lifecycle.

Sensitive evidence should stay off-chain. On-chain state should remain limited to policy id, reporter, timestamps, beneficiary authorization, and payout accounting.

## 7. Smart Contract Architecture

Current testnet modules:

- `RiskaPolicyManager`: flexible policy lifecycle, deposits, partial extra withdrawals, payout activation, holder claims, heartbeat, beneficiary death notice, and death claim.
- `RiskaPolicyMath`: constants and math for minimum principal, payout months, and death fee.
- `RiskaBeneficiaryRegistry`: beneficiary accounts and basis-point shares.
- `RiskaPremiumVault`: USDC custody, principal liability, holder payouts, beneficiary payouts, and protocol reserve.

Future modules:

- `WorldIdGate`: durable one-human-one-policy enforcement.
- `PolicyTermsRegistry`: legal document hashes and versioning.
- `YieldStrategyManager`: allowlisted yield deployment and withdrawals.
- `RiskController`: strategy caps, liquidity thresholds, and health checks.
- `GovernanceTimelock`: delayed upgrades and parameter changes.
- `PaymentAdapter`: WLD and fiat on-ramp conversion into USDC.

## 8. Electronic Policy Terms

The legal contract and smart contract must work together.

The electronic policy should define:

- Holder and beneficiary rights.
- Minimum policy principal and deposit rules.
- Extra principal treatment.
- Payout activation, partial extra withdrawal, claim-all, and policy reuse rights.
- Heartbeat and death notice rules.
- Death fee base and beneficiary payout formula.
- Beneficiary updates.
- Yield strategy risks and whether yield belongs to the protocol, reserve, or policyholder.
- Jurisdiction and compliance disclosures.

The terms hash should be stored on-chain when the policy opens. Users should sign human-readable policy terms before paying the first policy unit.

## 9. RISKA Incentive Layer

RISKA should support protocol reliability, enterprise distribution, and future decentralization, not distract from the user promise.

Initial RISKA design:

- Token name: RISKA.
- Fixed supply: 100,000 tokens.
- Decimals: 0.
- Transferable from day 1.
- Initial ownership: Riska owner/foundation controls all tokens.
- Governance starts centralized and can later decentralize through treasury, partner, or community distribution.

The grant-stage product should not depend on token speculation. The strongest grant argument is public-good utility: verified humans can access transparent protection logic that is easier to audit than legacy opaque policies.

## 10. Mini App Roadmap

### Phase 1: Testnet Product

- Build the Riska 30 landing page and downloadable white paper.
- Implement wallet connection, World ID path, beneficiary setup, and policy preview.
- Deploy flexible policy contracts on World Chain Sepolia.
- Add dashboard actions for deposit, partial extra withdrawal, heartbeat, payout activation, monthly claim, claim-all, death report, and death claim.

### Phase 2: Production Mini App Demo

- Package onboarding for World App.
- Add persistent policy storage and nullifier reservation.
- Keep a clearly labeled simulation/training mode for users and grant reviewers.
- Collect feedback from verified users.
- Produce retention, completion, and trust metrics.

### Phase 3: Pilot Readiness

- Commission smart contract review.
- Produce actuarial, yield-risk, and liquidity assumptions.
- Prepare jurisdiction-specific legal analysis.
- Define live production controls, strategy caps, user protections, and reserve rules.

## 11. Risks and Open Questions

### Regulatory classification

Life protection and retirement products are regulated in most jurisdictions. Riska must not be publicly sold as insurance, pension, or annuity without legal clearance.

### False death notices

Beneficiary reports are sensitive. The heartbeat and 12-month no-interaction window reduce accidental or malicious settlement risk, but production still needs notifications, monitoring, and legal processes.

### Solvency

Beneficiary payouts, protected principal, and yield strategies require reserve discipline. Principal must be segregated from treasury capital, and yield strategy losses need a predefined loss waterfall.

### User trust

The product asks users to think long term. The interface must be clear about what is guaranteed, what is conditional, and what depends on legal clearance.

### Yield risk

Using policy funds in lending or yield protocols introduces smart-contract risk, liquidity risk, bridge risk, oracle risk, governance risk, and counterparty risk.

## 12. Conclusion

Riska 30 narrows the original Riska vision into a product that is easier to explain, prototype, audit, and evaluate for grant funding.

The promise is direct: any verified human can open a policy, fund the minimum over time, add or withdraw extra principal, and choose when to activate programmed income. If they empty the policy while alive, they can fund the same policy again. Beneficiaries have a transparent death-notice path that depends on time and holder interaction rather than a hidden manual process.

The next milestone is a credible, verifiable demo: a working policy lifecycle, a clear user interface, a downloadable white paper, and a grant application grounded in measurable progress.

## References

1. World Foundation Grants, "Empowering builders turning real usage into lasting products", https://world.org/grants
2. World Developer Docs, "Grants Program", https://docs.world.org/world-chain/developers/grants
3. World Developer Docs, "World ID", https://docs.world.org/world-id
4. World Developer Docs, "Mini Apps", https://docs.world.org/mini-apps
