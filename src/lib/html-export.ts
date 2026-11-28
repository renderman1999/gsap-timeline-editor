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
import { keyframeEaseCodeLines, timelineUsesEasePlugin } from "@/lib/gsap-ease";
import { timelineLabelCodeLines } from "@/lib/gsap-labels";
import {
  CUSTOM_BOUNCE_CDN,
  CUSTOM_EASE_CDN,
  CUSTOM_WIGGLE_CDN,
  EASE_PACK_CDN,
  extraPluginRegisterLines,
  FLIP_CDN,
  PHYSICS_2D_CDN,
  PHYSICS_PROPS_CDN,
  SCRAMBLE_TEXT_CDN,
  SCROLL_TO_CDN,
  timelineUsesFlip,
  timelineUsesPhysics2D,
  timelineUsesPhysicsProps,
  timelineUsesScrambleText,
  timelineUsesScrollTo,
} from "@/lib/gsap-extra-plugins";
import { imageLayerInlineStyle } from "@/lib/image-layer";
import { STAR_CLIP_PATH } from "@/lib/shape-star";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import {
  looseSectionTargets,
  pinnedResolvedSections,
  resolveTimelineSections,
  sectionIsPinned,
  sectionMemberIds,
  sectionScrubLayers,
  targetsOutsideSectionScrub,
} from "@/lib/timeline-sections";
import {
  scrollTriggerTimelineCodeLines,
  usesSplitScrollPin,
} from "@/lib/gsap-scroll-pin";
import {
  partitionScrollPlayback,
  timePlaybackOptionLines,
  previewLayerScrollTriggerSelector,
  previewPinSectionSelector,
  scrollTriggerPinnedSectionCodeLines,
  scrollTriggerTargetCodeLines,
} from "@/lib/scroll-trigger-per-layer";
import { resolveStagePerspective, timelineUsesCss3d } from "@/lib/css3d";
import {
  model3dLayerMarkup,
  threeBootstrapCodeLines,
  threeRootVarLines,
  timelineUsesModel3d,
} from "@/lib/three-html-export";
import {
  pixiBootstrapCodeLines,
  pixiImportMapEntry,
  pixiLayerMarkup,
  pixiRootVarLines,
  timelineUsesPixi,
} from "@/lib/pixi-html-export";
import { MODEL3D_VIEW_H, MODEL3D_VIEW_W } from "@/lib/three-preview-fit";
import { layerStackZIndex } from "@/lib/layer-stack";
import { shapeLayerStyledExportMarkup } from "@/lib/shape-markup";
import {
  appendLayerMarkupClass,
  buildGoogleFontsStylesheetUrl,
  collectGoogleFontFamilies,
  layerBaseStyleToInlineString,
  layerCustomCssInlineString,
  layerTextUsesFullViewportWidth,
  TEXT_FULL_VIEWPORT_WIDTH_CLASS,
} from "@/lib/layer-style";
import { sanitizeSvgMarkup } from "@/lib/svg-sanitize";
import {
  buildCodeLayerScriptBlocks,
  codeLayerMarkupInner,
} from "@/lib/code-layer";
import {
  normalizeBoundsClass,
  resolveTimelineBackground,
} from "@/lib/timeline-stage";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";

const GSAP_CDN = "https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js";
const THREE_MODULE = "0.187.0";

function buildExportImportMap(model: Timeline): string {
  const usesModel3d = timelineUsesModel3d(model);
  const usesPixi = timelineUsesPixi(model);
  if (!usesModel3d && !usesPixi) return "";
  const imports: Record<string, string> = {};
  if (usesModel3d) {
    imports.three = `https://unpkg.com/three@${THREE_MODULE}/build/three.module.js`;
    imports["three/addons/"] = `https://unpkg.com/three@${THREE_MODULE}/examples/jsm/`;
  }
  if (usesPixi) Object.assign(imports, pixiImportMapEntry());
  return `<script type="importmap">\n${JSON.stringify({ imports }, null, 2)}\n</script>\n`;
}
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

function inlineBaseStyleAttr(target: AnimationTarget): string {
  const inline = layerBaseStyleToInlineString(target.style);
  return inline ? ` style="${escapeHtml(inline)}"` : "";
}

function wrapLayerCustomCss(inner: string, target: AnimationTarget): string {
  const inline = layerCustomCssInlineString(target.style);
  if (!inline.trim()) return inner;
  return `<div class="layer-custom-css" style="${escapeHtml(inline)}">${inner}</div>`;
}

function previewTargetAttr(target: AnimationTarget): string {
  return ` data-preview-target="${escapeHtml(target.id)}"`;
}

function buildTextLayerMarkup(target: AnimationTarget): string {
  const attrs = selectorAttrs(target.selector);
  const styleAttr = inlineBaseStyleAttr(target);
  const tweenAttr = previewTargetAttr(target);
  const textClass = layerTextUsesFullViewportWidth(target.style)
    ? `${TEXT_FULL_VIEWPORT_WIDTH_CLASS} font-semibold text-center`
    : "font-semibold text-center";
  const textAttrs = appendLayerMarkupClass(attrs, textClass);
  const p = `<p${tweenAttr}${textAttrs}${styleAttr} data-text-layer>${escapeHtml(target.text ?? "Testo")}</p>`;
  const customInline = layerCustomCssInlineString(target.style);
  const customStyleAttr = customInline.trim()
    ? ` style="${escapeHtml(customInline)}"`
    : "";
  return `<div class="layer-custom-css"${customStyleAttr}><div class="layer-tween-host layer-custom-css-host">${p}</div></div>`;
}

function targetMarkup(target: AnimationTarget): string {
  const attrs = selectorAttrs(target.selector);
  const styleAttr = inlineBaseStyleAttr(target);
  const tweenAttr = previewTargetAttr(target);

  let inner: string;
  if (target.type === "text") {
    return buildTextLayerMarkup(target);
  } else if (target.type === "model3d") {
    inner = model3dLayerMarkup(target);
  } else if (target.type === "image") {
    const src = escapeHtml(target.imageUrl ?? "");
    const alt = escapeHtml(target.name);
    const size = imageLayerInlineStyle(target.imageWidth);
    const base = layerBaseStyleToInlineString(target.style);
    const imageStyle = ` style="${escapeHtml([size, base].filter(Boolean).join(";"))}"`;
    const imageAttrs = appendLayerMarkupClass(attrs, "layer-image");
    inner = `<img${tweenAttr}${imageAttrs}${imageStyle} src="${src}" alt="${alt}" />`;
  } else if (target.type === "svg") {
    const svg = sanitizeSvgMarkup(target.svgContent);
    const fillColor = target.style?.color
      ? ` style="color: ${escapeHtml(target.style.color)}"`
      : "";
    inner = `<div${tweenAttr}${attrs}${styleAttr} aria-label="${escapeHtml(target.name)}"><div class="layer-svg-host"${fillColor}>${svg}</div></div>`;
  } else if (target.type === "pixi") {
    inner = pixiLayerMarkup(target);
  } else if (target.type === "code") {
    const markup = codeLayerMarkupInner(target);
    const hostAttrs = appendLayerMarkupClass(
      `${tweenAttr}${attrs}${styleAttr}`,
      "layer-code-host layer-tween-host"
    );
    inner = `<div${hostAttrs} data-code-layer>${markup}</div>`;
  } else {
    const shapeAttrs = appendLayerMarkupClass(
      `${tweenAttr}${attrs}`,
      "layer-shape-host"
    );
    inner = `<div${shapeAttrs} aria-label="${escapeHtml(target.name)}">${shapeLayerStyledExportMarkup(target)}</div>`;
  }

  return wrapLayerCustomCss(inner, target);
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
    .stage.preview-trigger {
      position: relative;
      width: 100%;
      min-height: 16rem;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .layer-stack {
      position: relative;
      width: 100%;
      min-height: 16rem;
    }
    .pin-stage-host .layer-stack {
      min-height: 16rem;
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
    .pixi-layout-host {
      box-sizing: border-box;
    }
    .pixi-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .pixi-canvas-host canvas {
      display: block;
      max-width: 100%;
      height: auto;
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
    .layer-code-host {
      display: block;
      max-width: 100%;
    }
    .layer-code-host img {
      max-width: 100%;
      height: auto;
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
    p.${TEXT_FULL_VIEWPORT_WIDTH_CLASS} {
      max-width: none;
      padding-left: 1.25rem;
      padding-right: 1.25rem;
      box-sizing: border-box;
    }
  .stage p.${TEXT_FULL_VIEWPORT_WIDTH_CLASS},
  .layer-slot p.${TEXT_FULL_VIEWPORT_WIDTH_CLASS} {
      width: 100vw;
      margin-left: calc(50% - 50vw);
      margin-right: calc(50% - 50vw);
    }
    .flow-layer-slot p.${TEXT_FULL_VIEWPORT_WIDTH_CLASS} {
      width: 100%;
      margin-left: 0;
      margin-right: 0;
    }
    img.layer-image,
    .stage img {
      height: auto;
      object-fit: contain;
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
    .layer-shape-host {
      display: flex;
      width: max-content;
      height: max-content;
      line-height: 0;
    }
    .layer-tween-host > p,
    p[data-text-layer] {
      margin: 0;
    }
    .shape-export-chrome {
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      line-height: 0;
    }
    .shape-square {
      width: 5rem;
      height: 5rem;
      box-sizing: border-box;
    }
    .shape-circle {
      width: 5rem;
      height: 5rem;
      border-radius: 9999px;
      box-sizing: border-box;
    }
    .shape-triangle {
      width: 0;
      height: 0;
      border-left: 40px solid transparent;
      border-right: 40px solid transparent;
      border-bottom: 69px solid #fff;
    }
    .shape-star {
      width: 5rem;
      height: 5rem;
      clip-path: ${STAR_CLIP_PATH};
      box-sizing: border-box;
    }
    .shape-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 5rem;
      height: 5rem;
    }
    .shape-icon-svg {
      display: block;
      width: 5rem;
      height: 5rem;
    }
    ${
      isScroll
        ? `
    #scroller {
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      container-type: size;
      scrollbar-width: none;
      -ms-overflow-style: none;
      background: transparent;
    }
    #scroller::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
    .scroll-spacer { height: 40vh; }
    .scroll-spacer-bottom { height: 80vh; }
    .scroll-content { position: relative; }
    .scroll-flow-layers {
      padding: 4rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 6rem;
    }
    .section-layers {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2rem;
    }
    .scroll-section {
      position: relative;
      width: 100%;
      min-height: 12rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .pin-layer-section {
      position: relative;
      width: 100%;
      height: 100cqh;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .flow-layer-slot {
      position: relative;
      min-height: 12rem;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }
    .pin-stage-host {
      position: relative;
      width: 100%;
      min-height: 16rem;
    }
    #scroller .stage.preview-trigger,
    #scroller .preview-trigger .pin-stage-host,
    #scroller .preview-trigger .layer-stack {
      min-height: 100vh;
      height: auto;
    }
    #scroller .preview-trigger .layer-slot {
      min-height: 100vh;
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
  const usesPixi = timelineUsesPixi(model);
  const needsAsyncBoot = usesModel3d || usesPixi;
  const lines: string[] = [];

  if (needsAsyncBoot) {
    lines.push("(async function () {");
    if (usesModel3d) {
      threeBootstrapCodeLines(model).forEach((line) => lines.push(line));
      lines.push("  await initModel3dLayers();");
      threeRootVarLines(model).forEach((line) => lines.push(`  ${line}`));
      lines.push("");
    }
    if (usesPixi) {
      pixiBootstrapCodeLines(model).forEach((line) => lines.push(line));
      lines.push("  await initPixiLayers();");
      pixiRootVarLines(model).forEach((line) => lines.push(`  ${line}`));
      lines.push("");
    }
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
  extraPluginRegisterLines(model).forEach((line) => lines.push(line));
  keyframeEaseCodeLines(model.keyframes).forEach((line) => lines.push(line));

  model.targets.forEach((target) => {
    splitTextCreateCode(target).forEach((line) => lines.push(line));
  });
  lines.push("");

  model.targets.forEach((target) => {
    const initial = model.initialStates?.[target.id];
    initialStateToCodeLines(target, initial).forEach((line) => lines.push(line));
  });
  lines.push("");

  const sectionPins = isScroll ? pinnedResolvedSections(model) : [];
  const { timed, pinned, own, shared: sharedFree } = partitionScrollPlayback(
    isScroll ? targetsOutsideSectionScrub(model) : model.targets
  );
  const shared = isScroll
    ? [...sharedFree, ...looseSectionTargets(model)]
    : sharedFree;
  const needsMasterScrollTrigger = isScroll && shared.length > 0;
  const masterTriggerSelector =
    pinned.length > 0 || sectionPins.length > 0
      ? ".scroll-flow-layers"
      : ".preview-trigger";

  const appendTargetTweenLines = (
    target: (typeof model.targets)[number],
    timelineVar: string
  ) => {
    const initial = model.initialStates?.[target.id];
    const layerKeyframes = model.keyframes.filter(
      (k) => (k.targetId ?? model.activeTargetId) === target.id
    );
    if (layerKeyframes.length === 0) return;

    lines.push(`// ${target.name}`);
    const steps = buildTweenSteps(layerKeyframes, initial);
    tweenStepsToCodeLines(target, steps).forEach((line) => {
      lines.push(
        timelineVar === "tl"
          ? line
          : line.replace(/^tl\./, `${timelineVar}.`)
      );
    });
    lines.push("");
  };

  if (isScroll && (sectionPins.length > 0 || pinned.length > 0)) {
    const pinCount = sectionPins.length + pinned.length;
    sectionPins.forEach((section, index) => {
      const safeId = section.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlPin_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      lines.push("  paused: true,");
      lines.push("  defaults: { immediateRender: false },");
      scrollTriggerPinnedSectionCodeLines(
        model,
        { id: section.id } as (typeof model.targets)[number],
        previewPinSectionSelector({
          id: section.id,
        } as (typeof model.targets)[number]),
        {
          scrollerSelector: "#scroller",
          refreshPriority: pinCount - index,
        }
      ).forEach((line) => lines.push(line));
      lines.push("});");
      timelineLabelCodeLines(tlVar, model.labels).forEach((line) =>
        lines.push(line)
      );
      lines.push("");
      sectionScrubLayers(section).forEach((layer) => {
        appendTargetTweenLines(layer, tlVar);
      });
    });
    pinned.forEach((target, index) => {
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlPin_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      lines.push("  paused: true,");
      lines.push("  defaults: { immediateRender: false },");
      scrollTriggerPinnedSectionCodeLines(
        model,
        target,
        previewPinSectionSelector(target),
        {
          scrollerSelector: "#scroller",
          refreshPriority: pinCount - (sectionPins.length + index),
        }
      ).forEach((line) => lines.push(line));
      lines.push("});");
      timelineLabelCodeLines(tlVar, model.labels).forEach((line) =>
        lines.push(line)
      );
      lines.push("");
      appendTargetTweenLines(target, tlVar);
    });
  }

  if (isScroll && own.length > 0) {
    own.forEach((target) => {
      const layerKeyframes = model.keyframes.filter(
        (k) => (k.targetId ?? model.activeTargetId) === target.id
      );
      if (layerKeyframes.length === 0) return;
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlLayer_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      lines.push("  paused: true,");
      lines.push("  defaults: { immediateRender: false },");
      scrollTriggerTargetCodeLines(
        model,
        target,
        previewLayerScrollTriggerSelector(target),
        { scrollerSelector: "#scroller", refreshPriority: pinned.length + 1 }
      ).forEach((line) => lines.push(line));
      lines.push("});");
      timelineLabelCodeLines(tlVar, model.labels).forEach((line) =>
        lines.push(line)
      );
      lines.push("");
      appendTargetTweenLines(target, tlVar);
    });
  }

  if (isScroll && timed.length > 0) {
    timed.forEach((target) => {
      const layerKeyframes = model.keyframes.filter(
        (k) => (k.targetId ?? model.activeTargetId) === target.id
      );
      if (layerKeyframes.length === 0) return;
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlTime_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      timePlaybackOptionLines(model).forEach((line) => lines.push(line));
      lines.push("});");
      timelineLabelCodeLines(tlVar, model.labels).forEach((line) =>
        lines.push(line)
      );
      lines.push("");
      appendTargetTweenLines(target, tlVar);
      lines.push(`${tlVar}.play();`);
      lines.push("");
    });
  }

  if (!isScroll || needsMasterScrollTrigger) {
    lines.push("const tl = gsap.timeline({");

    if (isScroll) {
      lines.push("  paused: true,");
      lines.push("  defaults: { immediateRender: false },");
      scrollTriggerTimelineCodeLines(model, masterTriggerSelector, {
        scrollerSelector: "#scroller",
        refreshPriority: pinned.length + 1,
      }).forEach((line) => lines.push(line));
    } else if (model.loop) {
      lines.push("  repeat: -1,");
      if (model.yoyo) {
        lines.push("  yoyo: true,");
      }
    }

    lines.push("});");
    timelineLabelCodeLines("tl", model.labels).forEach((line) => lines.push(line));
    lines.push("");

    const masterTargets = isScroll ? shared : model.targets;
    masterTargets.forEach((target) => appendTargetTweenLines(target, "tl"));
    if (isScroll) {
      lines.push('if (typeof tl !== "undefined") { window.__gsapMasterTl = tl; }');
    }
  }

  if (isScroll) {
    lines.push("function syncScrollAnimations() {");
    lines.push("  if (typeof ScrollTrigger === \"undefined\") return;");
    lines.push("  ScrollTrigger.getAll().forEach(function (st) {");
    lines.push("    if (st.animation) st.animation.progress(st.progress);");
    lines.push("  });");
    lines.push("}");
    lines.push("window.syncScrollAnimations = syncScrollAnimations;");
    lines.push("function refreshScrollPreviews() {");
    lines.push("  ScrollTrigger.refresh();");
    lines.push("  syncScrollAnimations();");
    lines.push("}");
    lines.push("refreshScrollPreviews();");
    if (needsMasterScrollTrigger) {
      lines.push("function syncMasterScrollAnimation() {");
      lines.push("  syncScrollAnimations();");
      lines.push("}");
      lines.push("syncMasterScrollAnimation();");
    }
  } else {
    lines.push("tl.play();");
  }

  if (needsDraggable) {
    lines.push("");
    draggableSetupCodeLines(model).forEach((line) => lines.push(line));
  }

  lines.push(
    "try { window.dispatchEvent(new Event(\"gsap-export-ready\")); } catch (_) {}"
  );

  if (needsAsyncBoot) {
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

function sectionLayersHtml(layers: Timeline["targets"]): string {
  return `<div class="section-layers">\n          ${layers
    .map((layer) => targetMarkup(layer))
    .join("\n          ")}\n        </div>`;
}

function buildFlowLayersHtml(model: Timeline): string {
  const members = sectionMemberIds(model);
  const unpinned = model.targets.filter(
    (target) =>
      !members.has(target.id) &&
      (target.timePlayback === true || !target.scrollPin)
  );
  const loose = resolveTimelineSections(model).filter(
    (section) => !sectionIsPinned(section)
  );
  const slots = unpinned.map(
    (target) =>
      `<div class="flow-layer-slot">\n          ${targetMarkup(target)}\n        </div>`
  );
  const groups = loose.map(
    (section) =>
      `<div class="scroll-section" data-scroll-section="${escapeHtml(section.id)}">\n          ${sectionLayersHtml(section.layers)}\n        </div>`
  );
  return [...slots, ...groups].join("\n        ");
}

function buildPinSectionsHtml(model: Timeline): string {
  const members = sectionMemberIds(model);
  const grouped = pinnedResolvedSections(model).map(
    (section) =>
      `<section class="pin-layer-section" data-pin-section="${escapeHtml(section.id)}">\n          ${sectionLayersHtml(section.layers)}\n        </section>`
  );
  const singles = model.targets
    .filter(
      (target) =>
        target.scrollPin &&
        target.timePlayback !== true &&
        !members.has(target.id)
    )
    .map(
      (target) =>
        `<section class="pin-layer-section" data-pin-section="${escapeHtml(target.id)}">\n          ${targetMarkup(target)}\n        </section>`
    );
  return [...grouped, ...singles].join("\n        ");
}

function buildBody(model: Timeline): string {
  const isScroll = model.playbackType === "scroll";
  const boundsCls = normalizeBoundsClass(model.boundsClass);
  const splitPin = usesSplitScrollPin(model);
  const stageTargets = splitPin ? [] : model.targets;
  const stackHtml = buildLayerStackHtml(model, stageTargets);
  const css3dClass = timelineUsesCss3d(model) ? " css3d-stage" : "";
  const stageInner = `<div class="layer-stack${css3dClass}">\n        ${stackHtml}\n      </div>`;
  const flowHtml = buildFlowLayersHtml(model);
  const flowBlock =
    isScroll && splitPin && flowHtml
      ? `<div class="scroll-flow-layers">\n        ${flowHtml}\n      </div>\n        `
      : "";
  const pinBlock =
    isScroll && splitPin ? `${buildPinSectionsHtml(model)}\n        ` : "";
  const topSpacer =
    isScroll ? `<div class="scroll-spacer"></div>\n        ` : "";
  const stageClassScroll = `stage ${boundsCls} preview-trigger`;
  const stageClassNormal = `stage ${boundsCls}`;

  if (isScroll) {
    const stageBlock = splitPin
      ? ""
      : `<div class="${stageClassScroll}">
          ${stageInner}
        </div>\n        `;
    return `
    <div id="scroller">
      <div class="scroll-content">
        ${topSpacer}${flowBlock}${pinBlock}${stageBlock}<div class="scroll-spacer-bottom"></div>
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
  const easePackScript = timelineUsesEasePlugin(model, "easePack")
    ? `  <script src="${EASE_PACK_CDN}"></script>\n`
    : "";
  const customEaseScript = timelineUsesEasePlugin(model, "customEase")
    ? `  <script src="${CUSTOM_EASE_CDN}"></script>\n`
    : "";
  const customWiggleScript = timelineUsesEasePlugin(model, "customWiggle")
    ? `  <script src="${CUSTOM_WIGGLE_CDN}"></script>\n`
    : "";
  const customBounceScript = timelineUsesEasePlugin(model, "customBounce")
    ? `  <script src="${CUSTOM_BOUNCE_CDN}"></script>\n`
    : "";
  const flipScript = timelineUsesFlip(model)
    ? `  <script src="${FLIP_CDN}"></script>\n`
    : "";
  const scrambleScript = timelineUsesScrambleText(model)
    ? `  <script src="${SCRAMBLE_TEXT_CDN}"></script>\n`
    : "";
  const physics2dScript = timelineUsesPhysics2D(model)
    ? `  <script src="${PHYSICS_2D_CDN}"></script>\n`
    : "";
  const physicsPropsScript = timelineUsesPhysicsProps(model)
    ? `  <script src="${PHYSICS_PROPS_CDN}"></script>\n`
    : "";
  const scrollToScript = timelineUsesScrollTo(model)
    ? `  <script src="${SCROLL_TO_CDN}"></script>\n`
    : "";

  const fontFamilies = collectGoogleFontFamilies(
    model.targets.map((t) => t.style)
  );
  const fontsHref = buildGoogleFontsStylesheetUrl(fontFamilies);
  const fontsLink = fontsHref
    ? `  <link rel="stylesheet" href="${escapeHtml(fontsHref)}" />\n`
    : "";
  const importMap = buildExportImportMap(model);
  const codeLayerScripts = buildCodeLayerScriptBlocks(model.targets);
  const codeLayerScriptBlock = codeLayerScripts.trim()
    ? `  <script>\n${codeLayerScripts}\n  </script>\n`
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
  ${codeLayerScriptBlock}  <script src="${GSAP_CDN}"></script>
${scrollScript}${drawScript}${morphScript}${splitScript}${motionPathScript}${cssRuleScript}${inertiaScript}${draggableScript}${easePackScript}${customEaseScript}${customWiggleScript}${customBounceScript}${flipScript}${scrambleScript}${physics2dScript}${physicsPropsScript}${scrollToScript}  <script>
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