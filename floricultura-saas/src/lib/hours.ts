/** Horário de funcionamento por dia da semana. Funciona no servidor e no navegador. */

export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type DayHours = { open: boolean; from: string; to: string };
export type BusinessHours = Record<DayKey, DayHours>;

export const DAYS: { key: DayKey; short: string; long: string }[] = [
  { key: "seg", short: "Seg", long: "segunda" },
  { key: "ter", short: "Ter", long: "terça" },
  { key: "qua", short: "Qua", long: "quarta" },
  { key: "qui", short: "Qui", long: "quinta" },
  { key: "sex", short: "Sex", long: "sexta" },
  { key: "sab", short: "Sáb", long: "sábado" },
  { key: "dom", short: "Dom", long: "domingo" },
];
// Date.getDay(): 0 = domingo
const BY_JS_DAY: DayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

const day = (open: boolean, from = "08:00", to = "18:00"): DayHours => ({ open, from, to });

export const PRESETS: { key: string; label: string; build: () => BusinessHours }[] = [
  {
    key: "seg-sex",
    label: "Seg a sex",
    build: () => ({ seg: day(true), ter: day(true), qua: day(true), qui: day(true), sex: day(true), sab: day(false), dom: day(false) }),
  },
  {
    key: "seg-sab",
    label: "Seg a sáb",
    build: () => ({ seg: day(true), ter: day(true), qua: day(true), qui: day(true), sex: day(true), sab: day(true, "08:00", "13:00"), dom: day(false) }),
  },
  {
    key: "todos",
    label: "Todos os dias",
    build: () => ({ seg: day(true), ter: day(true), qua: day(true), qui: day(true), sex: day(true), sab: day(true), dom: day(true, "08:00", "12:00") }),
  },
];

export const defaultHours = (): BusinessHours => PRESETS[1].build();

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Aceita só o formato esperado; qualquer coisa estranha vira null. */
export function parseHours(v: unknown): BusinessHours | null {
  if (!v || typeof v !== "object") return null;
  const out = {} as BusinessHours;
  for (const { key } of DAYS) {
    const d = (v as Record<string, unknown>)[key] as Partial<DayHours> | undefined;
    if (!d || typeof d !== "object") return null;
    const from = typeof d.from === "string" && TIME.test(d.from) ? d.from : "08:00";
    const to = typeof d.to === "string" && TIME.test(d.to) ? d.to : "18:00";
    out[key] = { open: d.open === true, from, to };
  }
  return out;
}

export function hoursError(h: BusinessHours): string | null {
  for (const { key, long } of DAYS) {
    const d = h[key];
    if (d.open && d.to <= d.from) return `Na ${long}, o horário de fechar precisa ser depois do de abrir.`;
  }
  return null;
}

/** "08:00" → "8h", "08:30" → "8h30" */
export function fmtTime(t: string) {
  const [h, m] = t.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
}

/** Resumo: "Seg a sex, 8h às 18h · Sáb, 8h às 13h · Dom, fechado" */
export function summarizeHours(h: BusinessHours): string {
  const groups: { from: number; to: number; label: string }[] = [];
  DAYS.forEach(({ key }, i) => {
    const d = h[key];
    const label = d.open ? `${fmtTime(d.from)} às ${fmtTime(d.to)}` : "fechado";
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.to === i - 1) last.to = i;
    else groups.push({ from: i, to: i, label });
  });
  if (groups.every((g) => g.label === "fechado")) return "Fechado";
  return groups
    .map((g) => {
      const days =
        g.from === g.to ? DAYS[g.from].short : g.to === g.from + 1 ? `${DAYS[g.from].short} e ${DAYS[g.to].short}` : `${DAYS[g.from].short} a ${DAYS[g.to].short}`;
      return `${days}, ${g.label}`;
    })
    .join(" · ");
}

/** Dia da semana e hora atuais no horário de Brasília. */
function nowInBrazil(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const jsDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { dayIndex: jsDay, time: `${get("hour")}:${get("minute")}` };
}

/** Situação agora: "Aberto agora · fecha às 18h" ou "Fechado · abre amanhã às 8h". */
export function openStatus(h: BusinessHours, now = new Date()): { open: boolean; text: string } | null {
  const { dayIndex, time } = nowInBrazil(now);
  const today = h[BY_JS_DAY[dayIndex]];
  if (today.open && time >= today.from && time < today.to) return { open: true, text: `Aberto agora · fecha às ${fmtTime(today.to)}` };
  for (let i = 0; i < 7; i++) {
    const d = h[BY_JS_DAY[(dayIndex + i) % 7]];
    if (!d.open || (i === 0 && time >= d.from)) continue;
    const when = i === 0 ? "hoje" : i === 1 ? "amanhã" : DAYS.find((x) => x.key === BY_JS_DAY[(dayIndex + i) % 7])!.long;
    return { open: false, text: `Fechado · abre ${when} às ${fmtTime(d.from)}` };
  }
  return null;
}
