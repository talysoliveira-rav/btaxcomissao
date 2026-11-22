import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Vitrine pública: não precisa de sessão. Marca a rota para o layout usar sempre o tema claro.
  if (request.nextUrl.pathname.startsWith("/loja/") || request.nextUrl.pathname.startsWith("/s/")) {
    const headers = new Headers(request.headers);
    headers.set("x-storefront", "1");
    return NextResponse.next({ request: { headers } });
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
