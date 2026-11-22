/** Datas comerciais fortes para floriculturas. */

export type CommercialDate = { key: string; title: string; iso: string; daysUntil: number; boost: number };

const DAY = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** 2º domingo de maio */
export function mothersDay(year: number) {
  const first = new Date(Date.UTC(year, 4, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + 7;
}

// boost = quanto a procura costuma subir (ajuste sugerido na previsão de compras)
const FIXED = [
  { key: "mulher", title: "Dia Internacional da Mulher", m: 3, d: 8, boost: 1.5 },
  { key: "namorados", title: "Dia dos Namorados", m: 6, d: 12, boost: 2.5 },
  { key: "finados", title: "Finados", m: 11, d: 2, boost: 2 },
  { key: "natal", title: "Natal", m: 12, d: 25, boost: 1.5 },
];

export function commercialDates(todayISO: string): CommercialDate[] {
  const today = utc(todayISO);
  const year = Number(todayISO.slice(0, 4));
  const out: CommercialDate[] = [];
  for (const y of [year, year + 1]) {
    for (const f of FIXED) out.push({ key: f.key, title: f.title, iso: iso(Date.UTC(y, f.m - 1, f.d)), daysUntil: 0, boost: f.boost });
    out.push({ key: "maes", title: "Dia das Mães", iso: iso(Date.UTC(y, 4, mothersDay(y))), daysUntil: 0, boost: 3 });
  }
  return out
    .map((c) => ({ ...c, daysUntil: Math.round((utc(c.iso) - today) / DAY) }))
    .filter((c) => c.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .filter((c, i, list) => list.findIndex((x) => x.key === c.key) === i);
}
