"use client";

import Link from "next/link";
import { BookOpen, Home, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const rules = t.navbar.links.find((link) => link.href === "/rules");
  const contracts = t.navbar.links.find((link) => link.href === "/docs");
  const items = [
    { href: "/", icon: Home, label: t.navbar.brand },
    { href: "/rules", icon: ShieldCheck, label: rules?.label ?? "Rules" },
    { href: "/docs", icon: BookOpen, label: contracts?.label ?? "Docs" }
  ];

  return (
    <header className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex max-w-md items-center justify-between rounded-[24px] border border-[#303a49] bg-[#10151d]/95 px-2 py-2 shadow-[0_12px_40px_rgba(8,11,16,0.4)] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = pathname === item.href;

          return (
            <Link
              aria-current={selected ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition ${
                selected
                    ? "bg-[#20295b] text-[#aeb8ff]"
                    : "text-[#9baac0] hover:bg-[#151d28] hover:text-[#f5f7fb]"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
        <div className="ml-1 border-l border-[#303a49] pl-1">
          <LanguageToggle variant="dark" />
        </div>
      </nav>
    </header>
  );
}
