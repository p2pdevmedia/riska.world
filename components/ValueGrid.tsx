"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function ValueGrid() {
  const { t } = useLanguage();
  const valueGrid = t.valueGrid;

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="mb-10 flex flex-col items-center text-center">
        <h2 className="section-title">{valueGrid.title}</h2>
        <p className="section-subtitle mt-4 max-w-2xl">{valueGrid.subtitle}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {valueGrid.values.map((value) => (
          <div key={value.title} className="glass-panel p-8">
            <h3 className="text-xl font-semibold text-white">{value.title}</h3>
            <p className="mt-3 text-sm text-slate-300/80">{value.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
