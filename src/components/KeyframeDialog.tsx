"use client";

import { useState, useEffect } from "react";
import { roundDelay, roundDuration } from "@/utils/round";
import { CSS_FILTERS } from "@/constants/filters";
import { GSAP_EASINGS } from "@/constants/easings";
import { Trash2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
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
  initialData?: {
    delay: number;
    duration: number;
    easing: string;
    transforms: Transform[];
  };
  onSave: (keyframeData: {
    delay: number;
    duration: number;
    easing: string;
    transforms: Transform[];
  }) => void;
  onCancel: () => void;
}

export function KeyframeDialog({
  isOpen,
  onOpenChange,
  mode,
  keyframe,
  keyframeNumber,
  initialData,
  onSave,
  onCancel,
}: KeyframeDialogProps) {
  const [keyframeForm, setKeyframeForm] = useState({
    delay: 0,
    duration: 1000,
    easing: "power2.inOut",
    transforms: [] as Transform[],
  });

  // Initialize form when dialog opens or keyframe changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && keyframe) {
        setKeyframeForm({
          delay: keyframe.delay,
          duration: keyframe.duration,
          easing: keyframe.easing,
          transforms: keyframe.transforms,
        });
      } else if (mode === "add" && initialData) {
        setKeyframeForm({
          delay: initialData.delay,
          duration: initialData.duration,
          easing: initialData.easing,
          transforms: initialData.transforms,
        });
      }
    }
  }, [isOpen, mode, keyframe, initialData]);

  const resetForm = () => {
    setKeyframeForm({
      delay: 0,
      duration: 1000,
      easing: "power2.inOut",
      transforms: [],
    });
  };

  // Helper function to normalize decimal input (handles both dot and comma)
  const parseDecimalInput = (value: string): number => {
    // Replace comma with dot for consistent parsing
    const normalizedValue = value.replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  };

  const handleAddTransform = (type: TransformType) => {
    // Check if transform type already exists
    const existingTransform = keyframeForm.transforms.find(
      (t) => t.type === type
    );
    if (existingTransform) {
      return; // Don't add duplicate transform types
    }

    const id = Math.random().toString(36).substr(2, 9);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let defaultValues: any = {};

    switch (type) {
      case "move":
        defaultValues = { x: 0, y: 0 };
        break;
      case "scale":
        defaultValues = { scaleX: 1, scaleY: 1 };
        break;
      case "rotate":
        defaultValues = { rotation: 0 };
        break;
      case "opacity":
        defaultValues = { opacity: 1 };
        break;
      case "skew":
        defaultValues = { skewX: 0, skewY: 0 };
        break;
      case "filter":
        defaultValues = { filter: "blur", value: 0 };
        break;
    }

    const newTransform: Transform = {
      id,
      type,
      values: defaultValues,
    };

    setKeyframeForm((prev) => ({
      ...prev,
      transforms: [...prev.transforms, newTransform],
    }));
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

  const handleSave = () => {
    onSave(keyframeForm);
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Label>X:</Label>
              <Input
                type="number"
                value={transform.values.x as number}
                className="max-w-[4rem]"
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    x: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
            <div className="flex items-center gap-1">
              <Label>Y:</Label>
              <Input
                type="number"
                value={transform.values.y as number}
                className="max-w-[4rem]"
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    y: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
        );
      case "scale":
        return (
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-1">
              <Label>X:</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="max-w-[4rem]"
                value={transform.values.scaleX as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    scaleX: parseDecimalInput(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Y:</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="max-w-[4rem]"
                value={transform.values.scaleY as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    scaleY: parseDecimalInput(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
        );
      case "rotate":
        return (
          <div className="flex items-center gap-2 ml-3">
            <Input
              type="number"
              value={transform.values.rotation as number}
              min="-360"
              max="360"
              onChange={(e) =>
                updateTransform(transform.id, {
                  ...transform.values,
                  rotation: parseFloat(e.target.value) || 0,
                })
              }
            />
            <span className="text-xs text-muted-foreground">deg</span>
          </div>
        );
      case "opacity":
        return (
          <Input
            type="number"
            step="0.01"
            min="0"
            max="1"
            className="max-w-[3rem] ml-1"
            value={transform.values.opacity as number}
            onChange={(e) =>
              updateTransform(transform.id, {
                ...transform.values,
                opacity: parseDecimalInput(e.target.value) || 0,
              })
            }
          />
        );
      case "skew":
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Label>X:</Label>
              <Input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                className="max-w-[4rem]"
                value={transform.values.skewX as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    skewX: parseDecimalInput(e.target.value) || 0,
                  })
                }
              />
              <span className="text-xs text-muted-foreground">deg</span>
            </div>
            <div className="flex items-center gap-1">
              <Label>Y:</Label>
              <Input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                className="max-w-[4rem]"
                value={transform.values.skewY as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    skewY: parseDecimalInput(e.target.value) || 0,
                  })
                }
              />
              <span className="text-xs text-muted-foreground">deg</span>
            </div>
          </div>
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
        return null;
    }
  };

  const title =
    mode === "add" ? "Add Keyframe" : `Edit Keyframe ${keyframeNumber || ""}`;

  const saveButtonText = mode === "add" ? "Add Keyframe" : "Update Keyframe";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
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
          </div>

          <div className="flex items-center gap-2">
            <Label>Easing:</Label>
            <Select
              value={keyframeForm.easing}
              onValueChange={(value) =>
                setKeyframeForm((prev) => ({ ...prev, easing: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="overflow-y-auto max-h-[20rem]">
                {GSAP_EASINGS.map((easing) => (
                  <SelectItem key={easing} value={easing}>
                    {easing}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="px-4 py-2 ">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-md font-bold">Transforms</Label>
              <Select
                onValueChange={(value: TransformType) =>
                  handleAddTransform(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Add Transform" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "move", label: "Move" },
                    { value: "scale", label: "Scale" },
                    { value: "rotate", label: "Rotate" },
                    { value: "opacity", label: "Opacity" },
                    { value: "skew", label: "Skew" },
                    { value: "filter", label: "Filter" },
                  ].map(({ value, label }) => {
                    const isUsed = keyframeForm.transforms.some(
                      (t) => t.type === value
                    );
                    return (
                      <SelectItem
                        key={value}
                        value={value}
                        disabled={isUsed}
                        className={isUsed ? "opacity-50" : ""}
                      >
                        {label} {isUsed ? "(added)" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
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
                  className="flex items-center justify-start gap-2 mb-2"
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
