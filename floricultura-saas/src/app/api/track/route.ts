import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KINDS = new Set(["view_store", "view_product", "view_selection", "click_whatsapp"]);
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slurp|headless|lighthouse/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registra visitas e cliques da vitrine (chamado por sendBeacon). Nunca falha para o visitante. */
export async function POST(req: Request) {
  try {
    if (BOT.test(req.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });
    const body = JSON.parse(await req.text());
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 40) : "";
    const kind = String(body.kind ?? "");
    if (!slug || !KINDS.has(kind)) return new NextResponse(null, { status: 204 });
    const product = typeof body.product === "string" && UUID.test(body.product) ? body.product : null;
    const selection = typeof body.selection === "string" && /^[a-z0-9]{6,12}$/.test(body.selection) ? body.selection : null;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.rpc("track_event", { p_slug: slug, p_kind: kind, p_product: product, p_selection: selection });
  } catch {
    /* métrica nunca quebra a página */
  }
  return new NextResponse(null, { status: 204 });
}
