"use client";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extFor, randomName, resizeImage } from "@/lib/images";
import type { ProductImage } from "@/lib/types";
import { addProductImages, deleteProductImage, setCoverImage } from "./actions";

const MAX_FILES = 8;

export function ImageManager({ orgId, productId, images }: { orgId: string; productId: string; images: ProductImage[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [, startTransition] = useTransition();

  async function upload(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES);
    if (!list.length) return;
    setError(null);
    const supabase = createClient();
    const done: { path: string; thumbPath: string }[] = [];
    try {
      for (const [i, file] of list.entries()) {
        setBusy(`Enviando ${i + 1} de ${list.length}…`);
        const [big, thumb] = await Promise.all([resizeImage(file, 1600), resizeImage(file, 720, 0.8, "image/jpeg")]);
        const base = `${orgId}/products/${productId}/${randomName()}`;
        const path = `${base}.${extFor(big)}`;
        const thumbPath = `${base}-thumb.${extFor(thumb)}`;
        const opts = { cacheControl: "31536000", upsert: false };
        const [a, b] = await Promise.all([
          supabase.storage.from("store").upload(path, big, { ...opts, contentType: big.type }),
          supabase.storage.from("store").upload(thumbPath, thumb, { ...opts, contentType: thumb.type }),
        ]);
        if (a.error || b.error) throw new Error((a.error ?? b.error)!.message);
        done.push({ path, thumbPath });
      }
      setBusy("Salvando…");
      const res = await addProductImages(productId, done);
      if (res?.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? `Não foi possível enviar: ${e.message}` : "Não foi possível enviar a foto.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <figure key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumb_url ?? img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-[#fff]">Capa</span>}
            <figcaption className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {i > 0 && (
                <form action={(fd) => startTransition(() => setCoverImage(fd))}>
                  <input type="hidden" name="id" value={img.id} />
                  <input type="hidden" name="product_id" value={productId} />
                  <button title="Usar como capa" aria-label="Usar como capa" className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-stone-800 hover:bg-white">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                </form>
              )}
              <form
                action={(fd) => {
                  if (confirm("Excluir esta foto?")) startTransition(() => deleteProductImage(fd));
                }}
              >
                <input type="hidden" name="id" value={img.id} />
                <input type="hidden" name="product_id" value={productId} />
                <button title="Excluir foto" aria-label="Excluir foto" className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-red-600 hover:bg-white">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </figcaption>
          </figure>
        ))}

        <button
          type="button"
          disabled={!!busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            upload([...e.dataTransfer.files]);
          }}
          className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-2 text-center text-xs font-medium transition ${
            dragOver ? "border-brand-500 bg-brand-50 text-brand-700" : "border-stone-300 text-stone-500 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          {busy ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          {busy ?? (images.length ? "Adicionar fotos" : "Enviar fotos")}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => upload([...(e.target.files ?? [])])} />
      <p className="mt-2 text-xs text-stone-500">Arraste ou toque para enviar (até {MAX_FILES} por vez). As fotos são otimizadas automaticamente. A primeira é a capa.</p>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
