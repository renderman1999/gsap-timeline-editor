import type { CSSProperties } from "react";
import type { TargetLayerStyle } from "@/stores/timeline-store";

const CUSTOM_CSS_FORBIDDEN = /[{}@!]|url\s*\(|expression\s*\(/i;

export function parseCustomCss(customCss?: string): CSSProperties {
  if (!customCss?.trim()) return {};
  if (CUSTOM_CSS_FORBIDDEN.test(customCss)) return {};

  const style: Record<string, string> = {};
  customCss
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((declaration) => {
      const colon = declaration.indexOf(":");
      if (colon <= 0) return;
      const prop = declaration.slice(0, colon).trim();
      const value = declaration.slice(colon + 1).trim();
      if (!prop || !value) return;
      const key = prop.startsWith("--")
        ? prop
        : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      style[key] = value;
    });
  return style as CSSProperties;
}

export type LayerStyleToCssOptions = {
  /** Includi il blocco CSS aggiuntivo (default: true). In preview il customCss va sul wrapper del layer. */
  customCss?: boolean;
};

export function layerStyleUsesLinkedCustomColor(
  style?: TargetLayerStyle
): boolean {
  const block = style?.customCss ?? "";
  return /color\s*:\s*var\s*\(/i.test(block);
}

export function layerStyleToCss(
  style?: TargetLayerStyle,
  options?: LayerStyleToCssOptions
): CSSProperties {
  if (!style) return {};
  const includeCustomCss = options?.customCss !== false;
  const textStroke =
    style.textStrokeWidth || style.textStrokeColor
      ? `${style.textStrokeWidth ?? "1px"} ${style.textStrokeColor ?? "currentColor"}`
      : undefined;

  const base: CSSProperties = {
    ...(style.color ? { color: style.color } : {}),
    ...(style.backgroundColor
      ? { backgroundColor: style.backgroundColor }
      : {}),
    ...(style.fontFamily
      ? { fontFamily: `"${style.fontFamily}", sans-serif` }
      : {}),
    ...(style.fontSize ? { fontSize: style.fontSize } : {}),
    ...(style.fontWeight ? { fontWeight: style.fontWeight } : {}),
    ...(style.lineHeight ? { lineHeight: style.lineHeight } : {}),
    ...(style.letterSpacing ? { letterSpacing: style.letterSpacing } : {}),
    ...(style.textAlign ? { textAlign: style.textAlign } : {}),
    ...(style.boxShadow ? { boxShadow: style.boxShadow } : {}),
    ...(style.textShadow ? { textShadow: style.textShadow } : {}),
    ...(style.borderWidth ? { borderWidth: style.borderWidth } : {}),
    ...(style.borderStyle ? { borderStyle: style.borderStyle } : {}),
    ...(style.borderColor ? { borderColor: style.borderColor } : {}),
    ...(style.borderRadius ? { borderRadius: style.borderRadius } : {}),
    ...(style.outlineWidth ? { outlineWidth: style.outlineWidth } : {}),
    ...(style.outlineStyle ? { outlineStyle: style.outlineStyle } : {}),
    ...(style.outlineColor ? { outlineColor: style.outlineColor } : {}),
    ...(style.outlineOffset ? { outlineOffset: style.outlineOffset } : {}),
    ...(style.opacity ? { opacity: style.opacity } : {}),
    ...(style.filter ? { filter: style.filter } : {}),
    ...(textStroke ? { WebkitTextStroke: textStroke } : {}),
  };
  return {
    ...base,
    ...(includeCustomCss ? parseCustomCss(style.customCss) : {}),
  };
}

/** Solo il blocco CSS aggiuntivo (per il wrapper tweenato in preview). */
export function layerCustomCssToStyle(style?: TargetLayerStyle): CSSProperties {
  return parseCustomCss(style?.customCss);
}

function stylePropToKebab(key: string): string {
  if (key.startsWith("--")) return key;
  const kebab = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return kebab.startsWith("webkit") ? `-${kebab}` : kebab;
}

export function layerStyleToInlineString(style?: TargetLayerStyle): string {
  const css = layerStyleToCss(style);
  return Object.entries(css)
    .map(([key, value]) => `${stylePropToKebab(key)}: ${value}`)
    .join("; ");
}

export function collectGoogleFontFamilies(
  styles: (TargetLayerStyle | undefined)[]
): string[] {
  const set = new Set<string>();
  styles.forEach((s) => {
    const name = s?.fontFamily?.trim();
    if (name) set.add(name);
  });
  return [...set];
}

export function buildGoogleFontsStylesheetUrl(families: string[]): string {
  if (families.length === 0) return "";
  const query = families
    .map(
      (name) =>
        `family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@300;400;500;600;700;800`
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}