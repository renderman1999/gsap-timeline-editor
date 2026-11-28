"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContentSidebar,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColorField } from "@/components/ColorField";
import { BoxShadowField, TextShadowField } from "@/components/ShadowField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PreviewTargetView } from "@/components/PreviewTargetView";
import { PixiLayerFields } from "@/components/PixiLayerFields";
import { layerCustomCssToStyle, layerStyleToCss } from "@/lib/layer-style";
import type {
  AnimationTarget,
  TargetLayerStyle,
} from "@/stores/timeline-store";
import { useTimelineStore } from "@/stores/timeline-store";

const POPULAR_GOOGLE_FONTS = [
  "Roboto",
  "Open Sans",
  "Montserrat",
  "Lato",
  "Oswald",
  "Playfair Display",
  "Raleway",
  "Poppins",
  "Inter",
  "Merriweather",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineId: string;
  target: AnimationTarget | null;
  onSave: (style: TargetLayerStyle) => void;
};

const defaultStyle = (): TargetLayerStyle => ({});

export function LayerStyleDialog({
  open,
  onOpenChange,
  timelineId,
  target,
  onSave,
}: Props) {
  const setLayerStyleLivePreview = useTimelineStore(
    (s) => s.setLayerStyleLivePreview
  );
  const updateTarget = useTimelineStore((s) => s.updateTarget);
  const [draft, setDraft] = useState<TargetLayerStyle>(defaultStyle());

  useEffect(() => {
    if (open && target) {
      setDraft({ ...(target.style ?? {}) });
    }
  }, [open, target]);

  useEffect(() => {
    if (!open || !target) {
      setLayerStyleLivePreview(null);
      return;
    }
    setLayerStyleLivePreview({
      timelineId,
      targetId: target.id,
      style: draft,
    });
    return () => setLayerStyleLivePreview(null);
  }, [open, target, draft, timelineId, setLayerStyleLivePreview]);

  if (!target) return null;

  const isText = target.type === "text";
  const isShape = target.type === "shape";
  const isSvg = target.type === "svg";
  const isPixi = target.type === "pixi";
  const isCode = target.type === "code";
  const isModel3d = target.type === "model3d";
  const showGenericColor =
    isShape || isSvg || isText;

  const handleSave = () => {
    onSave(draft);
    setLayerStyleLivePreview(null);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setLayerStyleLivePreview(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContentSidebar className="left-56 max-w-[26rem]">
        <DialogHeader className="shrink-0 pr-8">
          <DialogTitle>Stile — {target.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
          {isPixi ? (
            <div className="space-y-2 pb-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">
                Canvas Pixi
              </p>
              <PixiLayerFields
                targetId={target.id}
                targetName={target.name}
                pixiScene={target.pixiScene}
                pixiSettings={target.pixiSettings}
                onSceneChange={(pixiScene) =>
                  updateTarget(timelineId, target.id, { pixiScene })
                }
                onSettingsChange={(pixiSettings) =>
                  updateTarget(timelineId, target.id, { pixiSettings })
                }
              />
            </div>
          ) : null}

          {showGenericColor ? (
            <ColorField
              label={
                isShape
                  ? "Colore riempimento"
                  : isSvg
                    ? "Colore (currentColor)"
                    : "Colore testo"
              }
              value={draft.color}
              placeholder="#ffffff"
              onChange={(color) => setDraft((p) => ({ ...p, color }))}
            />
          ) : null}

          {isText ? (
            <>
              <div className="space-y-1.5">
                <Label>Font Google</Label>
                <Input
                  list="google-font-suggestions"
                  value={draft.fontFamily ?? ""}
                  placeholder="Es. Montserrat"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, fontFamily: e.target.value }))
                  }
                />
                <datalist id="google-font-suggestions">
                  {POPULAR_GOOGLE_FONTS.map((font) => (
                    <option key={font} value={font} />
                  ))}
                </datalist>
                <p className="text-xxs text-muted-foreground">
                  Nome come su fonts.google.com. Caricato in anteprima ed export
                  HTML.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Dimensione</Label>
                  <Input
                    numericWheel
                    value={draft.fontSize ?? ""}
                    placeholder="2rem"
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, fontSize: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Peso</Label>
                  <Select
                    value={draft.fontWeight ?? "__default__"}
                    onValueChange={(value) =>
                      setDraft((p) => ({
                        ...p,
                        fontWeight:
                          value === "__default__" ? undefined : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Predefinito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__default__">Predefinito</SelectItem>
                      <SelectItem value="300">300</SelectItem>
                      <SelectItem value="400">400</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="600">600</SelectItem>
                      <SelectItem value="700">700</SelectItem>
                      <SelectItem value="800">800</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Interlinea</Label>
                  <Input
                    numericWheel
                    step="0.1"
                    value={draft.lineHeight ?? ""}
                    placeholder="1.2"
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, lineHeight: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Spaziatura lettere</Label>
                  <Input
                    numericWheel
                    step="0.01"
                    value={draft.letterSpacing ?? ""}
                    placeholder="0.05em"
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        letterSpacing: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Allineamento</Label>
                <Select
                  value={draft.textAlign ?? "__default__"}
                  onValueChange={(value) =>
                    setDraft((p) => ({
                      ...p,
                      textAlign:
                        value === "__default__"
                          ? undefined
                          : (value as "left" | "center" | "right"),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Predefinito</SelectItem>
                    <SelectItem value="left">Sinistra</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Destra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-border/80 p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="text-full-viewport"
                    className="text-xs cursor-pointer"
                  >
                    Larghezza schermo (100vw)
                  </Label>
                  <Switch
                    id="text-full-viewport"
                    checked={draft.textFullViewportWidth === true}
                    onCheckedChange={(checked) =>
                      setDraft((p) => ({
                        ...p,
                        textFullViewportWidth: checked ? true : undefined,
                      }))
                    }
                  />
                </div>
                <p className="text-xxs text-muted-foreground leading-snug">
                  Nelle sezioni fullpage usa tutta la larghezza della sezione;
                  sullo stage pin usa il breakpoint viewport (100vw). Anteprima
                  ed export HTML.
                </p>
              </div>

              <div className="rounded-md border border-border/80 p-2 space-y-2">
                <Label className="text-xs">Contenitore testo (a capo)</Label>
                <p className="text-xxs text-muted-foreground leading-snug">
                  Imposta la larghezza massima del blocco testo per andare a
                  capo su più righe. Con 100vw disattivato o riduci max-width
                  anche con 100vw attivo.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "narrow", label: "Stretto", value: "20rem" },
                      { id: "medium", label: "Medio", value: "32rem" },
                      { id: "wide", label: "Largo", value: "48rem" },
                      { id: "reading", label: "65ch", value: "65ch" },
                    ] as const
                  ).map((preset) => (
                    <Button
                      key={preset.id}
                      type="button"
                      variant={
                        draft.textMaxWidth === preset.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="h-7 text-[10px] px-2"
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          textMaxWidth: preset.value,
                        }))
                      }
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <Input
                  numericWheel
                  className="h-8 text-xs font-mono"
                  placeholder="max-width personalizzata (es. 28rem, 90%)"
                  value={draft.textMaxWidth ?? ""}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      textMaxWidth: e.target.value.trim() || undefined,
                    }))
                  }
                />
              </div>

              <ColorField
                label="Sfondo testo (opzionale)"
                value={draft.backgroundColor}
                placeholder="transparent"
                pickerFallback="#000000"
                onChange={(backgroundColor) =>
                  setDraft((p) => ({ ...p, backgroundColor }))
                }
              />
            </>
          ) : null}

          {target.type === "image" ? (
            <ColorField
              label="Sfondo / cornice"
              value={draft.backgroundColor}
              placeholder="#00000000"
              pickerFallback="#000000"
              onChange={(backgroundColor) =>
                setDraft((p) => ({ ...p, backgroundColor }))
              }
            />
          ) : null}

          {!isPixi && !isCode && !isModel3d ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Ombre e profondità
            </p>
            <BoxShadowField
              label="Box shadow"
              value={draft.boxShadow}
              onChange={(boxShadow) =>
                setDraft((p) => ({ ...p, boxShadow }))
              }
            />
            {isText ? (
              <TextShadowField
                label="Text shadow"
                value={draft.textShadow}
                onChange={(textShadow) =>
                  setDraft((p) => ({ ...p, textShadow }))
                }
              />
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Opacità</Label>
                <Input
                  numericWheel
                  step="0.01"
                  min={0}
                  max={1}
                  value={draft.opacity ?? ""}
                  placeholder="1"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, opacity: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Filter</Label>
                <Input
                  numericWheel
                  value={draft.filter ?? ""}
                  placeholder="blur(2px)"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, filter: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
          ) : isPixi ? (
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">
                Contenitore (CSS)
              </p>
              <div className="space-y-1.5">
                <Label>Opacità wrapper</Label>
                <Input
                  numericWheel
                  step="0.01"
                  min={0}
                  max={1}
                  value={draft.opacity ?? ""}
                  placeholder="1"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, opacity: e.target.value }))
                  }
                />
              </div>
              <BoxShadowField
                label="Box shadow"
                value={draft.boxShadow}
                onChange={(boxShadow) =>
                  setDraft((p) => ({ ...p, boxShadow }))
                }
              />
            </div>
          ) : null}

          {!isPixi && !isCode && !isModel3d ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Bordo
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Spessore</Label>
                <Input
                  numericWheel
                  value={draft.borderWidth ?? ""}
                  placeholder="2px"
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, borderWidth: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stile</Label>
                <Select
                  value={draft.borderStyle ?? "__default__"}
                  onValueChange={(value) =>
                    setDraft((p) => ({
                      ...p,
                      borderStyle:
                        value === "__default__" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="none" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Nessuno</SelectItem>
                    <SelectItem value="solid">solid</SelectItem>
                    <SelectItem value="dashed">dashed</SelectItem>
                    <SelectItem value="dotted">dotted</SelectItem>
                    <SelectItem value="double">double</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ColorField
              label="Colore bordo"
              value={draft.borderColor}
              placeholder="#ffffff"
              onChange={(borderColor) =>
                setDraft((p) => ({ ...p, borderColor }))
              }
            />
            <div className="space-y-1.5">
              <Label>Border radius</Label>
              <Input
                numericWheel
                value={draft.borderRadius ?? ""}
                placeholder="8px"
                onChange={(e) =>
                  setDraft((p) => ({ ...p, borderRadius: e.target.value }))
                }
              />
            </div>
          </div>
          ) : null}

          {!isPixi && !isCode && !isModel3d ? (
          <div className="space-y-3 pt-1 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground">
              Outline (esterno)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Spessore</Label>
                <Input
                  numericWheel
                  value={draft.outlineWidth ?? ""}
                  placeholder="3px"
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      outlineWidth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stile</Label>
                <Select
                  value={draft.outlineStyle ?? "__default__"}
                  onValueChange={(value) =>
                    setDraft((p) => ({
                      ...p,
                      outlineStyle:
                        value === "__default__" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="solid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">Nessuno</SelectItem>
                    <SelectItem value="solid">solid</SelectItem>
                    <SelectItem value="dashed">dashed</SelectItem>
                    <SelectItem value="dotted">dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ColorField
              label="Colore outline"
              value={draft.outlineColor}
              placeholder="#3b82f6"
              pickerFallback="#3b82f6"
              onChange={(outlineColor) =>
                setDraft((p) => ({ ...p, outlineColor }))
              }
            />
            <div className="space-y-1.5">
              <Label>Offset</Label>
              <Input
                numericWheel
                value={draft.outlineOffset ?? ""}
                placeholder="4px"
                onChange={(e) =>
                  setDraft((p) => ({
                    ...p,
                    outlineOffset: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          ) : null}

          {isText ? (
            <div className="space-y-3 pt-1 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground">
                Contorno testo
              </p>
              <div className="space-y-1.5">
                <Label>Stroke</Label>
                <Input
                  numericWheel
                  value={draft.textStrokeWidth ?? ""}
                  placeholder="1px"
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      textStrokeWidth: e.target.value,
                    }))
                  }
                />
              </div>
              <ColorField
                label="Colore stroke"
                value={draft.textStrokeColor}
                placeholder="#000000"
                pickerFallback="#000000"
                onChange={(textStrokeColor) =>
                  setDraft((p) => ({ ...p, textStrokeColor }))
                }
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>CSS aggiuntivo</Label>
            <textarea
              className="w-full min-h-[88px] rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono"
              value={draft.customCss ?? ""}
              placeholder="text-transform: uppercase; text-shadow: 0 2px 8px #000;"
              onChange={(e) =>
                setDraft((p) => ({ ...p, customCss: e.target.value }))
              }
            />
          </div>

          <div className="rounded-md border border-border p-4 min-h-[5rem] w-full bg-zinc-900/80 flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              style={layerCustomCssToStyle(draft)}
            >
              {isText ? (
                <PreviewTargetView
                  target={{
                    ...target,
                    style: {
                      ...draft,
                      color: draft.color ?? target.style?.color ?? "#ffffff",
                    },
                  }}
                  textFullWidthContext="section"
                />
              ) : isShape ? (
                <PreviewTargetView
                  target={{
                    ...target,
                    style: {
                      ...draft,
                      color: draft.color ?? target.style?.color ?? "#fff",
                    },
                  }}
                />
              ) : isSvg ? (
                <PreviewTargetView target={{ ...target, style: draft }} />
              ) : isPixi ? (
                <PreviewTargetView
                  target={{ ...target, style: draft }}
                />
              ) : (
                <span
                  className="text-xxs text-muted-foreground px-3 py-2"
                  style={layerStyleToCss(draft, { customCss: false })}
                >
                  Anteprima immagine
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave}>Salva stile</Button>
        </DialogFooter>
      </DialogContentSidebar>
    </Dialog>
  );
}