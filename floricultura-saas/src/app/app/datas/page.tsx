import Link from "next/link";
import { getOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink, Card, Empty, PageHeader, Table } from "@/components/ui";
import { dateBR, weekdayBR, whatsappLink } from "@/lib/format";
import type { UpcomingDate } from "@/lib/types";

export const metadata = { title: "Datas especiais" };

const COMMERCIAL = [
  { m: 3, d: 8, t: "Dia Internacional da Mulher" },
  { m: 6, d: 12, t: "Dia dos Namorados" },
  { m: 11, d: 2, t: "Finados" },
  { m: 12, d: 25, t: "Natal" },
];

function mothersDay(year: number) {
  // 2º domingo de maio
  const first = new Date(Date.UTC(year, 4, 1)).getUTCDay();
  return 1 + ((7 - first) % 7) + 7;
}

export default async function DatesPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const sp = await searchParams;
  const days = [7, 30, 60, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const { org } = await getOrgContext();
  const supabase = await createClient();
  const { data } = await supabase.rpc("upcoming_special_dates", { p_org: org.id, p_days: days });
  const dates = (data ?? []) as UpcomingDate[];

  const now = new Date();
  const year = now.getFullYear();
  const commercial = [...COMMERCIAL, { m: 5, d: mothersDay(year), t: "Dia das Mães" }]
    .map((c) => {
      let date = new Date(Date.UTC(year, c.m - 1, c.d));
      if (date.getTime() < Date.UTC(year, now.getMonth(), now.getDate())) date = new Date(Date.UTC(year + 1, c.m - 1, c.m === 5 ? mothersDay(year + 1) : c.d));
      return { ...c, iso: date.toISOString().slice(0, 10), diff: Math.round((date.getTime() - Date.UTC(year, now.getMonth(), now.getDate())) / 86400000) };
    })
    .sort((a, b) => a.diff - b.diff);

  return (
    <>
      <PageHeader
        title="Datas especiais"
        subtitle="Aniversários e datas dos seus clientes — oportunidade de venda e de encantar."
        actions={[7, 30, 60, 90].map((d) => (
          <ButtonLink key={d} variant={d === days ? "primary" : "secondary"} href={`?dias=${d}`}>{d} dias</ButtonLink>
        ))}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title={`Próximos ${days} dias (${dates.length})`}>
          {dates.length === 0 ? <Empty>Nenhuma data neste período. Cadastre datas na ficha de cada cliente.</Empty> : (
            <Table>
              <thead><tr><th>Quando</th><th>Data</th><th>Cliente</th><th /></tr></thead>
              <tbody>
                {dates.map((d) => {
                  const wa = whatsappLink(d.customer_phone, `Olá, ${d.customer_name.split(" ")[0]}! Aqui é da ${org.name}. Vimos que ${dateBR(d.next_date).slice(0, 5)} é ${d.title}. Quer garantir flores para esse dia? 💐`);
                  return (
                    <tr key={d.id}>
                      <td className="whitespace-nowrap">
                        <b>{dateBR(d.next_date).slice(0, 5)}</b> <span className="capitalize text-stone-500">{weekdayBR(d.next_date).split("-")[0]}</span>
                        <span className={`block text-xs ${d.days_until <= 3 ? "font-medium text-brand-700" : "text-stone-500"}`}>{d.days_until === 0 ? "hoje!" : `em ${d.days_until} dia(s)`}</span>
                      </td>
                      <td>{d.title}{d.person_name && <span className="block text-xs text-stone-500">{d.person_name}</span>}</td>
                      <td><Link href={`/app/clientes/${d.customer_id}`} className="hover:text-brand-700">{d.customer_name}</Link></td>
                      <td className="text-right">{wa && <a href={wa} target="_blank" className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">WhatsApp</a>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
        <Card title="📅 Datas comerciais">
          <ul className="space-y-2 text-sm">
            {commercial.map((c) => (
              <li key={c.t} className="flex justify-between">
                <span>{c.t}</span>
                <span className="text-stone-500">{dateBR(c.iso).slice(0, 5)} · {c.diff === 0 ? "hoje" : `${c.diff} dias`}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-stone-500">Dica: reforce o estoque de rosas 2 semanas antes do Dia dos Namorados e do Dia das Mães.</p>
        </Card>
      </div>
    </>
  );
}
