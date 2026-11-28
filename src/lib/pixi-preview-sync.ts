/** Sincronizza la kill della timeline preview prima del destroy canvas Pixi. */
let killPreviewTimeline: (() => void) | null = null;

export function registerPreviewTimelineKiller(fn: (() => void) | null): void {
  killPreviewTimeline = fn;
}

export function killPreviewTimelineNow(): void {
  killPreviewTimeline?.();
}