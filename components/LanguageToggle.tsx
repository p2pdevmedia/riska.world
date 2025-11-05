"use client";

import { useCallback } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const handleToggle = useCallback(() => {
    const nextLanguage: Language = language === "en" ? "es" : "en";
    setLanguage(nextLanguage);
  }, [language, setLanguage]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t.navbar.languageToggle.ariaLabel}
      className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-aurora-500 hover:text-white"
    >
      {t.navbar.languageToggle.label}
    </button>
  );
}
