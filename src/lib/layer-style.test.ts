import { describe, expect, it } from "vitest";
import {
  layerCustomCssToStyle,
  layerStyleToCss,
  layerStyleToInlineString,
} from "./layer-style";

describe("layer-style", () => {
  it("preserves CSS custom properties for React style", () => {
    const css = layerStyleToCss({
      customCss: "--my-color: #f00; --accent: blue",
    });
    expect(css).toEqual({
      "--my-color": "#f00",
      "--accent": "blue",
    });
  });

  it("parses transform in custom css", () => {
    expect(
      layerCustomCssToStyle({ customCss: "transform: scaleY(-1);" })
    ).toEqual({
      transform: "scaleY(-1)",
      transformOrigin: "top center",
    });
  });

  it("exports custom properties in inline string", () => {
    const s = layerStyleToInlineString({
      customCss: "--brand: #336",
    });
    expect(s).toContain("--brand: #336");
  });
});