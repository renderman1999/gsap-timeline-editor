import type { CSSProperties } from "react";
import type { AnimationTarget, TargetShape } from "@/stores/timeline-store";
import { cssPropertiesToInlineString } from "@/lib/layer-style";
import {
  layerShapeChromeStyle,
  layerShapeGeometryExtras,
} from "@/lib/layer-shape-style";
import { STAR_CLIP_PATH } from "@/lib/shape-star";

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function styleAttr(css: CSSProperties): string {
  const inline = cssPropertiesToInlineString(css);
  if (!inline.trim()) return "";
  return ` style="${escapeAttr(inline)}"`;
}

function shapeFill(target: AnimationTarget): string {
  return target.style?.color ?? "#ffffff";
}

/** Export HTML allineato a PreviewTargetView (chrome + geometria + bordo/ombra). */
export function shapeLayerStyledExportMarkup(target: AnimationTarget): string {
  const shape = (target.shape ?? "square") as TargetShape;
  const fill = shapeFill(target);
  const chrome = layerShapeChromeStyle(target.style, shape);
  const geomExtra = layerShapeGeometryExtras(target.style, shape);

  const wrap = (body: string) =>
    `<span class="shape-export-chrome" aria-hidden="true"${styleAttr(chrome)}>${body}</span>`;

  switch (shape) {
    case "triangle":
      return wrap(
        `<span class="shape shape-triangle" style="border-bottom-color: ${escapeAttr(fill)}"></span>`
      );
    case "star":
      return wrap(
        `<span class="shape shape-star" style="background-color: ${escapeAttr(fill)}; clip-path: ${STAR_CLIP_PATH}"></span>`
      );
    case "circle":
      return wrap(
        `<span class="shape shape-circle"${styleAttr({
          backgroundColor: fill,
          ...geomExtra,
        })}></span>`
      );
    case "heart":
      return wrap(
        `<span class="shape shape-icon" style="color: ${escapeAttr(fill)}">${SHAPE_ICON_SVG.heart}</span>`
      );
    case "bell":
      return wrap(
        `<span class="shape shape-icon" style="color: ${escapeAttr(fill)}">${SHAPE_ICON_SVG.bell}</span>`
      );
    case "menu":
      return wrap(
        `<span class="shape shape-icon" style="color: ${escapeAttr(fill)}">${SHAPE_ICON_SVG.menu}</span>`
      );
    case "audio-lines":
      return wrap(
        `<span class="shape shape-icon" style="color: ${escapeAttr(fill)}">${SHAPE_ICON_SVG["audio-lines"]}</span>`
      );
    case "square":
    default:
      return wrap(
        `<span class="shape shape-square"${styleAttr({
          backgroundColor: fill,
          ...geomExtra,
        })}></span>`
      );
  }
}

/** @deprecated Usa shapeLayerStyledExportMarkup; solo fill senza bordo/ombra. */
export function shapeLayerInnerHtml(
  shape: TargetShape,
  fill: string
): string {
  switch (shape) {
    case "triangle":
      return `<span class="shape shape-triangle" aria-hidden="true" style="border-bottom-color: ${fill}"></span>`;
    case "star":
      return `<span class="shape shape-star" aria-hidden="true" style="background-color: ${fill}; clip-path: ${STAR_CLIP_PATH}"></span>`;
    case "circle":
      return `<span class="shape shape-circle" aria-hidden="true" style="background-color: ${fill}"></span>`;
    case "heart":
      return `<span class="shape shape-icon" aria-hidden="true" style="color: ${fill}">${SHAPE_ICON_SVG.heart}</span>`;
    case "bell":
      return `<span class="shape shape-icon" aria-hidden="true" style="color: ${fill}">${SHAPE_ICON_SVG.bell}</span>`;
    case "menu":
      return `<span class="shape shape-icon" aria-hidden="true" style="color: ${fill}">${SHAPE_ICON_SVG.menu}</span>`;
    case "audio-lines":
      return `<span class="shape shape-icon" aria-hidden="true" style="color: ${fill}">${SHAPE_ICON_SVG["audio-lines"]}</span>`;
    case "square":
    default:
      return `<span class="shape shape-square" aria-hidden="true" style="background-color: ${fill}"></span>`;
  }
}

const SHAPE_ICON_SVG: Record<
  "heart" | "bell" | "menu" | "audio-lines",
  string
> = {
  heart: `<svg class="shape-icon-svg" viewBox="0 0 24 24" width="80" height="80" fill="currentColor" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  bell: `<svg class="shape-icon-svg" viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>`,
  menu: `<svg class="shape-icon-svg" viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`,
  "audio-lines": `<svg class="shape-icon-svg" viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>`,
};