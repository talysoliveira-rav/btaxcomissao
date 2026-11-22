"use client";
import { useActionState, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import { Alert, Field, Input, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/client";
import { extFor, randomName, resizeImage } from "@/lib/images";
import type { Organization } from "@/lib/types";
import { parseHours } from "@/lib/hours";
import { parseRegions } from "@/lib/regions";
import { descriptionOptions, nextSuggestion, taglineOptions } from "@/lib/suggestions";
import { HoursPicker } from "./hours-picker";
import { RegionsPicker } from "./regions-picker";
import { updateStorefront, type StorefrontState } from "./actions";

function BrandImage({ orgId, name, label, initial, maxSide, aspect }: { orgId: string; name: string; label: string; initial: string | null; maxSide: number; aspect: string }) {
  const [url, setUrl] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await resizeImage(file, maxSide, 0.82, name === "cover_url" ? "image/jpeg" : "image/webp");
      const path = `${orgId}/brand/${name}-${randomName()}.${extFor(blob)}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("store").upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
      if (error) throw error;
      setUrl(supabase.storage.from("store").getPublicUrl(path).data.publicUrl);
    } catch {
      setErr("Não foi possível enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <span className="text-xs font-medium text-stone-600">{label}</span>
      <input type="hidden" name={name} value={url} />
      <div className={`relative mt-1 overflow-hidden rounded-xl border-2 border-dashed border-stone-300 bg-stone-100/60 ${aspect}`}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs font-medium text-stone-500 hover:text-brand-700">
            {busy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Enviando…" : "Enviar imagem"}
          </button>
        )}
        {url && (
          <div className="absolute right-1.5 top-1.5 flex gap-1">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-stone-800 shadow">Trocar</button>
            <button type="button" onClick={() => setUrl("")} aria-label="Remover" className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-stone-700 shadow"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {err && <p className="mt-1 text-xs text-red-700">{err}</p>}
    </div>
  );
}

function SuggestButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
    >
      <Sparkles className="h-3 w-3" aria-hidden /> Sugerir
    </button>
  );
}

function SectionTitle({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-end justify-between gap-2">
      <div>
        <span className="text-xs font-medium text-stone-600">{title}</span>
        {hint && <span className="block text-[11px] text-stone-400">{hint}</span>}
      </div>
      {action}
    </div>
  );
}

export function StorefrontForm({ org, baseUrl, disabled }: { org: Organization; baseUrl: string; disabled: boolean }) {
  const [state, action] = useActionState<StorefrontState, FormData>(updateStorefront, {});
  const [slug, setSlug] = useState(org.slug);
  const regions = parseRegions(org.delivery_regions);
  const city = (regions.find((r) => r.type === "city") as { label: string } | undefined)?.label ?? null;
  const ctx = { name: org.name, city };
  const [tagline, setTagline] = useState(org.tagline ?? "");
  const [about, setAbout] = useState(org.store_description ?? "");
  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert kind="success">Vitrine salva.</Alert>}
      <fieldset disabled={disabled} className="space-y-4">
        <label className="flex items-start gap-3 rounded-xl bg-brand-50/70 p-3">
          <input type="checkbox" name="storefront_enabled" defaultChecked={org.storefront_enabled} className="mt-1" />
          <span>
            <span className="block text-sm font-medium text-stone-900">Vitrine online ativa</span>
            <span className="block text-xs text-stone-500">Quando ativa, qualquer pessoa com o link vê os produtos marcados para a vitrine.</span>
          </span>
        </label>
        <Field label="Endereço da vitrine" hint="Letras minúsculas, números e hífen.">
          <div className="flex items-center overflow-hidden rounded-lg border border-stone-200 bg-white/90 text-sm focus-within:ring-4 focus-within:ring-brand-100">
            <span className="shrink-0 border-r border-stone-200 bg-stone-100/70 px-2.5 py-2 text-stone-500">{baseUrl.replace(/^https?:\/\//, "")}/loja/</span>
            <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required minLength={3} maxLength={40} className="min-w-0 flex-1 bg-transparent px-2.5 py-2 outline-none" />
          </div>
        </Field>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <BrandImage orgId={org.id} name="logo_url" label="Logo da floricultura" initial={org.logo_url} maxSide={512} aspect="aspect-square" />
          <BrandImage orgId={org.id} name="cover_url" label="Foto de capa" initial={org.cover_url} maxSide={1600} aspect="aspect-[2/1]" />
        </div>
        <div>
          <SectionTitle title="Frase de destaque" hint="Aparece embaixo do nome, no topo da vitrine." action={<SuggestButton onClick={() => setTagline(nextSuggestion(taglineOptions(ctx), tagline))} />} />
          <Input name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Flores frescas entregues com carinho" maxLength={90} />
        </div>
        <div>
          <SectionTitle title="Sobre a floricultura" hint="Use a sugestão como ponto de partida e ajuste com o seu jeito." action={<SuggestButton onClick={() => setAbout(nextSuggestion(descriptionOptions(ctx), about))} />} />
          <Textarea name="store_description" value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="Conte em poucas linhas o que torna sua floricultura especial." />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp de atendimento" hint="Para onde vão os pedidos da vitrine."><Input name="whatsapp" defaultValue={org.whatsapp ?? org.phone ?? ""} placeholder="(11) 99999-9999" required /></Field>
          <Field label="Instagram"><Input name="instagram" defaultValue={org.instagram ?? ""} placeholder="@suafloricultura" /></Field>
        </div>
        <div>
          <SectionTitle title="Horário de funcionamento" hint="Escolha um atalho e ajuste os dias e horários." />
          <HoursPicker initial={parseHours(org.business_hours)} />
        </div>
        <div>
          <SectionTitle title="Área de entrega" hint="Marque o estado, as cidades ou regiões inteiras e, se quiser, bairros." />
          <RegionsPicker initial={regions} />
        </div>
      </fieldset>
      {!disabled && <SubmitButton>Salvar vitrine</SubmitButton>}
    </form>
  );
}
