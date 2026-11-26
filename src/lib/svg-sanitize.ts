export const DEFAULT_LAYER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none" aria-hidden="true">
  <path id="draw-path" d="M14 52 L34 28 L50 38 L66 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path id="morph-end" d="M40 14 L66 40 L40 66 L14 40 Z" fill="none" stroke="currentColor" stroke-width="4" visibility="hidden"/>
</svg>`;

const FORBIDDEN_TAGS =
  /<\/?(script|foreignObject|iframe|object|embed|link|style)\b[\s\S]*?>/gi;

function stripForbiddenBlocks(markup: string): string {
  return markup.replace(FORBIDDEN_TAGS, "");
}

function stripEventHandlers(markup: string): string {
  return markup.replace(
    /\s+on[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi,
    ""
  );
}

function stripJavascriptUrls(markup: string): string {
  return markup.replace(
    /\s+(?:href|xlink:href)\s*=\s*(["']?)\s*javascript:[^\s"'>]*/gi,
    ""
  );
}

export function extractSvgFragment(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withoutXml = trimmed.replace(/<\?xml[^?]*\?>/gi, "").trim();

  if (/^<svg[\s>]/i.test(withoutXml)) {
    const end = withoutXml.search(/<\/svg>\s*$/i);
    if (end >= 0) {
      return withoutXml.slice(0, end + "</svg>".length);
    }
    return withoutXml;
  }

  const match = withoutXml.match(/<svg[\s\S]*?<\/svg>/i);
  return match?.[0] ?? null;
}

/** Riduce XSS; non sostituisce un sanitizzatore server-side in contesti non fidati. */
export function sanitizeSvgMarkup(raw: string | undefined): string {
  const fragment = extractSvgFragment(raw ?? "");
  if (!fragment) return DEFAULT_LAYER_SVG;

  let safe = stripForbiddenBlocks(fragment);
  safe = stripEventHandlers(safe);
  safe = stripJavascriptUrls(safe);

  if (!/<svg[\s>]/i.test(safe)) return DEFAULT_LAYER_SVG;
  return safe;
}

/** Triangolo equilatero con stroke per DrawSVG (come shape fill #cc3d3d). */
export const TRIANGLE_DRAW_EXAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120" aria-hidden="true">
  <path id="draw-path" d="M50 10 L90 85 L10 85 Z" fill="none" stroke="#cc3d3d" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

const DRAWABLE_SELECTORS =
  "path, polygon, polyline, line, rect, circle, ellipse";

function prepareSvgElementForDraw(el: Element, index: number): void {
  const stroke = el.getAttribute("stroke");
  const hasStroke = stroke && stroke !== "none";

  if (!hasStroke) {
    const fill = el.getAttribute("fill");
    const color =
      fill && fill !== "none" && !fill.startsWith("url(") ? fill : "currentColor";
    el.setAttribute("stroke", color);
    if (fill !== "none") {
      el.setAttribute("fill", "none");
    }
  }

  if (!el.getAttribute("stroke-width")) {
    el.setAttribute("stroke-width", "3");
  }

  if (!el.getAttribute("stroke-linejoin") && el.tagName.toLowerCase() !== "circle") {
    el.setAttribute("stroke-linejoin", "round");
  }

  if (!el.id && index === 0) {
    el.setAttribute("id", "draw-path");
  }
}

/**
 * Converte fill-only (es. triangolo pieno) in stroke per DrawSVGPlugin.
 * Usa DOMParser lato client.
 */
export function prepareSvgForDrawSVG(raw: string | undefined): string {
  const base = sanitizeSvgMarkup(raw);
  if (typeof DOMParser === "undefined") {
    return base;
  }

  const doc = new DOMParser().parseFromString(base, "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== "svg") {
    return base;
  }

  const shapes = svg.querySelectorAll(DRAWABLE_SELECTORS);
  shapes.forEach((el, index) => prepareSvgElementForDraw(el, index));

  if (shapes.length === 0) {
    return base;
  }

  return sanitizeSvgMarkup(svg.outerHTML);
}

export async function fetchSvgFromUrl(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("URL vuoto");
  }
  const response = await fetch(trimmed);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const text = await response.text();
  const fragment = extractSvgFragment(text);
  if (!fragment) {
    throw new Error("Risposta senza markup SVG");
  }
  return sanitizeSvgMarkup(fragment);
}