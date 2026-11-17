import { sessionCookies } from "../../../../lib/auth-server";
import { forwardWalletStream } from "../../../../lib/wallet-stream-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return forwardWalletStream(request, sessionCookies(request.headers.get("cookie") ?? ""),
    process.env.BACKEND_URL ?? "http://127.0.0.1:4000");
}

// Do not allocate a persistent connection for probes or prefetch HEAD requests.
export function HEAD() { return new Response(null, { status: 405, headers: { Allow: "GET" } }); }
