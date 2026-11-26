/** Limite GLB/GLTF in data URL nel progetto JSON. */
export const MAX_MODEL3D_DATA_URL_BYTES = 15 * 1024 * 1024;

const MODEL_EXT = /\.(gltf|glb)$/i;

export function isAllowedModel3dFile(file: File): boolean {
  if (file.name.match(MODEL_EXT)) return true;
  return (
    file.type === "model/gltf+json" ||
    file.type === "model/gltf-binary" ||
    file.type === ""
  );
}

/** GLTFLoader è più affidabile con MIME gltf-binary sui .glb. */
export function normalizeModel3dSource(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith("data:")) return trimmed;
  const comma = trimmed.indexOf(",");
  if (comma < 0) return trimmed;
  const payload = trimmed.slice(comma + 1);
  if (trimmed.includes("model/gltf-binary")) return trimmed;
  if (/\.gltf([?#]|$)/i.test(trimmed) || trimmed.includes("gltf+json")) {
    return `data:model/gltf+json;base64,${payload}`;
  }
  return `data:model/gltf-binary;base64,${payload}`;
}

export function readModel3dFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Lettura modello fallita"));
        return;
      }
      resolve(normalizeModel3dSource(result));
    };
    reader.onerror = () => reject(new Error("Lettura modello fallita"));
    reader.readAsDataURL(file);
  });
}