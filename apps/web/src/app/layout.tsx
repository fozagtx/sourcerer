import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Titan_One } from "next/font/google";
import { Toaster } from "sonner";
import "lenis/dist/lenis.css";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { SiteHeader } from "@/components/siteHeader";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500"],
});

const titanOne = Titan_One({
  subsets: ["latin"],
  variable: "--font-titan-one",
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Sourcerer - AI Memecoin Launcher",
  description: "AI-driven memecoin launcher on Solana and BNB Chain. Generate, launch, and trade memecoins in under 2 minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${titanOne.variable} min-h-screen bg-page font-sans font-normal text-ink antialiased`}
      >
        <AppProviders>
          <SiteHeader />
          <main className="mx-auto max-w-wrap px-4 pb-24 pt-6 sm:px-section-x">{children}</main>
          <Toaster theme="dark" position="bottom-right" richColors />
        </AppProviders>
      </body>
    </html>
  );
}
