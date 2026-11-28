import { Graphics, Text } from "pixi.js";
import type { Application, Container } from "pixi.js";

export type PixiCanvasAlign = "start" | "center" | "end";

export type PixiLayerSettings = {
  width?: number;
  height?: number;
  background?: string;
  backgroundAlpha?: number;
  /** In sezione fullpage: canvas a tutta area sezione (100% × 100%). */
  fillSection?: boolean;
  /** Posizione canvas nel contenitore (stage / sezione). */
  alignX?: PixiCanvasAlign;
  alignY?: PixiCanvasAlign;
  offsetX?: number;
  offsetY?: number;
};

export const PIXI_VIEW_W = 320;
export const PIXI_VIEW_H = 240;

export const DEFAULT_PIXI_SCENE = `// PIXI, app, root, layerId
const box = new PIXI.Graphics();
box.roundRect(-48, -48, 96, 96, 14);
box.fill(0x7c5cff);
root.addChild(box);

const label = new PIXI.Text({
  text: "Pixi",
  style: { fill: 0xffffff, fontSize: 22, fontWeight: "700" },
});
label.anchor.set(0.5);
root.addChild(label);
`;

export type NormalizedPixiLayerSettings = Required<
  Pick<PixiLayerSettings, "width" | "height" | "background" | "backgroundAlpha">
> & {
  fillSection: boolean;
};

export function normalizePixiLayerSettings(
  settings?: PixiLayerSettings
): NormalizedPixiLayerSettings {
  return {
    width: settings?.width ?? PIXI_VIEW_W,
    height: settings?.height ?? PIXI_VIEW_H,
    background: settings?.background ?? "#1a1a2e",
    backgroundAlpha:
      settings?.backgroundAlpha != null ? settings.backgroundAlpha : 1,
    fillSection: settings?.fillSection === true,
  };
}

/** Se incolli per sbaglio il file .ts (export const … = \`...\`), estrae solo il JS. */
export function normalizePixiSceneSource(source: string): string {
  const trimmed = source.trim();
  const exportTemplate = trimmed.match(
    /^export\s+const\s+[\w$]+\s*=\s*`([\s\S]*?)`\s*;?\s*$/
  );
  if (exportTemplate) {
    return exportTemplate[1].trim();
  }
  if (/^\s*export\s/m.test(trimmed)) {
    const start = trimmed.indexOf("`");
    const end = trimmed.lastIndexOf("`");
    if (start >= 0 && end > start) {
      return trimmed.slice(start + 1, end).trim();
    }
  }
  const loneTemplate = trimmed.match(/^`([\s\S]*?)`\s*;?$/);
  if (loneTemplate) {
    return loneTemplate[1].trim();
  }
  return trimmed;
}

export function runPixiSceneScript(
  PIXI: typeof import("pixi.js"),
  app: Application,
  root: Container,
  layerId: string,
  source: string
): void {
  const trimmed = normalizePixiSceneSource(source);
  if (!trimmed) return;
  try {
    const fn = new Function("PIXI", "app", "root", "layerId", trimmed);
    fn(PIXI, app, root, layerId);
  } catch (err) {
    console.error("[pixi layer]", layerId, err);
  }
}

export function defaultPixiScenePreview(): void {
  void Graphics;
  void Text;
}