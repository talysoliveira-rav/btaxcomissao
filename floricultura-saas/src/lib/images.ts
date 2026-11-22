"use client";

/** Reduz e converte a foto no próprio aparelho antes de enviar (fotos de celular têm 3–8 MB). */
export async function resizeImage(file: File, maxSide: number, quality = 0.82, type: "image/webp" | "image/jpeg" = "image/webp"): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (type === "image/jpeg") {
    ctx.fillStyle = "#fff"; // JPEG não tem transparência
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  if (blob && blob.type === type) return blob;
  // Safari antigo sem WebP: cai para JPEG
  return new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Falha ao processar a imagem"))), "image/jpeg", quality));
}

export function extFor(blob: Blob) {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

export function randomName() {
  return crypto.randomUUID().slice(0, 12);
}
