"use client";

import { useState, useEffect } from "react";
import { roundDelay, roundDuration } from "@/utils/round";
import { CSS_FILTERS } from "@/constants/filters";
import {
  EASING_ORDERS,
  EASING_TYPES,
  combineEasing,
  parseEasing,
} from "@/constants/easings";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CssRuleTransformFields,
  CssVarTransformFields,
} from "@/components/CssAdvancedTransformFields";
import { MotionPathTransformFields } from "@/components/MotionPathTransformFields";
import { SvgPluginTransformFields } from "@/components/SvgPluginTransformFields";
import {
  CORE_TRANSFORM_OPTIONS,
  CSS3D_TRANSFORM_OPTIONS,
  SVG_TRANSFORM_OPTIONS,
  transformAllowsMultiple,
} from "@/constants/transform-options";
import { ExtraTransformFields } from "@/components/ExtraTransformFields";
import {
  GsapValueInput,
  RotationValueFields,
} from "@/components/GsapValueInput";
import { KeyframeGsapOptions } from "@/components/KeyframeGsapOptions";
import { defaultValuesForTransformType } from "@/lib/transform-defaults";
import {
  type AnimationTarget,
  type Keyframe,
  type Transform,
  type TransformType,
} from "@/stores/timeline-store";

interface KeyframeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  keyframe?: Keyframe | null;
  keyframeNumber?: number;
  targets: AnimationTarget[];
  initialData?: {
    targetId: string;
    delay: number;
    duration: number;
    easing: string;
    transforms: Transform[];
  };
  onSave: (keyframeData: Omit<Keyframe, "id">) => void;
  onCancel: () => void;
  labelNames?: string[];
}

export function KeyframeDialog({
  isOpen,
  onOpenChange,
  mode,
  keyframe,
  keyframeNumber,
  initialData,
  targets,
  onSave,
  onCancel,
  labelNames,
}: KeyframeDialogProps) {
  const [keyframeForm, setKeyframeForm] = useState<Omit<Keyframe, "id">>({
    targetId: targets[0]?.id ?? "",
    delay: 0,
    duration: 1000,
    easing: "power2.out",
    transforms: [] as Transform[],
  });

  const [isAddTransformOpen, setIsAddTransformOpen] = useState(false);

  // Separate easing state for order and type
  const [easingOrder, setEasingOrder] = useState("power2");
  const [easingType, setEasingType] = useState("out");

  // Initialize form when dialog opens or keyframe changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && keyframe) {
        const { order, type } = parseEasing(keyframe.easing);
        const { id, ...draft } = keyframe;
        void id;
        setKeyframeForm({
          ...draft,
          targetId: keyframe.targetId ?? targets[0]?.id ?? "",
          transforms: [...keyframe.transforms],
        });
        setEasingOrder(order);
        setEasingType(type);
      } else if (mode === "add" && initialData) {
        const { order, type } = parseEasing(initialData.easing);
        setKeyframeForm({
          targetId: initialData.targetId,
          delay: initialData.delay,
          duration: initialData.duration,
          easing: initialData.easing,
          transforms: [...initialData.transforms],
        });
        setEasingOrder(order);
        setEasingType(type);
      }
    }
  }, [isOpen, mode, keyframe, initialData]);

  const resetForm = () => {
    setKeyframeForm({
      targetId: targets[0]?.id ?? "",
      delay: 0,
      duration: 1000,
      easing: "power2.inOut",
      transforms: [],
    });
  };

  // Helper function to normalize decimal input (handles both dot and comma)
  const parseDecimalInput = (value: string): number => {
    // Replace comma with dot for consistent parsing
    const normalizedValue = value.replace(",", ".");
    return parseFloat(normalizedValue) || 0;
  };

  const handleAddTransform = (type: TransformType) => {
    // Check if transform type already exists
    const existingTransform = keyframeForm.transforms.find(
      (t) => t.type === type
    );
    if (existingTransform && !transformAllowsMultiple(type)) {
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const defaultValues = defaultValuesForTransformType(type, {
      targetId: keyframeForm.targetId,
      targets,
    });

    const newTransform: Transform = {
      id,
      type,
      values: defaultValues,
    };

    setKeyframeForm((prev) => ({
      ...prev,
      transforms: [...prev.transforms, newTransform],
    }));

    // Close the popover after adding transform
    setIsAddTransformOpen(false);
  };

  const removeTransform = (transformId: string) => {
    setKeyframeForm((prev) => ({
      ...prev,
      transforms: prev.transforms.filter((t) => t.id !== transformId),
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTransform = (transformId: string, values: any) => {
    setKeyframeForm((prev) => ({
      ...prev,
      transforms: prev.transforms.map((transform) =>
        transform.id === transformId ? { ...transform, values } : transform
      ),
    }));
  };

  const selectedTarget =
    targets.find((t) => t.id === keyframeForm.targetId) ?? targets[0];
  const transformOptions = [
    ...CORE_TRANSFORM_OPTIONS,
    ...CSS3D_TRANSFORM_OPTIONS,
    ...(selectedTarget?.type === "svg" ? SVG_TRANSFORM_OPTIONS : []),
  ];

  const handleSave = () => {
    const payload: Omit<Keyframe, "id"> = {
      ...keyframeForm,
      position: keyframeForm.position?.trim() || undefined,
      stagger:
        keyframeForm.stagger != null && keyframeForm.stagger > 0
          ? keyframeForm.stagger
          : undefined,
      yoyo: keyframeForm.yoyo || undefined,
      yoyoEase: keyframeForm.yoyoEase?.trim() || undefined,
      clearProps: keyframeForm.clearProps?.trim() || undefined,
      startAt: keyframeForm.startAt?.trim() || undefined,
      onStart: keyframeForm.onStart?.trim() || undefined,
      onUpdate: keyframeForm.onUpdate?.trim() || undefined,
      onComplete: keyframeForm.onComplete?.trim() || undefined,
      onRepeat: keyframeForm.onRepeat?.trim() || undefined,
      onReverseComplete: keyframeForm.onReverseComplete?.trim() || undefined,
    };
    onSave(payload);
    resetForm();
  };

  const handleCancel = () => {
    onCancel();
    resetForm();
  };

  const renderTransformFields = (transform: Transform) => {
    switch (transform.type) {
      case "move":
        return (
          <div className="flex flex-wrap items-center gap-2">
            <GsapValueInput
              label="X"
              suffix="px"
              value={transform.values.x}
              onChange={(x) =>
                updateTransform(transform.id, { ...transform.values, x })
              }
            />
            <GsapValueInput
              label="Y"
              suffix="px"
              value={transform.values.y}
              onChange={(y) =>
                updateTransform(transform.id, { ...transform.values, y })
              }
            />
            <GsapValueInput
              label="X%"
              value={transform.values.xPercent}
              onChange={(xPercent) =>
                updateTransform(transform.id, { ...transform.values, xPercent })
              }
            />
            <GsapValueInput
              label="Y%"
              value={transform.values.yPercent}
              onChange={(yPercent) =>
                updateTransform(transform.id, { ...transform.values, yPercent })
              }
            />
          </div>
        );
      case "scale":
        return (
          <div className="flex items-center gap-4">
            <GsapValueInput
              label="X"
              step="0.01"
              min={0}
              value={transform.values.scaleX}
              onChange={(scaleX) =>
                updateTransform(transform.id, { ...transform.values, scaleX })
              }
            />
            <GsapValueInput
              label="Y"
              step="0.01"
              min={0}
              value={transform.values.scaleY}
              onChange={(scaleY) =>
                updateTransform(transform.id, { ...transform.values, scaleY })
              }
            />
          </div>
        );
      case "rotate":
        return (
          <RotationValueFields
            value={transform.values.rotation}
            direction={transform.values.rotationDir}
            onValue={(rotation) =>
              updateTransform(transform.id, { ...transform.values, rotation })
            }
            onDirection={(rotationDir) =>
              updateTransform(transform.id, {
                ...transform.values,
                rotationDir: rotationDir === "none" ? "" : rotationDir,
              })
            }
          />
        );
      case "rotateX":
        return (
          <RotationValueFields
            label="X"
            value={transform.values.rotationX}
            direction={transform.values.rotationXDir}
            onValue={(rotationX) =>
              updateTransform(transform.id, { ...transform.values, rotationX })
            }
            onDirection={(rotationXDir) =>
              updateTransform(transform.id, {
                ...transform.values,
                rotationXDir: rotationXDir === "none" ? "" : rotationXDir,
              })
            }
          />
        );
      case "rotateY":
        return (
          <RotationValueFields
            label="Y"
            value={transform.values.rotationY}
            direction={transform.values.rotationYDir}
            onValue={(rotationY) =>
              updateTransform(transform.id, { ...transform.values, rotationY })
            }
            onDirection={(rotationYDir) =>
              updateTransform(transform.id, {
                ...transform.values,
                rotationYDir: rotationYDir === "none" ? "" : rotationYDir,
              })
            }
          />
        );
      case "moveZ":
        return (
          <GsapValueInput
            label="Z"
            suffix="px"
            value={transform.values.z}
            onChange={(z) =>
              updateTransform(transform.id, { ...transform.values, z })
            }
          />
        );
      case "opacity":
        return (
          <GsapValueInput
            step="0.01"
            min={0}
            max={1}
            value={transform.values.opacity}
            onChange={(opacity) =>
              updateTransform(transform.id, { ...transform.values, opacity })
            }
          />
        );
      case "skew":
        return (
          <div className="flex items-center gap-4">
            <GsapValueInput
              label="X"
              suffix="deg"
              value={transform.values.skewX}
              onChange={(skewX) =>
                updateTransform(transform.id, { ...transform.values, skewX })
              }
            />
            <GsapValueInput
              label="Y"
              suffix="deg"
              value={transform.values.skewY}
              onChange={(skewY) =>
                updateTransform(transform.id, { ...transform.values, skewY })
              }
            />
          </div>
        );
      case "drawSvg":
      case "morphSvg":
        return (
          <SvgPluginTransformFields
            transform={transform}
            onUpdate={(values) => updateTransform(transform.id, values)}
          />
        );
      case "motionPath":
        return (
          <MotionPathTransformFields
            transform={transform}
            onUpdate={(values) => updateTransform(transform.id, values)}
          />
        );
      case "cssVar":
        return (
          <CssVarTransformFields
            transform={transform}
            targetId={keyframeForm.targetId}
            onUpdate={(values) => updateTransform(transform.id, values)}
          />
        );
      case "cssRule":
        return (
          <CssRuleTransformFields
            transform={transform}
            targetId={keyframeForm.targetId}
            onUpdate={(values) => updateTransform(transform.id, values)}
          />
        );
      case "filter":
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground"> Type</Label>
              <Select
                value={transform.values.filter as string}
                onValueChange={(value) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    filter: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="overflow-y-auto max-h-[20rem]">
                  {CSS_FILTERS.map((filter) => (
                    <SelectItem key={filter} value={filter}>
                      {filter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">Value</Label>
              <Input
                type="number"
                value={transform.values.value as number}
                className="max-w-[4rem]"
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    value: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        );
      default:
        return (
          <ExtraTransformFields
            transform={transform}
            onUpdate={(values) => updateTransform(transform.id, values)}
          />
        );
    }
  };

  const title =
    mode === "add" ? "Add Keyframe" : `Edit Keyframe ${keyframeNumber || ""}`;

  const saveButtonText = mode === "add" ? "Add Keyframe" : "Update Keyframe";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Label>Layer</Label>
            <Select
              value={keyframeForm.targetId}
              onValueChange={(value) =>
                setKeyframeForm((prev) => ({ ...prev, targetId: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Position, s:</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={keyframeForm.delay}
                className="max-w-[5rem]"
                onChange={(e) => {
                  const value = parseDecimalInput(e.target.value) || 0;
                  setKeyframeForm((prev) => ({
                    ...prev,
                    delay: roundDelay(value),
                  }));
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Duration, ms:</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={keyframeForm.duration}
                className="max-w-[5rem]"
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1000;
                  setKeyframeForm((prev) => ({
                    ...prev,
                    duration: roundDuration(value),
                  }));
                }}
              />
            </div>
              <div className="flex items-center gap-2">
                <Label title="Secondi tra un target e il successivo">
                  Stagger, s:
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className="max-w-[5rem]"
                  value={keyframeForm.stagger ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      setKeyframeForm((prev) => ({
                        ...prev,
                        stagger: undefined,
                      }));
                      return;
                    }
                    const value = parseDecimalInput(raw);
                    setKeyframeForm((prev) => ({
                      ...prev,
                      stagger: value > 0 ? roundDelay(value) : undefined,
                    }));
                  }}
                />
              </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Easing:</Label>
              <Select
                value={easingOrder}
                onValueChange={(value) => {
                  setEasingOrder(value);
                  const newEasing = combineEasing(value, easingType);
                  setKeyframeForm((prev) => ({ ...prev, easing: newEasing }));
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_ORDERS.map((order) => (
                    <SelectItem key={order.value} value={order.value}>
                      {order.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={easingType}
                onValueChange={(value) => {
                  setEasingType(value);
                  const newEasing = combineEasing(easingOrder, value);
                  setKeyframeForm((prev) => ({ ...prev, easing: newEasing }));
                }}
                disabled={easingOrder === "none"}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EASING_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <KeyframeGsapOptions
            key={isOpen ? "gsap-options-open" : "gsap-options-closed"}
            values={keyframeForm}
            easingOrder={easingOrder}
            labelNames={labelNames}
            onChange={(partial) =>
              setKeyframeForm((prev) => ({ ...prev, ...partial }))
            }
          />

          <Card className="px-4 py-2 ">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-md font-bold">Transforms</Label>
              <Popover
                open={isAddTransformOpen}
                onOpenChange={setIsAddTransformOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between gap-1">
                    <Plus className="h-4 w-4" />
                    Add Transform
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-52 max-h-80 overflow-y-auto p-1" align="end">
                  <div className="space-y-1">
                    {transformOptions.map(({ value, label }) => {
                      const isUsed =
                        !transformAllowsMultiple(value) &&
                        keyframeForm.transforms.some((t) => t.type === value);
                      return (
                        <Button
                          key={value}
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-left ${
                            isUsed ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isUsed}
                          onClick={() =>
                            handleAddTransform(value as TransformType)
                          }
                        >
                          {label} {isUsed ? "(added)" : ""}
                        </Button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[20rem]">
              {keyframeForm.transforms.length === 0 && (
                <p className="text-center text-xs mt-4 mb-6 text-muted-foreground">
                  No transforms added yet. Add one to animate.
                </p>
              )}
              {keyframeForm.transforms.map((transform) => (
                <div
                  key={transform.id}
                  className="flex flex-wrap items-start justify-start gap-2 mb-2"
                >
                  <span className="text-sm font-medium capitalize">
                    {transform.type}
                  </span>

                  {renderTransformFields(transform)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTransform(transform.id)}
                    className="ml-auto"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{saveButtonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
