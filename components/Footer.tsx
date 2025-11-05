"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  const note = useMemo(() => t.footer.note.replace("{year}", new Date().getFullYear().toString()), [t.footer.note]);

  return (
    <footer className="border-t border-white/5 bg-night-950/80 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>{note}</p>
        <div className="flex gap-4">
          <a href="https://worldchain.world" target="_blank" rel="noreferrer" className="transition hover:text-white">
            {t.footer.worldChain}
          </a>
          <a href="mailto:hey@riska.world" className="transition hover:text-white">
            {t.footer.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
