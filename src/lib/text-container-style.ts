import type { CSSProperties } from "react";
import type { TargetLayerStyle } from "@/stores/timeline-store";
import { layerTextUsesFullViewportWidth } from "@/lib/layer-style";

export const TEXT_CONTAINER_PRESETS = [
  { id: "narrow", label: "Stretto", value: "20rem" },
  { id: "medium", label: "Medio", value: "32rem" },
  { id: "wide", label: "Largo", value: "48rem" },
  { id: "reading", label: "Lettura (65ch)", value: "65ch" },
] as const;

export function resolveTextContainerStyle(
  style: TargetLayerStyle | undefined
): CSSProperties {
  if (layerTextUsesFullViewportWidth(style)) {
    if (style?.textMaxWidth?.trim()) {
      return {
        maxWidth: style.textMaxWidth.trim(),
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      };
    }
    return {};
  }
  const maxW = style?.textMaxWidth?.trim();
  return {
    ...(maxW
      ? { maxWidth: maxW, width: "100%" }
      : { maxWidth: "20rem", width: "100%" }),
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  };
}