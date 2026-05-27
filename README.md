# Riska 30

Riska 30 is a long-duration life protection product designed around one rule:

> Pay 30 USDC per month for 30 years. If the holder completes the term, the holder receives 100% of scheduled principal through 10 years of programmed income. If verified death occurs after the waiting period, beneficiaries collect under the policy formula.

The product combines an electronic policy document with a smart-contract lifecycle:

- 30-year contribution term.
- Beneficiary protection before maturity.
- Programmed withdrawals after maturity.
- Principal accounting in USDC, with yield strategies funding protocol economics separately from the base policy promise.
- Verifiable policy state for active, grace, lapsed, matured, payout, and closed policies.

## Product Flow

1. A plan defines the 30 USDC monthly premium, waiting period, beneficiary payout formula, maturity payout duration, and policy terms hash.
2. A verified holder opens a policy, sets a beneficiary, and pays the first premium.
3. Scheduled premiums keep coverage active through the contribution term.
4. If verified death occurs before 12 paid months, beneficiaries receive no policy payout.
5. If verified death occurs from month 12 through maturity, beneficiaries receive 80% of paid premiums.
6. If the policy reaches maturity, the holder activates 100% principal return over 120 monthly payouts.
7. If verified death occurs after maturity or during payout, beneficiaries receive 90% of the matured or remaining balance.

## Smart Contract

The MVP Solidity contract lives at:

```text
contracts/RiskaThirtyYearPolicy.sol
```

The current contract is intentionally scoped and does not yet match the final production design. It implements an MVP lifecycle, stablecoin accounting, premium split, death settlement, maturity activation, programmed payouts, fee withdrawal, and lapsed-policy surrender.

It does not yet implement production-grade World ID proof persistence, upgrade governance, yield strategies, final payout formulas, or jurisdiction-specific legal compliance.

## White Paper

The grant-oriented white paper source lives at:

```text
docs/riska-whitepaper-v2.md
```

The downloadable website PDF lives at:

```text
public/whitepapers/riska-whitepaper-v2.pdf
```

Regenerate it with:

```bash
python3 scripts/build_whitepaper_pdf.py
```

## Productive Development Plan

The current product plan, base financial model, roadmap, and open questions live at:

```text
docs/productive-development-plan.md
```

The site and contract map for AI-agent review, security review, and future auditors lives at:

```text
docs/agent-review-map.md
```

## Web App

The frontend is a Next.js app with bilingual product copy in `lib/i18n.ts`.
Mini App connection starts with the official World MiniKit provider and Wallet
Auth verification endpoints:

```text
components/MiniAppProvider.tsx
app/api/minikit/nonce/route.ts
app/api/minikit/complete-siwe/route.ts
```

For World App review, configure the Developer Portal app id:

```bash
NEXT_PUBLIC_WORLD_APP_ID=app_your_world_app_id
NEXT_PUBLIC_WORLD_ID_POLICY_ACTION=riska-policy-human-v1
NEXT_PUBLIC_WORLD_ID_ENVIRONMENT=production
WORLD_ID_RP_ID=rp_your_relying_party_id
RP_SIGNING_KEY=0x_your_server_only_rp_signing_key
RISKA_SESSION_SECRET=long_random_server_only_secret
```

`RP_SIGNING_KEY` must never be exposed to the browser. The IDKit flow uses it
only inside `app/api/world-id/rp-signature/route.ts`. `RISKA_SESSION_SECRET`
signs the server-side Wallet Auth session that binds IDKit proofs to the
authenticated wallet.

```bash
npm run dev
npm run build
```

## Contract Development

The contract toolchain uses Hardhat. The first production-aligned module is the Riska 30 policy math library:

```text
contracts/RiskaPolicyMath.sol
```

The first manager contract using that math lives at:

```text
contracts/RiskaPolicyManager.sol
```

Supporting modules now separate beneficiary configuration and USDC custody:

```text
contracts/RiskaBeneficiaryRegistry.sol
contracts/RiskaDeathVerifier.sol
contracts/RiskaPremiumVault.sol
```

Run contract checks with:

```bash
npm run contracts:compile
npm run contracts:test
```

### World Chain Sepolia test deployment

World Chain Sepolia uses chain id `4801` and the public RPC URL
`https://worldchain-sepolia.g.alchemy.com/public`.

Create a local deployer wallet:

```bash
npm run wallet:create:worldchain-sepolia
```

This writes the deployer private key to `.env.worldchain-sepolia.local`, which is
git-ignored. Fund the printed address with World Chain Sepolia ETH from:

```text
https://www.alchemy.com/faucets/world-chain-sepolia
```

Deploy the test contract set after funding the wallet:

```bash
npm run contracts:deploy:worldchain-sepolia
```

The deploy script publishes `MockUSDC`, the modular Riska policy contracts, and
the legacy `RiskaThirtyYearPolicy`, then wires the policy manager into the
registry, verifier, and vault. Successful deployments are saved under
`deployments/worldchain-sepolia/`.

## Stack

- Next.js and React for the web interface.
- Tailwind CSS for styling.
- World MiniKit for Mini App context and Wallet Auth.
- viem for World Chain/browser wallet connectivity.
- Prisma placeholder for future persistence.
- Solidity and Hardhat for the Riska 30 policy lifecycle.
