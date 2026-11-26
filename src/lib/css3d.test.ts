import { describe, expect, it } from "vitest";
import { timelineUsesCss3d } from "./css3d";
import type { Timeline } from "@/stores/timeline-store";
import { createAnimationTarget } from "./timeline-migrate";

describe("css3d", () => {
  it("detects 3d transforms on keyframes", () => {
    const target = createAnimationTarget({ id: "t1" });
    const timeline: Timeline = {
      id: "tl",
      name: "T",
      playbackType: "normal",
      loop: false,
      yoyo: false,
      keyframes: [
        {
          id: "k1",
          targetId: target.id,
          delay: 0,
          duration: 1,
          easing: "none",
          transforms: [
            { id: "tr", type: "rotateY", values: { rotationY: 45 } },
          ],
        },
      ],
      targets: [target],
      activeTargetId: target.id,
    };
    expect(timelineUsesCss3d(timeline)).toBe(true);
  });
});