import { defaultRuleSelectorForTarget } from "@/lib/gsap-css-rule";
import { DEFAULT_MOTION_PATH_SELECTOR } from "@/lib/gsap-motion-path";
import type { AnimationTarget, TransformType } from "@/stores/timeline-store";

export function defaultValuesForTransformType(
  type: TransformType,
  options?: {
    targetId?: string;
    targets?: AnimationTarget[];
  }
): Record<string, number | string> {
  const layer = options?.targets?.find((t) => t.id === options.targetId);
  switch (type) {
    case "move":
      return { x: 0, y: 0 };
    case "scale":
      return { scaleX: 1, scaleY: 1 };
    case "rotate":
      return { rotation: 0 };
    case "rotateX":
      return { rotationX: 0 };
    case "rotateY":
      return { rotationY: 0 };
    case "moveZ":
      return { z: 0 };
    case "opacity":
      return { opacity: 1 };
    case "skew":
      return { skewX: 0, skewY: 0 };
    case "filter":
      return { filter: "blur", value: 0 };
    case "drawSvg":
      return { drawSVG: "0% 100%" };
    case "morphSvg":
      return { morphSVG: "" };
    case "motionPath":
      return {
        path: layer?.motionPathSelector ?? DEFAULT_MOTION_PATH_SELECTOR,
        autoRotate: 0,
        align: "self",
        alignOrigin: "0.5, 0.5",
        start: "",
        end: "",
      };
    case "cssVar":
      return {
        varName: "--myColor",
        value: "#0ae448",
        valueKind: "color",
      };
    case "cssRule":
      return {
        ruleSelector: defaultRuleSelectorForTarget(options?.targetId ?? ""),
        property: "color",
        value: "#0ae448",
      };
    default:
      return {};
  }
}