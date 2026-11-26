import { describe, expect, it } from "vitest";
import { generateTimelineHtml } from "./html-export";
import { createAnimationTarget } from "@/lib/timeline-migrate";
import type { Timeline } from "@/stores/timeline-store";

describe("html-export", () => {
  it("generates standalone HTML with GSAP CDN", () => {
    const target = createAnimationTarget({ selector: ".hero" });
    const timeline: Timeline = {
      id: "t1",
      name: "Test Export",
      playbackType: "normal",
      loop: false,
      yoyo: false,
      keyframes: [],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("cdn.jsdelivr.net/npm/gsap");
    expect(html).toContain('class="hero"');
    expect(html).toContain("tl.play();");
    expect(html).not.toContain("<header>");
    expect(html).toContain("100vh");
  });

  it("includes ScrollTrigger for scroll playback", () => {
    const target = createAnimationTarget({ selector: ".hero" });
    const timeline: Timeline = {
      id: "t2",
      name: "Scroll",
      playbackType: "scroll",
      scrollLength: 200,
      loop: false,
      yoyo: false,
      keyframes: [],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain("ScrollTrigger.min.js");
    expect(html).toContain('id="scroller"');
    expect(html).toContain("preview-trigger");
    expect(html).toContain("syncScrollAnimation");
    expect(html).toContain("immediateRender: false");
  });
});