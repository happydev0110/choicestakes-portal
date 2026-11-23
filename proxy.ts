import { NextResponse, type NextRequest } from "next/server";
import { rejectMalformedRequest } from "./app/lib/request-guard";

export function proxy(request: NextRequest) {
  const rejection = rejectMalformedRequest({
    method: request.method,
    pathname: request.nextUrl.pathname,
    headers: request.headers,
  });
  if (rejection) {
    return new NextResponse(rejection.message, {
      status: rejection.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  return NextResponse.next();
}

// Include assets: the reported malformed requests target /_next/static/chunks/.
export const config = { matcher: "/:path*" };
