# Riska Agent Review Map

**Date:** May 26, 2026  
**Purpose:** Give AI agents, auditors, and reviewers a fast map of the current site, contracts, and review targets.

## 1. Repository Entry Points

Core project files:

- `README.md`: high-level project overview.
- `docs/riska-whitepaper-v2.md`: grant-oriented whitepaper source.
- `docs/productive-development-plan.md`: captured product decisions, calculations, risks, and roadmap.
- `contracts/RiskaThirtyYearPolicy.sol`: current Solidity MVP contract.
- `contracts/RiskaPolicyMath.sol`: production-aligned payout math for the 12-month waiting period, 80% pre-maturity beneficiary formula, 90% post-maturity beneficiary formula, and 100% maturity principal model.
- `contracts/RiskaPolicyManager.sol`: first production-directed policy manager using the math library with KYC/World ID eligibility stubs, one policy per holder, multiple beneficiaries, premium payment, maturity activation, retirement payouts, inactivity review, and verified-death settlement.
- `contracts/RiskaBeneficiaryRegistry.sol`: beneficiary storage module with share validation, duplicate protection, and manager-only writes.
- `contracts/RiskaDeathVerifier.sol`: death-report workflow with reporter submission, evidence hash, 90-day dispute window, Riska Team verification/rejection, and manager-only consumption.
- `contracts/RiskaPremiumVault.sol`: USDC custody module with principal liability accounting, protocol reserve tracking for retained formula balances, and manager-only premium/payout operations.
- `test/RiskaPolicyMath.test.js`: Hardhat tests for the base Riska 30 payout rules.
- `test/RiskaPolicyManager.test.js`: Hardhat tests for policy opening, beneficiary shares, eligibility, death reports, dispute windows, settlement, maturity, and payout cadence.
- `lib/contracts.ts`: contract metadata and documentation slugs used by the frontend.
- `lib/i18n.ts`: bilingual product, whitepaper, and contract copy.
- `components/MiniAppProvider.tsx`: World MiniKit provider wrapper for the Next.js app.
- `components/WalletAuth.tsx`: Mini App Wallet Auth entry point with browser-wallet fallback.
- `components/WorldIdGate.tsx`: IDKit proof-of-human gate for the one-policy-per-human flow.
- `app/api/minikit/nonce/route.ts`: backend nonce issuer for SIWE Wallet Auth.
- `app/api/minikit/complete-siwe/route.ts`: backend SIWE verification endpoint for MiniKit Wallet Auth.
- `app/api/world-id/rp-signature/route.ts`: server-side RP signature issuer for IDKit proof requests.
- `app/api/world-id/verify-policy-human/route.ts`: server-side World ID proof verification and nullifier reservation.
- `lib/world/idkit.ts`: client-safe IDKit constants and signal normalization.
- `lib/world/policy-human-registry.ts`: demo nullifier registry used to model one human per policy before database persistence.
- `lib/world/minikit-auth.ts`: shared MiniKit/Wallet Auth constants.
- `lib/world/wallet-session.ts`: signed `HttpOnly` Wallet Auth session helper used to bind World ID proofs to the authenticated wallet.
- `lib/web3/metamask.ts`: browser wallet fallback helper targeting World Chain.
- `prisma/schema.prisma`: placeholder database model.

Build command:

```bash
npm run build
```

Contract commands:

```bash
npm run contracts:compile
npm run contracts:test
```

Current build status on May 26, 2026: passes.
Current contract test status on May 26, 2026: passes.

## 2. Site Map

### `/`

File:

- `app/page.tsx`

Main sections:

- `components/RiskaEnrollmentHome.tsx`
- `components/WalletAuth.tsx`
- `components/WorldIdGate.tsx`
- `components/LanguageToggle.tsx`

Current purpose:

- Mobile-first Riska enrollment wizard and product entry point.
- Functional local demo flow for identity reservation, KYC file selection, beneficiary percentages, quote review, and terms/payment readiness.
- Mini App Wallet Auth entry point with backend SIWE verification.
- World ID / one-human-one-policy gate surfaced inside the enrollment flow.
- Product thesis and protocol contract links.

Review focus:

- Copy must match the current production model: 30 USDC/month, 12-month waiting period, 80% beneficiary payout before maturity, 100% holder payout at maturity, and 90% beneficiary payout after maturity or during retirement payout.
- MiniKit is installed globally, but production still needs `NEXT_PUBLIC_WORLD_APP_ID` from the World Developer Portal.
- Wallet Auth is verified server-side and now writes a signed `HttpOnly` wallet session for World ID binding; full account/session persistence is still pending.
- World ID uses IDKit proof-of-human requests, backend RP signatures, backend `/api/v4/verify/{rp_id}` verification, wallet-bound signal hash checks, and nullifier reservation for the one-policy-per-human flow.
- Production still needs persistent database storage for nullifiers; the current registry is an in-process demo model for the grant flow.
- KYC intake is UI-only right now; production still needs encrypted upload/storage, review tooling, retention policy, and audit logging.
- No real policy creation transaction yet.

### `/whitepaper`

Files:

- `app/whitepaper/page.tsx`
- `components/WhitepaperContent.tsx`
- `public/whitepapers/riska-whitepaper-v2.pdf`

Current purpose:

- Displays whitepaper content and downloadable PDF.

Review focus:

- Keep legal disclaimers aligned with actual product status.
- Update PDF whenever whitepaper source changes.

### `/docs`

Files:

- `app/docs/page.tsx`
- `components/DocsContent.tsx`

Current purpose:

- Documentation landing page.

Review focus:

- Should link to product plan, contract map, production deployment plan, yield strategy disclosures, and audit scope.

### `/contracts/[slug]`

Files:

- `app/contracts/[slug]/page.tsx`
- `components/ContractDetailContent.tsx`
- `lib/contracts.ts`

Current slugs:

- `/contracts/riska-thirty-year-policy`
- `/contracts/policy-manager`
- `/contracts/death-verifier`
- `/contracts/premium-vault`

Review focus:

- `riska-thirty-year-policy` includes local source.
- Other listed contracts have addresses but source is not included here.
- Verify every listed mainnet address before using in production or grant materials.
- Do not present pending or unverified modules as audited production contracts.

## 3. Current Contract Map

### `RiskaThirtyYearPolicy`

File:

- `contracts/RiskaThirtyYearPolicy.sol`

Current capabilities:

- Plan creation.
- Single-beneficiary policy opening.
- Premium collection.
- Premium allocation into retirement balance and fee balance.
- Grace period and lapsed status.
- Single verifier death settlement.
- Maturity activation.
- Programmed retirement payouts.
- Lapsed policy surrender.
- Fee withdrawal.
- Risk reserve funding.

Current critical limitations:

- Single owner address.
- Single claim verifier.
- No multisig or timelock.
- No upgradeability implementation yet.
- World ID gate exists in the app via IDKit, but the contract still relies on owner-set eligibility flags until the backend writes verified eligibility into the policy manager.
- No KYC gate.
- No multi-beneficiary percentages.
- No separate vault module.
- No external audit.
- No contract test framework in repo.
- Uses `360 * 30 days` as a 30-year term, not calendar years.
- Uses a minimal ERC20 interface instead of a hardened SafeERC20 wrapper.
- `refreshPolicyStatus` mutates state.
- Non-payment currently means lapse, not death; future death logic must not infer death from missed payments alone.
- Current contract does not implement the final 12-month waiting period, 80% beneficiary payout, 90% post-maturity beneficiary payout, or yield strategy accounting.

### `RiskaPolicyMath`

File:

- `contracts/RiskaPolicyMath.sol`

Current capabilities:

- Defines 30 USDC monthly premium using 6-decimal USDC accounting.
- Defines 12-month waiting period.
- Defines 360 contribution months and 120 payout months.
- Computes 10,800 USDC full-term principal.
- Computes 90 USDC monthly holder payout at maturity.
- Computes no beneficiary payout before 12 paid months.
- Computes 80% of paid premiums from month 12 until maturity.
- Computes 90% of matured or remaining balance after maturity.
- Validates beneficiary share percentages sum to 100%.

Review focus:

- Treat this as the source of truth for policy math until the full `RiskaPolicyManager` is implemented.
- Extend tests before changing any payout constant.
- Keep USDC decimal handling explicit.

### `RiskaPolicyManager`

File:

- `contracts/RiskaPolicyManager.sol`

Current capabilities:

- Uses `Ownable`, `Pausable`, and `ReentrancyGuard`; token movement is delegated to `RiskaPremiumVault`.
- Uses `RiskaPolicyMath` for the base product formula.
- Requires temporary owner-managed KYC and World ID eligibility flags before policy opening.
- Enforces one policy per holder.
- Writes beneficiary splits through `RiskaBeneficiaryRegistry`.
- Collects 30 USDC through `RiskaPremiumVault` at policy opening and lets the holder pay additional monthly periods.
- Marks the policy as matured at 360 paid months.
- Activates 120-month retirement payout at 90 USDC per claim.
- Enforces 30-day cadence between retirement payout claims after the first claim.
- Lets the owner flag inactivity review without settling death automatically.
- Consumes verified death reports from `RiskaDeathVerifier` before settlement.
- Coordinates 0 before 12 paid months, 80% before maturity after month 12, and 90% after maturity or during payout.

Current limitations:

- KYC and World ID are owner-set stubs, not real integrations.
- Governance is still a single owner, not multisig/timelock.
- Contract is not upgradeable yet.
- No yield strategy accounting yet.
- No legal terms registry yet beyond a `termsHash`.
- `RiskaDeathVerifier` still uses a single Riska verifier address, not multi-sig or multi-oracle quorum.
- Inactivity review is manual and does not preserve detailed reason metadata.
- There is no external human audit.

Review focus:

- Confirm total-principal liability accounting across death, maturity, and payout flows.
- Confirm beneficiary dust handling routes remainder safely to the final beneficiary.
- Confirm the manager remains aligned with `RiskaPolicyMath` before adding yield or upgrades.
- Expand tests before moving funds into external protocols.

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
- Decide whether duplicate beneficiaries should stay forbidden or be merged in the UI.
- Add beneficiary update delay and notification rules before production.

### `RiskaDeathVerifier`

File:

- `contracts/RiskaDeathVerifier.sol`

Current capabilities:

- Allows a reporter to submit a death report for a policy with an evidence hash.
- Opens a 90-day dispute window for every report.
- Allows anyone to dispute during the window with a dispute evidence hash.
- Allows the Riska verifier to verify after the dispute window closes.
- Allows the Riska verifier to reject a report.
- Allows rejected reports to be replaced by a new report.
- Allows only the configured policy manager to consume a verified report.
- Marks consumed reports as settled so they cannot be reused.

Review focus:

- Decide whether any wallet can report, or whether production needs allowlisted reporters.
- Decide how many disputes should be stored; current version emits dispute events but stores only the report.
- Replace the single verifier with multisig, timelock, or multi-oracle quorum before production funds.
- Decide whether 90 days should be a constant or configurable via governance.
- Add off-chain evidence retention and privacy process before KYC/death documents are accepted.

### `RiskaPremiumVault`

File:

- `contracts/RiskaPremiumVault.sol`

Current capabilities:

- Holds USDC separately from the policy manager.
- Allows only the configured policy manager to collect premiums and release payouts.
- Tracks `totalPrincipalLiability`.
- Tracks `protocolReserveBalance` when policy formulas retain part of contributed principal.
- Pays holders for retirement withdrawals.
- Pays beneficiaries by reading splits from `RiskaBeneficiaryRegistry`.

Review focus:

- `protocolReserveBalance` is accounted but intentionally not withdrawable yet.
- Add treasury/yield reserve rules before any withdrawal path.
- Add strategy caps and withdrawal paths before connecting yield protocols.
- Confirm liability accounting under every future module interaction.

Functions to review:

- `createPlan`
- `openPolicy`
- `payPremium`
- `activateRetirement`
- `claimRetirementPayout`
- `reportDeath`
- `surrenderLapsedPolicy`
- `refreshPolicyStatus`
- `fundRiskReserve`
- `withdrawFees`
- `availableRiskLiquidity`

Security review targets:

- Access control.
- Reentrancy.
- ERC20 transfer assumptions.
- Accounting invariants.
- Payout rounding.
- Time boundary conditions.
- Maturity and grace period edge cases.
- Death claim replay or double settlement.
- Admin key compromise.
- Upgrade storage safety.
- Beneficiary percentage rounding and dust.
- Policy status transitions.

## 4. Target Contract Architecture

Recommended production modules:

- `RiskaToken`: RISKA governance token.
- `RiskaPolicyManager`: policy lifecycle, policy ids, plan ids, and status coordination.
- `WorldIdGate`: one verified human per policy.
- `KycRegistry`: minimal KYC approval references.
- `BeneficiaryRegistry`: multiple beneficiaries and percentages.
- `PolicyTermsRegistry`: legal document hash and version registry.
- `DeathVerifier`: death reports, evidence hashes, dispute windows, and verifier roles.
- `PremiumVault`: USDC custody, protected principal liabilities, yield reserves, fees, and payout authorization.
- `YieldStrategyManager`: controlled deployment of funds into allowlisted yield protocols.
- `RiskController`: exposure caps, liquidity thresholds, health checks, and loss accounting.
- `GovernanceTimelock`: delayed upgrades and parameter changes.
- `EmergencyPause`: scoped pause controls.
- `PaymentAdapter`: WLD and fiat on-ramp conversion path into USDC.

## 5. Product Rules To Validate

Base model:

- Premium: 30 USDC per month.
- Term: 360 months.
- Total scheduled contribution: 10,800 USDC.
- Retirement payout duration: 120 months.
- Retirement payout if fully paid: 90 USDC per month.
- No beneficiary payout before 12 paid months.
- Beneficiary payout from month 12 to maturity: 80% of paid premiums.
- Beneficiary payout after maturity before retirement activation: 90% of matured balance.
- Beneficiary payout after retirement activation: 90% of remaining retirement balance.
- Inactivity review starts after 12 months without premium payment or without monthly payout claim, but death settlement still requires a death report and Riska Team verification.
- Multiple beneficiaries must sum to 100%.
- RISKA token supply is exactly 100,000, has 0 decimals, and is transferable from day 1.
- Governance starts centralized because the owner/foundation controls all RISKA tokens.
- KYC requires passport front page, passport second page, and FaceID/liveness match.
- Production target is World Chain mainnet.

Review questions:

- Are protocol fees funded only from yield/spread, external fees, treasury subsidy, or sponsors?
- Does the contract guarantee 100% return only if all 360 premiums were paid?
- Is the 80% beneficiary payout based only on paid principal, or paid principal plus some yield share?
- What happens if a holder overpays, underpays, pays late, or skips payments?
- What happens to dust from division across beneficiaries and monthly payouts?
- Can a beneficiary be a contract wallet?
- Can the holder be a smart account?
- Can KYC approval be revoked?
- Can a policy be migrated after an upgrade?
- What protocols can receive user funds for yield?
- What is the loss waterfall if a yield strategy suffers a loss?
- What is the emergency withdrawal path if a strategy becomes risky or illiquid?

## 6. Grant / Production Boundaries

For Spark Grant and the production Mini App:

- Build for World Chain mainnet production, while keeping a clearly labeled simulation/training mode.
- Use backend verification for World ID, wallet auth, payment, KYC, and any sensitive Mini App command result.
- Show policy quote, World ID verification, KYC, beneficiary setup, premium split, death verification, maturity, and payout.
- Capture metrics: verified starts, completed quotes, beneficiary setup completion, simulated policy opens, return dashboard visits, trust feedback.

For real-money launch:

- Requires legal clearance.
- Requires human external smart contract audit.
- Requires yield-strategy controls, liquidity controls, and operational controls.
- Requires incident response plan.
- Requires monitoring dashboard.

## 7. World Developer Portal Setup

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
- Action environment: production

Local environment values were written to `.env.local`, which is ignored by git.
The RP signing private key must remain server-only and must never be committed.

## 8. Suggested Agent Review Checklist

Agents reviewing this repo should produce findings with:

- Severity.
- File and line reference.
- Impact.
- Exploit or failure scenario.
- Suggested fix.
- Test that should fail before the fix and pass after the fix.

Priority areas:

- Smart contract accounting.
- Smart contract access control.
- Policy lifecycle edge cases.
- Death verification and dispute flow.
- Upgradeability and governance.
- Frontend status/copy accuracy.
- World ID and KYC integration plan.
- Privacy and data retention.
- Yield strategy accounting, caps, and failure modes.
