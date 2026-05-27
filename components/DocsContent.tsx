"use client";

import Link from "next/link";

import { ContractsSection } from "@/components/ContractsSection";
import { useLanguage } from "@/components/LanguageProvider";

export function DocsContent() {
  const { t } = useLanguage();
  const docsPage = t.docsPage;

  return (
    <div className="pb-24">
      <section className="mx-auto w-full max-w-4xl px-6 py-16 text-center sm:text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-aurora-500/80">
          {docsPage.hero.badge}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {docsPage.hero.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
          {docsPage.hero.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 sm:justify-start">
          <a
            href="#contracts"
            className="rounded-full border border-aurora-500/60 bg-aurora-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-aurora-200 transition hover:bg-aurora-500/20"
          >
            {docsPage.hero.primaryCta}
          </a>
          <Link
            href="/whitepaper"
            className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-aurora-400/60 hover:text-white"
          >
            {docsPage.hero.secondaryCta}
          </Link>
        </div>
      </section>
      <div className="mt-4">
        <ContractsSection />
      </div>
    </div>
  );
}
