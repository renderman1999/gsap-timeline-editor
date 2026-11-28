import type { TransformType } from "@/stores/timeline-store";

export function transformAllowsMultiple(type: TransformType): boolean {
  return (
    type === "cssRule" ||
    type === "cssVar" ||
    type === "cssProp" ||
    type === "physicsProps"
  );
}

export const CSS3D_TRANSFORM_OPTIONS: { value: TransformType; label: string }[] =
  [
    { value: "rotateX", label: "Rotate X (3D)" },
    { value: "rotateY", label: "Rotate Y (3D)" },
    { value: "moveZ", label: "Depth (Z)" },
  ];

export const CORE_TRANSFORM_OPTIONS: { value: TransformType; label: string }[] =
  [
    { value: "move", label: "Move" },
    { value: "scale", label: "Scale" },
    { value: "rotate", label: "Rotate" },
    { value: "opacity", label: "Opacity" },
    { value: "skew", label: "Skew" },
    { value: "filter", label: "Filter" },
    { value: "motionPath", label: "MotionPath" },
    { value: "cssVar", label: "CSS variable" },
    { value: "cssRule", label: "CSS rule (::pseudo)" },
    { value: "autoAlpha", label: "AutoAlpha" },
    { value: "transformOrigin", label: "Transform origin" },
    { value: "cssProp", label: "Proprietà CSS" },
    { value: "scrambleText", label: "ScrambleText" },
    { value: "physics2D", label: "Physics2D" },
    { value: "physicsProps", label: "PhysicsProps" },
    { value: "scrollTo", label: "ScrollTo" },
    { value: "flip", label: "Flip" },
  ];

export const SVG_TRANSFORM_OPTIONS: { value: TransformType; label: string }[] = [
  { value: "drawSvg", label: "DrawSVG" },
  { value: "morphSvg", label: "MorphSVG" },
  { value: "svgOrigin", label: "SVG origin" },
];