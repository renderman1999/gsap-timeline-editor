"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTimelineStore, type TargetShape } from "@/stores/timeline-store";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Code } from "lucide-react";
import { toast } from "react-toastify";
import { generateTimelineCode } from "@/lib/timeline-utils";
import {
  Square,
  Circle,
  Triangle,
  Heart,
  Bell,
  Menu,
  AudioLines,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function PreviewArea() {
  const {
    getActiveTimeline,
    targetShape,
    setTargetShape,
    isPlaying,
    setPlaying,
    currentTime,
    setCurrentTime,
    updateTimeline,
  } = useTimelineStore();

  const handleExportCode = useCallback(() => {
    const currentTimeline = getActiveTimeline();
    if (currentTimeline) {
      const code = generateTimelineCode(currentTimeline);
      navigator.clipboard.writeText(code);
      toast.success("GSAP Code copied to clipboard!");
    }
  }, [getActiveTimeline]);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const activeTimeline = getActiveTimeline();

  const renderShape = () => {
    const baseClasses = "transition-all duration-200";
    const iconClasses = "w-20 h-20 text-white";

    switch (targetShape) {
      // Basic shapes
      case "square":
        return <div className={`w-20 h-20 bg-white ${baseClasses}`} />;
      case "circle":
        return (
          <div className={`w-20 h-20 bg-white rounded-full ${baseClasses}`} />
        );
      case "triangle":
        return (
          <div
            className={`w-0 h-0 ${baseClasses}`}
            style={{
              borderLeft: "40px solid transparent",
              borderRight: "40px solid transparent",
              borderBottom: "69px solid white",
            }}
          />
        );

      // Icons
      case "heart" as TargetShape:
        return <Heart className={iconClasses} fill="white" />;
      case "bell" as TargetShape:
        return <Bell className={iconClasses} />;
      case "menu" as TargetShape:
        return <Menu className={iconClasses} />;
      case "audio-lines" as TargetShape:
        return <AudioLines className={iconClasses} />;

      // Default (square)
      default:
        return <div className={`w-16 h-16 bg-white ${baseClasses}`} />;
    }
  };

  const createGSAPTimeline = () => {
    if (!activeTimeline || !targetRef.current) return null;

    const tl = gsap.timeline({
      paused: true,
      repeat: activeTimeline.loop ? -1 : 0,
      yoyo: activeTimeline.yoyo,
      onUpdate: () => {
        if (tl) {
          setCurrentTime(tl.time());
        }
      },
      onComplete: () => {
        // Auto-stop when non-looped timeline finishes
        if (!activeTimeline.loop) {
          setPlaying(false);
          setCurrentTime(0);
        }
      },
    });

    // Reset target to initial state or use Initial State transforms
    const initialProps: Record<string, number | string> = {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1,
      filter: "none",
    };

    // Apply Initial State transforms if they exist
    if (activeTimeline.initialState) {
      activeTimeline.initialState.forEach((transform) => {
        switch (transform.type) {
          case "move":
            initialProps.x = transform.values.x || 0;
            initialProps.y = transform.values.y || 0;
            break;
          case "rotate":
            initialProps.rotation = transform.values.rotation || 0;
            break;
          case "opacity":
            initialProps.opacity = transform.values.opacity || 1;
            break;
          case "skew":
            initialProps.skewX = transform.values.skewX || 0;
            initialProps.skewY = transform.values.skewY || 0;
            break;
          case "scale":
            initialProps.scaleX = transform.values.scaleX || 1;
            initialProps.scaleY = transform.values.scaleY || 1;
            break;
          case "filter":
            const filterType = transform.values.filter;
            const filterValue = transform.values.value;
            let filterString = "";

            switch (filterType) {
              case "blur":
                filterString = `blur(${filterValue}px)`;
                break;
              case "brightness":
                filterString = `brightness(${filterValue}%)`;
                break;
              case "contrast":
                filterString = `contrast(${filterValue}%)`;
                break;
              case "grayscale":
                filterString = `grayscale(${filterValue}%)`;
                break;
              case "hue-rotate":
                filterString = `hue-rotate(${filterValue}deg)`;
                break;
              case "invert":
                filterString = `invert(${filterValue}%)`;
                break;
              case "opacity":
                filterString = `opacity(${filterValue}%)`;
                break;
              case "saturate":
                filterString = `saturate(${filterValue}%)`;
                break;
              case "sepia":
                filterString = `sepia(${filterValue}%)`;
                break;
            }

            initialProps.filter = filterString;
            break;
        }
      });
    }

    gsap.set(targetRef.current, initialProps);

    // Add keyframes to timeline
    activeTimeline.keyframes
      .sort((a, b) => a.delay - b.delay)
      .forEach((keyframe) => {
        const transformProps: Record<string, number | string> = {};

        keyframe.transforms.forEach((transform) => {
          switch (transform.type) {
            case "move":
              transformProps.x = transform.values.x;
              transformProps.y = transform.values.y;
              break;
            case "rotate":
              transformProps.rotation = transform.values.rotation;
              break;
            case "opacity":
              transformProps.opacity = transform.values.opacity;
              break;
            case "skew":
              transformProps.skewX = transform.values.skewX;
              transformProps.skewY = transform.values.skewY;
              break;
            case "scale":
              transformProps.scaleX = transform.values.scaleX;
              transformProps.scaleY = transform.values.scaleY;
              break;
            case "filter":
              const filterType = transform.values.filter;
              const filterValue = transform.values.value;
              let filterString = "";

              switch (filterType) {
                case "blur":
                  filterString = `blur(${filterValue}px)`;
                  break;
                case "brightness":
                  filterString = `brightness(${filterValue}%)`;
                  break;
                case "contrast":
                  filterString = `contrast(${filterValue}%)`;
                  break;
                case "grayscale":
                  filterString = `grayscale(${filterValue}%)`;
                  break;
                case "hue-rotate":
                  filterString = `hue-rotate(${filterValue}deg)`;
                  break;
                case "invert":
                  filterString = `invert(${filterValue}%)`;
                  break;
                case "opacity":
                  filterString = `opacity(${filterValue}%)`;
                  break;
                case "saturate":
                  filterString = `saturate(${filterValue}%)`;
                  break;
                case "sepia":
                  filterString = `sepia(${filterValue}%)`;
                  break;
              }

              transformProps.filter = filterString;
              break;
          }
        });

        tl.to(
          targetRef.current,
          {
            ...transformProps,
            duration: keyframe.duration / 1000,
            ease: keyframe.easing,
          },
          keyframe.delay
        );
      });

    return tl;
  };

  // Effect to sync target shape when active timeline changes
  useEffect(() => {
    if (activeTimeline?.targetShape) {
      setTargetShape(activeTimeline.targetShape);
    }
  }, [activeTimeline?.targetShape, setTargetShape]);

  // Memoize timeline creation to avoid unnecessary recreations
  const timelineData = useMemo(() => {
    if (!activeTimeline) return null;
    return {
      keyframes: activeTimeline.keyframes,
      loop: activeTimeline.loop,
      yoyo: activeTimeline.yoyo,
      targetShape,
      initialState: activeTimeline.initialState,
    };
  }, [
    activeTimeline?.keyframes,
    activeTimeline?.loop,
    activeTimeline?.yoyo,
    activeTimeline?.initialState,
    targetShape,
  ]);

  useEffect(() => {
    if (!timelineData) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    timelineRef.current = createGSAPTimeline();

    // If isPlaying is true, play the timeline immediately after creation
    if (timelineRef.current && isPlaying) {
      timelineRef.current.play();
    }
  }, [timelineData]);

  useEffect(() => {
    if (timelineRef.current) {
      if (isPlaying) {
        timelineRef.current.play();
      } else {
        timelineRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Effect to handle currentTime changes (including when Stop button is pressed)
  useEffect(() => {
    if (timelineRef.current && !isPlaying) {
      // When currentTime is set to 0 (Stop button pressed)
      if (currentTime === 0) {
        timelineRef.current.time(0);
      } else {
        // For manual scrubbing
        timelineRef.current.time(currentTime);
      }
    }
  }, [currentTime, isPlaying]);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  // Memoize target shape options to prevent recreation on every render
  const targetShapeOptions = useMemo(
    () => [
      {
        value: "square",
        label: "Square",
        icon: <Square className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "circle",
        label: "Circle",
        icon: <Circle className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "triangle",
        label: "Triangle",
        icon: <Triangle className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "heart",
        label: "Heart",
        icon: <Heart className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "bell",
        label: "Bell",
        icon: <Bell className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "menu",
        label: "Menu",
        icon: <Menu className="h-4 w-4" fill="currentColor" />,
      },
      {
        value: "audio-lines",
        label: "Audio Lines",
        icon: <AudioLines className="h-4 w-4" fill="currentColor" />,
      },
    ],
    []
  );

  return (
    <div className="max-w-[700px] mx-auto w-full">
      {activeTimeline && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mt-8 mb-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">Preview</h3>
              <Select
                value={activeTimeline.targetShape}
                onValueChange={(value: TargetShape) => {
                  if (activeTimeline) {
                    // Update the timeline's target shape
                    updateTimeline(activeTimeline.id, { targetShape: value });
                    // Also update the global target shape for immediate preview
                    setTargetShape(value);
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {targetShapeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-1">
                        <div className="mr-2 flex-shrink-0">{option.icon}</div>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 mr-2">
                <Switch
                  id="loop-toggle"
                  checked={activeTimeline.loop}
                  onCheckedChange={(checked) =>
                    updateTimeline(activeTimeline.id, {
                      loop: checked,
                    })
                  }
                  className="scale-75"
                />
                <Label htmlFor="loop-toggle" className="text-sm cursor-pointer">
                  Loop
                </Label>
              </div>

              {activeTimeline.loop && (
                <div className="flex items-center gap-2 mr-2">
                  <Switch
                    id="yoyo-toggle"
                    checked={activeTimeline.yoyo}
                    onCheckedChange={(checked) =>
                      updateTimeline(activeTimeline.id, {
                        yoyo: checked,
                      })
                    }
                    className="scale-75"
                  />
                  <Label
                    htmlFor="yoyo-toggle"
                    className="text-sm cursor-pointer"
                  >
                    Boomerang
                  </Label>
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleExportCode}
              >
                <Code className="h-4 w-4" />
                Export GSAP Code
              </Button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="bg-black rounded-lg p-8 min-h-80 flex items-center justify-center relative overflow-hidden"
          >
            <div ref={targetRef}>{renderShape()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
