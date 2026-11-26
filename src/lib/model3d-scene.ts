import * as THREE from "three";

export type Model3dMeshMaterial = {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  opacity?: number;
};

export type Model3dCameraPreset = "front" | "top";

export const DEFAULT_MODEL3D_CAMERA_FOV = 45;
export const MIN_MODEL3D_CAMERA_FOV = 12;
export const MAX_MODEL3D_CAMERA_FOV = 90;

export type Model3dSceneSettings = {
  shadowContact: boolean;
  shadowMap: boolean;
  contactOpacity: number;
  contactBlur: number;
  contactScale: number;
  /** Tinta colore dell'ombra sul piano (ShadowMaterial). */
  groundColor: string;
  /** Intensità ombra sul piano trasparente (0–1). */
  shadowGroundOpacity: number;
  envPreset: "studio" | "city" | "warehouse" | "sunset";
  envIntensity: number;
  /** Vista telecamera nel viewport 3D */
  cameraPreset: Model3dCameraPreset;
  cameraFov: number;
  meshMaterials: Record<string, Model3dMeshMaterial>;
};

export const DEFAULT_MODEL3D_SCENE: Model3dSceneSettings = {
  shadowContact: true,
  shadowMap: true,
  contactOpacity: 0.4,
  contactBlur: 2.5,
  contactScale: 12,
  groundColor: "#000000",
  shadowGroundOpacity: 0.55,
  envPreset: "studio",
  envIntensity: 0.85,
  cameraPreset: "front",
  cameraFov: DEFAULT_MODEL3D_CAMERA_FOV,
  meshMaterials: {},
};

export function normalizeModel3dSceneSettings(
  raw?: Partial<Model3dSceneSettings> | null
): Model3dSceneSettings {
  if (!raw) return { ...DEFAULT_MODEL3D_SCENE, meshMaterials: {} };
  return {
    shadowContact: raw.shadowContact ?? DEFAULT_MODEL3D_SCENE.shadowContact,
    shadowMap: raw.shadowMap ?? DEFAULT_MODEL3D_SCENE.shadowMap,
    contactOpacity: raw.contactOpacity ?? DEFAULT_MODEL3D_SCENE.contactOpacity,
    contactBlur: raw.contactBlur ?? DEFAULT_MODEL3D_SCENE.contactBlur,
    contactScale: raw.contactScale ?? DEFAULT_MODEL3D_SCENE.contactScale,
    groundColor: raw.groundColor ?? DEFAULT_MODEL3D_SCENE.groundColor,
    shadowGroundOpacity:
      raw.shadowGroundOpacity ?? DEFAULT_MODEL3D_SCENE.shadowGroundOpacity,
    envPreset: raw.envPreset ?? DEFAULT_MODEL3D_SCENE.envPreset,
    envIntensity: raw.envIntensity ?? DEFAULT_MODEL3D_SCENE.envIntensity,
    cameraPreset:
      raw.cameraPreset === "top" || raw.cameraPreset === "front"
        ? raw.cameraPreset
        : DEFAULT_MODEL3D_SCENE.cameraPreset,
    cameraFov: clampModel3dCameraFov(raw.cameraFov),
    meshMaterials: { ...(raw.meshMaterials ?? {}) },
  };
}

export function clampModel3dCameraFov(fov: number | undefined): number {
  const n = fov ?? DEFAULT_MODEL3D_CAMERA_FOV;
  if (!Number.isFinite(n)) return DEFAULT_MODEL3D_CAMERA_FOV;
  return Math.min(MAX_MODEL3D_CAMERA_FOV, Math.max(MIN_MODEL3D_CAMERA_FOV, n));
}

export function model3dCameraFitOptions(
  settings: Pick<Model3dSceneSettings, "cameraPreset" | "cameraFov">
): { preset: Model3dCameraPreset; fov: number } {
  return {
    preset:
      settings.cameraPreset === "top" ? "top" : ("front" as Model3dCameraPreset),
    fov: clampModel3dCameraFov(settings.cameraFov),
  };
}

export function listMeshNames(root: THREE.Object3D): string[] {
  const names = new Set<string>();
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      names.add(child.name?.trim() || child.uuid);
    }
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

function applyToMaterial(
  material: THREE.Material,
  patch: Model3dMeshMaterial
): void {
  if (!(material instanceof THREE.MeshStandardMaterial) &&
      !(material instanceof THREE.MeshPhysicalMaterial)) {
    return;
  }
  if (patch.color != null) material.color.set(patch.color);
  if (patch.emissive != null) material.emissive.set(patch.emissive);
  if (patch.metalness != null) material.metalness = patch.metalness;
  if (patch.roughness != null) material.roughness = patch.roughness;
  if (patch.opacity != null) {
    material.opacity = patch.opacity;
    material.transparent = patch.opacity < 1;
  }
  material.needsUpdate = true;
}

export function applyMeshMaterials(
  root: THREE.Object3D,
  materials: Record<string, Model3dMeshMaterial>
): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const key = child.name?.trim() || child.uuid;
    const patch = materials[key] ?? materials[child.name?.trim() ?? ""];
    if (!patch) return;
    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];
    mats.forEach((m) => applyToMaterial(m, patch));
  });
}

function toShadowCastMaterial(
  material: THREE.Material
): THREE.MeshStandardMaterial {
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    return material;
  }
  const basic =
    material instanceof THREE.MeshBasicMaterial
      ? material
      : material instanceof THREE.MeshLambertMaterial
        ? material
        : material instanceof THREE.MeshPhongMaterial
          ? material
          : null;
  const color = basic?.color?.clone() ?? new THREE.Color(0xffffff);
  return new THREE.MeshStandardMaterial({
    color,
    map: basic && "map" in basic ? basic.map ?? undefined : undefined,
    transparent: material.transparent,
    opacity: material.opacity,
    roughness: 0.65,
    metalness: 0.1,
  });
}

/** MeshBasicMaterial non proietta ombre: converti dove serve. */
export function upgradeMaterialsForShadows(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => toShadowCastMaterial(m));
    } else {
      const next = toShadowCastMaterial(child.material);
      if (next !== child.material) child.material = next;
    }
  });
}

export function enableShadowMapsOnMeshes(
  root: THREE.Object3D,
  enabled: boolean
): void {
  if (enabled) upgradeMaterialsForShadows(root);
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = enabled;
      child.receiveShadow = false;
    }
  });
}

export function fitDirectionalShadowToObject(
  light: THREE.DirectionalLight,
  root: THREE.Object3D
): void {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.5);
  const half = maxDim * 1.4;
  const center = box.getCenter(new THREE.Vector3());
  light.target.position.copy(center);
  light.target.updateMatrixWorld();

  const cam = light.shadow.camera;
  if (cam instanceof THREE.OrthographicCamera) {
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 0.25;
    cam.far = maxDim * 6 + 5;
    cam.updateProjectionMatrix();
  }
}

/** Centra e scala come in preview legacy (root animato da GSAP). */
export function prepareGltfSceneForStage(scene: THREE.Object3D): THREE.Object3D {
  const model = scene.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  model.scale.setScalar(1.35 / maxDim);
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  return model;
}

export function groundYFromObject(root: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(root);
  return box.min.y;
}