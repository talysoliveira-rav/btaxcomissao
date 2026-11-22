"use client";
import { useActionState, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { Alert, Field, Input, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/client";
import { extFor, randomName, resizeImage } from "@/lib/images";
import type { Organization } from "@/lib/types";
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

export function StorefrontForm({ org, baseUrl, disabled }: { org: Organization; baseUrl: string; disabled: boolean }) {
  const [state, action] = useActionState<StorefrontState, FormData>(updateStorefront, {});
  const [slug, setSlug] = useState(org.slug);
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
        <Field label="Frase de destaque"><Input name="tagline" defaultValue={org.tagline ?? ""} placeholder="Flores frescas entregues com carinho" maxLength={90} /></Field>
        <Field label="Sobre a floricultura"><Textarea name="store_description" defaultValue={org.store_description ?? ""} placeholder="Conte em poucas linhas o que torna sua floricultura especial." /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="WhatsApp de atendimento" hint="Para onde vão os pedidos da vitrine."><Input name="whatsapp" defaultValue={org.whatsapp ?? org.phone ?? ""} placeholder="(11) 99999-9999" required /></Field>
          <Field label="Instagram"><Input name="instagram" defaultValue={org.instagram ?? ""} placeholder="@suafloricultura" /></Field>
          <Field label="Horário de funcionamento"><Input name="opening_hours" defaultValue={org.opening_hours ?? ""} placeholder="Seg a sáb, 8h às 19h" /></Field>
          <Field label="Área de entrega"><Input name="delivery_area" defaultValue={org.delivery_area ?? ""} placeholder="Zona Sul e Centro de São Paulo" /></Field>
        </div>
      </fieldset>
      {!disabled && <SubmitButton>Salvar vitrine</SubmitButton>}
    </form>
  );
}
