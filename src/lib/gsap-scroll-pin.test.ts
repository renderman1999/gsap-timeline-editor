import { describe, expect, it } from "vitest";
import {
  resolveScrollPinSelector,
  scrollTriggerStartForPin,
  scrollTriggerTimelineCodeLines,
} from "./gsap-scroll-pin";
import { scrollTriggerPinnedSectionCodeLines } from "./scroll-trigger-per-layer";
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
    const master = scrollTriggerTimelineCodeLines(timeline, ".section", {
      scrollerSelector: "#scroller",
    });
    expect(master.join("\n")).not.toContain("pin: true");
    const pin = scrollTriggerPinnedSectionCodeLines(
      timeline,
      timeline.targets[0],
      '[data-pin-section="a"]',
      { scrollerSelector: "#scroller", refreshPriority: 0 }
    );
    const pinCode = pin.join("\n");
    expect(pinCode).toContain('trigger: "[data-pin-section=\\"a\\"]"');
    expect(() => new Function(`({${pinCode}})`)).not.toThrow();
    expect(pinCode).toContain("scrub: true");
    expect(pinCode).toContain("pin: true");
    expect(pinCode).toContain('pinType: "transform"');
    expect(pinCode).toContain('start: "top top"');
    expect(pinCode).toContain("refreshPriority: 0");
  });
});