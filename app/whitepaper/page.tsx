import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Riska Whitepaper — A Peer-to-Peer Insurance System",
  description:
    "Explore how riska.world delivers transparent, automated coverage with peer-to-peer capital pools, oracle verified events, and the RSK token economy."
};

export default function WhitepaperPage() {
  return (
    <div className="flex min-h-screen flex-col bg-night-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-4xl px-6 py-16">
          <header className="mb-12 space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-aurora-500/80">Riska Foundation</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Riska: A Peer-to-Peer Insurance System
            </h1>
            <p className="text-sm text-slate-400">November 2025</p>
          </header>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">Abstract</h2>
            <p className="leading-7 text-slate-300">
              We present a peer-to-peer insurance protocol where everyday risks—car accidents, home damage, electronics
              failure, travel disruptions—are covered by public rules and verifiable data instead of discretionary processes.
              Policies, premiums, and payouts are handled by transparent contracts; events are confirmed by independent
              reports. A native token (RSK) aligns incentives across users, liquidity providers, and data operators with a
              deflationary fee design, staking for oracle honesty, and on-chain governance. The goal is simple: make
              protection reliable, auditable, and globally accessible.
            </p>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p className="leading-7 text-slate-300">
              Insurance helps when it is easy to buy and reliable to settle. Legacy systems rely on opaque steps and
              discretionary approval. Riska removes those bottlenecks by expressing coverage as code and event truth as
              verifiable data feeds. Anyone can read the rules and audit settlements. This mirrors the ethos of electronic
              cash systems: replace institution-led discretion with transparent, predictable mechanics.
            </p>
            <h3 className="text-lg font-semibold text-white">Design Goals</h3>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>Open participation in capital and coverage.</li>
              <li>Deterministic execution of policy terms.</li>
              <li>Objective event verification.</li>
              <li>Clear incentives and governance.</li>
              <li>Minimal surface for abuse.</li>
            </ul>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">2. System Overview</h2>
            <p className="leading-7 text-slate-300">
              Participants interact through public risk pools. A pool holds capital and publishes what it covers and how
              payouts are computed. A policy specifies the insured sum <em>S</em> (amount paid on trigger), coverage window
              <em>T</em> (validity period), and trigger <em>θ</em> (a condition defined by data).
            </p>
            <p className="leading-7 text-slate-300">
              Examples include auto collision (police or telematics report), home flood (certified water-level data), electronics
              failure (service center logs), and travel delay (airline feeds).
            </p>
            <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
              <h3 className="mb-3 text-base font-semibold text-white">Everyday Intuition</h3>
              <p>
                A policy is like a ticket with a clear rule. If the condition happens, it pays. Everyone can see the rule and
                verify how it is enforced.
              </p>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">3. How It Works (User Lifecycle)</h2>
            <ol className="list-decimal space-y-3 pl-6 text-slate-300">
              <li>
                <span className="font-medium text-white">Select product.</span> Choose auto, home, electronics, or travel coverage with published terms.
              </li>
              <li>
                <span className="font-medium text-white">Pay premium.</span> The contract issues a timestamped policy for window <em>T</em>.
              </li>
              <li>
                <span className="font-medium text-white">Data monitoring.</span> Oracles watch for the trigger <em>θ</em>.
              </li>
              <li>
                <span className="font-medium text-white">Settlement.</span> If <em>θ</em> is confirmed within <em>T</em>, payout executes automatically.
              </li>
            </ol>
            <div className="space-y-3 rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
              <h3 className="text-base font-semibold text-white">Concrete Examples</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-white">Auto:</span> Alice buys collision coverage. If an official accident report is filed in <em>T</em>, the
                  oracle reports it and the policy pays a fixed amount.
                </li>
                <li>
                  <span className="font-medium text-white">Home:</span> A registered address is paid if certified flood data surpasses a threshold.
                </li>
                <li>
                  <span className="font-medium text-white">Electronics:</span> A device is paid if sensor or service logs confirm failure within <em>T</em>.
                </li>
                <li>
                  <span className="font-medium text-white">Travel:</span> A flight policy pays a flat sum when an airline feed confirms a 3h+ delay.
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">4. Capital and Solvency</h2>
            <p className="leading-7 text-slate-300">
              Pools must stay solvent even in bad months. Premiums should reflect expected payouts plus a buffer. The
              expected loss for a single policy equals the chance of a claim times the payout amount, <em>E[L<sub>i</sub>] = q<sub>i</sub>S<sub>i</sub></em>.
              Across <em>N</em> policies, <em>μ = Σ q<sub>i</sub>S<sub>i</sub></em>. Total premiums must cover this expectation over time.
            </p>
            <p className="leading-7 text-slate-300">
              Premiums include expected loss plus risk margin <em>ρ<sub>i</sub></em> and operating fees <em>κ<sub>i</sub></em>: <em>π<sub>i</sub> = q<sub>i</sub>S<sub>i</sub> + ρ<sub>i</sub> + κ<sub>i</sub></em>.
              Pools also maintain a solvency buffer so capital <em>P</em> meets <em>P ≥ μ + z<sub>1−α</sub>σ</em>, keeping insolvency probability below
              <em>α</em>.
            </p>
            <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
              <h3 className="mb-3 text-base font-semibold text-white">Illustrative Mini-Example</h3>
              <p>
                A home-flood product pays $2,000 with <em>q = 2%</em>. Expected payout per policy is $40. If fees and margin total $10,
                premium is $50. Selling 10,000 policies implies expected payouts of $400k; capital and buffers absorb rare spikes.
              </p>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">5. Event Verification</h2>
            <p className="leading-7 text-slate-300">
              Reliable data is essential in parametric insurance. Oracles submit signed reports with event type <em>e</em>, timestamp
              <em>t</em>, and evidence hash <em>h</em>. The contract waits a short window <em>Δ</em> for multiple reports; if a quorum agrees, the event is
              confirmed. Conflicts open a bounded dispute.
            </p>
            <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
              <h3 className="mb-3 text-base font-semibold text-white">Plain-Language View</h3>
              <p>
                Several independent observers describe the same event. When they agree, the claim is paid. When they disagree,
                the system pauses briefly and resolves it using published rules.
              </p>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">6. Claims and Disputes</h2>
            <p className="leading-7 text-slate-300">
              Once verified, payouts execute immediately. If oracles disagree, a dispute window allows re-reporting. Data
              providers that misreport risk losing posted bonds. All claim decisions are recorded on-chain for audit.
            </p>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">7. Economic Incentives and Capital Flow (RSK)</h2>
            <p className="leading-7 text-slate-300">
              The RSK token aligns incentives across liquidity providers, data operators, and users.
            </p>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>
                <span className="font-medium text-white">Liquidity providers:</span> Supply capital to pools and earn premiums while solvency rules and
                capacity limits protect their stake.
              </li>
              <li>
                <span className="font-medium text-white">Data operators:</span> Stake RSK as bond. Honest reporting earns fees; misconduct risks slashing.
              </li>
              <li>
                <span className="font-medium text-white">Users:</span> Pay posted premiums and receive automatic payouts when triggers occur.
              </li>
            </ul>
            <p className="leading-7 text-slate-300">
              A portion of protocol fees buys and retires RSK over time, linking usage to decreasing supply. If total fees in a
              period are <em>F</em> with fraction <em>β</em> earmarked for retirement, the retired amount is <em>Δ<sub>retire</sub> = βF / P</em>, with <em>P</em> the price of
              RSK at settlement. Circulating supply updates as <em>S<sub>t+1</sub> = S<sub>t</sub> − Δ<sub>retire</sub></em>.
            </p>
            <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-sm text-slate-200">
              <h3 className="mb-3 text-base font-semibold text-white">Worked Example</h3>
              <p>
                If a pool processes $1,000,000 of premiums with 1% protocol fee (<em>F = $10,000</em>) and <em>β = 0.5</em>, then $5,000 buys and
                retires RSK. With <em>P = $2</em>, about 2,500 RSK are retired that period.
              </p>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">8. Risk Calibration and Governance</h2>
            <p className="leading-7 text-slate-300">
              Pools publish capacity, utilization, and recent claims. Issuance halts when safe limits would be breached. Margin
              <em>M</em> and target <em>α</em> are set per product type, and correlated risks receive conservative adjustments to <em>ρ<sub>i</sub></em>.
            </p>
            <p className="leading-7 text-slate-300">
              Governance allows RSK holders to propose parameter changes—quorum, dispute windows, fee fractions—and upgrades
              with time delays so participants can react. All changes remain on-chain and auditable.
            </p>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">9. Security Model and Fraud Prevention</h2>
            <ul className="list-disc space-y-2 pl-6 text-slate-300">
              <li>
                <span className="font-medium text-white">Minimize trust:</span> Contracts are minimal and contain no privileged backdoors. Oracles are
                diverse and bonded to discourage misbehavior.
              </li>
              <li>
                <span className="font-medium text-white">Data minimization:</span> Only necessary policy and claim references live on-chain while evidence
                remains off-chain with cryptographic proofs.
              </li>
              <li>
                <span className="font-medium text-white">Auditability:</span> Every decision—accept, deny, dispute—is stored on-chain for public review.
              </li>
            </ul>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">10. Practical Applications</h2>
            <p className="leading-7 text-slate-300">
              The protocol supports coverage for cars, homes, electronics, travel, and logistics. Each product pays when
              predefined data sources confirm the qualifying event, enabling fast, transparent protection.
            </p>
            <p className="leading-7 text-slate-300">
              People choose Riska for simple rules, few steps, and fast results. Products disclose triggers and data sources up
              front so buyers know exactly what is covered.
            </p>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">11. FAQ</h2>
            <div className="space-y-5">
              <div>
                <p className="font-semibold text-white">How are prices set?</p>
                <p className="leading-7 text-slate-300">
                  By expected payouts plus margin and fees: <em>π = qS + ρ + κ</em>. Pools publish each component.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">What if data feeds fail?</p>
                <p className="leading-7 text-slate-300">
                  Multiple feeds and a dispute window reduce single-source risk. Operators stake RSK and can be slashed for
                  misconduct.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Can a pool run out of funds?</p>
                <p className="leading-7 text-slate-300">
                  Capacity and buffers are enforced by contracts. Issuance halts before unsafe exposure.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Where does RSK matter day-to-day?</p>
                <p className="leading-7 text-slate-300">
                  Staking for oracle honesty, governance voting, and deflationary retirement via protocol fees.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Is this legal insurance?</p>
                <p className="leading-7 text-slate-300">
                  Riska provides parametric protection: clear triggers, fixed payouts, and transparency. Local compliance varies
                  by jurisdiction and products can be configured accordingly.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12 space-y-6">
            <h2 className="text-xl font-semibold text-white">12. Conclusion</h2>
            <p className="leading-7 text-slate-300">
              Riska replaces friction and discretion with transparent rules and verifiable data. By combining capital pools,
              objective event proofs, and the RSK incentive model, the protocol aims to make everyday protection reliable,
              auditable, and open-access.
            </p>
          </section>

          <section className="mb-12 space-y-4">
            <h2 className="text-xl font-semibold text-white">References</h2>
            <ol className="list-decimal space-y-3 pl-6 text-slate-300">
              <li>S. Nakamoto. Bitcoin: A Peer-to-Peer Electronic Cash System. 2008. https://bitcoin.org/bitcoin.pdf</li>
              <li>A. Eling and W. Schnell. Parametric Insurance: The Next Generation of Insurance Products. 2016.</li>
              <li>OECD. Innovation in Peer-to-Peer Risk Pooling. 2023.</li>
              <li>B. Pournader et al. Blockchain and Risk Transfer Mechanisms. 2022.</li>
              <li>Chainlink Labs. Data Feeds and Oracle Architectures. 2021. https://chain.link</li>
            </ol>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
