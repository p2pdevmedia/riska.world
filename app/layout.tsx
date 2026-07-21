import type { Metadata } from "next";

import { LanguageProvider } from "@/components/LanguageProvider";
import { MiniAppProvider } from "@/components/MiniAppProvider";
import { EnvironmentProvider } from "@/components/NetworkEnvironment";
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
      <body className="min-h-screen bg-[#080b10] text-[#f5f7fb]">
        <MiniAppProvider>
          <EnvironmentProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </EnvironmentProvider>
        </MiniAppProvider>
      </body>
    </html>
  );
}
