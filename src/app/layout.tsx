import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Web3Provider } from "@/providers/web3-provider";
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
  title: "web3-ai — Pay-Per-Use AI Inference",
  description:
    "AI inference powered by micropayments. No subscriptions, no API keys. Connect your wallet and pay only for what you use.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Web3Provider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <Toaster
            position="bottom-right"
            theme="system"
            offset={16}
            gap={8}
            duration={6000}
            closeButton
          />
        </Web3Provider>
      </body>
    </html>
  );
}
