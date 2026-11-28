/** Limite per data URL nel progetto JSON (evita file enormi in localStorage). */
export const MAX_IMAGE_DATA_URL_BYTES = 4 * 1024 * 1024;

/** Larghezza di default, allineata al vecchio max 10rem. */
export const DEFAULT_IMAGE_WIDTH = 160;
export const MIN_IMAGE_WIDTH = 40;
export const MAX_IMAGE_WIDTH = 720;

export function clampImageWidth(value: number | undefined): number {
  const n = typeof value === "number" ? value : DEFAULT_IMAGE_WIDTH;
  if (!Number.isFinite(n)) return DEFAULT_IMAGE_WIDTH;
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(n)));
}

export function imageLayerSizeStyle(width: number | undefined): {
  width: number;
  maxWidth: "none";
  height: "auto";
  objectFit: "contain";
} {
  return {
    width: clampImageWidth(width),
    maxWidth: "none",
    height: "auto",
    objectFit: "contain",
  };
}

export function imageLayerInlineStyle(width: number | undefined): string {
  const w = clampImageWidth(width);
  return `width:${w}px;max-width:none;height:auto;object-fit:contain`;
}

const IMAGE_MIME =
  /^image\/(jpeg|jpg|png|gif|webp|svg\+xml|bmp|avif)$/i;

export function isAllowedImageFile(file: File): boolean {
  if (file.type && IMAGE_MIME.test(file.type)) return true;
  return /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(file.name);
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lettura immagine fallita"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Lettura immagine fallita"));
    reader.readAsDataURL(file);
  });
}