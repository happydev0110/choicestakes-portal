import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import "./screens/screens.css";
import { SiteShell } from "./components/site-shell";
import { PlayerAuthProvider } from "./components/player-auth";
import { GameWalletProvider } from "./components/game-wallet";
import { ToastProvider } from "./components/toast-provider";
import { WalletModalProvider } from "./components/wallet-modal";
export const metadata: Metadata = {
  title: "choicestakes",
  description:
    "Choicestakes casino and sportsbook. Explore games from our connected providers.",
  robots: { index: false, follow: false },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale === "zh" ? "zh-Hans" : locale} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider>
        <ToastProvider><PlayerAuthProvider><GameWalletProvider><WalletModalProvider><SiteShell>{children}</SiteShell></WalletModalProvider></GameWalletProvider></PlayerAuthProvider></ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
