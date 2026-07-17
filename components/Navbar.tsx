"use client";

import Link from "next/link";
import { BookOpen, Home, LogOut, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { disconnectWallet } from "@/lib/web3/metamask";

const enrollmentStorageKey = "riska.enrollment.v2";

function hasActiveWalletSession() {
  try {
    const enrollment = window.localStorage.getItem(enrollmentStorageKey);
    const pendingSession = window.sessionStorage.getItem("riska.pending-wallet-session");
    const walletSession = enrollment ? JSON.parse(enrollment).walletSession : null;

    return Boolean(walletSession?.address || (pendingSession && JSON.parse(pendingSession).address));
  } catch {
    return false;
  }
}

export function Navbar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const rules = t.navbar.links.find((link) => link.href === "/rules");
  const contracts = t.navbar.links.find((link) => link.href === "/docs");
  const [hasWalletSession, setHasWalletSession] = useState(false);
  const items = [
    { href: "/", icon: Home, label: t.navbar.brand },
    { href: "/rules", icon: ShieldCheck, label: rules?.label ?? "Rules" },
    { href: "/docs", icon: BookOpen, label: contracts?.label ?? "Docs" }
  ];

  useEffect(() => {
    const syncSession = () => setHasWalletSession(hasActiveWalletSession());

    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener("riska-session-changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("riska-session-changed", syncSession);
    };
  }, []);

  async function logout() {
    try {
      await disconnectWallet();
    } finally {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.dispatchEvent(new Event("riska-session-changed"));
      window.location.assign("/");
    }
  }

  return (
    <header className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex max-w-lg items-center justify-between rounded-[24px] border border-[#303a49] bg-[#10151d]/95 px-2 py-2 shadow-[0_12px_40px_rgba(8,11,16,0.4)] backdrop-blur-xl">
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
        {hasWalletSession && (
          <button
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium text-[#9baac0] transition hover:bg-[#151d28] hover:text-[#f5f7fb]"
            onClick={() => void logout()}
            type="button"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
            <span className="truncate">{t.walletAuth.actions.disconnect}</span>
          </button>
        )}
        <div className="ml-1 border-l border-[#303a49] pl-1">
          <LanguageToggle variant="dark" />
        </div>
      </nav>
    </header>
  );
}
