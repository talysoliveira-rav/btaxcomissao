import { headers } from "next/headers";

/** Endereço público do site (para montar links da vitrine). */
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const storePath = (slug: string) => `/loja/${slug}`;
export const productPath = (slug: string, id: string) => `/loja/${slug}/p/${id}`;
