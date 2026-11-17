import { ProviderPlayPage } from "../components/provider-play-page";

export const dynamic = "force-dynamic";

export default function SportsPage() {
  const gameId = process.env.SPORTSBOOK_GAME_ID || "044708be-61d4-5516-91dc-b3829c296294";
  return <ProviderPlayPage gameId={gameId} playPath="/sports" />;
}
