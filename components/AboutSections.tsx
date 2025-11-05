"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function AboutSections() {
  const { t } = useLanguage();

  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 pb-24">
      <div className="grid gap-10 md:grid-cols-3">
        {t.aboutSections.sections.map((item) => (
          <article key={item.title} className="glass-panel p-8 space-y-5">
            <header>
              <h3 className="text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300/80">{item.description}</p>
            </header>
            <ul className="space-y-3 text-sm text-slate-200/80">
              {item.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-aurora-500 shadow-glow" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
