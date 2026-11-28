import { gsap } from "gsap";
import type { Object3D } from "three";
import { callThreeFitView } from "@/lib/three-preview-fit";
import { renderAllThreeLayers } from "@/lib/three-layer-registry";
import type { AnimationTarget, Keyframe, Transform } from "@/stores/timeline-store";
import {
  buildInitialProps,
  buildTweenSteps,
  escapeJsString,
  type GsapProps,
  type TweenStep,
} from "@/lib/gsap-build";
import { formatPositionArg } from "@/lib/gsap-value";

const DEG = Math.PI / 180;

export type ThreeChannels = {
  position: Record<string, number>;
  rotation: Record<string, number>;
  scale: Record<string, number>;
};

export function gsapPropsToThreeChannels(props: GsapProps): ThreeChannels {
  const position: Record<string, number> = {};
  const rotation: Record<string, number> = {};
  const scale: Record<string, number> = {};

  if (props.x != null) position.x = props.x as number;
  if (props.y != null) position.y = props.y as number;
  if (props.z != null) position.z = props.z as number;

  if (props.rotation != null) rotation.z = (props.rotation as number) * DEG;
  if (props.rotationX != null) rotation.x = (props.rotationX as number) * DEG;
  if (props.rotationY != null) rotation.y = (props.rotationY as number) * DEG;

  if (props.scaleX != null) scale.x = props.scaleX as number;
  if (props.scaleY != null) scale.y = props.scaleY as number;
  if (props.scale != null && typeof props.scale === "number") {
    scale.x = props.scale;
    scale.y = props.scale;
    scale.z = props.scale;
  }
  if (props.scaleZ != null) scale.z = props.scaleZ as number;
  if (scale.x != null && scale.z == null) scale.z = scale.x;
  if (scale.y != null && scale.z == null) scale.z = scale.y;

  return { position, rotation, scale };
}

export function pickModel3dProps(props: GsapProps): GsapProps {
  const keys = [
    "x",
    "y",
    "z",
    "rotation",
    "rotationX",
    "rotationY",
    "scale",
    "scaleX",
    "scaleY",
    "scaleZ",
    "opacity",
  ];
  const out: GsapProps = {};
  keys.forEach((k) => {
    if (props[k] !== undefined) out[k] = props[k];
  });
  return out;
}

export function applyThreeInitialState(
  root: Object3D,
  initialState?: Transform[]
) {
  const props = pickModel3dProps(buildInitialProps(initialState));
  const ch = gsapPropsToThreeChannels(props);
  if (Object.keys(ch.position).length) gsap.set(root.position, ch.position);
  if (Object.keys(ch.rotation).length) gsap.set(root.rotation, ch.rotation);
  if (Object.keys(ch.scale).length) gsap.set(root.scale, ch.scale);
  callThreeFitView(root);
  renderAllThreeLayers();
}

function appendThreeChannels(
  tl: gsap.core.Timeline,
  root: Object3D,
  step: TweenStep,
  toCh: ThreeChannels,
  fromCh?: ThreeChannels
) {
  const shared: Record<string, unknown> = {};
  ["stagger", "repeat", "yoyo", "repeatDelay", "yoyoEase", "overwrite"].forEach(
    (key) => {
      const value = step.controls?.[key];
      if (value != null) shared[key] = value;
    }
  );
  const base = {
    duration: step.duration,
    ease: step.ease,
    ...shared,
  };
  const refit = () => {
    callThreeFitView(root);
    renderAllThreeLayers();
  };
  const withRefit = (vars: Record<string, unknown>) => ({
    ...vars,
    onUpdate: refit,
  });

  const channels: Array<{
    key: keyof ThreeChannels;
    obj: { x: number; y: number; z: number };
  }> = [
    { key: "position", obj: root.position },
    { key: "rotation", obj: root.rotation },
    { key: "scale", obj: root.scale },
  ];

  channels.forEach(({ key, obj }) => {
    const to = toCh[key];
    if (!Object.keys(to).length) return;
    const from = fromCh?.[key];
    if (step.kind === "fromTo" && from && Object.keys(from).length) {
      tl.fromTo(
        obj,
        withRefit({ ...from, ...base }),
        withRefit({ ...to, ...base }),
        step.position
      );
    } else {
      tl.to(obj, withRefit({ ...to, ...base }), step.position);
    }
  });
}

export function appendThreeTweenStepsToTimeline(
  tl: gsap.core.Timeline,
  root: Object3D,
  steps: TweenStep[]
) {
  steps.forEach((step) => {
    const toProps = pickModel3dProps(step.to);
  const fromProps = step.from ? pickModel3dProps(step.from) : undefined;
    appendThreeChannels(
      tl,
      root,
      step,
      gsapPropsToThreeChannels(toProps),
      fromProps ? gsapPropsToThreeChannels(fromProps) : undefined
    );
  });
}

export function buildModel3dTweenSteps(
  keyframes: Keyframe[],
  initialState?: Transform[]
): TweenStep[] {
  return buildTweenSteps(keyframes, initialState);
}

export function threeLayerVarName(target: AnimationTarget): string {
  const safe = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
  return `threeRoot_${safe}`;
}

export function threeTweenStepsToCodeLines(
  target: AnimationTarget,
  steps: TweenStep[]
): string[] {
  const root = threeLayerVarName(target);
  const lines: string[] = [];
  const fmt = (v: Record<string, number>) =>
    Object.entries(v)
      .map(([k, n]) => `${k}: ${typeof n === "number" ? n : JSON.stringify(n)}`)
      .join(", ");

  steps.forEach((step) => {
    const toCh = gsapPropsToThreeChannels(pickModel3dProps(step.to));
    const fromCh = step.from
      ? gsapPropsToThreeChannels(pickModel3dProps(step.from))
      : undefined;
    const sharedCode = (step.controlCode ?? []).filter((part) =>
      /^(stagger|repeat|yoyo|repeatDelay|yoyoEase|overwrite):/.test(part)
    );
    const base = [
      `duration: ${step.duration}`,
      `ease: "${escapeJsString(step.ease)}"`,
      ...sharedCode,
    ].join(", ");
    (["position", "rotation", "scale"] as const).forEach((channel) => {
      const to = toCh[channel];
      if (!Object.keys(to).length) return;
      const from = fromCh?.[channel];
      const obj = `${root}.${channel}`;
      if (step.kind === "fromTo" && from && Object.keys(from).length) {
        lines.push(
          `tl.fromTo(${obj}, { ${fmt(from)}, ${base} }, { ${fmt(to)}, ${base} }, ${formatPositionArg(step.position)});`
        );
      } else {
        lines.push(`tl.to(${obj}, { ${fmt(to)}, ${base} }, ${formatPositionArg(step.position)});`);
      }
    });
  });
  return lines;
}

export function threeInitialStateToCodeLines(
  target: AnimationTarget,
  initial?: Transform[]
): string[] {
  const root = threeLayerVarName(target);
  const ch = gsapPropsToThreeChannels(
    pickModel3dProps(buildInitialProps(initial))
  );
  const lines: string[] = [];
  if (Object.keys(ch.position).length) {
    lines.push(`gsap.set(${root}.position, { ${Object.entries(ch.position).map(([k, v]) => `${k}: ${v}`).join(", ")} });`);
  }
  if (Object.keys(ch.rotation).length) {
    lines.push(`gsap.set(${root}.rotation, { ${Object.entries(ch.rotation).map(([k, v]) => `${k}: ${v}`).join(", ")} });`);
  }
  if (Object.keys(ch.scale).length) {
    lines.push(`gsap.set(${root}.scale, { ${Object.entries(ch.scale).map(([k, v]) => `${k}: ${v}`).join(", ")} });`);
  }
  return lines;
}