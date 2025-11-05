import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Riska.world – On-Chain Insurance for Verified Humans",
  description:
    "Riska.world protege a humanos verificados con pólizas NFT, reclamos automatizados y pagos instantáneos sobre World Chain.",
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
    <html lang="es">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_55%)]">
        {children}
      </body>
    </html>
  );
}
