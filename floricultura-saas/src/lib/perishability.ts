/** Regras de perecibilidade: classificação dos lotes pelo tempo de vida que resta. */

export type Urgency = "vencido" | "critico" | "atencao" | "ok" | "sem_validade";

export const URGENCY: Record<Urgency, { label: string; hint: string; tone: string; bar: string; dot: string }> = {
  vencido: { label: "Vencidos", hint: "Já passaram da validade e ainda estão no estoque", tone: "text-red-700 bg-red-50 border-red-200", bar: "bg-red-500", dot: "bg-red-500" },
  critico: { label: "Vencem hoje ou amanhã", hint: "Use primeiro ou ofereça em promoção", tone: "text-orange-700 bg-orange-50 border-orange-200", bar: "bg-orange-500", dot: "bg-orange-500" },
  atencao: { label: "Vencem em 2 a 3 dias", hint: "Priorize nos arranjos desta semana", tone: "text-amber-700 bg-amber-50 border-amber-200", bar: "bg-amber-400", dot: "bg-amber-400" },
  ok: { label: "Frescos", hint: "Mais de 3 dias de vida", tone: "text-emerald-700 bg-emerald-50 border-emerald-200", bar: "bg-emerald-500", dot: "bg-emerald-500" },
  sem_validade: { label: "Sem validade", hint: "Defina a validade média do insumo para receber alertas", tone: "text-stone-600 bg-stone-50 border-stone-200", bar: "bg-stone-300", dot: "bg-stone-300" },
};

export const URGENCY_ORDER: Urgency[] = ["vencido", "critico", "atencao", "ok", "sem_validade"];

/** Faixas da taxa de perda (perdas ÷ compras). O setor costuma perder de 10% a 20%. */
export const LOSS_BENCHMARK = { good: 10, bad: 20 };

const DAY = 86_400_000;
const toUTC = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((toUTC(toISO) - toUTC(fromISO)) / DAY);
}

export function classify(expiresAt: string | null, today: string): { urgency: Urgency; daysLeft: number | null } {
  if (!expiresAt) return { urgency: "sem_validade", daysLeft: null };
  const d = daysBetween(today, expiresAt);
  if (d < 0) return { urgency: "vencido", daysLeft: d };
  if (d <= 1) return { urgency: "critico", daysLeft: d };
  if (d <= 3) return { urgency: "atencao", daysLeft: d };
  return { urgency: "ok", daysLeft: d };
}

/** Quanto da vida útil ainda resta (0–100%). */
export function freshnessPct(receivedAt: string, expiresAt: string | null, today: string) {
  if (!expiresAt) return null;
  const total = Math.max(1, daysBetween(receivedAt, expiresAt));
  const left = daysBetween(today, expiresAt);
  return Math.max(0, Math.min(100, Math.round((left / total) * 100)));
}

export function daysLeftLabel(d: number | null) {
  if (d === null) return "sem validade";
  if (d < -1) return `venceu há ${-d} dias`;
  if (d === -1) return "venceu ontem";
  if (d === 0) return "vence hoje";
  if (d === 1) return "vence amanhã";
  return `vence em ${d} dias`;
}

export function lossRateTone(rate: number | null) {
  if (rate === null) return { label: "Sem compras no período", cls: "text-stone-500" };
  if (rate < LOSS_BENCHMARK.good) return { label: "Abaixo da média do setor", cls: "text-emerald-700" };
  if (rate <= LOSS_BENCHMARK.bad) return { label: "Na média do setor (10–20%)", cls: "text-amber-700" };
  return { label: "Acima da média do setor", cls: "text-red-700" };
}
