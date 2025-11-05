"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function CallToAction() {
  const { t } = useLanguage();
  const cta = t.callToAction;

  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
      <div className="glass-panel space-y-6 px-10 py-12">
        <h2 className="section-title">{cta.title}</h2>
        <p className="section-subtitle">{cta.subtitle}</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <a
            href="#login"
            className="rounded-full bg-aurora-600 px-6 py-3 font-semibold text-white shadow-glow transition hover:bg-aurora-500"
          >
            {cta.primary}
          </a>
          <a
            href="mailto:partners@riska.world"
            className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white/80 transition hover:border-aurora-500 hover:text-white"
          >
            {cta.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}
