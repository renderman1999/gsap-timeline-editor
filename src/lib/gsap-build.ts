import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import {
  appendCssRuleSteps,
  applyCssVarTransformToProps,
  buildCssRuleFromGroups,
  cssRuleStepsToCodeLines,
  groupCssRuleTransforms,
  type CssRuleTweenPayload,
} from "@/lib/gsap-css-rule";
import {
  applyMotionPathTransformToProps,
  motionPathConfigToCode,
  type MotionPathGsapConfig,
} from "@/lib/gsap-motion-path";
import { resolveEase } from "@/lib/gsap-ease";
import { splitTweenTargetRef } from "@/lib/gsap-split-text";
import {
  hasTweenControls,
  readFlip,
  readScrollTo,
  resolvePosition,
  resolveStagger,
  runtimeTweenControls,
  tweenControlCodeParts,
  type FlipStepConfig,
  type ScrollToStepConfig,
} from "@/lib/gsap-tween-controls";
import {
  cssPropName,
  formatCodeValue,
  formatPositionArg,
  materializeTweenValue,
  rotationWithSuffix,
} from "@/lib/gsap-value";
import {
  threeInitialStateToCodeLines,
  threeTweenStepsToCodeLines,
} from "@/lib/three-gsap";
import {
  pixiInitialStateToCodeLines,
  pixiTweenStepsToCodeLines,
} from "@/lib/pixi-gsap";
import type {
  AnimationTarget,
  Keyframe,
  Timeline,
  Transform,
} from "@/stores/timeline-store";

const SVG_PLUGIN_KEYS = new Set(["drawSVG", "morphSVG"]);

export type GsapPropValue =
  | number
  | string
  | boolean
  | MotionPathGsapConfig
  | Record<string, unknown>;

export type GsapProps = Record<string, GsapPropValue>;

export const EXPORT_CODE_VERSION = "1.2.1";
export const TARGET_SELECTOR = ".target";
export const SCROLL_TRIGGER_SELECTOR = ".your-trigger";

import {
  domTweenSelector,
  escapeJsString,
  jsQuotedSelector,
} from "@/lib/gsap-export-code";

export {
  domTweenSelector,
  escapeJsString,
  jsQuotedSelector,
} from "@/lib/gsap-export-code";

export function defaultGsapProps(): GsapProps {
  return {
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    opacity: 1,
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    filter: "none",
  };
}

export function filterTypeToString(
  filterType: string | number | undefined,
  filterValue: string | number | undefined
): string {
  switch (filterType) {
    case "blur":
      return `blur(${filterValue}px)`;
    case "brightness":
      return `brightness(${filterValue}%)`;
    case "contrast":
      return `contrast(${filterValue}%)`;
    case "grayscale":
      return `grayscale(${filterValue}%)`;
    case "hue-rotate":
      return `hue-rotate(${filterValue}deg)`;
    case "invert":
      return `invert(${filterValue}%)`;
    case "opacity":
      return `opacity(${filterValue}%)`;
    case "saturate":
      return `saturate(${filterValue}%)`;
    case "sepia":
      return `sepia(${filterValue}%)`;
    default:
      return "none";
  }
}

function optionalValue(
  value: number | string | undefined
): number | string | undefined {
  if (value == null || value === "") return undefined;
  return value;
}

function requiredValue(
  value: number | string | undefined,
  fallback: number | string
): number | string {
  if (value == null || value === "") return fallback;
  return value;
}

function pluginNumber(value: number | string | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return fallback;
}

export function applyTransformToProps(
  props: GsapProps,
  transform: Transform
): void {
  switch (transform.type) {
    case "move":
      props.x = requiredValue(transform.values.x, 0);
      props.y = requiredValue(transform.values.y, 0);
      if (optionalValue(transform.values.xPercent) != null) {
        props.xPercent = transform.values.xPercent;
      }
      if (optionalValue(transform.values.yPercent) != null) {
        props.yPercent = transform.values.yPercent;
      }
      break;
    case "rotate":
      props.rotation = rotationWithSuffix(
        transform.values.rotation,
        transform.values.rotationDir
      );
      break;
    case "rotateX":
      props.rotationX = rotationWithSuffix(
        transform.values.rotationX,
        transform.values.rotationXDir
      );
      break;
    case "rotateY":
      props.rotationY = rotationWithSuffix(
        transform.values.rotationY,
        transform.values.rotationYDir
      );
      break;
    case "moveZ":
      props.z = requiredValue(transform.values.z, 0);
      break;
    case "opacity":
      props.opacity = requiredValue(transform.values.opacity, 1);
      break;
    case "autoAlpha":
      props.autoAlpha = requiredValue(transform.values.autoAlpha, 0);
      break;
    case "skew":
      props.skewX = requiredValue(transform.values.skewX, 0);
      props.skewY = requiredValue(transform.values.skewY, 0);
      break;
    case "scale":
      props.scaleX = requiredValue(transform.values.scaleX, 1);
      props.scaleY = requiredValue(transform.values.scaleY, 1);
      break;
    case "filter":
      props.filter = filterTypeToString(
        transform.values.filter,
        transform.values.value
      );
      break;
    case "drawSvg":
      props.drawSVG = (transform.values.drawSVG as string) || "0% 100%";
      break;
    case "morphSvg": {
      const morph = (transform.values.morphSVG as string)?.trim();
      if (morph) props.morphSVG = morph;
      break;
    }
    case "motionPath":
      applyMotionPathTransformToProps(props, transform.values);
      break;
    case "cssVar":
      applyCssVarTransformToProps(props, transform.values);
      break;
    case "transformOrigin": {
      const origin = String(transform.values.transformOrigin ?? "").trim();
      if (origin) props.transformOrigin = origin;
      break;
    }
    case "svgOrigin": {
      const origin = String(transform.values.svgOrigin ?? "").trim();
      if (origin) props.svgOrigin = origin;
      break;
    }
    case "cssProp": {
      const name = cssPropName(String(transform.values.property ?? ""));
      const value = optionalValue(transform.values.value);
      if (name && value != null) props[name] = value;
      break;
    }
    case "scrambleText": {
      const config: Record<string, unknown> = {
        text: String(transform.values.text ?? ""),
      };
      const chars = String(transform.values.chars ?? "").trim();
      if (chars) config.chars = chars;
      if (optionalValue(transform.values.revealDelay) != null) {
        config.revealDelay = pluginNumber(transform.values.revealDelay);
      }
      if (optionalValue(transform.values.speed) != null) {
        config.speed = pluginNumber(transform.values.speed, 1);
      }
      const delimiter = String(transform.values.delimiter ?? "");
      if (delimiter) config.delimiter = delimiter;
      if (transform.values.rightToLeft === 1 || transform.values.rightToLeft === "1") {
        config.rightToLeft = true;
      }
      props.scrambleText = config;
      break;
    }
    case "physics2D":
      props.physics2D = {
        velocity: pluginNumber(transform.values.velocity, 200),
        angle: pluginNumber(transform.values.angle, -60),
        gravity: pluginNumber(transform.values.gravity, 500),
        acceleration: pluginNumber(transform.values.acceleration),
        accelerationAngle: pluginNumber(transform.values.accelerationAngle),
        friction: pluginNumber(transform.values.friction),
      };
      break;
    case "physicsProps": {
      const property = cssPropName(String(transform.values.property ?? "x")) ?? "x";
      props.physicsProps = {
        [property]: {
          velocity: pluginNumber(transform.values.velocity, 100),
          acceleration: pluginNumber(transform.values.acceleration),
          friction: pluginNumber(transform.values.friction),
        },
      };
      break;
    }
    default:
      break;
  }
}

export function partitionGsapProps(props: GsapProps): {
  dom: GsapProps;
  svg: GsapProps;
} {
  const dom: GsapProps = {};
  const svg: GsapProps = {};
  Object.entries(props).forEach(([key, value]) => {
    if (SVG_PLUGIN_KEYS.has(key)) {
      svg[key] = value;
    } else {
      dom[key] = value;
    }
  });
  return { dom, svg };
}

export function svgPathSubselector(target: AnimationTarget): string {
  const sub = target.svgPathSelector?.trim();
  return sub || "path";
}

export function exportSvgPluginSelector(target: AnimationTarget): string {
  const sub = svgPathSubselector(target);
  return `${domTweenSelector(target)} ${sub}`;
}

export function resolveSvgPathElement(
  root: Element | null,
  target: AnimationTarget
): Element | null {
  if (!root) return null;

  const marked = root.querySelector(`[data-svg-path="${target.id}"]`);
  if (marked) return marked;

  const sub = svgPathSubselector(target);
  const candidates = [
    root.querySelector(sub),
    root.querySelector(`svg ${sub}`),
    root.querySelector(`.layer-svg-host ${sub}`),
    root.querySelector("svg path"),
    root.querySelector("path"),
  ];
  for (const el of candidates) {
    if (el) return el;
  }
  return null;
}

export function primeSvgPluginState(
  svgTarget: gsap.TweenTarget,
  steps: TweenStep[],
  initialState?: Transform[]
): void {
  const fromInitial = partitionGsapProps(
    buildInitialProps(initialState)
  ).svg;
  if (Object.keys(fromInitial).length > 0) {
    gsap.set(svgTarget, fromInitial);
    return;
  }

  for (const step of steps) {
    if (step.from) {
      const fromSvg = partitionGsapProps(step.from).svg;
      if (Object.keys(fromSvg).length > 0) {
        gsap.set(svgTarget, fromSvg);
        return;
      }
    }
    if (partitionGsapProps(step.to).svg.drawSVG !== undefined) {
      gsap.set(svgTarget, { drawSVG: "0% 0%" });
      return;
    }
  }
}

/** Forza misura del path dopo il mount (DrawSVG). */
export function measureSvgPath(path: Element | null): void {
  if (!path) return;
  try {
    DrawSVGPlugin.getLength(path as SVGPathElement);
  } catch {
    // ignore misconfiguration
  }
}

export function transformsToGsapProps(transforms: Transform[]): GsapProps {
  const props: GsapProps = {};
  const hasMotionPath = transforms.some((t) => t.type === "motionPath");
  transforms.forEach((t) => {
    if (t.type === "cssRule") return;
    if (hasMotionPath && t.type === "move") return;
    applyTransformToProps(props, t);
  });
  return props;
}

export function buildInitialProps(initialState?: Transform[]): GsapProps {
  const props = defaultGsapProps();
  if (!initialState) {
    return props;
  }

  initialState.forEach((transform) => {
    if (transform.type === "cssRule" || transform.type === "flip" || transform.type === "scrollTo") {
      return;
    }
    applyTransformToProps(props, transform);
  });

  return props;
}

export interface TweenStep {
  kind: "to" | "fromTo";
  from?: GsapProps;
  to: GsapProps;
  cssRulePayloads?: CssRuleTweenPayload[];
  duration: number;
  ease: string;
  position: number | string;
  stagger?: number | Record<string, unknown>;
  controls?: Record<string, unknown>;
  controlCode?: string[];
  flip?: FlipStepConfig;
  scrollTo?: ScrollToStepConfig;
}

function buildFromPropsForTransform(
  fromProps: GsapProps,
  transform: Transform,
  initialTransform: Transform | undefined
): void {
  if (!initialTransform) return;
  if (
    initialTransform.type === "flip" ||
    initialTransform.type === "scrollTo" ||
    initialTransform.type === "cssRule"
  ) {
    return;
  }
  applyTransformToProps(fromProps, initialTransform);
  if (transform.type === "drawSvg" && fromProps.drawSVG == null) {
    fromProps.drawSVG = "0% 0%";
  }
}

export function buildTweenSteps(
  keyframes: Keyframe[],
  initialState?: Transform[]
): TweenStep[] {
  const sorted = [...keyframes].sort((a, b) => a.delay - b.delay);
  const steps: TweenStep[] = [];

  sorted.forEach((keyframe, index) => {
    if (keyframe.transforms.length === 0) return;

    const to = transformsToGsapProps(keyframe.transforms);
    const isFirstKeyframe = index === 0;
    const cssRulePayloads =
      isFirstKeyframe && initialState?.length
        ? buildCssRuleFromGroups(keyframe.transforms, initialState)
        : groupCssRuleTransforms(keyframe.transforms);
    const flip = readFlip(keyframe);
    const scrollTo = readScrollTo(keyframe);
    const controls = runtimeTweenControls(keyframe);
    if (
      Object.keys(to).length === 0 &&
      cssRulePayloads.length === 0 &&
      !flip &&
      !scrollTo &&
      !hasTweenControls(keyframe)
    ) {
      return;
    }
    let from: GsapProps | undefined;
    const fromProps: GsapProps = {};

    if (isFirstKeyframe) {
      keyframe.transforms.forEach((transform) => {
        if (
          transform.type === "motionPath" ||
          transform.type === "cssRule" ||
          transform.type === "flip" ||
          transform.type === "scrollTo" ||
          transform.type === "scrambleText" ||
          transform.type === "physics2D" ||
          transform.type === "physicsProps"
        ) {
          return;
        }
        const initialTransform = initialState?.find((t) => {
          if (t.type !== transform.type) return false;
          if (transform.type === "cssVar") {
            return t.values.varName === transform.values.varName;
          }
          if (transform.type === "cssProp") {
            return t.values.property === transform.values.property;
          }
          if (transform.type === "cssRule") {
            return (
              t.values.ruleSelector === transform.values.ruleSelector &&
              t.values.property === transform.values.property
            );
          }
          return true;
        });
        if (initialTransform) {
          buildFromPropsForTransform(fromProps, transform, initialTransform);
        } else if (transform.type === "drawSvg") {
          fromProps.drawSVG = "0% 0%";
        }
      });
      if (Object.keys(fromProps).length > 0) {
        from = fromProps;
      }
    }

    const stagger = resolveStagger(keyframe);

    steps.push({
      kind: from ? "fromTo" : "to",
      from,
      to,
      cssRulePayloads:
        cssRulePayloads.length > 0 ? cssRulePayloads : undefined,
      duration: keyframe.duration / 1000,
      ease: resolveEase(keyframe),
      position: resolvePosition(keyframe),
      stagger,
      controls,
      controlCode: tweenControlCodeParts(keyframe),
      flip,
      scrollTo,
    });
  });

  return steps;
}

export function getTimelineGsapOptions(timeline: Timeline): gsap.TimelineVars {
  const isScroll = timeline.playbackType === "scroll";
  return {
    paused: true,
    repeat: !isScroll && timeline.loop ? -1 : 0,
    yoyo: !isScroll && timeline.yoyo,
    ...(isScroll ? { defaults: { immediateRender: false } } : {}),
  };
}

function appendPartitionedStep(
  tl: gsap.core.Timeline,
  domTarget: gsap.TweenTarget,
  svgTarget: gsap.TweenTarget | null,
  step: TweenStep,
  seenSvgFromProps: Set<string>
): void {
  const toDom = partitionGsapProps(step.to).dom;
  const toSvg = partitionGsapProps(step.to).svg;
  const fromDom = step.from ? partitionGsapProps(step.from).dom : undefined;
  const fromSvg = step.from ? partitionGsapProps(step.from).svg : undefined;

  const sharedKeys = new Set([
    "stagger",
    "repeat",
    "yoyo",
    "repeatDelay",
    "yoyoEase",
    "overwrite",
  ]);
  const shared: Record<string, unknown> = {};
  const once: Record<string, unknown> = {};
  Object.entries(step.controls ?? {}).forEach(([key, value]) => {
    if (sharedKeys.has(key)) shared[key] = value;
    else once[key] = value;
  });
  const timing = {
    duration: step.duration,
    ease: step.ease,
    ...shared,
  };
  const live = (props: GsapProps) => {
    const out: Record<string, unknown> = {};
    Object.entries(props).forEach(([key, value]) => {
      out[key] = materializeTweenValue(value);
    });
    return out;
  };

  const hasDom = Object.keys(toDom).length > 0;
  const willSvg = Boolean(svgTarget && (Object.keys(toSvg).length > 0 || toDom.svgOrigin != null));

  if (hasDom) {
    const vars = { ...live(toDom), ...timing, ...once };
    if (step.kind === "fromTo" && fromDom && Object.keys(fromDom).length > 0) {
      tl.fromTo(domTarget, live(fromDom), vars, step.position);
    } else {
      tl.to(domTarget, vars, step.position);
    }
  } else if (Object.keys(once).length > 0 && !willSvg && !step.flip && !step.scrollTo) {
    tl.to(domTarget, { ...timing, ...once }, step.position);
  }

  if (toDom.svgOrigin != null && svgTarget) {
    toSvg.svgOrigin = toDom.svgOrigin;
  }

  if (svgTarget && Object.keys(toSvg).length > 0) {
    const svgImmediate =
      typeof step.controls?.immediateRender === "boolean"
        ? step.controls.immediateRender
        : false;
    const vars = {
      ...live(toSvg),
      ...timing,
      ...(hasDom ? {} : once),
      immediateRender: svgImmediate,
    };
    if (step.kind === "fromTo" && fromSvg && Object.keys(fromSvg).length > 0) {
      const fromKeys = Object.keys(fromSvg);
      const repeatFrom = fromKeys.some((key) => seenSvgFromProps.has(key));
      fromKeys.forEach((key) => seenSvgFromProps.add(key));
      tl.fromTo(
        svgTarget,
        { ...live(fromSvg), immediateRender: !repeatFrom },
        vars,
        step.position
      );
    } else {
      tl.to(svgTarget, vars, step.position);
    }
  }

  if (step.flip) {
    const nodes = gsap.utils.toArray(domTarget) as Element[];
    if (nodes.length > 0) {
      const state = Flip.getState(nodes);
      if (step.flip.toggleClass) {
        nodes.forEach((node) => {
          if (node instanceof Element) node.classList.toggle(step.flip!.toggleClass!);
        });
      }
      tl.add(
        Flip.from(state, {
          duration: step.duration,
          ease: step.ease,
          absolute: step.flip.absolute,
          nested: step.flip.nested,
          scale: step.flip.scale,
          simple: step.flip.simple,
        }),
        step.position
      );
    }
  }

  if (step.scrollTo) {
    const target =
      step.scrollTo.target === "window" ? window : step.scrollTo.target;
    tl.to(
      target,
      {
        duration: step.duration,
        ease: step.ease,
        scrollTo: step.scrollTo.vars,
      },
      step.position
    );
  }

  if (step.cssRulePayloads?.length) {
    appendCssRuleSteps(tl, step.cssRulePayloads, {
      duration: step.duration,
      ease: step.ease,
      position: step.position,
      kind: step.kind,
    });
  }
}

export function appendTweenStepsToTimeline(
  tl: gsap.core.Timeline,
  domTarget: gsap.TweenTarget,
  steps: TweenStep[],
  svgTarget?: gsap.TweenTarget | null,
  domTweenTarget?: gsap.TweenTarget | null
): void {
  const domEl = domTweenTarget ?? domTarget;
  const seenSvgFromProps = new Set<string>();
  steps.forEach((step) => {
    appendPartitionedStep(tl, domEl, svgTarget ?? null, step, seenSvgFromProps);
  });
}

export function applyInitialStateToTarget(
  domTarget: gsap.TweenTarget,
  initialState?: Transform[],
  svgTarget?: gsap.TweenTarget | null,
  domTweenTarget?: gsap.TweenTarget | null
): void {
  const props = buildInitialProps(initialState);
  const { dom, svg } = partitionGsapProps(props);
  const domEl = domTweenTarget ?? domTarget;
  if (Object.keys(dom).length > 0) {
    gsap.set(domEl, dom);
  }
  if (svgTarget && Object.keys(svg).length > 0) {
    gsap.set(svgTarget, svg);
  }
}

function formatPropValue(
  key: string,
  value: GsapPropValue
): string {
  if (key === "motionPath" && value && typeof value === "object") {
    return `motionPath: ${motionPathConfigToCode(value as MotionPathGsapConfig)}`;
  }
  return `${key}: ${formatCodeValue(value)}`;
}

export function propsToCodeString(props: GsapProps): string {
  const entries = Object.entries(props).map(([key, value]) =>
    formatPropValue(key, value)
  );
  return `{ ${entries.join(", ")} }`;
}

function formatTweenToProps(step: TweenStep): string {
  const parts: string[] = [];
  Object.entries(step.to).forEach(([key, value]) => {
    parts.push(formatPropValue(key, value));
  });
  parts.push(`duration: ${step.duration}`);
  parts.push(`ease: "${escapeJsString(step.ease)}"`);
  (step.controlCode ?? []).forEach((part) => parts.push(part));
  return `{ ${parts.join(", ")} }`;
}

function tweenStepToCodeLines(
  targetSelector: string,
  step: TweenStep,
  propsSubset: "all" | "dom" | "svg",
  svgFromImmediateRender?: boolean
): string[] {
  const pick = (p: GsapProps) => {
    if (propsSubset === "all") return p;
    return partitionGsapProps(p)[propsSubset];
  };

  const to = pick(step.to);
  const targetExpr = targetSelector.startsWith("split_")
    ? targetSelector
    : jsQuotedSelector(targetSelector);
  if (Object.keys(to).length === 0) {
    if (!step.controlCode?.length || propsSubset === "svg") return [];
    const body = [
      `duration: ${step.duration}`,
      `ease: "${escapeJsString(step.ease)}"`,
      ...step.controlCode,
    ].join(", ");
    return [
      `tl.to(${targetExpr}, { ${body} }, ${formatPositionArg(step.position)});`,
    ];
  }

  const syntheticStep: TweenStep = {
    ...step,
    to,
    from: step.from ? pick(step.from) : undefined,
    kind:
      step.kind === "fromTo" &&
      step.from &&
      Object.keys(pick(step.from)).length > 0
        ? "fromTo"
        : "to",
  };

  const toString = formatTweenToProps(syntheticStep);
  if (syntheticStep.kind === "fromTo" && syntheticStep.from) {
    const fromProps =
      propsSubset === "svg" && svgFromImmediateRender != null
        ? { ...syntheticStep.from, immediateRender: svgFromImmediateRender }
        : syntheticStep.from;
    return [
      `tl.fromTo(${targetExpr}, ${propsToCodeString(fromProps)}, ${toString}, ${formatPositionArg(step.position)});`,
    ];
  }
  return [`tl.to(${targetExpr}, ${toString}, ${formatPositionArg(step.position)});`];
}

export function tweenStepsToCodeLines(
  target: AnimationTarget,
  steps: TweenStep[]
): string[] {
  if (target.type === "model3d") {
    return threeTweenStepsToCodeLines(target, steps);
  }
  if (target.type === "pixi") {
    return pixiTweenStepsToCodeLines(target, steps);
  }
  const domSelector = splitTweenTargetRef(target) ?? domTweenSelector(target);
  const svgSelector =
    target.type === "svg" ? exportSvgPluginSelector(target) : domSelector;
  const lines: string[] = [];
  const seenSvgFromProps = new Set<string>();

  steps.forEach((step) => {
    const hasSvg = Object.keys(partitionGsapProps(step.to).svg).length > 0;
    const hasDom = Object.keys(partitionGsapProps(step.to).dom).length > 0;

    if (hasDom) {
      lines.push(...tweenStepToCodeLines(domSelector, step, "dom"));
    }
    if (hasSvg && target.type === "svg") {
      const fromSvg = step.from ? partitionGsapProps(step.from).svg : {};
      const fromKeys = Object.keys(fromSvg);
      const repeatFrom = fromKeys.some((key) => seenSvgFromProps.has(key));
      fromKeys.forEach((key) => seenSvgFromProps.add(key));
      lines.push(
        ...tweenStepToCodeLines(
          svgSelector,
          hasDom ? { ...step, controlCode: [] } : step,
          "svg",
          fromKeys.length > 0 ? !repeatFrom : undefined
        )
      );
    }
    if (!hasDom && !hasSvg && (step.controlCode?.length || step.flip || step.scrollTo)) {
      if (step.controlCode?.length && !step.flip && !step.scrollTo) {
        lines.push(...tweenStepToCodeLines(domSelector, { ...step, to: {} }, "all"));
      }
    }
    if (step.scrollTo) {
      const scrollTarget =
        step.scrollTo.target === "window"
          ? "window"
          : jsQuotedSelector(step.scrollTo.target);
      lines.push(
        `tl.to(${scrollTarget}, { duration: ${step.duration}, ease: "${escapeJsString(step.ease)}", scrollTo: ${JSON.stringify(step.scrollTo.vars)} }, ${formatPositionArg(step.position)});`
      );
    }
    if (step.flip) {
      const flipTarget = domSelector.startsWith("split_")
        ? domSelector
        : jsQuotedSelector(domSelector);
      const toggle = step.flip.toggleClass
        ? `gsap.utils.toArray(${flipTarget}).forEach(function(node){ node.classList.toggle("${escapeJsString(step.flip.toggleClass)}"); });`
        : "";
      lines.push(
        `{ const flipState = Flip.getState(${flipTarget}); ${toggle} tl.add(Flip.from(flipState, { duration: ${step.duration}, ease: "${escapeJsString(step.ease)}", absolute: ${step.flip.absolute}, nested: ${step.flip.nested}, scale: ${step.flip.scale}, simple: ${step.flip.simple} }), ${formatPositionArg(step.position)}); }`
      );
    }
    if (step.cssRulePayloads?.length) {
      lines.push(
        ...cssRuleStepsToCodeLines(step.cssRulePayloads, {
          duration: step.duration,
          ease: step.ease,
          position: step.position,
          kind: step.kind,
        })
      );
    }
  });

  return lines;
}

export function initialStateToCodeLines(
  target: AnimationTarget,
  initial?: Transform[]
): string[] {
  if (target.type === "model3d") {
    return threeInitialStateToCodeLines(target, initial);
  }
  if (target.type === "pixi") {
    return pixiInitialStateToCodeLines(target, initial);
  }
  const props = buildInitialProps(initial);
  const { dom, svg } = partitionGsapProps(props);
  const lines: string[] = [];
  if (Object.keys(dom).length > 0) {
    const splitRef = splitTweenTargetRef(target);
    if (splitRef) {
      lines.push(`gsap.set(${splitRef}, ${propsToCodeString(dom)});`);
    } else {
      lines.push(
        `gsap.set(${jsQuotedSelector(domTweenSelector(target))}, ${propsToCodeString(dom)});`
      );
    }
  }
  if (target.type === "svg" && Object.keys(svg).length > 0) {
    lines.push(
      `gsap.set(${jsQuotedSelector(exportSvgPluginSelector(target))}, ${propsToCodeString(svg)});`
    );
  }
  return lines;
}