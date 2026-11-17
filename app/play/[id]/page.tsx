import { ProviderPlayPage } from "../../components/provider-play-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProviderPlayPage gameId={id} />;
}
