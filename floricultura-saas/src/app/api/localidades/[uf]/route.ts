import { NextResponse } from "next/server";
import { UFS, compactIbgeCities } from "@/lib/regions";

/** Cidades de um estado, vindas do IBGE, com cache de uma semana. */
export async function GET(_: Request, { params }: { params: Promise<{ uf: string }> }) {
  const { uf } = await params;
  const code = uf.toUpperCase();
  if (!UFS.some((u) => u.uf === code)) return NextResponse.json({ error: "UF inválida" }, { status: 400 });
  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${code}/municipios?orderBy=nome`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) throw new Error(String(res.status));
    const cities = compactIbgeCities(await res.json());
    return NextResponse.json(cities, { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar as cidades agora." }, { status: 502 });
  }
}
