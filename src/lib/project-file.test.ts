import { describe, expect, it } from "vitest";
import {
  buildProjectFile,
  parseProjectFile,
  PROJECT_FILE_KIND,
} from "./project-file";
import type { Timeline } from "@/stores/timeline-store";
import { createAnimationTarget } from "@/lib/timeline-migrate";

const minimalTimeline = (id: string): Timeline => {
  const target = createAnimationTarget({ name: "Layer 1" });
  return {
    id,
    name: "Test",
    playbackType: "normal",
    loop: false,
    yoyo: false,
    keyframes: [],
    targets: [target],
    activeTargetId: target.id,
    initialStates: {},
  };
};

describe("project-file", () => {
  it("serializes and parses project with active timeline", () => {
    const t1 = minimalTimeline("a");
    const t2 = minimalTimeline("b");
    const json = JSON.stringify(
      buildProjectFile([t1, t2], "b"),
      null,
      2
    );
    const parsed = parseProjectFile(json);
    expect(parsed.kind).toBe(PROJECT_FILE_KIND);
    expect(parsed.timelines).toHaveLength(2);
    expect(parsed.activeTimelineId).toBe("b");
  });

  it("accepts legacy export without kind", () => {
    const t = minimalTimeline("legacy");
    const json = JSON.stringify({
      version: "1.0",
      timelines: [t],
    });
    const parsed = parseProjectFile(json);
    expect(parsed.timelines[0].id).toBe("legacy");
  });
});