import type * as THREE from "three";

export type ThreeLayerHandle = {
  root: THREE.Object3D;
  /** Modello caricato (root può animare il gruppo contenitore). */
  loaded: boolean;
  dispose: () => void;
  fitView?: () => void;
  render?: () => void;
};

const registry = new Map<string, ThreeLayerHandle>();

export function registerThreeLayer(targetId: string, handle: ThreeLayerHandle) {
  const prev = registry.get(targetId);
  if (prev && prev.dispose !== handle.dispose) prev.dispose();
  registry.set(targetId, handle);
}

export function setThreeLayerLoaded(targetId: string, loaded: boolean) {
  const h = registry.get(targetId);
  if (h) h.loaded = loaded;
}

export function patchThreeLayer(
  targetId: string,
  patch: Partial<Pick<ThreeLayerHandle, "loaded" | "fitView" | "render">>
) {
  const h = registry.get(targetId);
  if (h) Object.assign(h, patch);
}

export function unregisterThreeLayer(targetId: string) {
  registry.get(targetId)?.dispose();
  registry.delete(targetId);
}

export function getThreeLayerRoot(targetId: string): THREE.Object3D | null {
  return registry.get(targetId)?.root ?? null;
}

export function isThreeLayerReady(targetId: string): boolean {
  const h = registry.get(targetId);
  return Boolean(h?.loaded && h.root);
}

export function clearThreeLayerRegistry() {
  registry.forEach((h) => h.dispose());
  registry.clear();
}

export function renderAllThreeLayers(): void {
  registry.forEach((h) => h.render?.());
}