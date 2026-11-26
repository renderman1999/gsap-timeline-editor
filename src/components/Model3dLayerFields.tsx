"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  isAllowedModel3dFile,
  MAX_MODEL3D_DATA_URL_BYTES,
  readModel3dFileAsDataUrl,
} from "@/lib/model3d-layer";
import { toast } from "react-toastify";

type Props = {
  model3dUrl: string | undefined;
  onChange: (model3dUrl: string) => void;
};

export function Model3dLayerFields({ model3dUrl, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAllowedModel3dFile(file)) {
      toast.warn("Serve un file .glb o .gltf");
      return;
    }
    if (file.size > MAX_MODEL3D_DATA_URL_BYTES) {
      toast.warn(
        `File troppo grande (max ${Math.round(MAX_MODEL3D_DATA_URL_BYTES / (1024 * 1024))} MB).`
      );
      return;
    }
    try {
      const dataUrl = await readModel3dFileAsDataUrl(file);
      if (dataUrl.length > MAX_MODEL3D_DATA_URL_BYTES * 1.37) {
        toast.warn("Modello troppo grande da salvare nel progetto.");
        return;
      }
      onChange(dataUrl);
      toast.success("Modello 3D caricato");
    } catch {
      toast.error("Lettura file fallita");
    }
  };

  return (
    <div className="space-y-2">
     
     
      <input
        ref={fileRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xxs w-full"
        onClick={() => fileRef.current?.click()}
      >
        Carica modello
      </Button>
      {model3dUrl ? (
        <p className="text-[10px] text-muted-foreground truncate" title={model3dUrl.slice(0, 48)}>
          {model3dUrl.startsWith("data:")
            ? "Modello in progetto (data URL)"
            : model3dUrl}
        </p>
      ) : null}
    </div>
  );
}