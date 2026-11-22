import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CalendarHeart, Check, ClipboardList, Columns3, Flower2, HandHeart, Hourglass, MessageCircle, Rocket,
  ShoppingBasket, Sparkles, Store, TrendingDown, Truck, Users,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Lily, Lotus, Orchid } from "@/components/flowers";
import { PLANS, SETUP_FEE, waLink } from "@/lib/plans";
import { BoardMock, HeroMock, PerishMock, SelectionMock, ShoppingMock } from "./landing-mocks";

export const metadata: Metadata = {
  title: { absolute: "Florescer — o sistema da sua floricultura" },
  description: "Pedidos, entregas, estoque com validade, lista de compras e vitrine online com pedido pelo WhatsApp. Menos flores no lixo, mais vendas.",
  openGraph: {
    title: "Florescer — menos flores no lixo, mais pedidos no WhatsApp",
    description: "O sistema feito para floriculturas: pedidos, entregas, estoque com validade, lista de compras e vitrine online.",
    type: "website",
  },
};

const WA_DEMO = waLink("Olá! Quero conhecer o Florescer para a minha floricultura.");
const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

function WhatsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.6-.1 1.1Z" />
    </svg>
  );
}

function CtaWhats({ children, href = WA_DEMO, className = "" }: { children: React.ReactNode; href?: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={`btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98] ${className}`}>
      <WhatsIcon /> {children}
    </a>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-stone-600">{text}</p>}
    </div>
  );
}

const PAINS = [
  { icon: TrendingDown, title: "Flores que vão para o lixo", text: "Muitas floriculturas perdem de 10% a 20% do que compram porque a flor murcha antes de virar venda." },
  { icon: MessageCircle, title: "Pedidos espalhados no WhatsApp", text: "Endereço numa conversa, cartão em outra, pagamento em outra. Um esquecimento vira cliente insatisfeito." },
  { icon: ShoppingBasket, title: "Comprar no escuro", text: "Sem saber o que já está vendido para amanhã, sobra flor num dia e falta no outro." },
  { icon: CalendarHeart, title: "Datas que pegam de surpresa", text: "Dia das Mães, Namorados, aniversários de clientes: venda que passa porque ninguém lembrou a tempo." },
];

const FEATURES = [
  {
    eyebrow: "Estoque e perdas",
    title: "Saiba o que vai vencer antes que vire prejuízo",
    text: "Cada compra vira um lote com validade. O Florescer mostra quanto dinheiro está em risco hoje, em quais arranjos usar primeiro e qual é a sua taxa de perda comparada ao setor.",
    bullets: ["Aviso de perecibilidade por lote", "Perda parcial e descarte em 1 toque", "Baixa automática pela ficha técnica de cada arranjo"],
    icon: Hourglass,
    mock: <PerishMock />,
  },
  {
    eyebrow: "Compras",
    title: "A lista de compras se monta sozinha",
    text: "Pedidos agendados, ritmo de vendas, estoque e validade de cada flor viram uma lista por fornecedor, arredondada no maço, pronta para mandar no WhatsApp.",
    bullets: ["Ajuste automático para datas comerciais", "Flores de vida curta: compra só o que aguenta", "Registro das entradas de uma vez só"],
    icon: ShoppingBasket,
    mock: <ShoppingMock />,
  },
  {
    eyebrow: "Pedidos e entregas",
    title: "Do pedido à entrega, sem papel e sem esquecer nada",
    text: "Cartão, destinatário, endereço salvo do cliente, pagamento e entregador no mesmo lugar. O quadro de produção mostra o que montar agora e o que está atrasado.",
    bullets: ["Quadro de produção arrasta e solta", "Agenda por turno e folha de rota impressa", "Aviso de entrega pronto para o WhatsApp"],
    icon: Columns3,
    mock: <BoardMock />,
  },
];

const STEPS = [
  { icon: MessageCircle, title: "Conversa rápida", text: "Entendemos como sua floricultura funciona hoje: canais, entregas, compras e principais dores." },
  { icon: Flower2, title: "Implantação", text: "Cadastramos seu catálogo com fotos, fichas técnicas, insumos e montamos sua vitrine online." },
  { icon: Rocket, title: "Mão na massa", text: "Treinamos sua equipe e acompanhamos as primeiras semanas até a rotina rodar sozinha." },
];

const FAQ = [
  ["Preciso instalar alguma coisa?", "Não. O Florescer funciona no navegador do computador e do celular. É só entrar com seu e-mail e senha."],
  ["Meus clientes precisam baixar aplicativo?", "Não. Eles recebem um link da sua vitrine ou de uma seleção, escolhem pelas fotos e o pedido chega no seu WhatsApp."],
  ["Funciona para mais de uma loja?", "Sim. No plano Premium você gerencia várias lojas na mesma conta, com estoques e pedidos separados."],
  ["Minha equipe pode usar?", "Sim. Cada pessoa tem o próprio acesso e você decide quem é administrador ou equipe."],
  ["Tem fidelidade?", "Não. A mensalidade é mês a mês. A implantação é paga uma única vez."],
  ["Meus dados ficam seguros?", "Sim. Cada floricultura só enxerga os próprios dados, e o acesso é protegido por senha individual para cada pessoa da equipe."],
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Topo */}
      <header className="glass-strong sticky top-0 z-40 border-b border-white/70">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-stone-900">
            <LogoMark className="h-8 w-8" /> Florescer
          </Link>
          <nav className="ml-6 hidden items-center gap-5 text-sm text-stone-600 md:flex">
            <a href="#funcionalidades" className="hover:text-brand-700">Funcionalidades</a>
            <a href="#vitrine" className="hover:text-brand-700">Vitrine</a>
            <a href="#planos" className="hover:text-brand-700">Planos</a>
            <a href="#duvidas" className="hover:text-brand-700">Dúvidas</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="hidden px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 sm:inline">Entrar</Link>
            <CtaWhats className="px-3.5 py-2 text-xs sm:text-sm">Falar no WhatsApp</CtaWhats>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Feito para floriculturas brasileiras
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                Menos flores no lixo.{" "}
                <span className="bg-[image:var(--rose-gradient)] bg-clip-text text-transparent">Mais pedidos no WhatsApp.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
                O Florescer organiza pedidos, entregas e estoque com validade, monta sua lista de compras e coloca seu catálogo numa vitrine online que manda o pedido direto para o seu WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CtaWhats className="px-6 py-3.5 text-base">Quero conhecer o Florescer</CtaWhats>
                <a href="#funcionalidades" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white/80 px-6 py-3.5 text-base font-medium text-stone-700 transition hover:bg-white">
                  Ver como funciona <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
                {["Sem instalar nada", "Implantação feita por nós", "Sem fidelidade"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-brand-600" aria-hidden /> {t}</li>
                ))}
              </ul>
            </div>
            <HeroMock />
          </div>
        </section>

        {/* Dores */}
        <section className="relative border-y border-white/70 bg-white/50 py-20 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="O dia a dia de quem vive de flores" title="Flor é bonita. A operação, nem tanto." />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PAINS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="surface rounded-2xl border p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-4 font-semibold text-stone-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="Funcionalidades" title="Tudo o que a floricultura precisa, num lugar só" text="Pensado para o balcão, para o ateliê e para quem compra na CEASA de madrugada." />
            <div className="mt-16 space-y-24">
              {FEATURES.map((f, i) => (
                <div key={f.title} className={`grid items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-brand-600"><f.icon className="h-4 w-4" aria-hidden /> {f.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">{f.title}</h3>
                    <p className="mt-3 leading-relaxed text-stone-600">{f.text}</p>
                    <ul className="mt-5 space-y-2">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm text-stone-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> {b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">{f.mock}</div>
                </div>
              ))}
            </div>

            {/* Outras funções */}
            <div className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Users, title: "Clientes e endereços", text: "Histórico de compras e endereços salvos para pedir de novo em segundos." },
                { icon: CalendarHeart, title: "Datas especiais", text: "Lista de quem lembrar esta semana, com mensagem pronta no WhatsApp." },
                { icon: Truck, title: "Entregadores", text: "Distribua as entregas do dia e acompanhe o que já saiu." },
                { icon: ClipboardList, title: "Relatórios", text: "Faturamento, canais de venda, produtos mais vendidos e perdas." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/80 bg-white/60 p-5 backdrop-blur">
                  <Icon className="h-5 w-5 text-brand-600" aria-hidden />
                  <h4 className="mt-3 font-semibold text-stone-900">{title}</h4>
                  <p className="mt-1 text-sm text-stone-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vitrine */}
        <section id="vitrine" className="relative scroll-mt-20 overflow-hidden py-24">
          <div className="absolute inset-0 -z-10 bg-[image:var(--rose-gradient)] opacity-[0.07]" />
          <Orchid className="pointer-events-none absolute -left-16 top-10 -z-10 h-72 w-72 text-brand-500/10" strokeWidth={1} />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-600"><Store className="h-4 w-4" aria-hidden /> Vitrine online</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Seu catálogo bonito, e o pedido continua no WhatsApp</h2>
              <p className="mt-4 leading-relaxed text-stone-600">
                Sua floricultura ganha uma página com capa, fotos, categorias e horário de funcionamento. O cliente escolhe e toca em “Pedir”: a conversa abre no seu WhatsApp com o produto já na mensagem.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  ["Seleções personalizadas", "“O que vocês têm até R$ 150?” Mande um link só com 3 opções."],
                  ["Ofertas do dia", "Flores perto da validade viram promoção na vitrine."],
                  ["Prévia com foto", "O link aparece no WhatsApp com foto, nome e preço."],
                  ["Desempenho", "Veja visitas, produtos mais vistos e cliques no WhatsApp."],
                ].map(([t, d]) => (
                  <div key={t} className="surface rounded-2xl border p-4">
                    <p className="text-sm font-semibold text-stone-900">{t}</p>
                    <p className="mt-1 text-sm text-stone-600">{d}</p>
                  </div>
                ))}
              </div>
            </div>
            <SelectionMock />
          </div>
        </section>

        {/* Como funciona */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="Como funciona" title="Você não começa do zero" text="A gente implanta com você. Em poucos dias, sua floricultura está rodando no Florescer." />
            <ol className="mt-14 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="surface relative rounded-3xl border p-6">
                  <span className="absolute right-5 top-4 text-5xl font-semibold text-brand-100">{i + 1}</span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--rose-gradient)] text-[#fff]"><Icon className="h-5 w-5" aria-hidden /></span>
                  <h3 className="mt-4 text-lg font-semibold text-stone-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Planos */}
        <section id="planos" className="relative scroll-mt-20 border-y border-white/70 bg-white/50 py-24 backdrop-blur">
          <Lotus className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 text-brand-500/10" strokeWidth={1} />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionTitle eyebrow="Planos" title="Escolha o momento da sua floricultura" text={`Mensalidade sem fidelidade. Implantação única de ${brl(SETUP_FEE)} (grátis no Premium).`} />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.key}
                  className={`relative flex flex-col rounded-3xl border p-7 ${p.highlight ? "border-transparent bg-white shadow-[0_30px_70px_-30px_rgb(190_24_93/0.55)] ring-2 ring-brand-400 lg:-mt-4 lg:pb-11" : "surface"}`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[image:var(--rose-gradient)] px-3 py-1 text-xs font-semibold text-[#fff] shadow">Mais escolhido</span>
                  )}
                  <h3 className="text-lg font-semibold text-stone-900">{p.name}</h3>
                  <p className="mt-1 text-sm text-stone-500">{p.tagline}</p>
                  <p className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-semibold tracking-tight text-stone-900">{brl(p.price)}</span>
                    <span className="pb-1 text-sm text-stone-500">/mês</span>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">{p.setupIncluded ? "Implantação inclusa" : `+ implantação de ${brl(SETUP_FEE)} (uma vez)`}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-stone-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> {f}</li>
                    ))}
                  </ul>
                  <a
                    href={waLink(`Olá! Tenho interesse no plano ${p.name} do Florescer.`)}
                    target="_blank"
                    rel="noopener"
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                      p.highlight ? "btn-primary" : "border border-stone-200 bg-white text-stone-800 hover:border-brand-200 hover:text-brand-700"
                    }`}
                  >
                    <WhatsIcon /> Quero o {p.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionTitle eyebrow="Dúvidas" title="Perguntas frequentes" />
            <div className="mt-10 space-y-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group surface rounded-2xl border px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-stone-900">
                    {q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-[image:var(--rose-gradient)] px-6 py-16 text-center text-[#fff] shadow-[0_30px_80px_-30px_rgb(190_24_93/0.7)] sm:px-12">
            <Lily className="pointer-events-none absolute -left-10 -top-10 h-64 w-64 text-white/15" strokeWidth={1} />
            <Lotus className="pointer-events-none absolute -bottom-16 -right-10 h-72 w-72 text-white/15" strokeWidth={1} />
            <HandHeart className="mx-auto h-10 w-10 opacity-90" aria-hidden />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Vamos fazer sua floricultura florescer?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">Conte como funciona sua loja hoje. A gente mostra o Florescer com o seu catálogo e monta a implantação com você.</p>
            <a href={WA_DEMO} target="_blank" rel="noopener" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-brand-700 shadow-lg transition hover:scale-[1.02]">
              <WhatsIcon className="h-5 w-5" /> Falar no WhatsApp
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-stone-500 sm:flex-row sm:px-6">
          <span className="flex items-center gap-2"><LogoMark className="h-6 w-6" /> <b className="font-semibold text-stone-700">Florescer</b> · © {new Date().getFullYear()}</span>
          <nav className="flex gap-5">
            <Link href="/login" className="hover:text-stone-800">Entrar</Link>
            <Link href="/signup" className="hover:text-stone-800">Criar conta</Link>
            <a href={WA_DEMO} target="_blank" rel="noopener" className="hover:text-stone-800">Contato</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
