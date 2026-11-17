// Dedicated streaming proxy: the JSON gaming proxy buffers responses and has a
// short request timeout, so it must not handle this long-lived connection.
export async function forwardWalletStream(request: Request, cookie: string, base: string, fetchUpstream: typeof fetch = fetch) {
  const fail = (status: number) => Response.json({ success: false, error: {
    message: status === 401 ? "Please log in to continue." : "Live balance updates are temporarily unavailable.",
  } }, { status, headers: { "Cache-Control": "no-store" } });
  if (!cookie) return fail(401);
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener("abort", abort, { once: true });
  if (request.signal.aborted) abort();
  // Only the connection handshake has a timeout. Heartbeats keep the stream alive.
  const timeout = setTimeout(abort, 12000);
  const cleanup = () => {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abort);
    abort();
  };
  try {
    const headers = new Headers({ Accept: "text/event-stream", Cookie: cookie });
    if (origin) headers.set("Origin", origin);
    const upstream = await fetchUpstream(`${base.replace(/\/$/, "")}/api/v1/gaming/wallet/events`, {
      headers, cache: "no-store", redirect: "error", signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.startsWith("text/event-stream")) {
      cleanup();
      void upstream.body?.cancel().catch(() => {});
      return fail([401, 403, 429].includes(upstream.status) ? upstream.status : 503);
    }
    const reader = upstream.body.getReader();
    const stream = new ReadableStream<Uint8Array>({
      async pull(output) {
        try {
          const next = await reader.read();
          if (next.done) { output.close(); cleanup(); }
          else output.enqueue(next.value);
        } catch (error) { output.error(error); cleanup(); }
      },
      async cancel() { cleanup(); await reader.cancel().catch(() => {}); },
    });
    return new Response(stream, { headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, no-transform",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
      Vary: "Cookie",
    } });
  } catch { cleanup(); return fail(503); }
}
