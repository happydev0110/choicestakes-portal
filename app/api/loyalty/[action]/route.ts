import { sessionCookies } from "../../../lib/auth-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  const fail = (status: number) =>
    Response.json({ success: false }, { status, headers });
  if (!["tiers", "me"].includes(action)) return fail(404);
  if (new URL(request.url).search) return fail(400);
  try {
    const cookie =
      action === "me"
        ? sessionCookies(request.headers.get("cookie") ?? "")
        : "";
    const base = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(
      /\/$/,
      "",
    );
    const upstream = await fetch(`${base}/api/v1/loyalty/${action}`, {
      headers: { accept: "application/json", ...(cookie ? { cookie } : {}) },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers,
    });
  } catch {
    return fail(503);
  }
}
