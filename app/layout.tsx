import type { Metadata } from "next";

import { LanguageProvider } from "@/components/LanguageProvider";
import { MiniAppProvider } from "@/components/MiniAppProvider";
import { dictionaries } from "@/lib/i18n";
import "@/styles/globals.css";

const metadataDictionary = dictionaries.en.metadata;

export const metadata: Metadata = {
  title: metadataDictionary.title,
  description: metadataDictionary.description,
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4f4f8] text-[#202027]">
        <MiniAppProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </MiniAppProvider>
      </body>
    </html>
  );
}
