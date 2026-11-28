import type { AnimationTarget } from "@/stores/timeline-store";

/** Campi layer che richiedono rebuild GSAP (escluso `style`, che resta solo React/CSS). */
export function targetAnimationDigest(target: AnimationTarget): string {
  return [
    target.id,
    target.type,
    target.shape ?? "",
    target.text ?? "",
    target.textSplit ?? "none",
    target.selector,
    target.scrollPin ? "1" : "0",
    target.imageUrl ?? "",
    target.model3dUrl ?? "",
    target.svgPathSelector ?? "",
    (target.pixiScene ?? "").length,
    JSON.stringify(target.pixiSettings ?? null),
    (target.codeHtml ?? "").length,
    (target.codeJs ?? "").length,
    JSON.stringify(target.draggable ?? null),
  ].join(":");
}

export function targetsAnimationDigest(targets: AnimationTarget[]): string {
  return targets.map(targetAnimationDigest).join("|");
}