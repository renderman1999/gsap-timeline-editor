import type { CSSProperties } from "react";
import type {
  AnimationTarget,
  LayerStyleLivePreview,
  TargetLayerStyle,
} from "@/stores/timeline-store";

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
    ...(style.textMaxWidth
      ? { maxWidth: style.textMaxWidth, width: "100%" }
      : {}),
    ...(style.boxShadow ? { boxShadow: style.boxShadow } : {}),
    ...(style.textShadow ? { textShadow: style.textShadow } : {}),
    ...(style.borderWidth ? { borderWidth: style.borderWidth } : {}),
    ...(style.borderStyle
      ? { borderStyle: style.borderStyle as CSSProperties["borderStyle"] }
      : {}),
    ...(style.borderColor ? { borderColor: style.borderColor } : {}),
    ...(style.borderRadius ? { borderRadius: style.borderRadius } : {}),
    ...(style.outlineWidth ? { outlineWidth: style.outlineWidth } : {}),
    ...(style.outlineStyle
      ? { outlineStyle: style.outlineStyle as CSSProperties["outlineStyle"] }
      : {}),
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

/** Riflesso scaleY(-1): origine in alto per attaccare il testo al layer sopra (editor = export). */
function reflectionTransformOriginForCustomCss(
  parsed: CSSProperties,
  customCss?: string
): CSSProperties {
  const block = customCss ?? "";
  if (
    /scaleY\s*\(\s*-1/i.test(block) &&
    !/transform-origin/i.test(block) &&
    parsed.transformOrigin == null
  ) {
    return { ...parsed, transformOrigin: "top center" };
  }
  return parsed;
}

/** Solo il blocco CSS aggiuntivo (per il wrapper tweenato in preview). */
export function layerCustomCssToStyle(style?: TargetLayerStyle): CSSProperties {
  const parsed = parseCustomCss(style?.customCss);
  return reflectionTransformOriginForCustomCss(parsed, style?.customCss);
}

export function layerTextUsesFullViewportWidth(
  style?: TargetLayerStyle
): boolean {
  return style?.textFullViewportWidth === true;
}

export type TextFullWidthContext = "viewport" | "section";

/** Full-bleed orizzontale da stage centrato (export / pin). */
export const TEXT_FULL_VIEWPORT_WIDTH_STYLE: CSSProperties = {
  width: "100vw",
  maxWidth: "100vw",
  marginLeft: "calc(50% - 50vw)",
  marginRight: "calc(50% - 50vw)",
  paddingLeft: "1.25rem",
  paddingRight: "1.25rem",
  boxSizing: "border-box",
};

/** Larghezza intera sezione fullpage o contenitore scroll (no vw). */
export const TEXT_FULL_SECTION_WIDTH_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "100%",
  marginLeft: 0,
  marginRight: 0,
  paddingLeft: "1.25rem",
  paddingRight: "1.25rem",
  boxSizing: "border-box",
};

export function resolveTextFullWidthStyle(
  context: TextFullWidthContext
): CSSProperties {
  return context === "section"
    ? TEXT_FULL_SECTION_WIDTH_STYLE
    : TEXT_FULL_VIEWPORT_WIDTH_STYLE;
}

export const TEXT_FULL_VIEWPORT_WIDTH_CLASS = "text-full-viewport";

export function appendLayerMarkupClass(
  attrs: string,
  className: string
): string {
  const trimmed = className.trim();
  if (!trimmed) return attrs;
  if (attrs.includes(' class="')) {
    return attrs.replace(' class="', ` class="${trimmed} `);
  }
  return `${attrs} class="${trimmed}"`;
}

export function resolveTargetStyleForPreview(
  timelineId: string,
  target: Pick<AnimationTarget, "id" | "style">,
  livePreview: LayerStyleLivePreview | null
): TargetLayerStyle | undefined {
  if (
    livePreview &&
    livePreview.timelineId === timelineId &&
    livePreview.targetId === target.id
  ) {
    return livePreview.style;
  }
  return target.style;
}

export function applyLayerStyleLivePreviewToTargets(
  timelineId: string,
  targets: AnimationTarget[],
  livePreview: LayerStyleLivePreview | null
): AnimationTarget[] {
  if (!livePreview || livePreview.timelineId !== timelineId) return targets;
  return targets.map((t) =>
    t.id === livePreview.targetId
      ? { ...t, style: livePreview.style }
      : t
  );
}

function stylePropToKebab(key: string): string {
  if (key.startsWith("--")) return key;
  const kebab = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  return kebab.startsWith("webkit") ? `-${kebab}` : kebab;
}

export function cssPropertiesToInlineString(css: CSSProperties): string {
  return Object.entries(css)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${stylePropToKebab(key)}: ${value}`)
    .join("; ");
}

export function layerBaseStyleToInlineString(style?: TargetLayerStyle): string {
  return cssPropertiesToInlineString(
    layerStyleToCss(style, { customCss: false })
  );
}

export function layerCustomCssInlineString(style?: TargetLayerStyle): string {
  return cssPropertiesToInlineString(layerCustomCssToStyle(style));
}

export function layerStyleToInlineString(style?: TargetLayerStyle): string {
  return cssPropertiesToInlineString(layerStyleToCss(style));
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