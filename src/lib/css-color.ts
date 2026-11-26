export type Rgba = { r: number; g: number; b: number; a: number };

export function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

export function clampAlpha(a: number): number {
  return Math.min(1, Math.max(0, a));
}

export function parseCssColor(value: string | undefined): Rgba | null {
  const v = value?.trim();
  if (!v) return null;

  const hex8 = v.match(/^#([0-9A-Fa-f]{8})$/);
  if (hex8) {
    const h = hex8[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }

  const hex6 = v.match(/^#([0-9A-Fa-f]{6})$/);
  if (hex6) {
    const h = hex6[1];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: 1,
    };
  }

  const hex3 = v.match(/^#([0-9A-Fa-f]{3})$/);
  if (hex3) {
    const h = hex3[1];
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
      a: 1,
    };
  }

  const rgba = v.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (rgba) {
    return {
      r: clampByte(parseInt(rgba[1], 10)),
      g: clampByte(parseInt(rgba[2], 10)),
      b: clampByte(parseInt(rgba[3], 10)),
      a: rgba[4] !== undefined ? clampAlpha(parseFloat(rgba[4])) : 1,
    };
  }

  return null;
}

export function formatRgba({ r, g, b, a }: Rgba): string {
  const alpha = Math.round(a * 1000) / 1000;
  if (alpha >= 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function rgbaToHex6({ r, g, b }: Rgba): string {
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbaToHex8({ r, g, b, a }: Rgba): string {
  const toHex = (n: number) => clampByte(n).toString(16).padStart(2, "0");
  const alpha = clampByte(a * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha}`;
}