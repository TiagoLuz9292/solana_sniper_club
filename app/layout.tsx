import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Sniper Club — Live Trading Bot",
  description:
    "Watch an automated Bybit futures trading bot trade in real time. Live performance, equity curve, and full trade history.",
  openGraph: {
    title: "Solana Sniper Club — Live Trading Bot",
    description: "Automated trading bot — live demo account performance dashboard.",
    siteName: "Solana Sniper Club",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface antialiased">{children}</body>
    </html>
  );
}
