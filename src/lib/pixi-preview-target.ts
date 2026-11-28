import type { AnimationTarget } from "@/stores/timeline-store";
import type { PixiLayerSettings } from "@/lib/pixi-scene";
import { DEFAULT_PIXI_SCENE } from "@/lib/pixi-scene";

export function isIsolatedPixiPreviewId(targetId: string): boolean {
  return targetId.includes("__pixi-");
}

/** ID Pixi separato dall'anteprima principale (stesso layer, canvas isolato). */
export function pixiIsolatedPreviewId(
  layerId: string,
  scope: "scene-editor" | "panel"
): string {
  return `${layerId}__pixi-${scope}`;
}

export function buildPixiIsolatedPreviewTarget(
  layerId: string,
  scope: "scene-editor" | "panel",
  targetName: string,
  pixiScene: string | undefined,
  pixiSettings: PixiLayerSettings | undefined,
  sceneOverride?: string
): AnimationTarget {
  const id = pixiIsolatedPreviewId(layerId, scope);
  const scene =
    sceneOverride?.trim() || pixiScene?.trim() || DEFAULT_PIXI_SCENE;
  return {
    id,
    name: targetName,
    type: "pixi",
    selector: `.pixi-${id.slice(0, 12)}`,
    pixiScene: scene,
    pixiSettings,
  };
}