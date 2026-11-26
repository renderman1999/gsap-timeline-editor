import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
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
import { splitTweenTargetRef } from "@/lib/gsap-split-text";
import {
  threeInitialStateToCodeLines,
  threeTweenStepsToCodeLines,
} from "@/lib/three-gsap";
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
  | MotionPathGsapConfig
  | Record<string, unknown>;

export type GsapProps = Record<string, GsapPropValue>;

export const EXPORT_CODE_VERSION = "1.2.1";
export const TARGET_SELECTOR = ".target";
export const SCROLL_TRIGGER_SELECTOR = ".your-trigger";

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

export function applyTransformToProps(
  props: GsapProps,
  transform: Transform
): void {
  switch (transform.type) {
    case "move":
      props.x = transform.values.x as number;
      props.y = transform.values.y as number;
      break;
    case "rotate":
      props.rotation = transform.values.rotation as number;
      break;
    case "rotateX":
      props.rotationX = transform.values.rotationX as number;
      break;
    case "rotateY":
      props.rotationY = transform.values.rotationY as number;
      break;
    case "moveZ":
      props.z = transform.values.z as number;
      break;
    case "opacity":
      props.opacity = transform.values.opacity as number;
      break;
    case "skew":
      props.skewX = transform.values.skewX as number;
      props.skewY = transform.values.skewY as number;
      break;
    case "scale":
      props.scaleX = transform.values.scaleX as number;
      props.scaleY = transform.values.scaleY as number;
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
  const base = target.selector.trim();
  const sub = svgPathSubselector(target);
  return `${base} ${sub}`;
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
    switch (transform.type) {
      case "move":
        props.x = (transform.values.x as number) ?? 0;
        props.y = (transform.values.y as number) ?? 0;
        break;
      case "rotate":
        props.rotation = (transform.values.rotation as number) ?? 0;
        break;
      case "rotateX":
        props.rotationX = (transform.values.rotationX as number) ?? 0;
        break;
      case "rotateY":
        props.rotationY = (transform.values.rotationY as number) ?? 0;
        break;
      case "moveZ":
        props.z = (transform.values.z as number) ?? 0;
        break;
      case "opacity":
        props.opacity =
          transform.values.opacity !== undefined
            ? (transform.values.opacity as number)
            : 1;
        break;
      case "skew":
        props.skewX = (transform.values.skewX as number) ?? 0;
        props.skewY = (transform.values.skewY as number) ?? 0;
        break;
      case "scale":
        props.scaleX = (transform.values.scaleX as number) ?? 1;
        props.scaleY = (transform.values.scaleY as number) ?? 1;
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
    }
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
  position: number;
  stagger?: number;
}

function buildFromPropsForTransform(
  fromProps: GsapProps,
  transform: Transform,
  initialTransform: Transform | undefined
): void {
  if (!initialTransform) return;

  switch (transform.type) {
    case "move":
      fromProps.x = (initialTransform.values.x as number) ?? 0;
      fromProps.y = (initialTransform.values.y as number) ?? 0;
      break;
    case "rotate":
      fromProps.rotation = (initialTransform.values.rotation as number) ?? 0;
      break;
    case "rotateX":
      fromProps.rotationX = (initialTransform.values.rotationX as number) ?? 0;
      break;
    case "rotateY":
      fromProps.rotationY = (initialTransform.values.rotationY as number) ?? 0;
      break;
    case "moveZ":
      fromProps.z = (initialTransform.values.z as number) ?? 0;
      break;
    case "opacity":
      fromProps.opacity = (initialTransform.values.opacity as number) ?? 1;
      break;
    case "skew":
      fromProps.skewX = (initialTransform.values.skewX as number) ?? 0;
      fromProps.skewY = (initialTransform.values.skewY as number) ?? 0;
      break;
    case "scale":
      fromProps.scaleX = (initialTransform.values.scaleX as number) ?? 1;
      fromProps.scaleY = (initialTransform.values.scaleY as number) ?? 1;
      break;
    case "filter":
      fromProps.filter = filterTypeToString(
        initialTransform.values.filter,
        initialTransform.values.value
      );
      break;
    case "drawSvg":
      fromProps.drawSVG =
        (initialTransform.values.drawSVG as string) || "0% 0%";
      break;
    case "morphSvg": {
      const morph = (initialTransform.values.morphSVG as string)?.trim();
      if (morph) fromProps.morphSVG = morph;
      break;
    }
    case "cssVar":
      applyCssVarTransformToProps(fromProps, initialTransform.values);
      break;
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
    if (Object.keys(to).length === 0 && cssRulePayloads.length === 0) return;
    let from: GsapProps | undefined;
    const fromProps: GsapProps = {};

    if (isFirstKeyframe) {
      keyframe.transforms.forEach((transform) => {
        if (transform.type === "motionPath" || transform.type === "cssRule") {
          return;
        }
        const initialTransform = initialState?.find((t) => {
          if (t.type !== transform.type) return false;
          if (transform.type === "cssVar") {
            return t.values.varName === transform.values.varName;
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

    const stagger =
      keyframe.stagger != null && keyframe.stagger > 0
        ? keyframe.stagger
        : undefined;

    steps.push({
      kind: from ? "fromTo" : "to",
      from,
      to,
      cssRulePayloads:
        cssRulePayloads.length > 0 ? cssRulePayloads : undefined,
      duration: keyframe.duration / 1000,
      ease: keyframe.easing,
      position: keyframe.delay,
      stagger,
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
  step: TweenStep
): void {
  const toDom = partitionGsapProps(step.to).dom;
  const toSvg = partitionGsapProps(step.to).svg;
  const fromDom = step.from ? partitionGsapProps(step.from).dom : undefined;
  const fromSvg = step.from ? partitionGsapProps(step.from).svg : undefined;

  const baseVars = {
    duration: step.duration,
    ease: step.ease,
    ...(step.stagger != null && step.stagger > 0
      ? { stagger: step.stagger }
      : {}),
  };

  if (Object.keys(toDom).length > 0) {
    const vars = { ...toDom, ...baseVars };
    if (step.kind === "fromTo" && fromDom && Object.keys(fromDom).length > 0) {
      tl.fromTo(domTarget, fromDom, vars, step.position);
    } else {
      tl.to(domTarget, vars, step.position);
    }
  }

  if (svgTarget && Object.keys(toSvg).length > 0) {
    const vars = { ...toSvg, ...baseVars, immediateRender: false };
    if (step.kind === "fromTo" && fromSvg && Object.keys(fromSvg).length > 0) {
      tl.fromTo(
        svgTarget,
        { ...fromSvg, immediateRender: true },
        vars,
        step.position
      );
    } else {
      tl.to(svgTarget, vars, step.position);
    }
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
  steps.forEach((step) => {
    appendPartitionedStep(tl, domEl, svgTarget ?? null, step);
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
  if (typeof value === "string") {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `${key}: "${escaped}"`;
  }
  if (typeof value === "number") {
    return `${key}: ${value}`;
  }
  return `${key}: ${JSON.stringify(value)}`;
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
  parts.push(`ease: "${step.ease}"`);
  if (step.stagger != null && step.stagger > 0) {
    parts.push(`stagger: ${step.stagger}`);
  }
  return `{ ${parts.join(", ")} }`;
}

function tweenStepToCodeLines(
  targetSelector: string,
  step: TweenStep,
  propsSubset: "all" | "dom" | "svg"
): string[] {
  const pick = (p: GsapProps) => {
    if (propsSubset === "all") return p;
    return partitionGsapProps(p)[propsSubset];
  };

  const to = pick(step.to);
  if (Object.keys(to).length === 0) return [];

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
  const targetExpr = targetSelector.startsWith("split_")
    ? targetSelector
    : `"${targetSelector}"`;
  if (syntheticStep.kind === "fromTo" && syntheticStep.from) {
    return [
      `tl.fromTo(${targetExpr}, ${propsToCodeString(syntheticStep.from)}, ${toString}, ${step.position});`,
    ];
  }
  return [`tl.to(${targetExpr}, ${toString}, ${step.position});`];
}

export function tweenStepsToCodeLines(
  target: AnimationTarget,
  steps: TweenStep[]
): string[] {
  if (target.type === "model3d") {
    return threeTweenStepsToCodeLines(target, steps);
  }
  const domSelector = splitTweenTargetRef(target) ?? target.selector;
  const svgSelector =
    target.type === "svg" ? exportSvgPluginSelector(target) : domSelector;
  const lines: string[] = [];

  steps.forEach((step) => {
    const hasSvg = Object.keys(partitionGsapProps(step.to).svg).length > 0;
    const hasDom = Object.keys(partitionGsapProps(step.to).dom).length > 0;

    if (hasDom) {
      lines.push(...tweenStepToCodeLines(domSelector, step, "dom"));
    }
    if (hasSvg && target.type === "svg") {
      lines.push(...tweenStepToCodeLines(svgSelector, step, "svg"));
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
  const props = buildInitialProps(initial);
  const { dom, svg } = partitionGsapProps(props);
  const lines: string[] = [];
  if (Object.keys(dom).length > 0) {
    const splitRef = splitTweenTargetRef(target);
    if (splitRef) {
      lines.push(`gsap.set(${splitRef}, ${propsToCodeString(dom)});`);
    } else {
      lines.push(
        `gsap.set("${target.selector}", ${propsToCodeString(dom)});`
      );
    }
  }
  if (target.type === "svg" && Object.keys(svg).length > 0) {
    lines.push(
      `gsap.set("${exportSvgPluginSelector(target)}", ${propsToCodeString(svg)});`
    );
  }
  return lines;
}