# Riska Agent Review Map

**Date:** May 27, 2026
**Purpose:** Give AI agents, auditors, and reviewers a fast map of the current site, contracts, and review targets.

## 1. Repository Entry Points

Core project files:

- `README.md`: high-level project overview.
- `docs/riska-whitepaper-v2.md`: grant-oriented whitepaper source.
- `docs/productive-development-plan.md`: captured product decisions, calculations, risks, and roadmap.
- `contracts/RiskaPolicyMath.sol`: source of truth for flexible policy constants and death-fee math.
- `contracts/RiskaPolicyManager.sol`: active policy lifecycle manager for flexible deposits, payout activation, holder claims, heartbeat, beneficiary death notice, and death claim.
- `contracts/RiskaBeneficiaryRegistry.sol`: beneficiary storage module with share validation, duplicate protection, and manager-only writes.
- `contracts/RiskaPremiumVault.sol`: USDC custody module with principal liability accounting, protocol reserve tracking, and manager-only payout operations.
- `contracts/RiskaDeathVerifier.sol`: legacy verifier/oracle experiment; no longer used by the main beneficiary claim flow.
- `contracts/RiskaThirtyYearPolicy.sol`: historical MVP contract retained for reference.
- `test/RiskaPolicyMath.test.js`: Hardhat tests for constants, monthly payout estimate, death payout math, and beneficiary share validation.
- `test/RiskaPolicyManager.test.js`: Hardhat tests for opening, deposits, payout activation, monthly claims, claim-all, death notice, heartbeat cancellation, and death settlement.
- `lib/web3/riska-testnet.ts`: browser wallet and viem helpers for testnet policy issuance and actions.
- `lib/contracts.ts`: contract metadata and documentation slugs used by the frontend.
- `lib/i18n.ts`: bilingual product, whitepaper, and contract copy.
- `components/RiskaEnrollmentHome.tsx`: main enrollment and testnet policy dashboard.
- `components/WalletAuth.tsx`: Mini App Wallet Auth entry point with browser-wallet fallback.
- `components/WorldIdGate.tsx`: IDKit proof-of-human gate for the one-policy-per-human flow.
- `app/api/world-id/verify-policy-human/route.ts`: server-side World ID proof verification and nullifier reservation.
- `lib/world/policy-human-registry.ts`: demo nullifier registry used before database persistence.

Build command:

```bash
npm run build
```

Contract commands:

```bash
npm run contracts:compile
npm run contracts:test
```

Current build status on May 27, 2026: passes.
Current contract test status on May 27, 2026: passes.

## 2. Site Map

### `/`

Files:

- `app/page.tsx`
- `components/RiskaEnrollmentHome.tsx`

Current purpose:

- Mobile-first Riska enrollment wizard and product entry point.
- Wallet Auth, World ID reservation, beneficiary setup, quote review, and terms/payment readiness.
- World Chain Sepolia issuance using the active `RiskaPolicyManager`.
- Testnet dashboard for minimum funded amount, extra principal, monthly payout estimate, heartbeat, payout activation, monthly claim, claim-all, beneficiary report, and beneficiary claim.

Review focus:

- Copy must match the current flexible model: any verified human can open, minimum is 10,800 USDC, extra principal is not fee-bearing, holder actions cancel death reports, and beneficiary payout waits 12 months after report.
- World ID uses app/backend verification; current persistence remains demo/in-process until a database is added.
- Testnet MockUSDC is not real USDC and has no production value.
- Real-money production still needs legal clearance, external audit, multisig/timelock, and monitoring.

### `/whitepaper`

Files:

- `app/whitepaper/page.tsx`
- `components/WhitepaperContent.tsx`
- `public/whitepapers/riska-whitepaper-v2.pdf`

Review focus:

- Keep the markdown source and PDF synchronized.
- Keep legal disclaimers aligned with actual product status.

### `/docs`

Files:

- `app/docs/page.tsx`
- `components/DocsContent.tsx`

Review focus:

- Should point reviewers toward the product plan, contract map, deployment plan, risk disclosures, and audit scope.

### `/contracts/[slug]`

Files:

- `app/contracts/[slug]/page.tsx`
- `components/ContractDetailContent.tsx`
- `lib/contracts.ts`

Review focus:

- Verify deployed testnet addresses after each redeploy.
- Do not present pending or unverified modules as audited production contracts.
- Mark `RiskaDeathVerifier` and `RiskaThirtyYearPolicy` as legacy/reference where they appear.

## 3. Current Contract Map

### `RiskaPolicyMath`

File:

- `contracts/RiskaPolicyMath.sol`

Current capabilities:

- Defines `MINIMUM_MONTHLY_UNIT = 30 USDC`.
- Defines `MINIMUM_POLICY_MONTHS = 360`.
- Defines `MINIMUM_POLICY_PRINCIPAL = 10,800 USDC`.
- Defines `PAYOUT_MONTHS = 120`.
- Defines death payout as 80% of remaining minimum principal plus 100% of remaining extra principal.
- Defines retained death fee as 20% of remaining minimum principal.
- Validates beneficiary share percentages sum to 100%.

Review focus:

- Keep USDC decimal handling explicit.
- Extend tests before changing any payout or fee constant.

### `RiskaPolicyManager`

File:

- `contracts/RiskaPolicyManager.sol`

Current capabilities:

- Opens one policy per holder after the app-level World ID and beneficiary steps are complete.
- Collects the first 30 USDC testnet unit at opening.
- Allows holder deposits before payout activation.
- Allocates deposits first to `remainingMinimumPrincipal`, then to `remainingExtraPrincipal`.
- Activates payout after the minimum is fully funded.
- Snapshots monthly payout as total principal divided by 120.
- Pays monthly claims with final dust on the last claim.
- Allows claim-all with no holder fee.
- Allows heartbeat without withdrawing funds.
- Allows holder beneficiary updates while active or in payout.
- Cancels pending death notices on holder actions.
- Allows configured beneficiaries to report death after the policy is at least `12 * 30 days` old.
- Allows death claim only after another `12 * 30 days` with no holder interaction.
- Settles death through `RiskaPremiumVault` without `RiskaDeathVerifier`.

Current limitations:

- World ID verification is enforced in the app/backend flow, not directly by this testnet contract.
- Governance is still a single owner for pause, not multisig/timelock.
- Contract is not upgradeable yet.
- No yield strategy accounting yet.
- No legal terms registry yet beyond `termsHash`.
- No external human audit.

Review focus:

- Confirm vault liability accounting across deposits, holder payouts, claim-all, and death settlement.
- Confirm no unauthorized beneficiary report or claim.
- Confirm every holder action cancels the pending death notice.
- Confirm death fee never touches extra principal.
- Confirm dust routing for monthly payouts and beneficiary splits.

### `RiskaBeneficiaryRegistry`

File:

- `contracts/RiskaBeneficiaryRegistry.sol`

Current capabilities:

- Stores beneficiary accounts and basis-point shares per policy.
- Allows only the configured policy manager to write beneficiary sets.
- Requires at least one beneficiary and at most eight beneficiaries.
- Requires shares to total 100%.
- Rejects zero-address and duplicate beneficiaries.

Review focus:

- Decide whether eight beneficiaries is the desired production cap.
- Decide whether beneficiary updates should have a delay before production.
- Decide whether beneficiaries should receive notifications off-chain.

### `RiskaPremiumVault`

File:

- `contracts/RiskaPremiumVault.sol`

Current capabilities:

- Holds USDC separately from the policy manager.
- Allows only the configured policy manager to collect deposits and release payouts.
- Tracks `totalPrincipalLiability`.
- Tracks `protocolReserveBalance` from retained death fees.
- Pays holders for monthly claims and claim-all.
- Pays beneficiaries by reading splits from `RiskaBeneficiaryRegistry`.

Review focus:

- `protocolReserveBalance` is accounted but intentionally not withdrawable yet.
- Add treasury/yield reserve rules before any withdrawal path.
- Add strategy caps and withdrawal paths before connecting yield protocols.
- Confirm liability accounting under every future module interaction.

### `RiskaDeathVerifier`

File:

- `contracts/RiskaDeathVerifier.sol`

Status:

- Legacy/reference only for the current flexible policy.
- Not passed into `RiskaPolicyManager`.
- Not required to settle beneficiary claims.

Review focus:

- Remove from production-critical docs and UI if no longer needed.
- Keep only if useful as a future optional evidence/review module.

## 4. Product Rules To Validate

Base model:

- Minimum policy principal: 10,800 USDC.
- Minimum unit: 30 USDC.
- Payout duration: 120 months.
- Deposits before payout activation only.
- Extra principal increases future monthly payout and is not fee-bearing.
- Holder monthly payout has no fee.
- Holder claim-all has no fee.
- Death report can only be made by a configured beneficiary.
- Death report is allowed only after policy age reaches `12 * 30 days`.
- Death claim requires another `12 * 30 days` with no holder interaction.
- Any holder action cancels a pending death report.
- Death fee is 20% of remaining minimum principal only.
- Multiple beneficiaries must sum to 100%.
- RISKA token supply is exactly 100,000, has 0 decimals, and is transferable from day 1.

Review questions:

- Should claim-all remain available immediately after minimum funding in every jurisdiction?
- Should future versions allow deposits after payout activation?
- Should beneficiary updates be delayed or notify old beneficiaries?
- What happens if a holder wants to migrate a policy after an upgrade?
- What protocols can receive user funds for yield?
- What is the loss waterfall if a yield strategy suffers a loss?

## 5. Grant / Production Boundaries

For Spark Grant and the production Mini App:

- Build for World Chain mainnet production, while keeping a clearly labeled simulation/training mode.
- Use backend verification for World ID, wallet auth, payment, and any sensitive Mini App command result.
- Show policy quote, World ID verification, beneficiary setup, deposit allocation, heartbeat, beneficiary death notice, and payout.
- Capture metrics: verified starts, completed quotes, beneficiary setup completion, testnet policy opens, return dashboard visits, and trust feedback.

For real-money launch:

- Requires legal clearance.
- Requires human external smart contract audit.
- Requires yield-strategy controls, liquidity controls, and operational controls.
- Requires incident response plan.
- Requires monitoring dashboard.

## 6. World Developer Portal Setup

Current portal objects created through the World Developer Portal MCP:

- Team: `Riska`
- Mini App: `RISKA`
- App ID: `app_0132d065b4ed3bd281fefe2c8ea09f02`
- App mode: `mini-app`
- Build: production
- World ID RP ID: `rp_06de503e374550e8`
- RP registration status: production `registered`, staging `registered`
- Signer address: `0x636f792e8c2DdE8DDFC09ff41E68e85a442e1109`
- World ID action: `riska-policy-human-v1`
- Action environments: production and staging

Local environment values were written to `.env.local`, which is ignored by git.
The RP signing private key must remain server-only and must never be committed.
