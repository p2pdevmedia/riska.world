"use client";

import { useLanguage } from "@/components/LanguageProvider";

export function TechStack() {
  const { t } = useLanguage();
  const techStack = t.techStack;

  return (
    <section id="stack" className="mx-auto max-w-6xl px-6 pb-24">
      <div className="glass-panel p-10">
        <h2 className="section-title text-center">{techStack.title}</h2>
        <p className="section-subtitle mt-4 text-center">{techStack.subtitle}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {techStack.stack.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-night-900/80 p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-300/80">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
