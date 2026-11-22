"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, MapPin, Plus, Search, X } from "lucide-react";
import { UFS, regionKey, summarizeRegions, ufName, type City, type Region } from "@/lib/regions";

const field =
  "w-full rounded-lg border border-stone-200 bg-white/90 px-3 py-2 text-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function RegionsPicker({ initial, name = "delivery_regions" }: { initial: Region[]; name?: string }) {
  const [regions, setRegions] = useState<Region[]>(initial);
  const firstUf = initial.find((r) => r.type !== "custom") as { uf: string } | undefined;
  const [uf, setUf] = useState(firstUf?.uf ?? "");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!uf) return;
    let alive = true;
    setLoading(true);
    setLoadError(false);
    fetch(`/api/localidades/${uf}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: City[]) => alive && setCities(data))
      .catch(() => alive && (setCities([]), setLoadError(true)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [uf]);

  const has = (r: Region) => regions.some((x) => regionKey(x) === regionKey(r));
  const add = (r: Region) => !has(r) && setRegions((list) => [...list, r]);
  const remove = (r: Region) => setRegions((list) => list.filter((x) => regionKey(x) !== regionKey(r)));
  const toggle = (r: Region) => (has(r) ? remove(r) : add(r));

  const stateRegion: Region | null = uf ? { type: "state", uf, label: `Todo o estado (${uf})` } : null;
  const results = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return [];
    return cities.filter((c) => norm(c.nome).includes(t)).slice(0, 8);
  }, [q, cities]);

  // Sugestão de região (divisão "região geográfica imediata" do IBGE) da última cidade marcada neste estado
  const lastCity = [...regions].reverse().find((r) => r.type === "city" && r.uf === uf) as Extract<Region, { type: "city" }> | undefined;
  const lastCityInfo = lastCity && cities.find((c) => c.id === lastCity.id);
  const areaSuggestion: Region | null =
    lastCityInfo?.ri && lastCityInfo.riNome
      ? { type: "area", uf, id: lastCityInfo.ri, label: `Região de ${lastCityInfo.riNome}`, cities: cities.filter((c) => c.ri === lastCityInfo.ri).length }
      : null;

  const addCustom = () => {
    const label = custom.trim();
    if (!label) return;
    add({ type: "custom", label });
    setCustom("");
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(regions)} />

      {regions.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Áreas selecionadas">
          {regions.map((r) => (
            <li key={regionKey(r)} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1 text-xs font-medium text-brand-800 ring-1 ring-brand-100">
              <MapPin className="h-3 w-3" aria-hidden />
              {r.type === "state" ? `Todo o ${ufName(r.uf)}` : r.label}
              {r.type === "city" && <span className="text-brand-700/60">· {r.uf}</span>}
              {r.type === "area" && <span className="text-brand-700/60">· {r.cities} cidades</span>}
              <button type="button" onClick={() => remove(r)} aria-label={`Remover ${r.label}`} className="grid h-5 w-5 place-items-center rounded-full hover:bg-brand-100">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-stone-500">Nenhuma área marcada ainda.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-[11rem_1fr]">
        <select value={uf} onChange={(e) => (setUf(e.target.value), setQ(""))} className={field} aria-label="Estado">
          <option value="">Escolha o estado…</option>
          {UFS.map((u) => (
            <option key={u.uf} value={u.uf}>{u.name}</option>
          ))}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={!uf || loadError}
            placeholder={!uf ? "Escolha o estado primeiro" : loading ? "Carregando cidades…" : "Buscar cidade…"}
            className={`${field} pl-9`}
            aria-label="Buscar cidade"
          />
          {loading && <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-400" aria-hidden />}
          {results.length > 0 && (
            <ul className="glass-strong absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-white p-1 shadow-lg">
              {results.map((c) => {
                const r: Region = { type: "city", uf, id: c.id, label: c.nome };
                const on = has(r);
                return (
                  <li key={c.id}>
                    <button type="button" onClick={() => toggle(r)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-brand-50">
                      <span className={`grid h-4 w-4 place-items-center rounded border ${on ? "border-brand-500 bg-brand-500 text-[#fff]" : "border-stone-300"}`}>
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      {c.nome}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {loadError && <p className="text-xs text-amber-700">Não foi possível carregar as cidades agora. Você pode digitar as áreas no campo abaixo.</p>}

      {uf && (
        <div className="flex flex-wrap gap-1.5">
          {stateRegion && (
            <button type="button" onClick={() => toggle(stateRegion)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${has(stateRegion) ? "accent-active" : "bg-white/80 text-stone-700 ring-1 ring-stone-200 hover:ring-brand-200"}`}>
              {has(stateRegion) ? "✓ " : "+ "}Todo o {ufName(uf)}
            </button>
          )}
          {areaSuggestion && (
            <button type="button" onClick={() => toggle(areaSuggestion)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${has(areaSuggestion) ? "accent-active" : "bg-white/80 text-stone-700 ring-1 ring-stone-200 hover:ring-brand-200"}`}>
              {has(areaSuggestion) ? "✓ " : "+ "}Toda a {areaSuggestion.label.replace(/^Região/, "região")} ({(areaSuggestion as { cities: number }).cities} cidades)
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Bairro, zona ou região (ex.: Zona Sul, Batel, Centro)"
          className={field}
          aria-label="Adicionar bairro, zona ou região"
        />
        <button type="button" onClick={addCustom} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white/80 px-3 text-sm font-medium text-stone-700 hover:bg-white">
          <Plus className="h-4 w-4" aria-hidden /> Adicionar
        </button>
      </div>

      {regions.length > 0 && (
        <p className="text-xs text-stone-500">
          Na vitrine: <span className="font-medium text-stone-700">{summarizeRegions(regions)}</span>
        </p>
      )}
    </div>
  );
}
