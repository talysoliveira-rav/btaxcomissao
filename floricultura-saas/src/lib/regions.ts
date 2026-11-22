/** Área de entrega: estados, cidades, regiões (IBGE) e bairros/zonas livres. */

export type Region =
  | { type: "state"; uf: string; label: string }
  | { type: "city"; uf: string; id: number; label: string }
  | { type: "area"; uf: string; id: number; label: string; cities: number }
  | { type: "custom"; label: string };

export const UFS: { uf: string; name: string }[] = [
  ["AC", "Acre"], ["AL", "Alagoas"], ["AP", "Amapá"], ["AM", "Amazonas"], ["BA", "Bahia"], ["CE", "Ceará"],
  ["DF", "Distrito Federal"], ["ES", "Espírito Santo"], ["GO", "Goiás"], ["MA", "Maranhão"], ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"], ["MG", "Minas Gerais"], ["PA", "Pará"], ["PB", "Paraíba"], ["PR", "Paraná"],
  ["PE", "Pernambuco"], ["PI", "Piauí"], ["RJ", "Rio de Janeiro"], ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"], ["RO", "Rondônia"], ["RR", "Roraima"], ["SC", "Santa Catarina"], ["SP", "São Paulo"],
  ["SE", "Sergipe"], ["TO", "Tocantins"],
].map(([uf, name]) => ({ uf, name }));

export const ufName = (uf: string) => UFS.find((u) => u.uf === uf)?.name ?? uf;

/** Cidade como vem da nossa rota /api/localidades/[uf] (já enxuta). */
export type City = { id: number; nome: string; ri: number | null; riNome: string | null };

export const regionKey = (r: Region) => (r.type === "custom" ? `custom:${r.label.toLowerCase()}` : `${r.type}:${r.uf}:${"id" in r ? r.id : ""}`);

const list = (items: string[]) => (items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`);

/** Resumo para a vitrine: "Curitiba, Pinhais e São José dos Pinhais (PR) · Zona Sul" */
export function summarizeRegions(regions: Region[]): string {
  const parts: string[] = [];
  const ufs = [...new Set(regions.filter((r) => r.type !== "custom").map((r) => (r as { uf: string }).uf))];
  for (const uf of ufs) {
    const ofUf = regions.filter((r) => r.type !== "custom" && r.uf === uf);
    if (ofUf.some((r) => r.type === "state")) {
      parts.push(`Todo o estado de ${ufName(uf)}`);
      continue;
    }
    // regiões inteiras primeiro, depois as cidades avulsas
    const names = [...ofUf.filter((r) => r.type === "area"), ...ofUf.filter((r) => r.type === "city")].map((r) => r.label);
    const shown = names.length > 4 ? [...names.slice(0, 3), `mais ${names.length - 3} cidades`] : names;
    parts.push(`${list(shown)} (${uf})`);
  }
  const custom = regions.filter((r) => r.type === "custom").map((r) => r.label);
  if (custom.length) parts.push(list(custom));
  return parts.join(" · ");
}

/** Valida o que veio do formulário. */
export function parseRegions(v: unknown): Region[] {
  if (!Array.isArray(v)) return [];
  const out: Region[] = [];
  for (const r of v.slice(0, 120)) {
    if (!r || typeof r !== "object") continue;
    const label = typeof r.label === "string" ? r.label.trim().slice(0, 80) : "";
    if (!label) continue;
    const uf = typeof r.uf === "string" && UFS.some((u) => u.uf === r.uf) ? r.uf : null;
    const id = Number(r.id);
    if (r.type === "custom") out.push({ type: "custom", label });
    else if (r.type === "state" && uf) out.push({ type: "state", uf, label });
    else if (r.type === "city" && uf && Number.isInteger(id)) out.push({ type: "city", uf, id, label });
    else if (r.type === "area" && uf && Number.isInteger(id)) out.push({ type: "area", uf, id, label, cities: Math.max(0, Number(r.cities) || 0) });
  }
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(regionKey(r)) ? false : (seen.add(regionKey(r)), true)));
}

/** Converte a resposta do IBGE (municípios de um estado) para o formato enxuto. */
export function compactIbgeCities(data: unknown): City[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((m) => {
      const ri = m?.["regiao-imediata"];
      return {
        id: Number(m?.id),
        nome: String(m?.nome ?? ""),
        ri: ri && Number.isInteger(Number(ri.id)) ? Number(ri.id) : null,
        // o IBGE devolve alguns travessões quebrados ("Cornélio Procópio ¿ Bandeirantes")
        riNome: ri?.nome ? String(ri.nome).replace(/\s*¿\s*/g, " – ") : null,
      };
    })
    .filter((c) => Number.isInteger(c.id) && c.nome)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
