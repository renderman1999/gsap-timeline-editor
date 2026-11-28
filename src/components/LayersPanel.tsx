"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { LayerStyleDialog } from "@/components/LayerStyleDialog";
import type { TargetLayerStyle } from "@/stores/timeline-store";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AnimationTarget,
  AnimationTargetType,
  TargetShape,
  TextSplitMode,
} from "@/stores/timeline-store";
import { ImageLayerFields } from "@/components/ImageLayerFields";
import { Model3dLayerFields } from "@/components/Model3dLayerFields";
import { Model3dSceneFields } from "@/components/Model3dSceneFields";
import { Model3dInteractionTriggerButton } from "@/components/Model3dInteractionDialog";
import { DEFAULT_MODEL3D_SCENE } from "@/lib/model3d-scene";
import { CodeLayerFields } from "@/components/CodeLayerFields";
import { DEFAULT_CODE_HTML, DEFAULT_CODE_JS } from "@/lib/code-layer";
import { PixiLayerFields } from "@/components/PixiLayerFields";
import { DEFAULT_PIXI_SCENE } from "@/lib/pixi-scene";
import { SvgLayerFields } from "@/components/SvgLayerFields";
import {
  DEFAULT_DRAGGABLE_CONFIG,
  type DraggableAxisType,
} from "@/lib/gsap-draggable";
import { boundsClassSelector } from "@/lib/timeline-stage";
import { DEFAULT_MOTION_PATH_SELECTOR } from "@/lib/gsap-motion-path";
import { DEFAULT_LAYER_SVG } from "@/lib/svg-sanitize";
import { useTimelineStore } from "@/stores/timeline-store";
import { resolveScrollEnd } from "@/lib/scroll-trigger-config";
const SHAPE_OPTIONS: { value: TargetShape; label: string }[] = [
  { value: "square", label: "Quadrato" },
  { value: "circle", label: "Cerchio" },
  { value: "triangle", label: "Triangolo" },
  { value: "star", label: "Stella" },
  { value: "heart", label: "Heart" },
  { value: "bell", label: "Bell" },
  { value: "menu", label: "Menu" },
  { value: "audio-lines", label: "Audio" },
];

export function LayersPanel({
  timelineId,
  targets,
  activeTargetId,
}: {
  timelineId: string;
  targets: AnimationTarget[];
  activeTargetId: string;
}) {
  const {
    addTarget,
    updateTarget,
    duplicateTarget,
    removeTarget,
    moveTarget,
    setActiveTarget,
    setScrollPin,
    addSection,
    updateSection,
    deleteSection,
    assignLayerToSection,
    timelines,
  } = useTimelineStore();
  const timelineMeta = timelines.find((t) => t.id === timelineId);
  const projectBoundsHint = timelineMeta
    ? boundsClassSelector(timelineMeta)
    : ".stage-bounds";
  const [openLayerIds, setOpenLayerIds] = useState<string[]>(() => [
    activeTargetId,
  ]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [styleTargetId, setStyleTargetId] = useState<string | null>(null);
  const [newLayer, setNewLayer] = useState<{
    name: string;
    type: AnimationTargetType;
  }>({ name: "", type: "shape" });

  useEffect(() => {
    setOpenLayerIds((current) =>
      current.includes(activeTargetId) ? current : [...current, activeTargetId]
    );
  }, [activeTargetId]);

  const toggleLayer = (id: string) => {
    const willOpen = !openLayerIds.includes(id);
    setOpenLayerIds((current) =>
      willOpen ? [...current, id] : current.filter((openId) => openId !== id)
    );
    if (willOpen) setActiveTarget(timelineId, id);
  };

  const handleAdd = () => {
    const name = newLayer.name.trim() || `Layer ${targets.length + 1}`;
    addTarget(timelineId, {
      name,
      type: newLayer.type,
      ...(newLayer.type === "svg"
        ? { svgContent: DEFAULT_LAYER_SVG }
        : {}),
      ...(newLayer.type === "code"
        ? { codeHtml: DEFAULT_CODE_HTML, codeJs: DEFAULT_CODE_JS }
        : {}),
      ...(newLayer.type === "pixi" ? { pixiScene: DEFAULT_PIXI_SCENE } : {}),
    });
    setNewLayer({ name: "", type: "shape" });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm text-muted-foreground">Layer</Label>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xxs"
            title="Nuova sezione"
            onClick={() => addSection(timelineId)}
          >
            Sezione
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-7 w-7"
            title="Nuovo layer"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {timelineMeta && timelineMeta.playbackType !== "scroll" ? (
        <p className="text-[10px] leading-snug text-muted-foreground mb-2">
          Per start/end ScrollTrigger per layer imposta playback{" "}
          <span className="font-medium text-foreground">Scroll</span> nella
          toolbar anteprima (in alto a destra).
        </p>
      ) : null}

      {timelineMeta?.playbackType === "scroll" ? (
        <p className="text-[10px] leading-snug text-muted-foreground mb-2">
          ScrollTrigger start/end: attiva{" "}
          <span className="font-medium text-foreground">ScrollTrigger proprio</span>{" "}
          nel layer. <span className="font-medium text-foreground">Animazione a tempo</span>{" "}
          lo stacca dallo scroll e lo fa partire da solo.
        </p>
      ) : null}

      {(timelineMeta?.sections?.length ?? 0) > 0 ? (
        <div className="space-y-2 mb-2">
          {timelineMeta?.sections?.map((section) => {
            const available = targets.filter(
              (target) => !section.layerIds.includes(target.id)
            );
            return (
              <div
                key={section.id}
                className="rounded-md border border-border p-2 space-y-2"
              >
                <div className="flex items-center gap-1">
                  <Input
                    value={section.name}
                    className="h-7 text-xs"
                    onChange={(event) =>
                      updateSection(timelineId, section.id, {
                        name: event.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-destructive"
                    title="Elimina sezione"
                    onClick={() => deleteSection(timelineId, section.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {timelineMeta.playbackType === "scroll" ? (
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-[10px] text-muted-foreground">
                      Blocca sezione
                    </Label>
                    <Switch
                      checked={section.scrollPin !== false}
                      onCheckedChange={(checked) =>
                        updateSection(timelineId, section.id, {
                          scrollPin: checked ? undefined : false,
                        })
                      }
                      className="scale-75"
                    />
                  </div>
                ) : null}
                <p className="text-[10px] leading-snug text-muted-foreground">
                  I layer qui dentro condividono questo blocco
                  {section.scrollPin !== false &&
                  timelineMeta.playbackType === "scroll"
                    ? " e lo stesso scroller-end."
                    : "."}
                </p>
                <div className="space-y-1">
                  {section.layerIds.map((layerId) => {
                    const layer = targets.find((target) => target.id === layerId);
                    if (!layer) return null;
                    return (
                      <div
                        key={layerId}
                        className="flex items-center justify-between gap-1 text-xs"
                      >
                        <span className="truncate">{layer.name}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 shrink-0"
                          title="Togli dalla sezione"
                          onClick={() =>
                            assignLayerToSection(timelineId, layerId, null)
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {available.length > 0 ? (
                  <Select
                    key={`${section.id}:${section.layerIds.join(",")}`}
                    onValueChange={(layerId) =>
                      assignLayerToSection(timelineId, layerId, section.id)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Aggiungi layer" />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((target) => (
                        <SelectItem key={target.id} value={target.id}>
                          {target.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2 pr-1">
        {targets.map((target, index) => {
          const isOpen = openLayerIds.includes(target.id);
          return (
          <div
            key={target.id}
            className={`rounded-md border p-2 ${isOpen ? "space-y-2" : ""} ${
              activeTargetId === target.id
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-1">
              <div className="flex flex-col shrink-0 gap-0">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Porta sopra (davanti)"
                  disabled={index >= targets.length - 1}
                  onClick={() => moveTarget(timelineId, target.id, "down")}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title="Porta sotto (dietro)"
                  disabled={index === 0}
                  onClick={() => moveTarget(timelineId, target.id, "up")}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center gap-1 text-left text-sm font-medium"
                  aria-expanded={isOpen}
                  title={isOpen ? "Chiudi layer" : "Apri layer"}
                  onClick={() => toggleLayer(target.id)}
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">
                    {target.name}
                    <span className="ml-1 text-xxs text-muted-foreground font-normal">
                      ({target.type})
                    </span>
                  </span>
                </button>
                <div className="mt-0.5 flex gap-0.5 pl-4">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Stile layer"
                    onClick={() => setStyleTargetId(target.id)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    title="Duplica layer"
                    onClick={() => duplicateTarget(timelineId, target.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {targets.length > 1 ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      title="Elimina layer"
                      onClick={() => removeTarget(timelineId, target.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            {isOpen ? (
            <div className="space-y-2">
            <div className="space-y-1.5">
              <Label className="text-xxs text-muted-foreground">
                Selettore CSS
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                value={target.selector}
                onChange={(e) =>
                  updateTarget(timelineId, target.id, {
                    selector: e.target.value,
                  })
                }
              />
              <p className="text-[10px] text-muted-foreground leading-snug">
                Un layer = un elemento animato. Per tenerne diversi nello
                stesso blocco di scroll usa Sezione e aggiungi i layer li.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xxs text-muted-foreground">
                MotionPath (path SVG)
              </Label>
              <Input
                className="h-8 text-xs font-mono"
                value={
                  target.motionPathSelector ?? DEFAULT_MOTION_PATH_SELECTOR
                }
                placeholder={DEFAULT_MOTION_PATH_SELECTOR}
                onChange={(e) =>
                  updateTarget(timelineId, target.id, {
                    motionPathSelector: e.target.value,
                  })
                }
              />
            </div>

            <Input
              className="h-8 text-xs"
              value={target.name}
              placeholder="Nome layer"
              onChange={(e) =>
                updateTarget(timelineId, target.id, { name: e.target.value })
              }
            />

            <Select
              value={target.type}
              onValueChange={(value: AnimationTargetType) => {
                const updates: Partial<AnimationTarget> = { type: value };
                if (value === "svg" && !target.svgContent?.trim()) {
                  updates.svgContent = DEFAULT_LAYER_SVG;
                }
                if (value === "model3d" && !target.model3dScene) {
                  updates.model3dScene = {
                    ...DEFAULT_MODEL3D_SCENE,
                    meshMaterials: {},
                  };
                }
                if (value === "code") {
                  updates.codeHtml = target.codeHtml ?? DEFAULT_CODE_HTML;
                  updates.codeJs = target.codeJs ?? DEFAULT_CODE_JS;
                }
                if (value === "pixi") {
                  updates.pixiScene = target.pixiScene ?? DEFAULT_PIXI_SCENE;
                }
                updateTarget(timelineId, target.id, updates);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shape">Forma</SelectItem>
                <SelectItem value="text">Testo</SelectItem>
                <SelectItem value="image">Immagine</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="model3d">Modello 3D</SelectItem>
                <SelectItem value="code">Codice</SelectItem>
                <SelectItem value="pixi">Pixi</SelectItem>
              </SelectContent>
            </Select>

            {target.type === "shape" ? (
              <Select
                value={target.shape ?? "square"}
                onValueChange={(value: TargetShape) =>
                  updateTarget(timelineId, target.id, { shape: value })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHAPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {target.type === "text" ? (
              <>
                <Input
                  className="h-8 text-xs"
                  value={target.text ?? ""}
                  placeholder="Contenuto testo"
                  onChange={(e) =>
                    updateTarget(timelineId, target.id, {
                      text: e.target.value,
                    })
                  }
                />
                <div className="space-y-1.5">
                  <Label className="text-xxs text-muted-foreground">
                    SplitText
                  </Label>
                  <Select
                    value={target.textSplit ?? "none"}
                    onValueChange={(value: TextSplitMode) =>
                      updateTarget(timelineId, target.id, { textSplit: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuno</SelectItem>
                      <SelectItem value="chars">Caratteri</SelectItem>
                      <SelectItem value="words">Parole</SelectItem>
                      <SelectItem value="lines">Righe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {target.type === "image" ? (
              <ImageLayerFields
                imageUrl={target.imageUrl}
                imageWidth={target.imageWidth}
                onChange={(imageUrl) =>
                  updateTarget(timelineId, target.id, { imageUrl })
                }
                onWidthChange={(imageWidth) =>
                  updateTarget(timelineId, target.id, { imageWidth })
                }
              />
            ) : null}

            {target.type === "code" ? (
              <CodeLayerFields
                codeHtml={target.codeHtml}
                codeJs={target.codeJs}
                onHtmlChange={(codeHtml) =>
                  updateTarget(timelineId, target.id, { codeHtml })
                }
                onJsChange={(codeJs) =>
                  updateTarget(timelineId, target.id, { codeJs })
                }
              />
            ) : null}

            {target.type === "pixi" ? (
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
            ) : null}

            {target.type === "model3d" ? (
              <>
                <Model3dLayerFields
                  model3dUrl={target.model3dUrl}
                  onChange={(model3dUrl) =>
                    updateTarget(timelineId, target.id, { model3dUrl })
                  }
                />
                <Model3dSceneFields
                  settings={target.model3dScene}
                  meshNames={target.model3dMeshNames}
                  onChange={(model3dScene) =>
                    updateTarget(timelineId, target.id, { model3dScene })
                  }
                />
                <Model3dInteractionTriggerButton
                  config={target.model3dInteractions}
                  meshNames={target.model3dMeshNames}
                  onChange={(model3dInteractions) =>
                    updateTarget(timelineId, target.id, {
                      model3dInteractions,
                    })
                  }
                />
              </>
            ) : null}

            {timelineMeta?.playbackType === "scroll" ? (
              <>
                <div className="rounded-md border border-dashed border-border/80 p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      className="text-xxs text-muted-foreground"
                      title="gsap.timeline() senza ScrollTrigger: i keyframe partono da soli, in secondi."
                    >
                      Animazione a tempo
                    </Label>
                    <Switch
                      checked={target.timePlayback ?? false}
                      onCheckedChange={(checked) =>
                        updateTarget(timelineId, target.id, {
                          timePlayback: checked,
                          ...(checked
                            ? { scrollPin: false, scrollTriggerOwn: false }
                            : {}),
                        })
                      }
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Parte da sola in anteprima e nell&apos;HTML, mentre gli
                    altri layer restano legati allo scroll.
                  </p>
                </div>
                <div className="rounded-md border border-dashed border-border/80 p-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      className="text-xxs text-muted-foreground"
                      title="ScrollTrigger pin: questa sezione resta ferma mentre scrolli e i keyframe seguono lo scroll."
                    >
                      Blocca in scroll (pin)
                    </Label>
                    <Switch
                      checked={(target.scrollPin ?? false) && !target.timePlayback}
                      disabled={target.timePlayback === true}
                      onCheckedChange={(checked) =>
                        setScrollPin(timelineId, target.id, checked)
                      }
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Ogni layer con pin è una sezione a sé: resta ferma mentre
                    scrolli e i suoi keyframe seguono lo scroll. Più pin si
                    susseguono uno dopo l&apos;altro.
                  </p>
                </div>
                <div className="rounded-md border border-dashed border-border/80 p-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      className="text-xxs text-muted-foreground"
                      title="Timeline GSAP separata: start/end propri rispetto al layer (o al selettore trigger)."
                    >
                      ScrollTrigger proprio
                    </Label>
                    <Switch
                      checked={
                        (target.scrollTriggerOwn ?? false) && !target.timePlayback
                      }
                      disabled={target.timePlayback === true}
                      onCheckedChange={(checked) =>
                        updateTarget(timelineId, target.id, {
                          scrollTriggerOwn: checked,
                          ...(checked ? { timePlayback: false } : {}),
                        })
                      }
                    />
                  </div>
                  {target.scrollTriggerOwn && !target.timePlayback ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xxs text-muted-foreground">
                          Start
                        </Label>
                        <Input
                          className="h-8 text-xs font-mono"
                          placeholder={
                            timelineMeta.scrollTriggerStart?.trim() ||
                            "top center"
                          }
                          value={target.scrollTriggerStart ?? ""}
                          onChange={(e) =>
                            updateTarget(timelineId, target.id, {
                              scrollTriggerStart:
                                e.target.value.trim() === ""
                                  ? undefined
                                  : e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xxs text-muted-foreground">
                          End
                        </Label>
                        <Input
                          className="h-8 text-xs font-mono"
                          placeholder={resolveScrollEnd(
                            target.scrollTriggerScrollLength ??
                              timelineMeta.scrollLength,
                            timelineMeta.scrollTriggerEnd
                          )}
                          value={target.scrollTriggerEnd ?? ""}
                          onChange={(e) =>
                            updateTarget(timelineId, target.id, {
                              scrollTriggerEnd:
                                e.target.value.trim() === ""
                                  ? undefined
                                  : e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xxs text-muted-foreground">
                          Lunghezza scroll (%)
                        </Label>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          min={50}
                          max={2000}
                          placeholder={String(timelineMeta.scrollLength ?? 300)}
                          value={target.scrollTriggerScrollLength ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value.trim();
                            updateTarget(timelineId, target.id, {
                              scrollTriggerScrollLength:
                                raw === ""
                                  ? undefined
                                  : parseInt(raw, 10) || undefined,
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xxs text-muted-foreground">
                          Trigger (selettore CSS)
                        </Label>
                        <Input
                          className="h-8 text-xs font-mono"
                          placeholder="vuoto = questo layer"
                          value={target.scrollTriggerSelector ?? ""}
                          onChange={(e) =>
                            updateTarget(timelineId, target.id, {
                              scrollTriggerSelector:
                                e.target.value.trim() === ""
                                  ? undefined
                                  : e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="rounded-md border border-dashed border-border/80 p-2 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xxs text-muted-foreground">
                  Draggable (GSAP)
                </Label>
                <Switch
                  checked={target.draggable?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    updateTarget(timelineId, target.id, {
                      draggable: {
                        ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>
              {target.draggable?.enabled ? (
                <>
                  <Select
                    value={target.draggable?.type ?? "x,y"}
                    onValueChange={(value: DraggableAxisType) =>
                      updateTarget(timelineId, target.id, {
                        draggable: {
                          ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                          enabled: true,
                          type: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="x">Asse X</SelectItem>
                      <SelectItem value="y">Asse Y</SelectItem>
                      <SelectItem value="x,y">X e Y</SelectItem>
                      <SelectItem value="rotation">Rotazione</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-8 text-xs font-mono"
                    placeholder={`vuoto = ${projectBoundsHint}, parent`}
                    value={target.draggable?.bounds ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      updateTarget(timelineId, target.id, {
                        draggable: {
                          ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                          enabled: true,
                          bounds: raw.trim() === "" ? undefined : raw,
                        },
                      });
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`inertia-${target.id}`}
                      checked={target.draggable?.inertia ?? false}
                      onCheckedChange={(checked) =>
                        updateTarget(timelineId, target.id, {
                          draggable: {
                            ...(target.draggable ?? DEFAULT_DRAGGABLE_CONFIG),
                            enabled: true,
                            inertia: checked,
                          },
                        })
                      }
                    />
                    <Label
                      htmlFor={`inertia-${target.id}`}
                      className="text-xxs cursor-pointer"
                    >
                      Inertia (flick)
                    </Label>
                  </div>
                </>
              ) : null}
            </div>

            {target.type === "svg" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xxs text-muted-foreground">
                    Selettore path (DrawSVG / MorphSVG)
                  </Label>
                  <Input
                    className="h-8 text-xs font-mono"
                    value={target.svgPathSelector ?? "#draw-path"}
                    placeholder="#draw-path"
                    onChange={(e) =>
                      updateTarget(timelineId, target.id, {
                        svgPathSelector: e.target.value,
                      })
                    }
                  />
                </div>
                <SvgLayerFields
                  svgContent={target.svgContent}
                  onChange={(svgContent) =>
                    updateTarget(timelineId, target.id, { svgContent })
                  }
                />
              </>
            ) : null}
            </div>
            ) : null}
          </div>
          );
        })}
      </div>

      <LayerStyleDialog
        open={styleTargetId !== null}
        timelineId={timelineId}
        onOpenChange={(open) => {
          if (!open) setStyleTargetId(null);
        }}
        target={targets.find((t) => t.id === styleTargetId) ?? null}
        onSave={(style: TargetLayerStyle) => {
          if (!styleTargetId) return;
          updateTarget(timelineId, styleTargetId, { style });
        }}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[360px]">
          <DialogHeader>
            <DialogTitle>Nuovo layer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={`Layer ${targets.length + 1}`}
              value={newLayer.name}
              onChange={(e) =>
                setNewLayer((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Select
              value={newLayer.type}
              onValueChange={(value: AnimationTargetType) =>
                setNewLayer((p) => ({
                  ...p,
                  type: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shape">Forma</SelectItem>
                <SelectItem value="text">Testo</SelectItem>
                <SelectItem value="image">Immagine</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="model3d">Modello 3D</SelectItem>
                <SelectItem value="code">Codice</SelectItem>
                <SelectItem value="pixi">Pixi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Aggiungi layer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}