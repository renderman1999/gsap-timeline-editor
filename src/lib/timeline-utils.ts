import {
  buildTweenSteps,
  EXPORT_CODE_VERSION,
  SCROLL_TRIGGER_SELECTOR,
  tweenStepsToCodeLines,
} from "@/lib/gsap-build";
import { keyframeEaseCodeLines } from "@/lib/gsap-ease";
import { timelineLabelCodeLines } from "@/lib/gsap-labels";
import {
  extraPluginImportLines,
  extraPluginModuleRegisterLines,
} from "@/lib/gsap-extra-plugins";
import {
  timelineUsesDrawSvg,
  timelineUsesMorphSvg,
} from "@/lib/gsap-svg-plugins";
import { timelineUsesCssRule } from "@/lib/gsap-css-rule";
import {
  draggableSetupCodeLines,
  timelineUsesDraggable,
  timelineUsesDraggableInertia,
} from "@/lib/gsap-draggable";
import {
  timelineUsesMotionPath,
} from "@/lib/gsap-motion-path";
import {
  splitTextCreateCode,
  timelineUsesSplitText,
} from "@/lib/gsap-split-text";
import { normalizeTimeline } from "@/lib/timeline-migrate";
import {
  looseSectionTargets,
  pinnedResolvedSections,
  sectionScrubLayers,
  targetsOutsideSectionScrub,
} from "@/lib/timeline-sections";
import {
  scrollTriggerTimelineCodeLines,
} from "@/lib/gsap-scroll-pin";
import {
  partitionScrollPlayback,
  timePlaybackOptionLines,
  previewLayerScrollTriggerSelector,
  previewPinSectionSelector,
  scrollTriggerPinnedSectionCodeLines,
  scrollTriggerTargetCodeLines,
} from "@/lib/scroll-trigger-per-layer";
import { Timeline } from "@/stores/timeline-store";

export interface TimelineExport {
  version: string;
  timelines: Timeline[];
  exportedAt: string;
}

export const exportTimelines = (timelines: Timeline[]): string => {
  const exportData: TimelineExport = {
    version: EXPORT_CODE_VERSION,
    timelines,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
};

export const importTimelines = (jsonString: string): Timeline[] => {
  try {
    const data = JSON.parse(jsonString) as TimelineExport;

    // Validate the structure
    if (!data.timelines || !Array.isArray(data.timelines)) {
      throw new Error("Invalid timeline data structure");
    }

    // Validate each timeline
    data.timelines.forEach((timeline, index) => {
      if (
        !timeline.id ||
        !timeline.name ||
        !Array.isArray(timeline.keyframes)
      ) {
        throw new Error(`Invalid timeline at index ${index}`);
      }
    });

    return data.timelines;
  } catch (error) {
    throw new Error(
      `Failed to import timelines: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const downloadTimelines = (timelines: Timeline[], filename?: string) => {
  const jsonString = exportTimelines(timelines);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename || `gsap-timelines-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const generateTimelineCode = (timeline: Timeline): string => {
  const model = normalizeTimeline(timeline);
  const lines: string[] = [];
  const isScroll = model.playbackType === "scroll";

  lines.push(`// GSAP Timeline: ${model.name}`);
  lines.push(`// Generated with GSAP Timeline Editor v${EXPORT_CODE_VERSION}`);
  lines.push(`import { keyframeEaseCodeLines } from "@/lib/gsap-ease";
import {
  extraPluginImportLines,
  extraPluginModuleRegisterLines,
} from "@/lib/gsap-extra-plugins";`);
  lines.push(`import { ScrollTrigger } from "gsap/ScrollTrigger";`);
  const needsDraw = timelineUsesDrawSvg(model);
  const needsMorph = timelineUsesMorphSvg(model);
  const needsSplit = timelineUsesSplitText(model);
  const needsMotionPath = timelineUsesMotionPath(model);
  const needsCssRule = timelineUsesCssRule(model);
  const needsDraggable = timelineUsesDraggable(model);
  const needsInertia = timelineUsesDraggableInertia(model);
  if (needsDraw) {
    lines.push(`import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";`);
  }
  if (needsMorph) {
    lines.push(`import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";`);
  }
  if (needsSplit) {
    lines.push(`import { SplitText } from "gsap/SplitText";`);
  }
  if (needsMotionPath) {
    lines.push(`import { MotionPathPlugin } from "gsap/MotionPathPlugin";`);
  }
  if (needsCssRule) {
    lines.push(`import { CSSRulePlugin } from "gsap/CSSRulePlugin";`);
  }
  if (needsDraggable) {
    lines.push(`import { Draggable } from "gsap/Draggable";`);
  }
  if (needsInertia) {
    lines.push(`import { InertiaPlugin } from "gsap/InertiaPlugin";`);
  }
  extraPluginImportLines(model).forEach((line) => lines.push(line));
  lines.push("");
  lines.push(`gsap.registerPlugin(ScrollTrigger);`);
  if (needsDraw) {
    lines.push(`gsap.registerPlugin(DrawSVGPlugin);`);
  }
  if (needsMorph) {
    lines.push(`gsap.registerPlugin(MorphSVGPlugin);`);
  }
  if (needsSplit) {
    lines.push(`gsap.registerPlugin(SplitText);`);
  }
  if (needsMotionPath) {
    lines.push(`gsap.registerPlugin(MotionPathPlugin);`);
  }
  if (needsCssRule) {
    lines.push(`gsap.registerPlugin(CSSRulePlugin);`);
  }
  if (needsDraggable) {
    lines.push(`gsap.registerPlugin(Draggable);`);
  }
  if (needsInertia) {
    lines.push(`gsap.registerPlugin(InertiaPlugin);`);
  }
  extraPluginModuleRegisterLines(model).forEach((line) => lines.push(line));
  keyframeEaseCodeLines(model.keyframes).forEach((line) => lines.push(line));
  lines.push("");
  const sectionPins = isScroll ? pinnedResolvedSections(model) : [];
  const { timed, pinned, own, shared: sharedFree } = partitionScrollPlayback(
    isScroll ? targetsOutsideSectionScrub(model) : model.targets
  );
  const shared = isScroll
    ? [...sharedFree, ...looseSectionTargets(model)]
    : sharedFree;
  const needsMasterScrollTrigger = isScroll && shared.length > 0;

  model.targets.forEach((target) => {
    splitTextCreateCode(target).forEach((line) => lines.push(line));
  });
  if (model.targets.some((t) => splitTextCreateCode(t).length > 0)) {
    lines.push("");
  }

  const appendTargetTweenLines = (
    target: (typeof model.targets)[number],
    timelineVar: string
  ) => {
    const layerKeyframes = model.keyframes.filter(
      (k) => k.targetId === target.id
    );
    if (layerKeyframes.length === 0) return;

    lines.push(`// Layer: ${target.name} (${target.selector})`);
    const steps = buildTweenSteps(
      layerKeyframes,
      model.initialStates?.[target.id]
    );
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
      lines.push(`  defaults: { immediateRender: false },`);
      scrollTriggerPinnedSectionCodeLines(
        model,
        { id: section.id } as (typeof model.targets)[number],
        previewPinSectionSelector({
          id: section.id,
        } as (typeof model.targets)[number]),
        { refreshPriority: pinCount - index }
      ).forEach((line) => lines.push(line));
      lines.push(`});`);
      timelineLabelCodeLines(tlVar, model.labels).forEach((line) =>
        lines.push(line)
      );
      lines.push("");
      sectionScrubLayers(section).forEach((layer) => {
        appendTargetTweenLines(layer, tlVar);
      });
    });
    pinned.forEach((target, index) => {
      const layerKeyframes = model.keyframes.filter(
        (k) => k.targetId === target.id
      );
      if (layerKeyframes.length === 0) return;
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlPin_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      lines.push(`  defaults: { immediateRender: false },`);
      scrollTriggerPinnedSectionCodeLines(
        model,
        target,
        previewPinSectionSelector(target),
        { refreshPriority: pinCount - (sectionPins.length + index) }
      ).forEach((line) => lines.push(line));
      lines.push(`});`);
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
        (k) => k.targetId === target.id
      );
      if (layerKeyframes.length === 0) return;
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlLayer_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      lines.push(`  defaults: { immediateRender: false },`);
      scrollTriggerTargetCodeLines(
        model,
        target,
        previewLayerScrollTriggerSelector(target),
        { refreshPriority: pinned.length + 1 }
      ).forEach((line) => lines.push(line));
      lines.push(`});`);
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
        (k) => k.targetId === target.id
      );
      if (layerKeyframes.length === 0) return;
      const safeId = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
      const tlVar = `tlTime_${safeId}`;
      lines.push(`const ${tlVar} = gsap.timeline({`);
      timePlaybackOptionLines(model).forEach((line) => lines.push(line));
      lines.push(`});`);
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
    lines.push(`const tl = gsap.timeline({`);

    if (isScroll) {
      lines.push(`  defaults: { immediateRender: false },`);
      scrollTriggerTimelineCodeLines(
        model,
        pinned.length > 0 ? ".scroll-flow-layers" : SCROLL_TRIGGER_SELECTOR,
        { refreshPriority: pinned.length + 1 }
      ).forEach((line) => lines.push(line));
    } else if (model.loop) {
      lines.push(`  repeat: -1,`);
      if (model.yoyo) {
        lines.push(`  yoyo: true,`);
      }
    }

    lines.push(`});`);
    timelineLabelCodeLines("tl", model.labels).forEach((line) => lines.push(line));
    lines.push("");

    const masterTargets = isScroll ? shared : model.targets;
    masterTargets.forEach((target) => appendTargetTweenLines(target, "tl"));
  }

  if (isScroll) {
    lines.push("");
    lines.push(`// Sostituisci ${SCROLL_TRIGGER_SELECTOR} con il tuo trigger`);
    lines.push("// Layer con pin: timeline tlPin_* , trigger [data-pin-section]");
    lines.push("// Layer con ScrollTrigger proprio: timeline tlLayer_* + trigger sul layer");
    lines.push("// Aggiungi scroller: \"#id\" in scrollTrigger se non usi la viewport");
  }

  if (needsDraggable) {
    lines.push("");
    draggableSetupCodeLines(model).forEach((line) => lines.push(line));
  }

  return lines.join("\n");
};
