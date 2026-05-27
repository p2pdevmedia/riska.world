"use client";

import Link from "next/link";

import { ContractsSection } from "@/components/ContractsSection";
import { useLanguage } from "@/components/LanguageProvider";

export function DocsContent() {
  const { t } = useLanguage();
  const docsPage = t.docsPage;

  return (
    <div className="pb-24">
      <section className="mx-auto w-full max-w-5xl px-5 py-14 text-center sm:text-left md:px-8">
        <p className="text-sm font-semibold text-emerald-700">
          {docsPage.hero.badge}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#18211d] sm:text-5xl">
          {docsPage.hero.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-[#516159] sm:text-lg">
          {docsPage.hero.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4 sm:justify-start">
          <a
            href="#contracts"
            className="border border-[#17231e] bg-[#17231e] px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#26342d] hover:text-white"
          >
            {docsPage.hero.primaryCta}
          </a>
          <Link
            href="/whitepaper"
            className="border border-[#cbd7cf] bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#26342d] transition hover:border-[#17231e] hover:text-[#18211d]"
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
