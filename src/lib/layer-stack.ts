/** z-index sul contenitore layer: ultimo in lista = sopra. */
export function layerStackZIndex(index: number): number {
  return index + 1;
}

export function mergeStackZIndexIntoStyle(
  index: number,
  existingStyle?: string
): string {
  const z = `z-index: ${layerStackZIndex(index)}`;
  const base = existingStyle?.trim();
  if (!base) return z;
  if (/z-index\s*:/i.test(base)) return base;
  return `${base}; ${z}`;
}