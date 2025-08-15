import React, { useState, useEffect } from "react";
import {
  Transform,
  TransformType,
  useTimelineStore,
} from "@/stores/timeline-store";
import { CSS_FILTERS } from "@/constants/filters";
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

interface InitialStateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  timelineId: string;
}

export function InitialStateDialog({
  isOpen,
  onOpenChange,
  timelineId,
}: InitialStateDialogProps) {
  const { getActiveTimeline, setInitialState, clearInitialState } =
    useTimelineStore();
  const [transforms, setTransforms] = useState<Transform[]>([]);
  const [isAddTransformOpen, setIsAddTransformOpen] = useState(false);

  // Helper function to normalize decimal input (handles both dot and comma)
  const parseDecimalInput = (value: string): number => {
    // Replace comma with dot for consistent parsing
    const normalizedValue = value.replace(",", ".");
    return parseFloat(normalizedValue) || 0;
  };

  // Initialize transforms when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timeline = getActiveTimeline();
      if (timeline) {
        if (timeline.initialState) {
          // Use existing initial state
          setTransforms([...timeline.initialState]);
        } else if (timeline.keyframes.length > 0) {
          // Inherit from first keyframe
          setTransforms([...timeline.keyframes[0].transforms]);
        } else {
          // Empty state
          setTransforms([]);
        }
      }
    }
  }, [isOpen, timelineId, getActiveTimeline]);

  const handleAddTransform = (type: TransformType) => {
    // Check if transform type already exists
    const existingTransform = transforms.find((t) => t.type === type);
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

    setTransforms((prev) => [...prev, newTransform]);

    // Close the popover after adding transform
    setIsAddTransformOpen(false);
  };

  const removeTransform = (transformId: string) => {
    setTransforms((prev) => prev.filter((t) => t.id !== transformId));
  };

  const updateTransform = (
    transformId: string,
    values: Record<string, number | string>
  ) => {
    setTransforms((prev) =>
      prev.map((t) => (t.id === transformId ? { ...t, values } : t))
    );
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
                    x: parseDecimalInput(e.target.value) || 0,
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
                    y: parseDecimalInput(e.target.value) || 0,
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
                  rotation: parseDecimalInput(e.target.value) || 0,
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
            onChange={(e) => {
              const parsedValue = parseDecimalInput(e.target.value);
              // Use the parsed value directly, don't use || which treats 0 as falsy
              updateTransform(transform.id, {
                ...transform.values,
                opacity: parsedValue,
              });
            }}
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
                    value: parseDecimalInput(e.target.value) || 0,
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

  const handleSave = () => {
    setInitialState(timelineId, transforms);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleClear = () => {
    clearInitialState(timelineId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Initial State</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="px-4 py-2">
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
                <PopoverContent className="w-40 p-1" align="end">
                  <div className="space-y-1">
                    {[
                      { value: "move", label: "Move" },
                      { value: "scale", label: "Scale" },
                      { value: "rotate", label: "Rotate" },
                      { value: "opacity", label: "Opacity" },
                      { value: "skew", label: "Skew" },
                      { value: "filter", label: "Filter" },
                    ].map(({ value, label }) => {
                      const isUsed = transforms.some((t) => t.type === value);
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
              {transforms.length === 0 && (
                <p className="text-center text-xs mt-4 mb-6 text-muted-foreground">
                  No transforms added yet. Add one to animate.
                </p>
              )}
              {transforms.map((transform) => (
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
          <div className="flex justify-between w-full">
            <Button variant="destructive" onClick={handleClear}>
              Clear Initial State
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
