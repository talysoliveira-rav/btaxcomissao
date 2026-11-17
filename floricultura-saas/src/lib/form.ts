/** Helpers para ler FormData em server actions. */
export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
};
export const reqStr = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (!v) throw new Error(`Campo obrigatório: ${k}`);
  return v;
};
/** Aceita "12,5" e "12.5". */
export const decimal = (fd: FormData, k: string, fallback = 0) => {
  const v = str(fd, k);
  if (v === null) return fallback;
  const n = Number(v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v);
  return Number.isFinite(n) ? n : fallback;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
