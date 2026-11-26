import { normalizeCssVarName } from "@/lib/gsap-css-rule";

export type CssVarLinkTarget =
  | "color"
  | "background"
  | "border"
  | "outline"
  | "textStroke";

export const CSS_VAR_LINK_OPTIONS: {
  id: CssVarLinkTarget;
  label: string;
}[] = [
  { id: "color", label: "Colore testo" },
  { id: "background", label: "Sfondo" },
  { id: "border", label: "Bordo" },
  { id: "outline", label: "Outline" },
  { id: "textStroke", label: "Text stroke" },
];

function declarationsForLink(
  varName: string,
  link: CssVarLinkTarget
): string[] {
  const v = `var(${varName})`;
  switch (link) {
    case "color":
      return [`color: ${v}`];
    case "background":
      return [`background-color: ${v}`];
    case "border":
      return [
        "border-style: solid",
        "border-width: 1px",
        `border-color: ${v}`,
      ];
    case "outline":
      return ["outline-style: solid", "outline-width: 2px", `outline-color: ${v}`];
    case "textStroke":
      return [`-webkit-text-stroke-color: ${v}`];
    default:
      return [];
  }
}

export function buildCssVarCustomCssSnippet(
  varName: string,
  _initialValue: string,
  links: CssVarLinkTarget[]
): string {
  const name = normalizeCssVarName(varName);
  if (!name) return "";
  const decls = new Set<string>();
  links.forEach((link) => {
    declarationsForLink(name, link).forEach((d) => decls.add(d));
  });
  return [...decls].join("; ");
}

export function mergeCustomCssBlock(
  existing: string | undefined,
  snippet: string
): string {
  const base = existing?.trim().replace(/;\s*$/, "") ?? "";
  if (!snippet.trim()) return base;
  if (!base) return snippet;
  return `${base}; ${snippet}`;
}

export function isLikelyColorValue(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return (
    v.startsWith("#") ||
    v.startsWith("rgb") ||
    v.startsWith("hsl") ||
    /^[a-z]+$/i.test(v)
  );
}