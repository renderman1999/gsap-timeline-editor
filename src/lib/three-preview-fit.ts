import type { CSSProperties } from "react";
import * as THREE from "three";
import type { Model3dCameraPreset } from "@/lib/model3d-scene";
import {
  DEFAULT_MODEL3D_CAMERA_FOV,
  MAX_MODEL3D_CAMERA_FOV,
  MIN_MODEL3D_CAMERA_FOV,
} from "@/lib/model3d-scene";

export const MODEL3D_VIEW_W = 500;
export const MODEL3D_VIEW_H = 500;

const FIT_PADDING = 1.45;

export function model3dHostStyle(): CSSProperties {
  return {
    width: MODEL3D_VIEW_W,
    height: MODEL3D_VIEW_H,
    flexShrink: 0,
    ["--model3d-view-w" as string]: `${MODEL3D_VIEW_W}px`,
    ["--model3d-view-h" as string]: `${MODEL3D_VIEW_H}px`,
  };
}

/** Allinea buffer WebGL e CSS del canvas alle dimensioni logiche del viewport. */
export function syncModel3dViewport(
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  viewW: number,
  viewH: number
): void {
  const pr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
    2
  );
  renderer.setPixelRatio(pr);
  renderer.setSize(viewW, viewH, false);
  const canvas = renderer.domElement;
  canvas.style.display = "block";
  canvas.style.width = `${viewW}px`;
  canvas.style.height = `${viewH}px`;
  canvas.style.maxWidth = "none";
  canvas.style.maxHeight = "none";
  camera.aspect = viewW / viewH;
  camera.updateProjectionMatrix();
}

export type Model3dCameraFitOptions = {
  preset: Model3dCameraPreset;
  fov: number;
};

/** Riduce il clipping quando scale/position cambiano il bounding box. */
export function fitPerspectiveCameraToObject(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  viewAspect: number,
  options?: Partial<Model3dCameraFitOptions>
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const preset = options?.preset ?? "front";
  const fov = options?.fov ?? camera.fov ?? DEFAULT_MODEL3D_CAMERA_FOV;
  camera.fov = fov;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);

  const vFov = (fov * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * viewAspect);
  const distV = maxDim / 2 / Math.tan(vFov / 2);
  const distH = maxDim / 2 / Math.tan(hFov / 2);
  const distance = Math.max(distV, distH) * FIT_PADDING;

  if (preset === "top") {
    camera.position.set(center.x, center.y + distance, center.z);
  } else {
    camera.position.set(
      center.x,
      center.y + size.y * 0.05,
      center.z + distance
    );
  }
  camera.near = Math.max(0.01, distance / 100);
  camera.far = distance * 50;
  camera.aspect = viewAspect;
  camera.updateProjectionMatrix();
  camera.lookAt(center);
}

export type ThreeFitView = () => void;

export function setThreeFitViewOptions(
  root: THREE.Object3D,
  options: Model3dCameraFitOptions
): void {
  root.userData.__fitOptions = options;
}

export function bindThreeFitView(
  root: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  viewW: number,
  viewH: number,
  fitOptions: Model3dCameraFitOptions
): ThreeFitView {
  setThreeFitViewOptions(root, fitOptions);
  const fit = () => {
    const opts =
      (root.userData.__fitOptions as Model3dCameraFitOptions | undefined) ??
      fitOptions;
    fitPerspectiveCameraToObject(camera, root, viewW / viewH, opts);
  };
  root.userData.__fitView = fit;
  return fit;
}

export function callThreeFitView(root: THREE.Object3D): void {
  const fit = root.userData.__fitView as ThreeFitView | undefined;
  fit?.();
}

/** Snippet vanilla JS per export HTML (stessa logica del fit in preview). */
export function model3dCameraFitVanillaJsLines(indent = ""): string[] {
  const body = `${indent}  `;
  return [
    `${indent}function __fitModel3dCamera(camera, root, viewW, viewH, sceneCfg) {`,
    `${body}const preset = sceneCfg.cameraPreset === 'top' ? 'top' : 'front';`,
    `${body}const fov = Math.min(${MAX_MODEL3D_CAMERA_FOV}, Math.max(${MIN_MODEL3D_CAMERA_FOV}, sceneCfg.cameraFov ?? ${DEFAULT_MODEL3D_CAMERA_FOV}));`,
    `${body}camera.fov = fov;`,
    `${body}const box = new THREE.Box3().setFromObject(root);`,
    `${body}if (box.isEmpty()) return;`,
    `${body}const size = box.getSize(new THREE.Vector3());`,
    `${body}const center = box.getCenter(new THREE.Vector3());`,
    `${body}const maxDim = Math.max(size.x, size.y, size.z, 0.001);`,
    `${body}const aspect = viewW / viewH;`,
    `${body}const vFov = (fov * Math.PI) / 180;`,
    `${body}const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);`,
    `${body}const distance = Math.max(maxDim / 2 / Math.tan(vFov / 2), maxDim / 2 / Math.tan(hFov / 2)) * ${FIT_PADDING};`,
    `${body}if (preset === 'top') camera.position.set(center.x, center.y + distance, center.z);`,
    `${body}else camera.position.set(center.x, center.y + size.y * 0.05, center.z + distance);`,
    `${body}camera.near = Math.max(0.01, distance / 100);`,
    `${body}camera.far = distance * 50;`,
    `${body}camera.aspect = aspect;`,
    `${body}camera.updateProjectionMatrix();`,
    `${body}camera.lookAt(center);`,
    `${indent}}`,
  ];
}