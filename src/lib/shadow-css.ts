import { parseCssColor, type Rgba } from "@/lib/css-color";

export type BoxShadowParts = {
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
};

export type TextShadowParts = {
  offsetX: string;
  offsetY: string;
  blur: string;
  color: string;
};

const DEFAULT_SHADOW_COLOR = "rgba(0, 0, 0, 0.35)";

function extractTrailingColor(
  shadow: string
): { lead: string; color: string } | null {
  const trimmed = shadow.trim();
  if (!trimmed) return null;

  const rgba = trimmed.match(/^(.*)\s+(rgba?\([^)]+\))\s*$/i);
  if (rgba) {
    return { lead: rgba[1].trim(), color: rgba[2] };
  }

  const hex = trimmed.match(/^(.*)\s+(#[0-9A-Fa-f]{3,8})\s*$/);
  if (hex) {
    return { lead: hex[1].trim(), color: hex[2] };
  }

  return null;
}

export function parseBoxShadow(value?: string): BoxShadowParts | null {
  if (!value?.trim()) return null;
  const extracted = extractTrailingColor(value);
  if (!extracted) return null;

  const tokens = extracted.lead.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return null;

  return {
    offsetX: tokens[0] ?? "0",
    offsetY: tokens[1] ?? "0",
    blur: tokens[2] ?? "0",
    spread: tokens[3] ?? "0",
    color: extracted.color,
  };
}

export function formatBoxShadow(parts: BoxShadowParts): string {
  const spread =
    parts.spread && parts.spread !== "0" ? ` ${parts.spread}` : "";
  return `${parts.offsetX} ${parts.offsetY} ${parts.blur}${spread} ${parts.color}`;
}

export function parseTextShadow(value?: string): TextShadowParts | null {
  if (!value?.trim()) return null;
  const extracted = extractTrailingColor(value);
  if (!extracted) return null;

  const tokens = extracted.lead.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return null;

  return {
    offsetX: tokens[0] ?? "0",
    offsetY: tokens[1] ?? "0",
    blur: tokens[2] ?? "0",
    color: extracted.color,
  };
}

export function formatTextShadow(parts: TextShadowParts): string {
  return `${parts.offsetX} ${parts.offsetY} ${parts.blur} ${parts.color}`;
}

export function defaultBoxShadowParts(): BoxShadowParts {
  return {
    offsetX: "0",
    offsetY: "8px",
    blur: "32px",
    spread: "0",
    color: DEFAULT_SHADOW_COLOR,
  };
}

export function defaultTextShadowParts(): TextShadowParts {
  return {
    offsetX: "0",
    offsetY: "2px",
    blur: "12px",
    color: "rgba(0, 0, 0, 0.8)",
  };
}

export function shadowColorOrDefault(color: string): Rgba {
  return (
    parseCssColor(color) ?? parseCssColor(DEFAULT_SHADOW_COLOR) ?? {
      r: 0,
      g: 0,
      b: 0,
      a: 0.35,
    }
  );
}