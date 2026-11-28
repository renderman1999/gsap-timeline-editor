import { gsap } from "gsap";
import type { AnimationTarget, Keyframe, Transform } from "@/stores/timeline-store";
import {
  applyPixiGsapDriveToRoot,
  getOrCreatePixiGsapDrive,
  getPixiLayerRoot,
} from "@/lib/pixi-layer-registry";
import {
  buildInitialProps,
  buildTweenSteps,
  escapeJsString,
  type GsapProps,
  type TweenStep,
} from "@/lib/gsap-build";
import { formatPositionArg } from "@/lib/gsap-value";

const DEG = Math.PI / 180;

export type PixiTweenChannels = {
  position: Record<string, number>;
  rotation: number | null;
  scale: Record<string, number>;
  alpha: number | null;
};

export function pickPixiProps(props: GsapProps): GsapProps {
  const keys = [
    "x",
    "y",
    "rotation",
    "scale",
    "scaleX",
    "scaleY",
    "opacity",
  ];
  const out: GsapProps = {};
  keys.forEach((k) => {
    if (props[k] !== undefined) out[k] = props[k];
  });
  return out;
}

export function gsapPropsToPixiChannels(props: GsapProps): PixiTweenChannels {
  const position: Record<string, number> = {};
  const scale: Record<string, number> = {};

  if (props.x != null) position.x = props.x as number;
  if (props.y != null) position.y = props.y as number;

  let rotation: number | null = null;
  if (props.rotation != null) rotation = (props.rotation as number) * DEG;

  if (props.scaleX != null) scale.x = props.scaleX as number;
  if (props.scaleY != null) scale.y = props.scaleY as number;
  if (props.scale != null && typeof props.scale === "number") {
    scale.x = props.scale;
    scale.y = props.scale;
  }

  let alpha: number | null = null;
  if (props.opacity != null) alpha = props.opacity as number;

  return { position, rotation, scale, alpha };
}

function pixiChannelsToDrivePatch(ch: PixiTweenChannels): Record<string, number> {
  const patch: Record<string, number> = {};
  if (ch.position.x != null) patch.x = ch.position.x;
  if (ch.position.y != null) patch.y = ch.position.y;
  if (ch.rotation != null) patch.rotation = ch.rotation;
  if (ch.alpha != null) patch.alpha = ch.alpha;
  if (ch.scale.x != null) patch.scaleX = ch.scale.x;
  if (ch.scale.y != null) patch.scaleY = ch.scale.y;
  return patch;
}

function applyDrivePatch(
  targetId: string,
  patch: Record<string, number>
): void {
  const drive = getOrCreatePixiGsapDrive(targetId);
  Object.assign(drive, patch);
  applyPixiGsapDriveToRoot(targetId);
}

export function applyPixiInitialState(
  targetId: string,
  initialState?: Transform[]
) {
  if (!getPixiLayerRoot(targetId)) return;
  const ch = gsapPropsToPixiChannels(
    pickPixiProps(buildInitialProps(initialState))
  );
  const patch = pixiChannelsToDrivePatch(ch);
  if (Object.keys(patch).length) applyDrivePatch(targetId, patch);
}

function appendPixiStep(
  tl: gsap.core.Timeline,
  targetId: string,
  step: TweenStep,
  to: PixiTweenChannels,
  from?: PixiTweenChannels
) {
  const drive = getOrCreatePixiGsapDrive(targetId);
  const pos = step.position;
  const toPatch = pixiChannelsToDrivePatch(to);
  if (Object.keys(toPatch).length === 0 && to.rotation == null && to.alpha == null) {
    return;
  }

  const push = () => applyPixiGsapDriveToRoot(targetId);
  const shared: Record<string, unknown> = {};
  ["stagger", "repeat", "yoyo", "repeatDelay", "yoyoEase", "overwrite"].forEach(
    (key) => {
      const value = step.controls?.[key];
      if (value != null) shared[key] = value;
    }
  );
  const tweenOpts = {
    duration: step.duration,
    ease: step.ease,
    ...shared,
    onUpdate: push,
    onComplete: push,
  };

  const fromPatch = from ? pixiChannelsToDrivePatch(from) : undefined;

  if (
    step.kind === "fromTo" &&
    fromPatch &&
    Object.keys(fromPatch).length > 0 &&
    Object.keys(toPatch).length > 0
  ) {
    tl.fromTo(drive, fromPatch, { ...toPatch, ...tweenOpts }, pos);
    return;
  }

  if (Object.keys(toPatch).length > 0) {
    tl.to(drive, { ...toPatch, ...tweenOpts }, pos);
  }
}

export function appendPixiTweenStepsToTimeline(
  tl: gsap.core.Timeline,
  targetId: string,
  steps: TweenStep[]
) {
  if (!getPixiLayerRoot(targetId)) return;
  steps.forEach((step) => {
    const to = gsapPropsToPixiChannels(pickPixiProps(step.to));
    const from = step.from
      ? gsapPropsToPixiChannels(pickPixiProps(step.from))
      : undefined;
    appendPixiStep(tl, targetId, step, to, from);
  });
}

export function buildPixiTweenSteps(
  keyframes: Keyframe[],
  initialState?: Transform[]
): TweenStep[] {
  return buildTweenSteps(keyframes, initialState);
}

export function pixiLayerVarName(target: AnimationTarget): string {
  const safe = target.id.replace(/[^a-zA-Z0-9_]/g, "_");
  return `pixiRoot_${safe}`;
}

function fmtRecord(v: Record<string, number>): string {
  return Object.entries(v)
    .map(([k, n]) => `${k}: ${n}`)
    .join(", ");
}

export function pixiTweenStepsToCodeLines(
  target: AnimationTarget,
  steps: TweenStep[]
): string[] {
  const root = pixiLayerVarName(target);
  const lines: string[] = [];

  steps.forEach((step) => {
    const to = gsapPropsToPixiChannels(pickPixiProps(step.to));
    const from = step.from
      ? gsapPropsToPixiChannels(pickPixiProps(step.from))
      : undefined;
    const pos = formatPositionArg(step.position);
    const sharedCode = (step.controlCode ?? [])
      .filter((part) =>
        /^(stagger|repeat|yoyo|repeatDelay|yoyoEase|overwrite):/.test(part)
      )
      .join(", ");
    const base = [
      `duration: ${step.duration}`,
      `ease: "${escapeJsString(step.ease)}"`,
      sharedCode,
    ]
      .filter(Boolean)
      .join(", ");

    if (Object.keys(to.position).length) {
      if (step.kind === "fromTo" && from && Object.keys(from.position).length) {
        lines.push(
          `tl.fromTo(${root}, { ${fmtRecord(from.position)}, ${base} }, { ${fmtRecord(to.position)}, ${base} }, ${pos});`
        );
      } else {
        lines.push(
          `tl.to(${root}, { ${fmtRecord(to.position)}, ${base} }, ${pos});`
        );
      }
    }
    if (to.rotation != null) {
      if (step.kind === "fromTo" && from?.rotation != null) {
        lines.push(
          `tl.fromTo(${root}, { rotation: ${from.rotation}, ${base} }, { rotation: ${to.rotation}, ${base} }, ${pos});`
        );
      } else {
        lines.push(
          `tl.to(${root}, { rotation: ${to.rotation}, ${base} }, ${pos});`
        );
      }
    }
    if (Object.keys(to.scale).length) {
      if (step.kind === "fromTo" && from && Object.keys(from.scale).length) {
        lines.push(
          `tl.fromTo(${root}.scale, { ${fmtRecord(from.scale)}, ${base} }, { ${fmtRecord(to.scale)}, ${base} }, ${pos});`
        );
      } else {
        lines.push(
          `tl.to(${root}.scale, { ${fmtRecord(to.scale)}, ${base} }, ${pos});`
        );
      }
    }
    if (to.alpha != null) {
      if (step.kind === "fromTo" && from?.alpha != null) {
        lines.push(
          `tl.fromTo(${root}, { alpha: ${from.alpha}, ${base} }, { alpha: ${to.alpha}, ${base} }, ${pos});`
        );
      } else {
        lines.push(`tl.to(${root}, { alpha: ${to.alpha}, ${base} }, ${pos});`);
      }
    }
  });
  return lines;
}

export function pixiInitialStateToCodeLines(
  target: AnimationTarget,
  initial?: Transform[]
): string[] {
  const root = pixiLayerVarName(target);
  const ch = gsapPropsToPixiChannels(
    pickPixiProps(buildInitialProps(initial))
  );
  const lines: string[] = [];
  if (Object.keys(ch.position).length) {
    lines.push(`gsap.set(${root}, { ${fmtRecord(ch.position)} });`);
  }
  if (ch.rotation != null) {
    lines.push(`gsap.set(${root}, { rotation: ${ch.rotation} });`);
  }
  if (Object.keys(ch.scale).length) {
    lines.push(`gsap.set(${root}.scale, { ${fmtRecord(ch.scale)} });`);
  }
  if (ch.alpha != null) {
    lines.push(`gsap.set(${root}, { alpha: ${ch.alpha} });`);
  }
  return lines;
}