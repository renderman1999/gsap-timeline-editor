"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchSvgFromUrl,
  prepareSvgForDrawSVG,
  sanitizeSvgMarkup,
  TRIANGLE_DRAW_EXAMPLE,
} from "@/lib/svg-sanitize";
import { toast } from "react-toastify";

type Props = {
  svgContent: string | undefined;
  onChange: (svgContent: string) => void;
};

export function SvgLayerFields({ svgContent, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const applyMarkup = (raw: string) => {
    const safe = sanitizeSvgMarkup(raw);
    onChange(safe);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const isSvg =
      file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg");
    if (!isSvg) {
      toast.warn("Serve un file .svg (non PNG/JPG). Usa Prepara DrawSVG su SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      onChange(prepareSvgForDrawSVG(text));
      toast.success("SVG caricato e preparato per DrawSVG");
    };
    reader.onerror = () => toast.error("Lettura file fallita");
    reader.readAsText(file);
  };

  const onFetchUrl = async () => {
    setLoading(true);
    try {
      const markup = await fetchSvgFromUrl(url);
      applyMarkup(markup);
      toast.success("SVG importato");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import fallito";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xxs text-muted-foreground">SVG inline</Label>
        <textarea
          className="w-full min-h-[72px] max-h-32 rounded-md border border-input bg-transparent px-2 py-1.5 text-xxs font-mono"
          value={svgContent ?? ""}
          placeholder="<svg ..."
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => applyMarkup(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        <input
          ref={fileRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            onFile(e.target.files?.[0]);
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xxs"
          onClick={() => applyMarkup(svgContent ?? "")}
        >
          Sanitizza
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xxs"
          onClick={() => onChange(prepareSvgForDrawSVG(svgContent))}
        >
          Prepara DrawSVG
        </Button>
    
      </div>
      <div className="flex gap-1">
        <Input
          className="h-8 text-xs flex-1"
          value={url}
          placeholder="URL .svg"
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 text-xs"
          disabled={loading || !url.trim()}
          onClick={() => void onFetchUrl()}
        >
          {loading ? "..." : "URL"}
        </Button>
      </div>
   
    </div>
  );
}