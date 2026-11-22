import type { DeliveryPeriod, OrderStatus, PaymentStatus, PriceMode, StockMovementType } from "./types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const money = (v: number | string | null | undefined) => brl.format(Number(v ?? 0));

export const num = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(v ?? 0));

/** Data "YYYY-MM-DD" → "dd/mm/aaaa" sem problemas de fuso. */
export function dateBR(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

export function dateTimeBR(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

/** Hoje no fuso de São Paulo, "YYYY-MM-DD". */
export function todayISO(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

export function weekdayBR(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day, 12)).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "UTC" });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  em_rota: "Em rota",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  novo: "bg-sky-100 text-sky-800",
  confirmado: "bg-indigo-100 text-indigo-800",
  em_producao: "bg-amber-100 text-amber-800",
  pronto: "bg-lime-100 text-lime-800",
  em_rota: "bg-violet-100 text-violet-800",
  entregue: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-stone-200 text-stone-600",
};

export const STATUS_FLOW: OrderStatus[] = ["novo", "confirmado", "em_producao", "pronto", "em_rota", "entregue"];

export const PERIOD_LABEL: Record<DeliveryPeriod, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  horario: "Horário marcado",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pendente: "Pendente",
  pago: "Pago",
  estornado: "Estornado",
};

export const MOVEMENT_LABEL: Record<StockMovementType, string> = {
  entrada: "Entrada",
  saida: "Saída",
  perda: "Perda",
  ajuste: "Ajuste",
  consumo_pedido: "Consumo (pedido)",
  estorno_pedido: "Estorno (pedido)",
};

export const PAYMENT_METHODS = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Link de pagamento", "Faturado"];
export const CHANNELS = ["Balcão", "WhatsApp", "Instagram", "Telefone", "Site", "iFood/Marketplace"];

export function whatsappLink(phone: string | null | undefined, text?: string) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length <= 11) digits = "55" + digits;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatAddress(o: {
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
}) {
  const line = [o.address_street, o.address_number].filter(Boolean).join(", ");
  return [line, o.address_complement, o.address_neighborhood, o.address_city].filter(Boolean).join(" — ");
}

export const PRICE_MODE_LABEL: Record<PriceMode, string> = {
  exato: "Preço exato",
  a_partir_de: "A partir de",
  sob_consulta: "Sob consulta",
};

/** Texto do preço na vitrine. */
export function priceLabel(price: number | string, mode: PriceMode) {
  if (mode === "sob_consulta") return "Sob consulta";
  return mode === "a_partir_de" ? `a partir de ${money(price)}` : money(price);
}
