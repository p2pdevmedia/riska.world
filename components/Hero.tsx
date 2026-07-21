"use client";

import Link from "next/link";
import { ArrowDownRight, Check, ShieldCheck } from "lucide-react";

import { WalletAuth } from "@/components/WalletAuth";
import { useLanguage } from "@/components/LanguageProvider";

export function Hero() {
  const { t } = useLanguage();
  const hero = t.hero;

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_13%_14%,rgba(88,104,234,0.2),transparent_28%),radial-gradient(circle_at_86%_26%,rgba(45,212,191,0.12),transparent_27%)]" />
      <div className="pointer-events-none absolute left-[10%] top-20 -z-10 h-64 w-64 rounded-full border border-[#5868ea]/15" />
      <div className="pointer-events-none absolute right-[6%] top-32 -z-10 h-96 w-96 rounded-full border border-aurora-500/10" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-14 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:pb-28 md:pt-24">
        <div className="max-w-2xl space-y-8">
          <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-[#aeb8ff]">
            <span className="relative grid h-8 w-8 place-items-center rounded-full border border-[#5868ea]/50 bg-[#5868ea]/10">
              <span className="absolute h-3 w-3 rounded-full border border-aurora-500" />
              <span className="h-1.5 w-1.5 rounded-full bg-aurora-500 shadow-glow" />
            </span>
            <span>{hero.brand}</span>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-medium tracking-wide text-aurora-500">{hero.badge}</p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-white md:text-7xl">
              {hero.title}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#b7c3d5] md:text-xl">{hero.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#c9d2df]">
            {hero.chips.map((chip) => (
              <span key={chip} className="flex items-center gap-2">
                <Check aria-hidden="true" className="h-4 w-4 text-aurora-500" strokeWidth={2.5} />
                {chip}
              </span>
            ))}
          </div>

          <Link
            className="group inline-flex items-center gap-2 text-sm font-semibold text-[#d9dfff] transition hover:text-white"
            href="#protection"
          >
            {hero.secondaryAction}
            <ArrowDownRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-lg md:mx-0">
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#5868ea]/20 via-transparent to-aurora-500/10 blur-2xl" />
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-medium text-[#9baac0]">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-aurora-500" />
            {hero.walletEyebrow}
          </div>
          <WalletAuth />
        </div>
      </div>

      <div id="protection" className="relative mx-auto grid max-w-6xl gap-px overflow-hidden border-y border-[#202936] bg-[#202936] sm:grid-cols-3">
        {hero.proofs.map((proof) => (
          <div key={proof.title} className="bg-[#0b0f16]/90 px-6 py-6 md:px-8">
            <p className="text-sm font-semibold text-white">{proof.title}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#9baac0]">{proof.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
