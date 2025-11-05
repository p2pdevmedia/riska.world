"use client";

import Link from "next/link";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar() {
  const { t } = useLanguage();
  const links = t.navbar.links;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold text-white">
          {t.navbar.brand}
        </Link>
        <div className="hidden gap-8 text-sm text-slate-300/80 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-white transition">
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <a
            href="#login"
            className="rounded-full border border-aurora-500/60 bg-aurora-600/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-aurora-500 transition hover:bg-aurora-500/20"
          >
            {t.navbar.cta}
          </a>
        </div>
      </nav>
    </header>
  );
}
