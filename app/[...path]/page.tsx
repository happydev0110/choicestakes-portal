import { notFound } from "next/navigation";
import { pageDefinitions } from "../site-map";
import { FrontendPage } from "../screens/frontend-page";

type Props = { params: Promise<{ path: string[] }> };
// This route only serves the pages in site-map. Unknown paths must not create
// on-demand cache entries (including malformed requests for missing JS files).
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(pageDefinitions).filter((path) => pageDefinitions[path]?.kind !== 'account' && path !== 'casino').map((path) => ({
    path: path.split("/"),
  }));
}
export default async function Page({ params }: Props) {
  const { path } = await params;
  const key = path.join("/");
  if (!Object.hasOwn(pageDefinitions, key)) notFound();
  return (
    <FrontendPage key={key} pageKey={key} definition={pageDefinitions[key]} />
  );
}
