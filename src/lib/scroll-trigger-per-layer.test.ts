import { describe, expect, it } from "vitest";
import type { AnimationTarget, Timeline } from "@/stores/timeline-store";
import {
  buildScrollTriggerVarsForTarget,
  layerHasOwnScrollTimeline,
  partitionScrollPlayback,
  partitionTargetsByScrollTriggerMode,
  resolveLayerScrollTriggerElement,
  shouldSyncScrollPlayhead,
  targetUsesOwnScrollTrigger,
} from "@/lib/scroll-trigger-per-layer";

describe("scroll-trigger-per-layer", () => {
  it("partitions own vs shared targets", () => {
    const targets = [
      { id: "a", scrollTriggerOwn: true } as AnimationTarget,
      { id: "b" } as AnimationTarget,
    ];
    const { own, shared } = partitionTargetsByScrollTriggerMode(targets);
    expect(own.map((t) => t.id)).toEqual(["a"]);
    expect(shared.map((t) => t.id)).toEqual(["b"]);
  });

  it("keeps pinned layers off the shared timeline", () => {
    const targets = [
      { id: "a", scrollPin: true } as AnimationTarget,
      { id: "b", scrollPin: true, scrollTriggerOwn: true } as AnimationTarget,
      { id: "c" } as AnimationTarget,
    ];
    const parts = partitionScrollPlayback(targets);
    expect(parts.pinned.map((t) => t.id)).toEqual(["a", "b"]);
    expect(parts.shared.map((t) => t.id)).toEqual(["c"]);
    expect(parts.own).toEqual([]);
    expect(parts.timed).toEqual([]);
    expect(layerHasOwnScrollTimeline(targets[0])).toBe(true);
    expect(shouldSyncScrollPlayhead("a", targets, "a")).toBe(true);
    expect(shouldSyncScrollPlayhead("a", targets, null)).toBe(false);
  });

  it("shouldSyncScrollPlayhead follows active layer mode", () => {
    const targets = [
      { id: "a", scrollTriggerOwn: true } as AnimationTarget,
      { id: "b" } as AnimationTarget,
    ];
    expect(shouldSyncScrollPlayhead("a", targets, "a")).toBe(true);
    expect(shouldSyncScrollPlayhead("a", targets, null)).toBe(false);
    expect(shouldSyncScrollPlayhead("b", targets, null)).toBe(true);
    expect(shouldSyncScrollPlayhead("b", targets, "a")).toBe(false);
  });

  it("buildScrollTriggerVarsForTarget uses layer start/end", () => {
    const timeline = {
      scrollTriggerStart: "top center",
      scrollLength: 300,
    } as Timeline;
    const target = {
      scrollTriggerOwn: true,
      scrollTriggerStart: "top 80%",
      scrollTriggerEnd: "top 30%",
    } as AnimationTarget;
    const vars = buildScrollTriggerVarsForTarget(timeline, target, ".el");
    expect(vars.start).toBe("top 80%");
    expect(vars.end).toBe("top 30%");
    expect(vars.trigger).toBe(".el");
  });

  it("resolveLayerScrollTriggerElement prefers custom selector", () => {
    const parent = document.createElement("div");
    const layer = document.createElement("div");
    const custom = document.createElement("span");
    custom.className = "hit";
    parent.append(layer, custom);
    const target = {
      scrollTriggerSelector: ".hit",
    } as AnimationTarget;
    expect(
      resolveLayerScrollTriggerElement(parent, target, layer, parent)
    ).toBe(custom);
  });

  it("time playback leaves pin and scroll", () => {
    const targets = [
      { id: "a", timePlayback: true, scrollPin: true } as AnimationTarget,
      { id: "b", scrollPin: true } as AnimationTarget,
      { id: "c" } as AnimationTarget,
    ];
    const parts = partitionScrollPlayback(targets);
    expect(parts.timed.map((t) => t.id)).toEqual(["a"]);
    expect(parts.pinned.map((t) => t.id)).toEqual(["b"]);
    expect(parts.shared.map((t) => t.id)).toEqual(["c"]);
  });

  it("targetUsesOwnScrollTrigger is strict", () => {
    expect(targetUsesOwnScrollTrigger({} as AnimationTarget)).toBe(false);
    expect(
      targetUsesOwnScrollTrigger({
        scrollTriggerOwn: true,
      } as AnimationTarget)
    ).toBe(true);
  });
});