"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function ImpactMetrics() {
  const { t } = useLanguage();
  const metrics = t.impactMetrics;

  return (
    <section id="vision" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="glass-panel grid gap-8 p-10 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <h2 className="section-title">{metrics.title}</h2>
          <p className="section-subtitle">{metrics.subtitle}</p>
          <p className="text-sm text-slate-300/80">{metrics.body}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {metrics.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-night-900/70 p-6 text-center">
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
