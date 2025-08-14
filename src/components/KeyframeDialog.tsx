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

  const handleAddTransform = (type: TransformType) => {
    const id = Math.random().toString(36).substr(2, 9);
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>X</Label>
              <Input
                type="number"
                value={transform.values.x as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    x: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Y</Label>
              <Input
                type="number"
                value={transform.values.y as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    y: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        );
      case "scale":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Scale X</Label>
              <Input
                type="number"
                step="0.1"
                value={transform.values.scaleX as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    scaleX: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
            <div>
              <Label>Scale Y</Label>
              <Input
                type="number"
                step="0.1"
                value={transform.values.scaleY as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    scaleY: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
        );
      case "rotate":
        return (
          <div>
            <Label>Rotation (degrees)</Label>
            <Input
              type="number"
              value={transform.values.rotation as number}
              onChange={(e) =>
                updateTransform(transform.id, {
                  ...transform.values,
                  rotation: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        );
      case "opacity":
        return (
          <div>
            <Label>Opacity</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={transform.values.opacity as number}
              onChange={(e) =>
                updateTransform(transform.id, {
                  ...transform.values,
                  opacity: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        );
      case "skew":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Skew X</Label>
              <Input
                type="number"
                value={transform.values.skewX as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    skewX: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label>Skew Y</Label>
              <Input
                type="number"
                value={transform.values.skewY as number}
                onChange={(e) =>
                  updateTransform(transform.id, {
                    ...transform.values,
                    skewY: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        );
      case "filter":
        return (
          <div className="space-y-2">
            <div>
              <Label>Filter Type</Label>
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
                <SelectContent>
                  {CSS_FILTERS.map((filter) => (
                    <SelectItem key={filter} value={filter}>
                      {filter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={transform.values.value as number}
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
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Delay (s)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={keyframeForm.delay}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setKeyframeForm((prev) => ({
                    ...prev,
                    delay: roundDelay(value),
                  }));
                }}
              />
            </div>
            <div>
              <Label>Duration (ms)</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={keyframeForm.duration}
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

          <div>
            <Label>Easing</Label>
            <Select
              value={keyframeForm.easing}
              onValueChange={(value) =>
                setKeyframeForm((prev) => ({ ...prev, easing: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GSAP_EASINGS.map((easing) => (
                  <SelectItem key={easing} value={easing}>
                    {easing}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Transforms</Label>
              <Select
                onValueChange={(value: TransformType) =>
                  handleAddTransform(value)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Add Transform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="move">Move</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="rotate">Rotate</SelectItem>
                  <SelectItem value="opacity">Opacity</SelectItem>
                  <SelectItem value="skew">Skew</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {keyframeForm.transforms.map((transform) => (
                <Card key={transform.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {transform.type}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTransform(transform.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {renderTransformFields(transform)}
                </Card>
              ))}
            </div>
          </div>
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
