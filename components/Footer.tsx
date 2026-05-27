"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/LanguageProvider";

export function Footer() {
  const { t } = useLanguage();
  const note = useMemo(() => t.footer.note.replace("{year}", new Date().getFullYear().toString()), [t.footer.note]);

  return (
    <footer className="border-t border-[#dce4d8] bg-[#f5f7f2] py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-[#647268] md:flex-row md:items-center md:justify-between md:px-8">
        <p>{note}</p>
        <div className="flex gap-4">
          <a href="https://worldchain.world" target="_blank" rel="noreferrer" className="text-[#56665d] transition hover:text-[#18211d]">
            {t.footer.worldChain}
          </a>
          <a href="mailto:hey@riska.world" className="text-[#56665d] transition hover:text-[#18211d]">
            {t.footer.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
