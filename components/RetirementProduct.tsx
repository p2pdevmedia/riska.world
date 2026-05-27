"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function RetirementProduct() {
  const { t } = useLanguage();
  const product = t.retirementProduct;

  return (
    <section id="product" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-aurora-400">
            {product.badge}
          </p>
          <div className="space-y-4">
            <h2 className="section-title">{product.title}</h2>
            <p className="section-subtitle">{product.subtitle}</p>
          </div>
          <p className="rounded-lg border border-aurora-400/20 bg-aurora-400/10 p-5 text-sm leading-6 text-slate-200">
            {product.contractNote}
          </p>
        </div>

        <div className="grid gap-10">
          <div>
            <h3 className="text-xl font-semibold text-white">{product.timelineTitle}</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {product.timeline.map((step) => (
                <article key={step.label} className="rounded-lg border border-white/10 bg-night-900/80 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-aurora-400">
                    {step.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300/85">{step.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white">{product.economicsTitle}</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {product.economics.map((item) => (
                <article key={item.label} className="rounded-lg border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300/80">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
