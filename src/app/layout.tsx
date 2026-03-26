import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Web3Provider } from "@/providers/web3-provider";
import { WalletBonusProvider } from "@/providers/wallet-bonus-provider";
import { PresaleFloat } from "@/components/presale-float";
import { FreeCreditFloatHome } from "@/components/sections/free-credit-float-home";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WEBAI3 — Pay-Per-Use AI Inference",
  description:
    "Wallet-authenticated AI inference with x402 micropayments and USDC settlement on Base. Pay per run, with on-chain receipts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <Web3Provider>
            <WalletBonusProvider>
              <SiteHeader />
              <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <FreeCreditFloatHome />
              </div>
              <main>{children}</main>
              <SiteFooter />
              <PresaleFloat />
              <Toaster
                position="bottom-right"
                theme="system"
                offset={16}
                gap={8}
                duration={6000}
                closeButton
              />
            </WalletBonusProvider>
          </Web3Provider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
