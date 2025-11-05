import type { Metadata } from "next";

import { LanguageProvider } from "@/components/LanguageProvider";
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
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
