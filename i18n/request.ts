import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookie, resolveLocale } from "./locales";

export default getRequestConfig(async () => {
  const locale = resolveLocale((await cookies()).get(localeCookie)?.value);
  return {
    locale,
    timeZone: "UTC",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
