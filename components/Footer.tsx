"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  const note = useMemo(() => t.footer.note.replace("{year}", new Date().getFullYear().toString()), [t.footer.note]);

  return (
    <footer className="bg-[#f4f4f8] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 border-t border-[#dedee5] px-5 pt-6 text-sm text-[#777782] md:flex-row md:items-center md:justify-between md:px-8">
        <p>{note}</p>
        <div className="flex gap-4">
          <a href="https://worldchain.world" target="_blank" rel="noreferrer" className="text-[#696975] transition hover:text-[#202027]">
            {t.footer.worldChain}
          </a>
          <a href="mailto:hey@riska.world" className="text-[#696975] transition hover:text-[#202027]">
            {t.footer.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
