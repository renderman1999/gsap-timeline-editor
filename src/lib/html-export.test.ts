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

  it("embeds shape border and box-shadow like the in-app preview", () => {
    const target = createAnimationTarget({
      type: "shape",
      shape: "square",
      style: {
        color: "#ff0066",
        borderWidth: "4px",
        borderColor: "#00ff99",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      },
    });
    const timeline: Timeline = {
      id: "shape-style",
      name: "Shape style",
      playbackType: "normal",
      loop: false,
      yoyo: false,
      keyframes: [],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain("shape-export-chrome");
    expect(html).toContain("border-color: #00ff99");
    expect(html).toContain("border-width: 4px");
    expect(html).toContain("border-style: solid");
    expect(html).toContain("box-shadow:");
    expect(html).toContain("background-color: #ff0066");
  });

  it("emits separate timelines for layers with own ScrollTrigger", () => {
    const shared = createAnimationTarget({ id: "shared", selector: ".shared" });
    const own = createAnimationTarget({
      id: "own",
      selector: ".own",
      scrollTriggerOwn: true,
      scrollTriggerStart: "top 80%",
      scrollTriggerEnd: "top 30%",
    });
    const timeline: Timeline = {
      id: "t-own-st",
      name: "Per layer ST",
      playbackType: "scroll",
      scrollLength: 200,
      loop: false,
      yoyo: false,
      keyframes: [
        {
          id: "k1",
          targetId: shared.id,
          delay: 0,
          duration: 1000,
          easing: "power2.out",
          transforms: [{ id: "t1", type: "move", values: { x: 100, y: 0 } }],
        },
        {
          id: "k2",
          targetId: own.id,
          delay: 0,
          duration: 1000,
          easing: "power2.out",
          transforms: [{ id: "t2", type: "move", values: { x: 200, y: 0 } }],
        },
      ],
      targets: [shared, own],
      activeTargetId: shared.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain("tlLayer_own");
    expect(html).toContain('start: "top 80%"');
    expect(html).toContain('end: "top 30%"');
    expect(html).toContain("const tl = gsap.timeline");
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
    expect(html).toContain(".stage.preview-trigger");
    expect(html).toContain("height: auto");
    expect(html).toContain("min-height: 100vh");
    expect(html).toContain("refreshScrollPreviews");
    expect(html).toContain("syncMasterScrollAnimation");
    expect(html).toContain("immediateRender: false");
  });

  it("inline script is valid JavaScript", () => {
    const target = createAnimationTarget({ type: "text" });
    const timeline: Timeline = {
      id: "t3",
      name: "Keyframes",
      playbackType: "scroll",
      scrollLength: 300,
      loop: false,
      yoyo: false,
      keyframes: [
        {
          id: "k1",
          targetId: target.id,
          delay: 0,
          duration: 1000,
          easing: "elastic.out(1, 0.5)",
          transforms: [
            { id: "tr1", type: "opacity", values: { opacity: 0.2 } },
          ],
        },
      ],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    const start = html.indexOf("<script>\n") + "<script>\n".length;
    const end = html.lastIndexOf("\n  </script>");
    const script = html.slice(start, end);
    expect(() => new Function(script)).not.toThrow();
    expect(script).toContain('\\"');
    expect(script).toContain("data-preview-target");
  });

  it("embeds code layer HTML and script", () => {
    const target = createAnimationTarget({
      type: "code",
      codeHtml: '<button id="btn">OK</button>',
      codeJs: 'root.querySelector("#btn").textContent = "via script";',
    });
    const timeline: Timeline = {
      id: "code",
      name: "Code layer",
      playbackType: "normal",
      loop: false,
      yoyo: false,
      keyframes: [],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain('data-code-layer');
    expect(html).toContain('<button id="btn">OK</button>');
    expect(html).toContain("via script");
    expect(html).toContain("[code layer]");
  });

  it("scroll export uses GSAP ScrollTrigger and 40vh/80vh spacers", () => {
    const target = createAnimationTarget({ type: "shape" });
    const timeline: Timeline = {
      id: "scroll",
      name: "Scroll",
      playbackType: "scroll",
      scrollLength: 400,
      loop: false,
      yoyo: false,
      keyframes: [
        {
          id: "k1",
          targetId: target.id,
          delay: 0,
          duration: 800,
          easing: "power2.out",
          transforms: [
            { id: "tr1", type: "rotate", values: { rotation: 45 } },
          ],
        },
      ],
      targets: [target],
      activeTargetId: target.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain("ScrollTrigger.min.js");
    expect(html).toContain('id="scroller"');
    expect(html).toContain(".scroll-spacer { height: 40vh; }");
    expect(html).toContain(".scroll-spacer-bottom { height: 80vh; }");
    expect(html).not.toContain('id="pagepiling"');
  });

  it("pins each scrollPin layer on its own section", () => {
    const first = createAnimationTarget({
      id: "pinA",
      name: "A",
      scrollPin: true,
      scrollTriggerStart: "top top",
      scrollTriggerScrollLength: 100,
    });
    const second = createAnimationTarget({
      id: "pinB",
      name: "B",
      scrollPin: true,
      scrollTriggerStart: "top top",
      scrollTriggerScrollLength: 100,
    });
    const timeline: Timeline = {
      id: "pins",
      name: "Due pin",
      playbackType: "scroll",
      scrollLength: 100,
      scrollTriggerStart: "top top",
      loop: false,
      yoyo: false,
      keyframes: [
        {
          id: "k1",
          targetId: first.id,
          delay: 0,
          duration: 800,
          easing: "power2.out",
          transforms: [{ id: "tr1", type: "move", values: { x: 120, y: 0 } }],
        },
        {
          id: "k2",
          targetId: second.id,
          delay: 0,
          duration: 800,
          easing: "power2.out",
          transforms: [{ id: "tr2", type: "rotate", values: { rotation: 90 } }],
        },
      ],
      targets: [first, second],
      activeTargetId: first.id,
      initialStates: {},
    };

    const html = generateTimelineHtml(timeline);
    expect(html).toContain('data-pin-section="pinA"');
    expect(html).toContain('data-pin-section="pinB"');
    expect(html).toContain("tlPin_pinA");
    expect(html).toContain("tlPin_pinB");
    expect(html.match(/pin: true/g)?.length).toBe(2);
    expect(html).toContain('pinType: "transform"');
    expect(html).toContain('[data-pin-section=\\"pinA\\"]');
    expect(html).not.toContain("const tl = gsap.timeline");
    const scriptStart = html.lastIndexOf("<script>\n") + "<script>\n".length;
    const scriptEnd = html.lastIndexOf("\n  </script>");
    const script = html.slice(scriptStart, scriptEnd);
    expect(() => new Function(script)).not.toThrow();
  });
});