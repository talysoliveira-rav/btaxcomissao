import { Boxes, CalendarHeart, ClipboardList, Truck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";

const features = [
  { icon: ClipboardList, title: "Pedidos sem papel", text: "Registre pedidos do balcão, WhatsApp e Instagram com cartão de mensagem, destinatário e pagamento." },
  { icon: Truck, title: "Agenda de entregas", text: "Veja o dia por turno, atribua entregadores e imprima a folha de rota com endereços e cartões." },
  { icon: Boxes, title: "Estoque de flores", text: "Ficha técnica por arranjo dá baixa automática nos insumos. Controle validade dos lotes e perdas." },
  { icon: CalendarHeart, title: "Clientes e datas", text: "Guarde endereços e datas especiais de cada cliente e receba a lista de quem lembrar esta semana." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-stone-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo className="text-lg" />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900">Entrar</Link>
          <ButtonLink href="/signup">Criar conta grátis</ButtonLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 text-center md:py-24">
          <p className="mb-4 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Feito para floriculturas brasileiras</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 md:text-6xl">
            Sua floricultura organizada, do pedido à entrega.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">
            Pedidos, entregas, estoque de flores e clientes em um só lugar — pensado para o Dia das Mães, o Dia dos Namorados e todos os outros dias.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/signup" className="px-5 py-2.5 text-base">Começar agora</ButtonLink>
            <ButtonLink href="/login" variant="secondary" className="px-5 py-2.5 text-base">Já tenho conta</ButtonLink>
          </div>
        </section>
        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><f.icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="mt-3 font-semibold text-stone-900">{f.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">© {new Date().getFullYear()} Florescer</footer>
    </div>
  );
}
