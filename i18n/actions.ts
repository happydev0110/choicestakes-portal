"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookie } from "./locales";

export async function setLanguage(locale: string) {
  if (!isLocale(locale)) throw new Error("Unsupported language");
  (await cookies()).set(localeCookie, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
}
