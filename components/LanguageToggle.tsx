"use client";

import { useCallback } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/lib/i18n";

export function LanguageToggle({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { language, setLanguage, t } = useLanguage();

  const handleToggle = useCallback(() => {
    const nextLanguage: Language = language === "en" ? "es" : "en";
    setLanguage(nextLanguage);
  }, [language, setLanguage]);

  const className =
    variant === "light"
      ? "rounded-full border border-[#e2e2e8] bg-[#f7f7fa] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#555562] transition hover:border-[#aeb8ff] hover:text-[#4f63e8]"
      : "rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-aurora-500 hover:text-white";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={t.navbar.languageToggle.ariaLabel}
      className={className}
    >
      {t.navbar.languageToggle.label}
    </button>
  );
}
