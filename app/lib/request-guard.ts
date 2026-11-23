type RequestMetadata = {
  method: string;
  pathname: string;
  headers: Headers;
};

type Rejection = { status: number; message: string };

// Next.js 16 generates 42-character hexadecimal Server Action IDs. This is a
// syntax check, not authorization: Next still validates the action and origin.
const actionIdPattern = /^[a-f0-9]{42}$/i;

export function rejectMalformedRequest({ method, pathname, headers }: RequestMetadata): Rejection | null {
  let path: string;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return { status: 400, message: "Invalid request path." };
  }

  // Check the reserved static namespace too: excluding it from Proxy would let
  // malformed chunk URLs fall through to page rendering. Leave space for Next's
  // cache suffixes under the filesystem's per-filename byte limit.
  if (path.startsWith("/_next/static/") && path.split("/").some((segment) => new TextEncoder().encode(segment).length > 240)) {
    return { status: 414, message: "Request path is too long." };
  }

  // JSON player/gaming endpoints and the wallet event stream have their own
  // validation. Do not apply the page Server Action contract to API routes.
  if (path === "/api" || path.startsWith("/api/") || method !== "POST") return null;

  const actionId = headers.get("next-action");
  if (!actionId || !actionIdPattern.test(actionId)) {
    return { status: 400, message: "Invalid page action request." };
  }

  // The portal's only Server Action is setLanguage(string), called by a Client
  // Component. React sends these arguments as text/plain. There are no native
  // Server Action forms or file uploads to page URLs. Revisit this allowlist if
  // such forms are introduced; API uploads are unaffected.
  const contentType = headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "text/plain") {
    return { status: 415, message: "Unsupported page action content type." };
  }

  return null;
}
