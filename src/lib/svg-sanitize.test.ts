import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYER_SVG,
  extractSvgFragment,
  sanitizeSvgMarkup,
} from "@/lib/svg-sanitize";

describe("sanitizeSvgMarkup", () => {
  it("returns default when empty", () => {
    expect(sanitizeSvgMarkup("")).toBe(DEFAULT_LAYER_SVG);
  });

  it("strips script tags", () => {
    const raw = `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="10"/></svg>`;
    const out = sanitizeSvgMarkup(raw);
    expect(out.toLowerCase()).not.toContain("<script");
    expect(out).toContain("circle");
  });

  it("extracts svg from html wrapper", () => {
    const fragment = extractSvgFragment(
      '<div><svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg></div>'
    );
    expect(fragment).toMatch(/^<svg/i);
  });
});