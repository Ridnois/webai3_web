import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Web3Provider } from "@/providers/web3-provider";
import { WalletBonusProvider } from "@/providers/wallet-bonus-provider";
import { PresaleFloat } from "@/components/presale-float";
import "./globals.css";

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
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <Web3Provider>
            <WalletBonusProvider>
              <SiteHeader />
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
