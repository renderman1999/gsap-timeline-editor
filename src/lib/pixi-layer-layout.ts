import type { CSSProperties } from "react";
import type { PixiCanvasAlign, PixiLayerSettings } from "@/lib/pixi-scene";
import { cn } from "@/lib/utils";

export type PixiLayerLayout = {
  alignX: PixiCanvasAlign;
  alignY: PixiCanvasAlign;
  offsetX: number;
  offsetY: number;
};

const ALIGN_JUSTIFY: Record<PixiCanvasAlign, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
};

const ALIGN_ITEMS: Record<PixiCanvasAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

function parseAlign(
  value: PixiLayerSettings["alignX"] | undefined,
  fallback: PixiCanvasAlign
): PixiCanvasAlign {
  if (value === "start" || value === "center" || value === "end") return value;
  return fallback;
}

export function resolvePixiLayerLayout(
  settings?: PixiLayerSettings
): PixiLayerLayout {
  return {
    alignX: parseAlign(settings?.alignX, "center"),
    alignY: parseAlign(settings?.alignY, "center"),
    offsetX: Number(settings?.offsetX) || 0,
    offsetY: Number(settings?.offsetY) || 0,
  };
}

/** Flex sul contenitore largo (stage / sezione). */
export function pixiLayoutHostClassName(
  settings: PixiLayerSettings | undefined,
  sectionFill: boolean
): string {
  if (sectionFill) {
    return "flex w-full h-full max-w-none min-h-0 overflow-visible";
  }
  const layout = resolvePixiLayerLayout(settings);
  return cn(
    "flex w-full max-w-full min-h-[1px] overflow-visible",
    ALIGN_JUSTIFY[layout.alignX],
    ALIGN_ITEMS[layout.alignY]
  );
}

export function pixiSlotOffsetStyle(
  settings: PixiLayerSettings | undefined,
  sectionFill: boolean
): CSSProperties | undefined {
  if (sectionFill) return undefined;
  const { offsetX, offsetY } = resolvePixiLayerLayout(settings);
  if (offsetX === 0 && offsetY === 0) return undefined;
  return { transform: `translate(${offsetX}px, ${offsetY}px)` };
}

export function pixiLayoutHostCss(
  settings: PixiLayerSettings | undefined,
  sectionFill: boolean
): Record<string, string> {
  if (sectionFill) {
    return { display: "flex", width: "100%", height: "100%" };
  }
  const layout = resolvePixiLayerLayout(settings);
  const justifyContent =
    layout.alignX === "start"
      ? "flex-start"
      : layout.alignX === "end"
        ? "flex-end"
        : "center";
  const alignItems =
    layout.alignY === "start"
      ? "flex-start"
      : layout.alignY === "end"
        ? "flex-end"
        : "center";
  return {
    display: "flex",
    width: "100%",
    justifyContent,
    alignItems,
  };
}

export function pixiSlotOffsetCss(
  settings: PixiLayerSettings | undefined,
  sectionFill: boolean
): string {
  if (sectionFill) return "";
  const { offsetX, offsetY } = resolvePixiLayerLayout(settings);
  if (offsetX === 0 && offsetY === 0) return "";
  return `transform:translate(${offsetX}px,${offsetY}px);`;
}

export function styleMapToInlineCss(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(";");
}