import type { TransformType } from "@/stores/timeline-store";

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
  ];

export const SVG_TRANSFORM_OPTIONS: { value: TransformType; label: string }[] = [
  { value: "drawSvg", label: "DrawSVG" },
  { value: "morphSvg", label: "MorphSVG" },
];