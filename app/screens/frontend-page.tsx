"use client";
import { type PageDefinition } from "../site-map";
import { ProviderDirectory } from "./provider-catalog";
import { CasinoCategory } from "./casino-category";
import { CasinoLobby } from "./casino-lobby";
import {
  AffiliateScreen,
  CryptoScreen,
  ReferralScreen,
} from "./marketing-screen";
import { LoyaltyScreen } from "./loyalty-screen";
import { ContactScreen, FaqScreen, PolicyScreen } from "./support-screen";
import { AuthScreen } from "./auth-screen";
export function FrontendPage({
  definition,
  pageKey,
}: {
  definition: PageDefinition;
  pageKey: string;
}) {
  switch (definition.kind) {
    case "casino":
      return <CasinoLobby />;
    case "catalog":
      return <CasinoCategory key={pageKey} title={definition.title} category={["search", "all-games"].includes(pageKey) ? "" : pageKey} />;
    case "providers":
      return <ProviderDirectory />;
    case "loyalty":
      return <LoyaltyScreen />;
    case "affiliate":
      return <AffiliateScreen />;
    case "referral":
      return <ReferralScreen />;
    case "crypto":
      return <CryptoScreen />;
    case "contact":
      return <ContactScreen complaint={pageKey === "complaints"} />;
    case "faq":
      return <FaqScreen />;
    case "policy":
      return <PolicyScreen pageKey={pageKey} title={definition.title} />;
    case "auth":
      return <AuthScreen pageKey={pageKey} />;
    case "account":
      return null; // Account routes are authenticated on the server in app/account/.
  }
}
