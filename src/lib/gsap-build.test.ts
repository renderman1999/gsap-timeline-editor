import { describe, expect, it } from "vitest";
import { buildTweenSteps, tweenStepsToCodeLines } from "./gsap-build";
import { createAnimationTarget } from "@/lib/timeline-migrate";
import type { Keyframe } from "@/stores/timeline-store";

describe("gsap-build", () => {
  it("uses fromTo on first keyframe when initial state matches", () => {
    const keyframes: Keyframe[] = [
      {
        id: "k1",
        targetId: "layer-1",
        delay: 0,
        duration: 500,
        easing: "power2.out",
        transforms: [
          {
            id: "t1",
            type: "opacity",
            values: { opacity: 1 },
          },
        ],
      },
    ];

    const steps = buildTweenSteps(keyframes, [
      {
        id: "i1",
        type: "opacity",
        values: { opacity: 0 },
      },
    ]);

    expect(steps).toHaveLength(1);
    expect(steps[0].kind).toBe("fromTo");
    expect(steps[0].from?.opacity).toBe(0);
    expect(steps[0].to.opacity).toBe(1);
  });

  it("generates matching code lines", () => {
    const steps = buildTweenSteps(
      [
        {
          id: "k1",
          targetId: "layer-1",
          delay: 0.5,
          duration: 1000,
          easing: "power1.inOut",
          transforms: [
            {
              id: "t1",
              type: "move",
              values: { x: 100, y: 0 },
            },
          ],
        },
      ],
      undefined
    );

    const target = createAnimationTarget({ selector: ".target" });
    const lines = tweenStepsToCodeLines(target, steps);
    expect(lines[0]).toContain(
      `tl.to("[data-preview-target=\\"${target.id}\\"]"`
    );
    expect(lines[0]).toContain("x: 100");
    expect(lines[0]).toContain("0.5");
  });

  it("exports GSAP position, controls, relative values and plugin props", () => {
    const steps = buildTweenSteps(
      [
        {
          id: "k-plugin",
          targetId: "layer-1",
          delay: 0,
          position: "+=0.5",
          duration: 800,
          easing: "back.out",
          easeExtra: { param: 1.7 },
          repeat: -1,
          yoyo: true,
          transforms: [
            {
              id: "t-move",
              type: "move",
              values: { x: "+=20", y: 0, xPercent: -50 },
            },
            {
              id: "t-alpha",
              type: "autoAlpha",
              values: { autoAlpha: 0 },
            },
            {
              id: "t-css",
              type: "cssProp",
              values: { property: "width", value: "240px" },
            },
          ],
        },
      ],
      undefined
    );

    const target = createAnimationTarget({ selector: ".box" });
    const line = tweenStepsToCodeLines(target, steps)[0];
    expect(steps[0].ease).toBe("back.out(1.7)");
    expect(steps[0].position).toBe("+=0.5");
    expect(line).toContain('"+=20"');
    expect(line).toContain("xPercent");
    expect(line).toContain("autoAlpha");
    expect(line).toContain("width");
    expect(line).toContain("repeat: -1");
    expect(line).toContain("yoyo: true");
    expect(line).toContain('"+=0.5"');
  });

  it("emits motionPath config in code export", () => {
    const steps = buildTweenSteps(
      [
        {
          id: "k1",
          targetId: "layer-1",
          delay: 0,
          duration: 2000,
          easing: "power2.inOut",
          transforms: [
            {
              id: "t1",
              type: "motionPath",
              values: {
                path: "#motion-path",
                autoRotate: 1,
                align: "self",
                alignOrigin: "0.5, 0.5",
              },
            },
          ],
        },
      ],
      undefined
    );

    const lines = tweenStepsToCodeLines(
      createAnimationTarget({ selector: ".hero" }),
      steps
    );
    expect(lines[0]).toContain("motionPath:");
    expect(lines[0]).toContain('path: "#motion-path"');
    expect(lines[0]).toContain("autoRotate: true");
    expect(lines[0]).toContain('align: "self"');
    expect(lines[0]).toContain("transformOrigin");
  });

  it("emits css variable and cssRule in code export", () => {
    const target = createAnimationTarget({ selector: ".box" });
    const steps = buildTweenSteps(
      [
        {
          id: "k1",
          targetId: "layer-1",
          delay: 0,
          duration: 500,
          easing: "power1.out",
          transforms: [
            {
              id: "v1",
              type: "cssVar",
              values: { varName: "--myColor", value: "#0ae448" },
            },
            {
              id: "r1",
              type: "cssRule",
              values: {
                ruleSelector: ".box::before",
                property: "color",
                value: "blue",
              },
            },
          ],
        },
      ],
      [
        {
          id: "i1",
          type: "cssRule",
          values: {
            ruleSelector: ".box::before",
            property: "color",
            value: "red",
          },
        },
      ]
    );

    const lines = tweenStepsToCodeLines(target, steps);
    expect(lines.some((l) => l.includes("--myColor"))).toBe(true);
    expect(lines.some((l) => l.includes("CSSRulePlugin.getRule"))).toBe(true);
    expect(lines.some((l) => l.includes("cssRule:"))).toBe(true);
  });
});