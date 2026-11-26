import { gsap } from "gsap";
import type * as THREE from "three";

export type Model3dInteractionTrigger =
  | "click"
  | "doubleClick"
  | "pointerenter"
  | "pointerleave";

export type Model3dInteractionHit = "viewport" | "model";

export type Model3dInteractionKind =
  | "rotateRelative"
  | "rotateToggle"
  | "scalePulse"
  | "scaleToggle"
  | "moveRelative";

export type Model3dInteractionAxis = "x" | "y" | "z";

export interface Model3dInteractionRule {
  id: string;
  enabled: boolean;
  name: string;
  trigger: Model3dInteractionTrigger;
  hit: Model3dInteractionHit;
  /** Se valorizzato, il raycast deve colpire questa mesh. */
  meshName?: string;
  kind: Model3dInteractionKind;
  axis: Model3dInteractionAxis;
  /** Gradi (rotate), moltiplicatore scala (scale), unita world (move). */
  amount: number;
  duration: number;
  ease: string;
}

export interface Model3dInteractionConfig {
  enabled: boolean;
  rules: Model3dInteractionRule[];
}

export const DEFAULT_MODEL3D_INTERACTION: Model3dInteractionConfig = {
  enabled: false,
  rules: [],
};

const DEG = Math.PI / 180;

export function newModel3dInteractionRule(
  partial?: Partial<Model3dInteractionRule>
): Model3dInteractionRule {
  return {
    id: Math.random().toString(36).slice(2, 11),
    enabled: true,
    name: partial?.name ?? "Nuova interazione",
    trigger: partial?.trigger ?? "click",
    hit: partial?.hit ?? "model",
    meshName: partial?.meshName,
    kind: partial?.kind ?? "rotateRelative",
    axis: partial?.axis ?? "y",
    amount: partial?.amount ?? 90,
    duration: partial?.duration ?? 0.6,
    ease: partial?.ease ?? "power2.out",
    ...partial,
  };
}

export function normalizeModel3dInteraction(
  raw?: Model3dInteractionConfig | null
): Model3dInteractionConfig {
  if (!raw) return { ...DEFAULT_MODEL3D_INTERACTION, rules: [] };
  const rules = (raw.rules ?? []).map((r) => ({
    ...newModel3dInteractionRule(),
    ...r,
    id: r.id || Math.random().toString(36).slice(2, 11),
    duration: Math.max(0.05, r.duration ?? 0.6),
    amount: Number.isFinite(r.amount) ? r.amount : 90,
  }));
  return {
    enabled: raw.enabled === true,
    rules,
  };
}

type ToggleBag = Record<string, boolean>;

function toggleState(root: THREE.Object3D, ruleId: string): boolean {
  const bag = root.userData.__model3dInteractionToggle as ToggleBag | undefined;
  return bag?.[ruleId] ?? false;
}

function setToggleState(root: THREE.Object3D, ruleId: string, on: boolean): void {
  if (!root.userData.__model3dInteractionToggle) {
    root.userData.__model3dInteractionToggle = {};
  }
  (root.userData.__model3dInteractionToggle as ToggleBag)[ruleId] = on;
}

function rotatingAmount(rule: Model3dInteractionRule): number {
  return rule.amount * DEG;
}

export type Model3dInteractionRuntime = {
  onUpdate?: () => void;
};

export function runModel3dInteractionRule(
  root: THREE.Object3D,
  rule: Model3dInteractionRule,
  runtime?: Model3dInteractionRuntime
): gsap.core.Tween | null {
  if (!rule.enabled) return null;

  const axis = rule.axis;
  const dur = rule.duration;
  const ease = rule.ease;
  const onUpdate = () => runtime?.onUpdate?.();

  const rot = root.rotation;
  const pos = root.position;
  const scale = root.scale;

  switch (rule.kind) {
    case "rotateRelative":
      return gsap.to(rot, {
        [axis]: `+=${rotatingAmount(rule)}`,
        duration: dur,
        ease,
        onUpdate,
      });
    case "rotateToggle": {
      const on = !toggleState(root, rule.id);
      setToggleState(root, rule.id, on);
      const delta = on ? rotatingAmount(rule) : -rotatingAmount(rule);
      return gsap.to(rot, {
        [axis]: `+=${delta}`,
        duration: dur,
        ease,
        onUpdate,
      });
    }
    case "scalePulse": {
      const peak = rule.amount;
      const key = axis;
      const from = scale[key];
      return gsap.to(scale, {
        [key]: peak,
        duration: dur / 2,
        ease,
        yoyo: true,
        repeat: 1,
        onUpdate,
        onComplete: () => {
          scale[key] = from;
          onUpdate();
        },
      });
    }
    case "scaleToggle": {
      const on = !toggleState(root, rule.id);
      setToggleState(root, rule.id, on);
      const target = on ? rule.amount : 1;
      return gsap.to(scale, {
        [axis]: target,
        duration: dur,
        ease,
        onUpdate,
      });
    }
    case "moveRelative":
      return gsap.to(pos, {
        [axis]: `+=${rule.amount}`,
        duration: dur,
        ease,
        onUpdate,
      });
    default:
      return null;
  }
}

export const MODEL3D_INTERACTION_KIND_LABELS: Record<
  Model3dInteractionKind,
  string
> = {
  rotateRelative: "Ruota (relativo)",
  rotateToggle: "Ruota (toggle)",
  scalePulse: "Scala (pulse)",
  scaleToggle: "Scala (toggle)",
  moveRelative: "Sposta (relativo)",
};

export const MODEL3D_TRIGGER_LABELS: Record<Model3dInteractionTrigger, string> =
  {
    click: "Click",
    doubleClick: "Doppio click",
    pointerenter: "Hover enter",
    pointerleave: "Hover leave",
  };

export const MODEL3D_HIT_LABELS: Record<Model3dInteractionHit, string> = {
  viewport: "Area viewport",
  model: "Solo sul modello",
};