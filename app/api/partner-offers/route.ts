export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  };
  const page = new URL(request.url).searchParams.get("page") ?? "1";
  if (!/^[1-9]\d{0,4}$/.test(page) || Number(page) > 10000)
    return Response.json({ success: false }, { status: 400, headers });
  try {
    const base = (process.env.BACKEND_URL ?? "http://127.0.0.1:4000").replace(
      /\/$/,
      "",
    );
    const result = await fetch(`${base}/api/v1/partner-offers?page=${page}`, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    return new Response(await result.text(), {
      status: result.status,
      headers,
    });
  } catch {
    return Response.json({ success: false }, { status: 503, headers });
  }
}
