import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import {
  DEFAULT_PIXI_SCENE,
  normalizePixiLayerSettings,
} from "@/lib/pixi-scene";
import {
  pixiLayoutHostCss,
  pixiSlotOffsetCss,
  styleMapToInlineCss,
} from "@/lib/pixi-layer-layout";
import { pixiLayerVarName } from "@/lib/pixi-gsap";

export const PIXI_MODULE = "8.23.0";
const PIXI_CDN = `https://cdn.jsdelivr.net/npm/pixi.js@${PIXI_MODULE}/dist/pixi.min.mjs`;

export function timelineUsesPixi(model: Timeline): boolean {
  return model.targets.some((t) => t.type === "pixi");
}

export function pixiLayerMarkup(target: AnimationTarget): string {
  const fill = normalizePixiLayerSettings(target.pixiSettings).fillSection;
  const slotClass = fill
    ? "pixi-slot pixi-slot--section-fill"
    : "pixi-slot";
  const hostStyle = styleMapToInlineCss(
    pixiLayoutHostCss(target.pixiSettings, fill)
  );
  const slotExtra = pixiSlotOffsetCss(target.pixiSettings, fill);
  const cfg = normalizePixiLayerSettings(target.pixiSettings);
  const slotSize =
    fill ? "" : `width:${cfg.width}px;height:${cfg.height}px;`;
  const slotStyle = [slotSize, slotExtra].filter(Boolean).join("");
  const hostAttr = hostStyle ? ` style="${hostStyle}"` : "";
  const slotAttr = slotStyle ? ` style="${slotStyle}"` : "";
  return `<div class="pixi-layout-host"${hostAttr}>
          <div class="${slotClass}" data-pixi-id="${target.id}"${fill ? ' data-pixi-fill="1"' : ""}${slotAttr}>
          <div class="pixi-canvas-host" data-pixi-host="${target.id}"></div>
        </div>
        </div>`;
}

export function pixiImportMapEntry(): Record<string, string> {
  return { pixi: PIXI_CDN };
}

export function pixiBootstrapCodeLines(model: Timeline): string[] {
  const layers = model.targets.filter((t) => t.type === "pixi");
  if (layers.length === 0) return [];

  const lines: string[] = [];
  lines.push("window.__pixiLayers = {};");
  lines.push("async function initPixiLayers() {");
  lines.push('  const PIXI = await import("pixi");');

  layers.forEach((t) => {
    const cfg = normalizePixiLayerSettings(t.pixiSettings);
    const scene = t.pixiScene?.trim() || DEFAULT_PIXI_SCENE;
    const fillSection = cfg.fillSection;
    lines.push(`  {`);
    lines.push(
      `    const host = document.querySelector('[data-pixi-host="${t.id}"]');`
    );
    lines.push("    if (!host) return;");
    if (fillSection) {
      lines.push(
        `    let __pw = Math.max(64, host.clientWidth || window.innerWidth);`
      );
      lines.push(
        `    let __ph = Math.max(64, host.clientHeight || window.innerHeight);`
      );
    } else {
      lines.push(`    const __pw = ${cfg.width};`);
      lines.push(`    const __ph = ${cfg.height};`);
    }
    lines.push("    const app = new PIXI.Application();");
    lines.push("    await app.init({");
    lines.push("      width: __pw,");
    lines.push("      height: __ph,");
    lines.push(`      background: ${JSON.stringify(cfg.background)},`);
    lines.push(`      backgroundAlpha: ${cfg.backgroundAlpha},`);
    lines.push("      antialias: true,");
    lines.push("      resolution: window.devicePixelRatio || 1,");
    lines.push("      autoDensity: true,");
    lines.push("    });");
    lines.push("    host.appendChild(app.canvas);");
    lines.push("    const root = new PIXI.Container();");
    lines.push("    root.x = __pw / 2;");
    lines.push("    root.y = __ph / 2;");
    lines.push("    app.stage.addChild(root);");
    lines.push(`    try {`);
    lines.push(`      const fn = new Function("PIXI", "app", "root", "layerId", ${JSON.stringify(scene)});`);
    lines.push(`      fn(PIXI, app, root, ${JSON.stringify(t.id)});`);
    lines.push("    } catch (e) { console.error('[pixi layer]', e); }");
    lines.push(`    window.__pixiLayers[${JSON.stringify(t.id)}] = root;`);
    lines.push("  }");
  });

  lines.push("}");
  lines.push("");
  return lines;
}

export function pixiRootVarLines(model: Timeline): string[] {
  return model.targets
    .filter((t) => t.type === "pixi")
    .map(
      (t) =>
        `const ${pixiLayerVarName(t)} = window.__pixiLayers[${JSON.stringify(t.id)}];`
    );
}