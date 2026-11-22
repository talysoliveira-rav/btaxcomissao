import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Só aceita caminhos internos (evita redirecionar para outro site com "//site.com"). */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/app";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const target = next === "/redefinir-senha" ? "/esqueci-senha?erro=link" : "/login?erro=link";
      return NextResponse.redirect(`${origin}${target}`);
    }
  }
  return NextResponse.redirect(`${origin}${next}`);
}
