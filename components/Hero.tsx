"use client";

import { WalletAuth } from "@/components/WalletAuth";
import { useLanguage } from "@/components/LanguageProvider";

export function Hero() {
  const { t } = useLanguage();
  const hero = t.hero;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.4),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-14 px-6 pb-24 pt-28 text-center md:flex-row md:text-left md:pt-32">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-200/80 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-aurora-500" />
            {hero.badge}
          </div>
          <h1 className="text-5xl font-semibold leading-tight md:text-6xl">{hero.title}</h1>
          <p className="max-w-xl text-lg text-slate-300/90">{hero.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300/80">
            {hero.chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/5 px-4 py-2">
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-1 justify-center md:justify-end">
          <WalletAuth />
        </div>
      </div>
    </section>
  );
}
