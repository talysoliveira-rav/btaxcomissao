"use client";
import { useState } from "react";
import { CopyCheck } from "lucide-react";
import { DAYS, PRESETS, defaultHours, fmtTime, hoursError, summarizeHours, type BusinessHours, type DayKey } from "@/lib/hours";

const timeInput =
  "rounded-lg border border-stone-200 bg-white/90 px-2 py-1.5 text-sm tabular-nums outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

// De 5h às 23h30, de meia em meia hora (igual em qualquer aparelho, sem AM/PM)
const TIMES = Array.from({ length: 38 }, (_, i) => {
  const m = 5 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${m % 60 === 0 ? "00" : "30"}`;
});

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const options = TIMES.includes(value) ? TIMES : [...TIMES, value].sort();
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={timeInput}>
      {options.map((t) => (
        <option key={t} value={t}>{fmtTime(t)}</option>
      ))}
    </select>
  );
}

export function HoursPicker({ initial, name = "business_hours" }: { initial: BusinessHours | null; name?: string }) {
  const [hours, setHours] = useState<BusinessHours>(initial ?? defaultHours());
  const [preset, setPreset] = useState<string | null>(null);
  const set = (k: DayKey, patch: Partial<BusinessHours[DayKey]>) => {
    setPreset(null);
    setHours((h) => ({ ...h, [k]: { ...h[k], ...patch } }));
  };
  const firstOpen = DAYS.find((d) => hours[d.key].open);
  const copyToAll = () => {
    if (!firstOpen) return;
    const { from, to } = hours[firstOpen.key];
    setHours((h) => Object.fromEntries(DAYS.map(({ key }) => [key, h[key].open ? { ...h[key], from, to } : h[key]])) as BusinessHours);
  };
  const error = hoursError(hours);

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(hours)} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setHours(p.build());
              setPreset(p.key);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              preset === p.key ? "accent-active" : "bg-white/80 text-stone-700 ring-1 ring-stone-200 hover:ring-brand-200"
            }`}
          >
            {p.label}
          </button>
        ))}
        {firstOpen && (
          <button type="button" onClick={copyToAll} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
            <CopyCheck className="h-3.5 w-3.5" aria-hidden /> Usar o horário de {firstOpen.short.toLowerCase()} em todos
          </button>
        )}
      </div>

      <ul className="divide-y divide-stone-200/60 rounded-xl border border-stone-200/70 bg-white/50">
        {DAYS.map(({ key, short, long }) => {
          const d = hours[key];
          return (
            <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
              <button
                type="button"
                role="switch"
                aria-checked={d.open}
                aria-label={`Aberto na ${long}`}
                onClick={() => set(key, { open: !d.open })}
                className="flex w-24 items-center gap-2 text-sm font-medium text-stone-800"
              >
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${d.open ? "bg-[image:var(--rose-gradient)]" : "bg-stone-300"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#fff] shadow transition-all ${d.open ? "left-[18px]" : "left-0.5"}`} />
                </span>
                {short}
              </button>
              {d.open ? (
                <span className="flex items-center gap-2 text-sm text-stone-500">
                  <TimeSelect label={`Abre na ${long}`} value={d.from} onChange={(v) => set(key, { from: v })} />
                  às
                  <TimeSelect label={`Fecha na ${long}`} value={d.to} onChange={(v) => set(key, { to: v })} />
                </span>
              ) : (
                <span className="text-sm text-stone-400">Fechado</span>
              )}
            </li>
          );
        })}
      </ul>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-stone-500">
          Na vitrine: <span className="font-medium text-stone-700">{summarizeHours(hours)}</span>
        </p>
      )}
    </div>
  );
}
