import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { WhitepaperContent } from "@/components/WhitepaperContent";

import { dictionaries } from "@/lib/i18n";

export const metadata: Metadata = {
  title: dictionaries.en.whitepaper.metadata.title,
  description: dictionaries.en.whitepaper.metadata.description
};

export default function WhitepaperPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f2] text-[#18211d]">
      <Navbar />
      <main className="flex-1">
        <WhitepaperContent />
      </main>
      <Footer />
    </div>
  );
}
