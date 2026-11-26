import {
  buildTweenSteps,
  initialStateToCodeLines,
  tweenStepsToCodeLines,
} from "@/lib/gsap-build";
import {
  DRAW_SVG_CDN,
  MORPH_SVG_CDN,
  timelineUsesDrawSvg,
  timelineUsesMorphSvg,
} from "@/lib/gsap-svg-plugins";
import {
  CSS_RULE_CDN,
  collectCssRuleStylesheet,
  timelineUsesCssRule,
} from "@/lib/gsap-css-rule";
import {
  DRAGGABLE_CDN,
  INERTIA_CDN,
  draggableSetupCodeLines,
  timelineUsesDraggable,
  timelineUsesDraggableInertia,
} from "@/lib/gsap-draggable";
import {
  collectMotionPathGuideIds,
  MOTION_PATH_CDN,
  motionPathGuideSvgMarkup,
  timelineUsesMotionPath,
} from "@/lib/gsap-motion-path";
import {
  splitTextCreateCode,
  SPLIT_TEXT_CDN,
  timelineUsesSplitText,
} from "@/lib/gsap-split-text";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import {
  getScrollPinnedTargets,
  scrollTriggerTimelineCodeLines,
  usesSplitScrollPin,
} from "@/lib/gsap-scroll-pin";
import { resolveStagePerspective, timelineUsesCss3d } from "@/lib/css3d";
import {
  model3dLayerMarkup,
  threeBootstrapCodeLines,
  threeImportMapLines,
  threeRootVarLines,
  timelineUsesModel3d,
} from "@/lib/three-html-export";
import { MODEL3D_VIEW_H, MODEL3D_VIEW_W } from "@/lib/three-preview-fit";
import { layerStackZIndex } from "@/lib/layer-stack";
import {
  buildGoogleFontsStylesheetUrl,
  collectGoogleFontFamilies,
  layerStyleToInlineString,
} from "@/lib/layer-style";
import { sanitizeSvgMarkup } from "@/lib/svg-sanitize";
import {
  normalizeBoundsClass,
  resolveTimelineBackground,
} from "@/lib/timeline-stage";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";

const GSAP_CDN = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js";
const SCROLL_TRIGGER_CDN =
  "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeJsString(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function selectorAttrs(selector: string): string {
  const trimmed = selector.trim();
  if (trimmed.startsWith("#")) {
    return ` id="${escapeHtml(trimmed.slice(1))}"`;
  }
  if (trimmed.startsWith(".")) {
    return ` class="${escapeHtml(trimmed.slice(1))}"`;
  }
  return ` class="${escapeHtml(trimmed.replace(/^\./, ""))}"`;
}

function inlineStyleAttr(target: AnimationTarget): string {
  const inline = layerStyleToInlineString(target.style);
  return inline ? ` style="${escapeHtml(inline)}"` : "";
}

function targetMarkup(target: AnimationTarget): string {
  const attrs = selectorAttrs(target.selector);
  const styleAttr = inlineStyleAttr(target);
  const fill = escapeHtml(target.style?.color ?? "#ffffff");

  if (target.type === "text") {
    return `<p${attrs}${styleAttr}>${escapeHtml(target.text ?? "Testo")}</p>`;
  }
  if (target.type === "model3d") {
    return model3dLayerMarkup(target);
  }
  if (target.type === "image") {
    const src = escapeHtml(target.imageUrl ?? "");
    const alt = escapeHtml(target.name);
    return `<img${attrs}${styleAttr} src="${src}" alt="${alt}" />`;
  }

  if (target.type === "svg") {
    const svg = sanitizeSvgMarkup(target.svgContent);
  const fillColor = target.style?.color
      ? ` style="color: ${escapeHtml(target.style.color)}"`
      : "";
    return `<div${attrs}${styleAttr} aria-label="${escapeHtml(target.name)}"><div class="layer-svg-host"${fillColor}>${svg}</div></div>`;
  }

  const shape = target.shape ?? "square";
  if (shape === "triangle") {
    return `<div${attrs} aria-label="${escapeHtml(target.name)}"><span class="shape shape-triangle" aria-hidden="true" style="border-bottom-color: ${fill}"></span></div>`;
  }
  if (shape === "circle") {
    return `<div${attrs} aria-label="${escapeHtml(target.name)}"><span class="shape shape-circle" aria-hidden="true" style="background-color: ${fill}"></span></div>`;
  }
  return `<div${attrs} aria-label="${escapeHtml(target.name)}"><span class="shape shape-square" aria-hidden="true" style="background-color: ${fill}"></span></div>`;
}

function buildStyles(isScroll: boolean, model: Timeline): string {
  const cssRuleBlock = timelineUsesCssRule(model)
    ? `\n    ${collectCssRuleStylesheet(model)}\n`
    : "";
  const boundsCls = normalizeBoundsClass(model.boundsClass);
  const css3d = timelineUsesCss3d(model);
  const perspectivePx = resolveStagePerspective(model);
  const css3dPerspectiveRule =
    css3d && perspectivePx
      ? `\n    .layer-stack.css3d-stage,\n    .stage.${boundsCls}.css3d-stage {\n      perspective: ${perspectivePx}px;\n      transform-style: preserve-3d;\n    }`
      : "";
  const pageBg = resolveTimelineBackground(model);
  const pageBackgroundRule = pageBg
    ? `\n    html, body {\n      background: ${pageBg};\n      background-attachment: fixed;\n    }`
  : `\n    html, body {\n      background: #0a0a0a;\n    }`;
  return `
    * { box-sizing: border-box; }
    html, body {
      height: 100%;
      min-height: 100%;
      margin: 0;
    }
    html {
      overflow: hidden;
    }
    body {
      overflow: hidden;
      font-family: system-ui, sans-serif;
      color: #fafafa;
    }
    ${pageBackgroundRule}
    ${css3dPerspectiveRule}
    ${cssRuleBlock}
    .stage {
      width: 100%;
      background: transparent;
    }
    .stage.${boundsCls} {
      position: relative;
      min-height: 16rem;
      width: 100%;
    }
    .layer-stack {
      position: relative;
      width: 100%;
    }
    .layer-stack.css3d-stage {
      transform-style: preserve-3d;
    }
    .layer-slot {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    .layer-slot > * {
      transform-style: preserve-3d;
      pointer-events: auto;
    }
    .model3d-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .model3d-canvas-host {
      width: ${MODEL3D_VIEW_W}px;
      height: ${MODEL3D_VIEW_H}px;
      flex-shrink: 0;
      position: relative;
      overflow: hidden;
    }
    .model3d-canvas-host canvas {
      display: block;
      width: ${MODEL3D_VIEW_W}px !important;
      height: ${MODEL3D_VIEW_H}px !important;
      max-width: none !important;
      max-height: none !important;
      border-radius: 0.25rem;
    }
    .stage p {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      text-align: center;
      max-width: 20rem;
    }
    .stage img {
      max-width: 10rem;
      max-height: 10rem;
      object-fit: cover;
      border-radius: 8px;
    }
    .layer-svg-host {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 12rem;
      max-height: 12rem;
      color: #ffffff;
    }
    .layer-svg-host svg {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: 100%;
    }
    .shape {
      display: block;
    }
    .shape-square {
      width: 5rem;
      height: 5rem;
      background: #fff;
    }
    .shape-circle {
      width: 5rem;
      height: 5rem;
      background: #fff;
      border-radius: 9999px;
    }
    .shape-triangle {
      width: 0;
      height: 0;
      border-left: 2.5rem solid transparent;
      border-right: 2.5rem solid transparent;
      border-bottom: 4.3rem solid #fff;
    }
    ${
      isScroll
        ? `
    #scroller {
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      background: transparent;
    }
    #scroller::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    .scroll-spacer { height: 100vh; }
    .scroll-spacer-bottom { height: 200vh; }
    .scroll-content { position: relative; }
    .scroll-flow-layers {
      padding: 4rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 6rem;
    }
    .flow-layer-slot {
      position: relative;
      min-height: 12rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-stage-host {
      position: relative;
      width: 100%;
      min-height: 16rem;
    }
    #scroller .stage,
    #scroller .layer-stack {
      min-height: 16rem;
      height: 100%;
    }
    `
        : `
    .viewport {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .viewport .stage,
    .viewport .layer-stack {
      width: 100%;
      height: 100%;
      min-height: 100vh;
    }
    `
    }
  `;
}

function buildScript(model: Timeline): string {
  const isScroll = model.playbackType === "scroll";
  const usesModel3d = timelineUsesModel3d(model);
  const lines: string[] = [];

  if (usesModel3d) {
    lines.push("(async function () {");
    threeBootstrapCodeLines(model).forEach((line) => lines.push(line));
    lines.push("  await initModel3dLayers();");
    threeRootVarLines(model).forEach((line) => lines.push(`  ${line}`));
    lines.push("");
  }

  const needsDraw = timelineUsesDrawSvg(model);
  const needsMorph = timelineUsesMorphSvg(model);
  const needsSplit = timelineUsesSplitText(model);
  const needsMotionPath = timelineUsesMotionPath(model);
  const needsCssRule = timelineUsesCssRule(model);
  const needsDraggable = timelineUsesDraggable(model);
  const needsInertia = timelineUsesDraggableInertia(model);

  lines.push("gsap.registerPlugin(ScrollTrigger);");
  if (needsDraggable) {
    lines.push(
      'if (typeof Draggable !== "undefined") { gsap.registerPlugin(Draggable); }'
    );
  }
  if (needsInertia) {
    lines.push(
      'if (typeof InertiaPlugin !== "undefined") { gsap.registerPlugin(InertiaPlugin); }'
    );
  }
  if (needsCssRule) {
    lines.push(
      'if (typeof CSSRulePlugin !== "undefined") { gsap.registerPlugin(CSSRulePlugin); }'
    );
  }
  if (needsMotionPath) {
    lines.push(
      'if (typeof MotionPathPlugin !== "undefined") { gsap.registerPlugin(MotionPathPlugin); }'
    );
  }
  if (needsSplit) {
    lines.push(
      'if (typeof SplitText !== "undefined") { gsap.registerPlugin(SplitText); }'
    );
  }
  if (needsDraw) {
    lines.push(
      'if (typeof DrawSVGPlugin !== "undefined") { gsap.registerPlugin(DrawSVGPlugin); }'
    );
  }
  if (needsMorph) {
    lines.push(
      'if (typeof MorphSVGPlugin !== "undefined") { gsap.registerPlugin(MorphSVGPlugin); }'
    );
  }

  model.targets.forEach((target) => {
    splitTextCreateCode(target).forEach((line) => lines.push(line));
  });
  lines.push("");

  model.targets.forEach((target) => {
    const initial = model.initialStates?.[target.id];
    initialStateToCodeLines(target, initial).forEach((line) => lines.push(line));
  });
  lines.push("");

  lines.push("const tl = gsap.timeline({");

  if (isScroll) {
    lines.push("  paused: true,");
    lines.push("  defaults: { immediateRender: false },");
    scrollTriggerTimelineCodeLines(model, ".preview-trigger", {
      scrollerSelector: "#scroller",
    }).forEach((line) => lines.push(line));
  } else if (model.loop) {
    lines.push("  repeat: -1,");
    if (model.yoyo) {
      lines.push("  yoyo: true,");
    }
  }

  lines.push("});");
  lines.push("");

  model.targets.forEach((target) => {
    const initial = model.initialStates?.[target.id];
    const layerKeyframes = model.keyframes.filter(
      (k) => k.targetId === target.id
    );
    if (layerKeyframes.length === 0) return;

    lines.push(`// ${target.name}`);
    const steps = buildTweenSteps(layerKeyframes, initial);
    tweenStepsToCodeLines(target, steps).forEach((line) => {
      lines.push(line);
    });
    lines.push("");
  });

  if (isScroll) {
    lines.push("const scroller = document.getElementById(\"scroller\");");
    lines.push("function syncScrollAnimation() {");
    lines.push("  if (!scroller || !tl.scrollTrigger) return;");
    lines.push("  scroller.scrollTop = 0;");
    lines.push("  ScrollTrigger.refresh();");
    lines.push("  const p = scroller.scrollTop < 2 ? 0 : tl.scrollTrigger.progress;");
    lines.push("  tl.progress(Math.max(0, Math.min(1, p)));");
    lines.push("}");
    lines.push("syncScrollAnimation();");
    lines.push('window.addEventListener("load", syncScrollAnimation);');
    lines.push(
      'window.addEventListener("resize", () => { ScrollTrigger.refresh(); });'
    );
  } else {
    lines.push("tl.play();");
  }

  if (needsDraggable) {
    lines.push("");
    draggableSetupCodeLines(model).forEach((line) => lines.push(line));
  }

  if (usesModel3d) {
    lines.push("})();");
  }

  return lines.join("\n");
}

function buildLayerStackHtml(
  model: Timeline,
  targets = model.targets
): string {
  const motionGuides = timelineUsesMotionPath(model)
    ? `\n        ${motionPathGuideSvgMarkup(collectMotionPathGuideIds(model))}\n        `
    : "";
  return (
    motionGuides +
    targets
      .map(
        (target, index) =>
          `<div class="layer-slot" style="z-index: ${layerStackZIndex(index)}">\n          ${targetMarkup(target)}\n        </div>`
      )
      .join("\n        ")
  );
}

function buildFlowLayersHtml(model: Timeline): string {
  const unpinned = model.targets.filter((t) => !t.scrollPin);
  if (unpinned.length === 0) return "";
  return unpinned
    .map(
      (target) =>
        `<div class="flow-layer-slot">\n          ${targetMarkup(target)}\n        </div>`
    )
    .join("\n        ");
}

function buildBody(model: Timeline): string {
  const isScroll = model.playbackType === "scroll";
  const boundsCls = normalizeBoundsClass(model.boundsClass);
  const splitPin = usesSplitScrollPin(model);
  const pinned = splitPin ? getScrollPinnedTargets(model) : model.targets;
  const stackHtml = buildLayerStackHtml(model, pinned);
  const css3dClass = timelineUsesCss3d(model) ? " css3d-stage" : "";
  const stageInner = splitPin
    ? `<div class="pin-stage-host ${boundsCls}${css3dClass}" data-preview-pin-host>\n        <div class="layer-stack${css3dClass}">\n        ${stackHtml}\n      </div>\n      </div>`
  : `<div class="layer-stack${css3dClass}">\n        ${stackHtml}\n      </div>`;
  const flowBlock =
    isScroll && splitPin
      ? `<div class="scroll-flow-layers">\n        ${buildFlowLayersHtml(model)}\n      </div>\n        `
      : "";
  const stageClassScroll = `stage ${boundsCls} preview-trigger`;
  const stageClassNormal = `stage ${boundsCls}`;

  if (isScroll) {
    return `
    <div id="scroller">
      <div class="scroll-content">
        <div class="scroll-spacer"></div>
        ${flowBlock}<div class="${stageClassScroll}">
          ${stageInner}
        </div>
        <div class="scroll-spacer-bottom"></div>
      </div>
    </div>`;
  }

  return `
    <div class="viewport">
      <div class="${stageClassNormal}">
        ${stageInner}
      </div>
    </div>`;
}

export function generateTimelineHtml(timeline: Timeline): string {
  const model = normalizeTimeline(timeline);
  const isScroll = model.playbackType === "scroll";
  const script = buildScript(model);
  const body = buildBody(model);

  const scrollScript = isScroll
    ? `  <script src="${SCROLL_TRIGGER_CDN}"></script>\n`
    : "";
  const drawScript = timelineUsesDrawSvg(model)
    ? `  <script src="${DRAW_SVG_CDN}"></script>\n`
    : "";
  const morphScript = timelineUsesMorphSvg(model)
    ? `  <script src="${MORPH_SVG_CDN}"></script>\n`
    : "";
  const splitScript = timelineUsesSplitText(model)
    ? `  <script src="${SPLIT_TEXT_CDN}"></script>\n`
    : "";
  const motionPathScript = timelineUsesMotionPath(model)
    ? `  <script src="${MOTION_PATH_CDN}"></script>\n`
    : "";
  const cssRuleScript = timelineUsesCssRule(model)
    ? `  <script src="${CSS_RULE_CDN}"></script>\n`
    : "";
  const draggableScript = timelineUsesDraggable(model)
    ? `  <script src="${DRAGGABLE_CDN}"></script>\n`
    : "";
  const inertiaScript = timelineUsesDraggableInertia(model)
    ? `  <script src="${INERTIA_CDN}"></script>\n`
    : "";

  const fontFamilies = collectGoogleFontFamilies(
    model.targets.map((t) => t.style)
  );
  const fontsHref = buildGoogleFontsStylesheetUrl(fontFamilies);
  const fontsLink = fontsHref
    ? `  <link rel="stylesheet" href="${escapeHtml(fontsHref)}" />\n`
    : "";
  const importMap = timelineUsesModel3d(model)
    ? `${threeImportMapLines().join("\n")}\n`
    : "";

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title></title>
${fontsLink}${importMap}  <style>${buildStyles(isScroll, model)}</style>
</head>
<body>
  ${body}
  <script src="${GSAP_CDN}"></script>
${scrollScript}${drawScript}${morphScript}${splitScript}${motionPathScript}${cssRuleScript}${inertiaScript}${draggableScript}  <script>
${script}
  </script>
</body>
</html>
`;
}

export function downloadTimelineHtml(
  timeline: Timeline,
  filename?: string
): void {
  const html = generateTimelineHtml(timeline);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeName = timeline.name
    .trim()
    .replace(/[^\w\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ??
    `${safeName || "animazione"}-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}