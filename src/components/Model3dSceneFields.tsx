"use client";

import { ColorField } from "@/components/ColorField";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clampModel3dCameraFov,
  DEFAULT_MODEL3D_SCENE,
  MAX_MODEL3D_CAMERA_FOV,
  MIN_MODEL3D_CAMERA_FOV,
  normalizeModel3dSceneSettings,
  type Model3dMeshMaterial,
  type Model3dSceneSettings,
} from "@/lib/model3d-scene";

type Props = {
  settings?: Model3dSceneSettings;
  meshNames?: string[];
  onChange: (next: Model3dSceneSettings) => void;
};

function meshMaterialOrEmpty(
  settings: Model3dSceneSettings,
  meshName: string
): Model3dMeshMaterial {
  return settings.meshMaterials[meshName] ?? {};
}

function MeshMaterialSlider({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: number | undefined;
  fallback: number;
  onChange: (value: number) => void;
}) {
  const display = value ?? fallback;
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-[1fr_2.25rem] gap-1.5 items-center">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          className="w-full h-2 accent-primary"
          value={display}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="text-[10px] text-muted-foreground text-right tabular-nums">
          {Math.round(display * 100)}%
        </span>
      </div>
    </div>
  );
}

function MeshMaterialBlock({
  meshName,
  mat,
  onPatch,
}: {
  meshName: string;
  mat: Model3dMeshMaterial;
  onPatch: (partial: Model3dMeshMaterial) => void;
}) {
  return (
    <div className="rounded border border-border/50 p-2 space-y-2">
      <p className="text-[10px] font-mono truncate" title={meshName}>
        {meshName}
      </p>
      <div className="[&_label]:text-[10px] [&_label]:text-muted-foreground [&_input]:h-7 [&_input]:text-xxs">
        <ColorField
          label="Colore"
          value={mat.color}
          pickerFallback="#ffffff"
          placeholder="#ffffff"
          onChange={(color) => onPatch({ color })}
        />
      </div>
      <MeshMaterialSlider
        label="Metallic"
        value={mat.metalness}
        fallback={0.1}
        onChange={(metalness) => onPatch({ metalness })}
      />
      <MeshMaterialSlider
        label="Roughness"
        value={mat.roughness}
        fallback={0.65}
        onChange={(roughness) => onPatch({ roughness })}
      />
      <MeshMaterialSlider
        label="Opacità"
        value={mat.opacity}
        fallback={1}
        onChange={(opacity) => onPatch({ opacity })}
      />
    </div>
  );
}

export function Model3dSceneFields({ settings, meshNames = [], onChange }: Props) {
  const scene = normalizeModel3dSceneSettings(settings);

  const patch = (partial: Partial<Model3dSceneSettings>) =>
    onChange({ ...scene, ...partial });

  const patchMesh = (meshName: string, partial: Model3dMeshMaterial) => {
    const prev = meshMaterialOrEmpty(scene, meshName);
    patch({
      meshMaterials: {
        ...scene.meshMaterials,
        [meshName]: { ...prev, ...partial },
      },
    });
  };

  return (
    <div className="space-y-3 rounded-md border border-border/80 p-2">
      <p className="text-xxs font-medium text-muted-foreground">
        Scena 3D
      </p>

      <div className="space-y-2 pb-2 border-b border-border/60">
         <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Preset camera</Label>
          <Select
            value={scene.cameraPreset}
            onValueChange={(cameraPreset: Model3dSceneSettings["cameraPreset"]) =>
              patch({ cameraPreset })
            }
          >
            <SelectTrigger className="h-7 text-xxs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Fronte</SelectItem>
              <SelectItem value="top">Sopra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">FOV</Label>
          <div className="grid grid-cols-[1fr_2.5rem] gap-2 items-center">
            <input
              type="range"
              min={MIN_MODEL3D_CAMERA_FOV}
              max={MAX_MODEL3D_CAMERA_FOV}
              step={1}
              className="w-full h-2 accent-primary"
              value={scene.cameraFov}
              onChange={(e) =>
                patch({
                  cameraFov: clampModel3dCameraFov(Number(e.target.value)),
                })
              }
            />
            <Input
              type="number"
              min={MIN_MODEL3D_CAMERA_FOV}
              max={MAX_MODEL3D_CAMERA_FOV}
              className="h-7 text-xxs px-1"
              value={scene.cameraFov}
              onChange={(e) =>
                patch({
                  cameraFov: clampModel3dCameraFov(
                    parseFloat(e.target.value) || DEFAULT_MODEL3D_SCENE.cameraFov
                  ),
                })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Label className="text-xxs">Contact shadow</Label>
        <Switch
          checked={scene.shadowContact}
          onCheckedChange={(shadowContact) => patch({ shadowContact })}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xxs">Shadow map</Label>
        <Switch
          checked={scene.shadowMap}
          onCheckedChange={(shadowMap) => patch({ shadowMap })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Contact opac.</Label>
          <Input
            type="number"
            step={0.05}
            min={0}
            max={1}
            className="h-7 text-xxs"
            value={scene.contactOpacity}
            onChange={(e) =>
              patch({
                contactOpacity:
                  parseFloat(e.target.value) ||
                  DEFAULT_MODEL3D_SCENE.contactOpacity,
              })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Contact blur</Label>
          <Input
            type="number"
            step={0.5}
            min={0}
            className="h-7 text-xxs"
            value={scene.contactBlur}
            onChange={(e) =>
              patch({
                contactBlur:
                  parseFloat(e.target.value) ||
                  DEFAULT_MODEL3D_SCENE.contactBlur,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Environment</Label>
        <Select
          value={scene.envPreset}
          onValueChange={(envPreset: Model3dSceneSettings["envPreset"]) =>
            patch({ envPreset })
          }
        >
          <SelectTrigger className="h-7 text-xxs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="city">City</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
            <SelectItem value="sunset">Sunset</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="[&_label]:text-[10px] [&_label]:text-muted-foreground [&_input]:h-7 [&_input]:text-xxs">
        <ColorField
          label="Tinta ombra"
          value={scene.groundColor}
          pickerFallback="#000000"
          placeholder="#000000"
          onChange={(groundColor) => patch({ groundColor })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground">
          Opac. ombra piano
        </Label>
        <div className="grid grid-cols-[1fr_2.25rem] gap-2 items-center">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            className="w-full h-2 accent-primary"
            value={scene.shadowGroundOpacity}
            onChange={(e) =>
              patch({ shadowGroundOpacity: Number(e.target.value) })
            }
          />
          <span className="text-xxs text-muted-foreground text-right tabular-nums">
            {Math.round(scene.shadowGroundOpacity * 100)}%
          </span>
        </div>
      </div>

      {meshNames.length > 0 ? (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <Label className="text-xxs text-muted-foreground">Materiali per mesh</Label>
          <div className="space-y-2">
            {meshNames.map((name) => (
              <MeshMaterialBlock
                key={name}
                meshName={name}
                mat={meshMaterialOrEmpty(scene, name)}
                onPatch={(partial) => patchMesh(name, partial)}
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          Carica un modello: qui compariranno le mesh per regolare i materiali.
        </p>
      )}
    </div>
  );
}