# Riska 30

Riska 30 is a flexible USDC policy account for World ID verified humans.

## Morpho USDC on World Chain

The legacy yield manager uses the ERC-4626 interface implemented by MetaMorpho vaults. Its production strategy onboarding is allowlisted, with a cap and an independent deposit pause per strategy.

## User-owned vaults and governance

The repository also includes the isolated-custody architecture for new accounts:

- `RiskaUserVaultFactory` is permissionless: a wallet calls `createVault()` and receives one deterministic, user-owned `RiskaUserVault`.
- Idle USDC remains in that individual vault. The owner may keep it static, or explicitly deposit it into an ERC-4626 vault such as a MetaMorpho USDC vault approved by governance.
- `RiskaProtocolConfig` is the parent contract shared by all user vaults. It contains the USDC token, the approved yield-vault allowlist, protocol yield fee, fee recipient, and the account-creation switch.
- `RiskaGovernanceToken` + `RiskaProtocolGovernor` govern every mutable config value on-chain. No deployer/admin wallet can directly add a yield vault or change fees after deployment.

For a real launch, distribute/delegate the governance token to its intended holders before proposals are made, and review the governor timing/quorum plus each ERC-4626 vault in a security audit. The factory path is intentionally separate from the legacy policy-manager path, allowing existing policies to continue operating without a custody migration.

After the Riska contracts have been deployed with Circle USDC on World Chain, configure an approved Morpho USDC vault with:

```bash
WORLDCHAIN_RPC_URL=... \
WORLDCHAIN_PRIVATE_KEY=... \
RISKA_YIELD_STRATEGY_MANAGER=0x... \
MORPHO_USDC_VAULT=0x... \
MORPHO_USDC_DEPOSIT_CAP=25000 \
MORPHO_USDC_METADATA_URI=https://... \
npm run contracts:configure:morpho-usdc:worldchain
```

The script refuses the wrong chain and rejects a vault unless its `asset()` is World Chain's official USDC (`0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`). Choose and review the vault address, curator, markets, liquidity, cap, and audit status before running it; the script does not treat a vault address as trusted merely because it is supplied in an environment variable.

Official Morpho production contracts on World Chain are recorded here for operational reference. Riska's ERC-4626 adapter deposits into an approved MetaMorpho vault, so it does not call Morpho Blue or its oracle/IRM contracts directly.

| Contract | Address |
| --- | --- |
| Morpho Blue | `0xE741BC7c34758b4caE05062794E8Ae24978AF432` |
| Adaptive Curve IRM | `0x34E99D604751a72cF8d0CFDf87069292d82De472` |
| Chainlink Oracle V2 Factory | `0xd706690BA1Fe26b70c4AD89e60ff62cEB3A2eD02` |
| MetaMorpho V1.1 Factory | `0x4DBB3a642a2146d5413750Cca3647086D9ba5F12` |
| Public Allocator | `0xef9889B4e443DEd35FA0Bd060f2104Cca94e6A43` |

Morpho does not list a World Chain Sepolia deployment in its official contract-address page. On World Chain Sepolia, use the included ERC-4626 mock vault and the official test USDC at `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88`; do not point testnet contracts at mainnet Morpho addresses.

> Any verified human can open a policy. The minimum policy is 10,800 USDC, payable over time or prepaid. Extra USDC deposits increase future monthly payout and are not fee-bearing. Once the USDC minimum is covered, the holder can store other ERC20 tokens in the policy with no Riska fee. Beneficiaries can claim only after a death report plus 12 months without holder interaction, and stored non-USDC ERC20 tokens pass 100% to beneficiaries.

The product combines an electronic policy document with a smart-contract lifecycle:

- One policy per verified human.
- Minimum policy principal: `30 USDC * 360 = 10,800 USDC`.
- Deposits fill the minimum first, then extra principal.
- Holder payout can start once the minimum is fully funded.
- Holder payout is `total remaining principal / 120` monthly payments, with final dust paid on the last claim.
- Holder can withdraw extra principal in parts with no fee.
- Holder can deposit and withdraw non-USDC ERC20 tokens after the USDC minimum is covered; these tokens do not count toward monthly payout, carry no protocol fee, and pass 100% to beneficiaries on death settlement.
- Holder can opt in to allowlisted World Chain yield strategies during the accumulation phase. Realized positive yield retains 10% for the Riska yield reserve and credits 90% back to the policy as extra principal; realized losses reduce extra principal first, then minimum principal.
- Holder can claim all remaining USDC principal early; Riska retains 20% only from the remaining minimum principal, extra principal has no fee, and the same policy can be funded and activated again.
- Holder `heartbeat` proves life and cancels pending beneficiary death reports.
- Beneficiary death claims also retain 20% only from remaining minimum principal; extra principal and auxiliary ERC20 tokens go 100% to beneficiaries.

## Product Flow

1. A verified holder opens a policy, sets beneficiaries, accepts the terms hash, and pays the first 30 USDC testnet unit.
2. The holder deposits any amount over time; deposits fill the 10,800 USDC minimum first.
3. Any amount above 10,800 USDC becomes extra principal and increases the future monthly payout estimate.
4. Once the minimum is fully funded, the holder can activate 120 monthly payouts.
5. After the USDC minimum is covered, the holder can deposit other ERC20 tokens as auxiliary token custody.
6. During accumulation, the holder can deploy policy principal into allowlisted yield strategies and must exit open yield positions before payout activation, claim-all, or extra withdrawal.
7. Realized yield gain sends 10% to the Riska yield reserve and 90% to policy extra principal; realized losses reduce extra principal first, then minimum principal.
8. The holder can withdraw extra principal or auxiliary tokens in parts, claim monthly, claim all USDC principal with the minimum-principal fee, or send a heartbeat without withdrawing.
9. If the holder withdraws the full living USDC balance, the policy resets to an active zero-balance state and can be funded again.
10. A configured beneficiary can report death only after the policy has existed for 12 months.
11. If the holder does not interact for 12 months after the report, any configured beneficiary can claim.
12. A claim-ready beneficiary can exit open yield positions before death settlement.
13. Death settlement pays 100% of stored non-USDC ERC20 tokens to beneficiaries with no protocol fee.
14. If the holder interacts with the contract, the pending death report is cancelled.

## Canonical Auxiliary Token Rule

Non-USDC ERC20 tokens are custody-only policy assets. They can be deposited only after the 10,800 USDC minimum is covered, can be withdrawn in parts by the living holder with no fee, never count toward USDC monthly payout, never enter the minimum-principal fee base, and are distributed 100% to beneficiaries by the configured beneficiary shares on death settlement.

## Current Smart Contracts

The current production-directed contract set lives in:

```text
contracts/RiskaPolicyManager.sol
contracts/RiskaPolicyMath.sol
contracts/RiskaBeneficiaryRegistry.sol
contracts/RiskaPremiumVault.sol
contracts/RiskaYieldStrategyManager.sol
contracts/RiskaERC4626YieldAdapter.sol
```

## White Paper

The white paper source lives at:

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

## Product And Review Docs

```text
docs/productive-development-plan.md
docs/agent-review-map.md
```

The frontend is a Next.js app with bilingual product copy in `lib/i18n.ts`.

## Web App

World App and World ID integration starts here:

```text
components/MiniAppProvider.tsx
components/WalletAuth.tsx
components/WorldIdGate.tsx
app/api/minikit/nonce/route.ts
app/api/minikit/complete-siwe/route.ts
app/api/world-id/rp-signature/route.ts
app/api/world-id/verify-policy-human/route.ts
```

For World App review, configure:

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

Run contract checks with:

```bash
npm run contracts:compile
npm run contracts:test
```

### World Chain Sepolia Test Deployment

World Chain Sepolia uses chain id `4801` and the public RPC URL
`https://worldchain-sepolia.g.alchemy.com/public`.

Create a local deployer wallet:

```bash
npm run wallet:create:worldchain-sepolia
```

Deploy after funding the wallet:

```bash
npm run contracts:deploy:worldchain-sepolia
```

The deploy script publishes the modular Riska policy contracts plus the
test-only `MockUSDC` payment token required by Sepolia flows. It wires the active
policy manager into the beneficiary registry and premium vault. Successful
deployments are saved under `deployments/worldchain-sepolia/`. Test wallets must
already hold MockUSDC before opening or funding a policy; the app never mints
test funds during the user flow.

## Stack

- Next.js and React for the web interface.
- Tailwind CSS for styling.
- World MiniKit for Mini App context and Wallet Auth.
- viem for World Chain/browser wallet connectivity.
- Prisma placeholder for future persistence.
- Solidity and Hardhat for the Riska policy lifecycle.
