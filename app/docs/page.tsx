import type { Metadata } from "next";

import { DocsContent } from "@/components/DocsContent";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { dictionaries } from "@/lib/i18n";

export const metadata: Metadata = {
  title: dictionaries.en.docsPage.metadata.title,
  description: dictionaries.en.docsPage.metadata.description
};

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f2] text-[#18211d]">
      <Navbar />
      <main className="flex-1">
        <DocsContent />
      </main>
      <Footer />
    </div>
  );
}
