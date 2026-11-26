import { describe, expect, it } from "vitest";
import {
  resolveScrollPinSelector,
  scrollTriggerStartForPin,
  scrollTriggerTimelineCodeLines,
} from "./gsap-scroll-pin";
import { createAnimationTarget, normalizeTimeline } from "./timeline-migrate";

describe("gsap-scroll-pin", () => {
  it("returns layer selector when one layer is pinned", () => {
    const timeline = normalizeTimeline({
      id: "t1",
      name: "T",
      playbackType: "scroll",
      loop: false,
      yoyo: false,
      keyframes: [],
      targets: [
        createAnimationTarget({
          id: "a",
          selector: ".hero",
          scrollPin: true,
        }),
      ],
      activeTargetId: "a",
    });
    expect(resolveScrollPinSelector(timeline)).toBe(true);
    expect(scrollTriggerStartForPin("top center", true)).toBe("top top");
    const code = scrollTriggerTimelineCodeLines(timeline, ".section");
    expect(code.join("\n")).toContain("scrub: true");
    expect(code.join("\n")).toContain("pin: true");
    const codeInScroller = scrollTriggerTimelineCodeLines(timeline, ".t", {
      scrollerSelector: "#scroller",
    });
    expect(codeInScroller.join("\n")).toContain('pinType: "transform"');
    expect(code.join("\n")).toContain('start: "top top"');
  });
});