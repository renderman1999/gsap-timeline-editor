import type { CSSProperties } from "react";
import type { TargetLayerStyle } from "@/stores/timeline-store";
import type { TargetShape } from "@/stores/timeline-store";
import { layerStyleToCss } from "@/lib/layer-style";

export function isShapeIcon(shape: TargetShape): boolean {
  return (
    shape === "heart" ||
    shape === "bell" ||
    shape === "menu" ||
    shape === "audio-lines"
  );
}

function borderPropsFromStyle(full: CSSProperties): CSSProperties {
  const hasWidth = Boolean(full.borderWidth);
  if (!hasWidth && !full.borderColor) return {};
  return {
    ...(hasWidth
      ? {
          borderWidth: full.borderWidth,
          borderStyle: full.borderStyle ?? "solid",
        }
      : {}),
    ...(full.borderColor ? { borderColor: full.borderColor } : {}),
  };
}

function outlinePropsFromStyle(full: CSSProperties): CSSProperties {
  const hasWidth = Boolean(full.outlineWidth);
  if (!hasWidth && !full.outlineColor) return {};
  return {
    ...(hasWidth
      ? {
          outlineWidth: full.outlineWidth,
          outlineStyle: full.outlineStyle ?? "solid",
        }
      : {}),
    ...(full.outlineColor ? { outlineColor: full.outlineColor } : {}),
    ...(full.outlineOffset ? { outlineOffset: full.outlineOffset } : {}),
  };
}

const chromeBase = (full: CSSProperties): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  ...(full.boxShadow ? { boxShadow: full.boxShadow } : {}),
  ...outlinePropsFromStyle(full),
  ...(full.opacity ? { opacity: full.opacity } : {}),
  ...(full.filter ? { filter: full.filter } : {}),
  ...(full.backgroundColor ? { backgroundColor: full.backgroundColor } : {}),
});

/** Wrapper attorno alla geometria (ombre, outline, opacità; bordo su triangolo/icone). */
export function layerShapeChromeStyle(
  style?: TargetLayerStyle,
  shape: TargetShape = "square"
): CSSProperties {
  const full = layerStyleToCss(style, { customCss: false });
  const base = chromeBase(full);
  if (shape === "triangle" || shape === "star" || isShapeIcon(shape)) {
    return {
      ...base,
      ...borderPropsFromStyle(full),
      ...(full.borderRadius ? { borderRadius: full.borderRadius } : {}),
    };
  }
  return base;
}

/** Bordo/raggio sulla geometria (quadrato/cerchio). */
export function layerShapeGeometryExtras(
  style?: TargetLayerStyle,
  shape: TargetShape = "square"
): CSSProperties {
  if (shape === "triangle" || shape === "star" || isShapeIcon(shape)) {
    return {};
  }
  const full = layerStyleToCss(style, { customCss: false });
  return {
    ...borderPropsFromStyle(full),
    boxSizing: "border-box",
    ...(full.borderRadius && shape !== "circle"
      ? { borderRadius: full.borderRadius }
      : {}),
  };
}