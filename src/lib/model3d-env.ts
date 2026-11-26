import type { Model3dSceneSettings } from "@/lib/model3d-scene";

/** Stessi HDR usati da @react-three/drei `<Environment preset />`. */
export const MODEL3D_ENV_HDRI_BASE =
  "https://raw.githubusercontent.com/pmndrs/drei-assets@master/hdri/";

export const MODEL3D_ENV_HDRI_FILE: Record<
  Model3dSceneSettings["envPreset"],
  string
> = {
  studio: "studio_small_09_1k.hdr",
  city: "potsdamer_platz_1k.hdr",
  warehouse: "empty_warehouse_01_1k.hdr",
  sunset: "venice_sunset_1k.hdr",
};

export function model3dEnvMapUrl(
  preset: Model3dSceneSettings["envPreset"]
): string {
  const file =
    MODEL3D_ENV_HDRI_FILE[preset] ?? MODEL3D_ENV_HDRI_FILE.studio;
  return `${MODEL3D_ENV_HDRI_BASE}${file}`;
}