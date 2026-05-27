"use client";

import Link from "next/link";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar() {
  const { t } = useLanguage();
  const links = t.navbar.links;

  return (
    <header className="sticky top-0 z-40 border-b border-[#dce4d8] bg-[#f5f7f2]/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-emerald-800">
          {t.navbar.brand}
        </Link>
        <div className="hidden items-center gap-7 text-sm text-[#56665d] md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#56665d] hover:text-[#18211d]">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle variant="light" />
          <Link
            href="/#enroll"
            className="border border-[#17231e] bg-[#17231e] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white hover:bg-[#26342d] hover:text-white"
          >
            {t.navbar.cta}
          </Link>
        </div>
      </nav>
    </header>
  );
}
