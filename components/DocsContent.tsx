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
        <p className="text-sm font-semibold text-[#aeb8ff]">
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
            className="rounded-lg border border-[#5868ea] bg-[#5868ea] px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#4f63e8] hover:text-white"
          >
            {docsPage.hero.primaryCta}
          </a>
          <Link
            href="/whitepaper"
            className="rounded-lg border border-[#334052] bg-[#151d28] px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#d8e0ee] transition hover:border-[#5868ea] hover:text-[#f5f7fb]"
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
