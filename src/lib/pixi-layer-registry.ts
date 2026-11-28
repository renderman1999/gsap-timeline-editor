import { gsap } from "gsap";
import type { Application, Container } from "pixi.js";
import { killPreviewTimelineNow } from "@/lib/pixi-preview-sync";
import { isIsolatedPixiPreviewId } from "@/lib/pixi-preview-target";

export type PixiLayerHandle = {
  app: Application;
  root: Container;
  ready: boolean;
  dispose: () => void;
};

const registry = new Map<string, PixiLayerHandle>();
/** Root precedenti: GSAP può ancora referenziarli dopo destroy. */
const pixiGsapRootsById = new Map<string, Container>();

/** Oggetto plain per GSAP (evita tween diretti sul Container Pixi). */
export type PixiGsapDrive = {
  x: number;
  y: number;
  rotation: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
};

const pixiGsapDrives = new Map<string, PixiGsapDrive>();

export function getOrCreatePixiGsapDrive(targetId: string): PixiGsapDrive {
  let drive = pixiGsapDrives.get(targetId);
  if (!drive) {
    drive = {
      x: 0,
      y: 0,
      rotation: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
    };
    pixiGsapDrives.set(targetId, drive);
  }
  return drive;
}

export function syncPixiGsapDriveFromRoot(targetId: string): void {
  const root = registry.get(targetId)?.root;
  const drive = getOrCreatePixiGsapDrive(targetId);
  if (!pixiRootAlive(root)) return;
  drive.x = root.x;
  drive.y = root.y;
  drive.rotation = root.rotation;
  drive.alpha = root.alpha;
  drive.scaleX = root.scale.x;
  drive.scaleY = root.scale.y;
}

export function applyPixiGsapDriveToRoot(targetId: string): void {
  const root = getPixiLayerRoot(targetId);
  const drive = pixiGsapDrives.get(targetId);
  if (!drive || !pixiRootAlive(root)) return;
  try {
    root.x = drive.x;
    root.y = drive.y;
    root.rotation = drive.rotation;
    root.alpha = drive.alpha;
    root.scale.set(drive.scaleX, drive.scaleY);
  } catch {
    /* root distrutto in race */
  }
}

let pixiLayoutEpoch = 0;
const pixiLayoutEpochListeners = new Set<() => void>();

/** Per far ricostruire la timeline GSAP dopo resize / ricreazione canvas. */
export function subscribePixiLayoutEpoch(listener: () => void): () => void {
  pixiLayoutEpochListeners.add(listener);
  return () => pixiLayoutEpochListeners.delete(listener);
}

export function getPixiLayoutEpoch(): number {
  return pixiLayoutEpoch;
}

function bumpPixiLayoutEpoch(): void {
  pixiLayoutEpoch += 1;
  pixiLayoutEpochListeners.forEach((l) => l());
}

function pixiRootAlive(root: Container | null | undefined): root is Container {
  return Boolean(root && !root.destroyed && root.scale);
}

function killGsapOnPixiRoot(root: Container | null | undefined): void {
  if (!root) return;
  try {
    gsap.killTweensOf(root);
    if (root.scale) gsap.killTweensOf(root.scale);
    if (root.position) gsap.killTweensOf(root.position);
  } catch {
    /* root già distrutto */
  }
}

export function killPixiLayerGsapTweens(targetId: string): void {
  killGsapOnPixiRoot(registry.get(targetId)?.root);
  killGsapOnPixiRoot(pixiGsapRootsById.get(targetId));
  const drive = pixiGsapDrives.get(targetId);
  if (drive) gsap.killTweensOf(drive);
}

export function preparePixiLayerRecreate(targetId: string): void {
  if (!isIsolatedPixiPreviewId(targetId)) {
    killPreviewTimelineNow();
  }
  killPixiLayerGsapTweens(targetId);
  setPixiLayerReady(targetId, false);
}

export function registerPixiLayer(targetId: string, handle: PixiLayerHandle) {
  const prev = registry.get(targetId);
  if (prev && prev.dispose !== handle.dispose) {
    preparePixiLayerRecreate(targetId);
    prev.dispose();
  }
  pixiGsapRootsById.set(targetId, handle.root);
  registry.set(targetId, handle);
  if (pixiGsapDrives.has(targetId)) {
    applyPixiGsapDriveToRoot(targetId);
  } else {
    syncPixiGsapDriveFromRoot(targetId);
  }
}

export function setPixiLayerReady(targetId: string, ready: boolean) {
  const h = registry.get(targetId);
  if (h) h.ready = ready;
  if (ready && !isIsolatedPixiPreviewId(targetId)) {
    bumpPixiLayoutEpoch();
  }
}

export function unregisterPixiLayer(targetId: string) {
  const h = registry.get(targetId);
  if (h?.root) pixiGsapRootsById.set(targetId, h.root);
  killPixiLayerGsapTweens(targetId);
  try {
    h?.dispose();
  } catch {
    /* canvas già distrutto */
  }
  registry.delete(targetId);
}

export function clearPixiGsapRootRef(targetId: string): void {
  pixiGsapRootsById.delete(targetId);
}

export function getPixiLayerRoot(targetId: string): Container | null {
  const h = registry.get(targetId);
  if (!pixiRootAlive(h?.root)) return null;
  return h.root;
}

export function isPixiLayerReady(targetId: string): boolean {
  const h = registry.get(targetId);
  return Boolean(h?.ready && pixiRootAlive(h.root));
}

export function clearPixiLayerRegistry() {
  registry.forEach((_, id) => preparePixiLayerRecreate(id));
  registry.forEach((h) => h.dispose());
  registry.clear();
  pixiGsapRootsById.clear();
  pixiGsapDrives.clear();
}

export function renderAllPixiLayers(): void {
  try {
    registry.forEach((h) => {
      if (!pixiRootAlive(h.root)) return;
      if (h.app?.renderer) h.app.render();
    });
  } catch {
    /* evita crash in onUpdate durante rebuild */
  }
}