/* Miniaturas ilustrativas das telas do Florescer, usadas na landing page. */
import { ArrowRight, Bike, Clock, Hourglass, MapPin, ShoppingBasket, Sparkles, Store, TriangleAlert, Wallet } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Rose, Sunflower, Tulip } from "@/components/flowers";

const Frame = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`surface rounded-2xl border p-4 ${className}`}>{children}</div>
);

export function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <Rose className="pointer-events-none absolute -right-10 -top-12 h-56 w-56 text-brand-500/15" strokeWidth={1} />
      <Tulip className="pointer-events-none absolute -bottom-10 -left-12 h-48 w-48 text-brand-500/10" strokeWidth={1} />

      {/* painel */}
      <div className="glass-strong relative overflow-hidden rounded-3xl border border-white shadow-[0_30px_80px_-30px_rgb(157_23_77/0.45)]">
        <div className="flex items-center gap-2 border-b border-stone-200/60 px-4 py-3">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-semibold">Florescer</span>
          <span className="ml-auto flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-stone-200" /><span className="h-2.5 w-2.5 rounded-full bg-stone-200" /><span className="h-2.5 w-2.5 rounded-full bg-stone-200" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Frame className="col-span-2 !border-orange-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-700"><Hourglass className="h-4 w-4" /> Vencem hoje ou amanhã</div>
            <p className="mt-1 text-2xl font-semibold tracking-tight">R$ 159,80</p>
            <div className="mt-2 space-y-1.5">
              {[["Gérbera laranja", 8, "vence hoje"], ["Lírio branco", 20, "vence amanhã"]].map(([n, w, t]) => (
                <div key={n as string} className="flex items-center gap-2 text-xs">
                  <span className="w-28 truncate text-stone-700">{n}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-stone-200"><span className="block h-full rounded-full bg-orange-500" style={{ width: `${w}%` }} /></span>
                  <span className="w-20 text-right text-orange-700">{t}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-stone-500">Use em: <span className="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-700">Buquê alegria</span></p>
          </Frame>
          <Frame>
            <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">Perda (30 dias)</p>
            <p className="mt-0.5 text-xl font-semibold">6,8%</p>
            <p className="text-[11px] font-medium text-emerald-700">Abaixo da média do setor</p>
          </Frame>
          <Frame>
            <p className="text-[10px] font-medium uppercase tracking-wide text-stone-500">Cliques no WhatsApp</p>
            <p className="mt-0.5 text-xl font-semibold">128</p>
            <p className="text-[11px] text-stone-500">vindos da vitrine</p>
          </Frame>
        </div>
      </div>

      {/* celular */}
      <div className="absolute -bottom-10 -right-4 w-40 rotate-3 overflow-hidden rounded-[1.6rem] border-4 border-stone-900 bg-white shadow-2xl sm:-right-10 sm:w-48">
        <div className="h-16 bg-[image:var(--rose-gradient)]" />
        <div className="-mt-5 px-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white shadow"><LogoMark className="h-6 w-6" /></span>
          <p className="mt-1 text-[11px] font-semibold">Flores do Verão</p>
          <p className="flex items-center gap-1 text-[9px] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aberto agora</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 pb-3">
            {["from-pink-200 to-rose-300", "from-amber-100 to-yellow-300", "from-violet-100 to-violet-300", "from-lime-100 to-green-300"].map((g, i) => (
              <div key={g}>
                <div className={`aspect-[4/5] rounded-lg bg-gradient-to-br ${g}`} />
                <p className="mt-0.5 text-[8px] font-semibold text-brand-700">R$ {[189, 149, 129, 119][i]},90</p>
              </div>
            ))}
          </div>
          <div className="mb-3 rounded-lg bg-[image:var(--rose-gradient)] py-1.5 text-center text-[9px] font-semibold text-[#fff]">Pedir pelo WhatsApp</div>
        </div>
      </div>
    </div>
  );
}

export function PerishMock() {
  return (
    <Frame className="relative overflow-hidden">
      <Sunflower className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 text-brand-500/10" strokeWidth={1} />
      <p className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-brand-600" /> Taxa de perda</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">12,1%</p>
      <p className="text-sm font-medium text-amber-700">Na média do setor (10–20%)</p>
      <div className="relative mt-4">
        <div className="flex h-2 overflow-hidden rounded-full"><div className="w-1/3 bg-emerald-400" /><div className="w-1/3 bg-amber-300" /><div className="flex-1 bg-red-400" /></div>
        <div className="absolute -top-1 left-[40%] h-4 w-1 rounded-full bg-stone-900 ring-2 ring-white" />
      </div>
      <p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">Cada ponto percentual a menos de perda economiza cerca de <b>R$ 33,60</b> por mês.</p>
      <div className="mt-3 flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 text-orange-800"><TriangleAlert className="h-3.5 w-3.5" /> Girassol · 22 hastes vencem amanhã</span>
        <span className="rounded-full bg-[image:var(--rose-gradient)] px-2 py-0.5 font-semibold text-[#fff]">Criar oferta</span>
      </div>
    </Frame>
  );
}

export function ShoppingMock() {
  const rows = [
    ["Rosa vermelha", "60 hastes", "R$ 168,00"],
    ["Lisianthus branco", "10 hastes", "R$ 35,00"],
    ["Eucalipto", "2 maços", "R$ 18,00"],
  ];
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><Store className="h-4 w-4 text-brand-600" /> CEASA · 3 itens · R$ 221,00</p>
        <span className="rounded-lg bg-[#25D366] px-2.5 py-1 text-[11px] font-medium text-[#fff]">Enviar pedido</span>
      </div>
      <ul className="mt-3 divide-y divide-stone-200/60 text-sm">
        {rows.map(([n, q, c]) => (
          <li key={n} className="flex items-center justify-between py-2">
            <span>{n}</span>
            <span className="flex items-center gap-4"><b className="tabular-nums">{q}</b><span className="w-20 text-right tabular-nums text-stone-500">{c}</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"><ShoppingBasket className="h-3.5 w-3.5" /> Girassol dura 2 dias: compre de novo na quinta</p>
    </Frame>
  );
}

export function BoardMock() {
  const cols: [string, string, [string, string, boolean?][]][] = [
    ["Novo", "bg-sky-500", [["#41 Ana Souza", "Manhã · Moema"]]],
    ["Em produção", "bg-amber-500", [["#39 Hospital", "Atrasado · Tarde", true], ["#42 Carla", "15:30 · Retirada"]]],
    ["Em rota", "bg-violet-500", [["#40 Beatriz", "Pinheiros"]]],
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map(([title, dot, cards]) => (
        <div key={title} className="rounded-2xl border border-white/70 bg-white/45 p-2 backdrop-blur">
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${dot}`} />{title}</p>
          {cards.map(([n, info, late]) => (
            <div key={n} className={`mb-2 rounded-xl border bg-white/90 p-2 text-[11px] shadow-sm ${late ? "border-red-300" : "border-stone-200"}`}>
              <p className="font-medium">{n}</p>
              <p className={`mt-0.5 flex items-center gap-1 ${late ? "text-red-700" : "text-stone-500"}`}>{late ? <Clock className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}{info}</p>
              <p className="mt-1.5 flex items-center justify-center gap-1 rounded-md border border-stone-200 py-0.5 text-[10px] text-stone-600">Avançar <ArrowRight className="h-2.5 w-2.5" /></p>
            </div>
          ))}
        </div>
      ))}
      <p className="col-span-3 flex items-center gap-1.5 text-xs text-stone-500"><Bike className="h-3.5 w-3.5" /> Folha de rota impressa com endereços e cartões</p>
    </div>
  );
}

export function SelectionMock() {
  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-[2rem] border-[6px] border-stone-900 bg-[#faf8f6] shadow-2xl">
      <div className="px-4 pb-4 pt-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">Seleção especial</p>
        <p className="mt-1 text-base font-semibold leading-snug">Ana, separamos estas opções para você</p>
      </div>
      {[["1", "Buquê 12 rosas", "R$ 169,90", "from-pink-200 to-rose-300"], ["2", "Arranjo campestre", "R$ 149,90", "from-lime-100 to-green-300"]].map(([n, name, price, g]) => (
        <div key={n} className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
          <div className={`relative h-24 bg-gradient-to-br ${g}`}>
            <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[image:var(--rose-gradient)] text-xs font-bold text-[#fff]">{n}</span>
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-sm font-semibold text-brand-700">{price}</p>
            <p className="mt-2 rounded-xl bg-[image:var(--rose-gradient)] py-2 text-center text-xs font-semibold text-[#fff]">Quero a opção {n}</p>
          </div>
        </div>
      ))}
      <p className="flex items-center justify-center gap-1 pb-4 text-[10px] text-stone-500"><Sparkles className="h-3 w-3" /> Abre o WhatsApp com a escolha</p>
    </div>
  );
}
