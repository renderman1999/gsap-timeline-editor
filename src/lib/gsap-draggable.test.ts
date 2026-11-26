import { describe, expect, it } from "vitest";
import { createAnimationTarget } from "@/lib/timeline-migrate";
import {
  buildDraggableVars,
  draggableCreateCodeLines,
  normalizeDraggableBounds,
} from "@/lib/gsap-draggable";

describe("gsap-draggable", () => {
  it("generates Draggable.create for enabled layers", () => {
    const target = createAnimationTarget({
      selector: ".hero",
      draggable: {
        enabled: true,
        type: "x,y",
        bounds: ".stage",
        inertia: true,
      },
    });
    const lines = draggableCreateCodeLines(target);
    expect(lines.join("\n")).toContain('Draggable.create(".hero"');
    expect(lines.join("\n")).toContain('type: "x,y"');
    expect(lines.join("\n")).toContain('bounds: ".stage"');
    expect(lines.join("\n")).toContain("inertia: true");
  });

  it("ignores invalid bounds like a lone dot", () => {
    expect(normalizeDraggableBounds(".")).toBeUndefined();
    expect(normalizeDraggableBounds("#")).toBeUndefined();
    expect(normalizeDraggableBounds("parent")).toBe("parent");
    const vars = buildDraggableVars(
      createAnimationTarget({
        draggable: { enabled: true, bounds: "." },
      })
    );
    expect(vars.bounds).toBeUndefined();
  });

  it("does not keep unresolved selector strings in export vars", () => {
    expect(normalizeDraggableBounds(".nope-in-page")).toBeUndefined();
  });
});