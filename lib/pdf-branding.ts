const logoCache = new Map<string, string>();

export async function loadLogoDataUrl(src: string): Promise<string> {
  const cached = logoCache.get(src);
  if (cached) return cached;
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  logoCache.set(src, dataUrl);
  return dataUrl;
}

export const LOGO_DARK_SRC = "/images/iconMauroAcosta.png";
export const LOGO_WHITE_SRC = "/images/iconMauroAcostaWhite.png";
