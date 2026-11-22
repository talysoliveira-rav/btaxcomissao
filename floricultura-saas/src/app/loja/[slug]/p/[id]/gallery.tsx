"use client";
/* eslint-disable @next/next/no-img-element -- fotos já otimizadas no envio */
import { useRef, useState } from "react";
import { Flower2 } from "lucide-react";

export function Gallery({ images, alt }: { images: { url: string; thumb_url: string }[]; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const go = (i: number) => track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: "smooth" });

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-gradient-to-br from-brand-50 to-stone-100 text-brand-300">
        <Flower2 className="h-16 w-16" strokeWidth={1} aria-hidden />
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto rounded-3xl bg-stone-100 [scrollbar-width:none]"
        >
          {images.map((img, i) => (
            <img key={img.url} src={img.url} alt={`${alt} — foto ${i + 1}`} className="h-full w-full shrink-0 snap-center object-cover" loading={i === 0 ? "eager" : "lazy"} />
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Foto ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => go(i)}
              className={`h-16 w-16 overflow-hidden rounded-xl ring-2 transition ${i === index ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={img.thumb_url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
