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
              {transforms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transforms added. Click "Add Transform" to get started.
                </p>
              ) : (
                transforms.map((transform) => (
                  <Card key={transform.id} className="p-3 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium capitalize">
                        {transform.type}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTransform(transform.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Move Transform */}
                      {transform.type === "move" && (
                        <>
                          <div>
                            <Label
                              htmlFor={`x-${transform.id}`}
                              className="text-xs"
                            >
                              X (px)
                            </Label>
                            <Input
                              id={`x-${transform.id}`}
                              type="number"
                              size="sm"
                              value={transform.values.x || 0}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  x: parseDecimalInput(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`y-${transform.id}`}
                              className="text-xs"
                            >
                              Y (px)
                            </Label>
                            <Input
                              id={`y-${transform.id}`}
                              type="number"
                              size="sm"
                              value={transform.values.y || 0}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  y: parseDecimalInput(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* Scale Transform */}
                      {transform.type === "scale" && (
                        <>
                          <div>
                            <Label
                              htmlFor={`scaleX-${transform.id}`}
                              className="text-xs"
                            >
                              Scale X
                            </Label>
                            <Input
                              id={`scaleX-${transform.id}`}
                              type="number"
                              step="0.01"
                              size="sm"
                              value={transform.values.scaleX || 1}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  scaleX:
                                    parseDecimalInput(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`scaleY-${transform.id}`}
                              className="text-xs"
                            >
                              Scale Y
                            </Label>
                            <Input
                              id={`scaleY-${transform.id}`}
                              type="number"
                              step="0.01"
                              size="sm"
                              value={transform.values.scaleY || 1}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  scaleY:
                                    parseDecimalInput(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* Rotate Transform */}
                      {transform.type === "rotate" && (
                        <div className="col-span-2">
                          <Label
                            htmlFor={`rotation-${transform.id}`}
                            className="text-xs"
                          >
                            Rotation (deg)
                          </Label>
                          <Input
                            id={`rotation-${transform.id}`}
                            type="number"
                            step="0.01"
                            size="sm"
                            value={transform.values.rotation || 0}
                            onChange={(e) =>
                              updateTransform(transform.id, {
                                ...transform.values,
                                rotation:
                                  parseDecimalInput(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      )}

                      {/* Opacity Transform */}
                      {transform.type === "opacity" && (
                        <div className="col-span-2">
                          <Label
                            htmlFor={`opacity-${transform.id}`}
                            className="text-xs"
                          >
                            Opacity
                          </Label>
                          <Input
                            id={`opacity-${transform.id}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            size="sm"
                            value={transform.values.opacity || 1}
                            onChange={(e) =>
                              updateTransform(transform.id, {
                                ...transform.values,
                                opacity: parseDecimalInput(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      )}

                      {/* Skew Transform */}
                      {transform.type === "skew" && (
                        <>
                          <div>
                            <Label
                              htmlFor={`skewX-${transform.id}`}
                              className="text-xs"
                            >
                              Skew X (deg)
                            </Label>
                            <Input
                              id={`skewX-${transform.id}`}
                              type="number"
                              step="0.01"
                              size="sm"
                              value={transform.values.skewX || 0}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  skewX: parseDecimalInput(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`skewY-${transform.id}`}
                              className="text-xs"
                            >
                              Skew Y (deg)
                            </Label>
                            <Input
                              id={`skewY-${transform.id}`}
                              type="number"
                              step="0.01"
                              size="sm"
                              value={transform.values.skewY || 0}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  skewY: parseDecimalInput(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* Filter Transform */}
                      {transform.type === "filter" && (
                        <>
                          <div>
                            <Label
                              htmlFor={`filter-${transform.id}`}
                              className="text-xs"
                            >
                              Filter Type
                            </Label>
                            <Select
                              value={transform.values.filter as string}
                              onValueChange={(value) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  filter: value,
                                })
                              }
                            >
                              <SelectTrigger size="sm">
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
                            <Label
                              htmlFor={`value-${transform.id}`}
                              className="text-xs"
                            >
                              Value
                            </Label>
                            <Input
                              id={`value-${transform.id}`}
                              type="number"
                              step="0.01"
                              size="sm"
                              value={transform.values.value || 0}
                              onChange={(e) =>
                                updateTransform(transform.id, {
                                  ...transform.values,
                                  value: parseDecimalInput(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}
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
