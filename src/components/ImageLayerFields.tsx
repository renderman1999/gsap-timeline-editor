"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clampImageWidth,
  isAllowedImageFile,
  MAX_IMAGE_DATA_URL_BYTES,
  MAX_IMAGE_WIDTH,
  MIN_IMAGE_WIDTH,
  readImageFileAsDataUrl,
} from "@/lib/image-layer";
import { toast } from "react-toastify";

type Props = {
  imageUrl: string | undefined;
  imageWidth: number | undefined;
  onChange: (imageUrl: string) => void;
  onWidthChange: (imageWidth: number) => void;
};

export function ImageLayerFields({
  imageUrl,
  imageWidth,
  onChange,
  onWidthChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!isAllowedImageFile(file)) {
      toast.warn("Formato non supportato. Usa JPG, PNG, WebP, GIF o SVG.");
      return;
    }
    if (file.size > MAX_IMAGE_DATA_URL_BYTES) {
      toast.warn(
        `File troppo grande (max ${Math.round(MAX_IMAGE_DATA_URL_BYTES / (1024 * 1024))} MB).`
      );
      return;
    }
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_DATA_URL_BYTES * 1.4) {
        toast.warn("Immagine troppo grande da salvare nel progetto.");
        return;
      }
      onChange(dataUrl);
      toast.success("Immagine caricata");
    } catch {
      toast.error("Lettura file fallita");
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xxs text-muted-foreground">Immagine (URL o upload)</Label>
      <Input
        className="h-8 text-xs"
        value={imageUrl ?? ""}
        placeholder="https://… oppure Carica file"
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.svg"
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
          className="h-7 text-xxs"
          onClick={() => fileRef.current?.click()}
        >
          Carica file
        </Button>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-10 w-10 rounded border border-border object-cover"
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xxs text-muted-foreground">Larghezza</Label>
          <span className="text-xxs text-muted-foreground tabular-nums">
            {clampImageWidth(imageWidth)} px
          </span>
        </div>
        <input
          type="range"
          min={MIN_IMAGE_WIDTH}
          max={MAX_IMAGE_WIDTH}
          step={4}
          className="w-full h-2 accent-primary"
          aria-label="Larghezza immagine"
          value={clampImageWidth(imageWidth)}
          onChange={(e) => onWidthChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}