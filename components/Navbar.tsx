"use client";

import Link from "next/link";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar() {
  const { t } = useLanguage();
  const links = t.navbar.links;

  return (
    <header className="sticky top-0 z-40 bg-[#f4f4f8]/90 px-3 pt-3 backdrop-blur md:px-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-[#e2e2e8] bg-white/90 px-4 py-3 shadow-[0_8px_30px_rgba(30,30,45,0.05)] md:px-5">
        <Link href="/" className="text-base font-bold tracking-[-0.04em] text-[#202027]">
          {t.navbar.brand}
        </Link>
        <div className="hidden items-center gap-6 text-sm text-[#696975] md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#696975] hover:text-[#202027]">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle variant="light" />
          <Link href="/apply" className="rounded-full bg-[#202027] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4f63e8] hover:text-white">
            {t.navbar.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}
