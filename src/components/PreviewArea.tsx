"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTimelineStore, type TargetShape } from "@/stores/timeline-store";
import { Button } from "@/components/ui/button";
import { Repeat, RefreshCw } from "lucide-react";
import { Square, Heart, Bell, Menu, AudioLines } from "lucide-react";
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
    setCurrentTime,
    updateTimeline,
  } = useTimelineStore();

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
    });

    // Reset target to initial state
    gsap.set(targetRef.current, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1,
      filter: "none",
    });

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
  }, [activeTimeline, setTargetShape]);

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    timelineRef.current = createGSAPTimeline();

    // If isPlaying is true, play the timeline immediately after creation
    if (timelineRef.current && isPlaying) {
      timelineRef.current.play();
    }
  }, [activeTimeline, targetShape]);

  useEffect(() => {
    if (timelineRef.current) {
      if (isPlaying) {
        timelineRef.current.play();
      } else {
        timelineRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  // Define target shape options for the Select component with preview icons
  const targetShapeOptions = [
    {
      value: "square",
      label: "Square",
      icon: <Square className="h-4 w-4" fill="currentColor" />,
    },
    {
      value: "circle",
      label: "Circle",
      icon: <div className="h-4 w-4 rounded-full bg-current" />,
    },
    {
      value: "triangle",
      label: "Triangle",
      icon: (
        <div className="h-0 w-0 border-x-4 border-x-transparent border-b-[8px] border-b-current" />
      ),
    },
    {
      value: "heart",
      label: "Heart",
      icon: <Heart className="h-4 w-4" fill="currentColor" />,
    },
    {
      value: "bell",
      label: "Bell",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      value: "menu",
      label: "Menu",
      icon: <Menu className="h-4 w-4" />,
    },
    {
      value: "audio-lines",
      label: "Audio Lines",
      icon: <AudioLines className="h-4 w-4" />,
    },
  ];

  return (
    <div className="w-96 border-l border-border bg-card p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Select
              value={activeTimeline?.targetShape || "square"}
              defaultValue="square"
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
          </div>
        </div>

        <div
          ref={containerRef}
          className="bg-black rounded-lg p-8 min-h-64 flex items-center justify-center relative overflow-hidden"
        >
          <div ref={targetRef}>{renderShape()}</div>
        </div>

        {activeTimeline && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              size="sm"
              variant="ghost"
              className={
                activeTimeline.loop ? "text-primary" : "text-muted-foreground"
              }
              title={activeTimeline.loop ? "Disable loop" : "Enable loop"}
              onClick={() =>
                updateTimeline(activeTimeline.id, {
                  loop: !activeTimeline.loop,
                })
              }
            >
              <Repeat className="h-4 w-4" />
            </Button>
            {activeTimeline.loop && (
              <Button
                size="sm"
                variant="ghost"
                className={
                  activeTimeline.yoyo ? "text-primary" : "text-muted-foreground"
                }
                title={activeTimeline.yoyo ? "Disable yo-yo" : "Enable yo-yo"}
                onClick={() =>
                  updateTimeline(activeTimeline.id, {
                    yoyo: !activeTimeline.yoyo,
                  })
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {activeTimeline && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Timeline: {activeTimeline.name}</div>
            <div>Keyframes: {activeTimeline.keyframes.length}</div>
            <div>Type: {activeTimeline.playbackType}</div>
            {activeTimeline.loop && (
              <div>Loop: {activeTimeline.yoyo ? "Yo-yo" : "Normal"}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
