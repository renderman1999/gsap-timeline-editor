/** Limite per data URL nel progetto JSON (evita file enormi in localStorage). */
export const MAX_IMAGE_DATA_URL_BYTES = 4 * 1024 * 1024;

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