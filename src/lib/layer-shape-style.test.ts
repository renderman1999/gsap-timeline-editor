import { describe, expect, it } from "vitest";
import {
  layerShapeChromeStyle,
  layerShapeGeometryExtras,
} from "./layer-shape-style";

describe("layer-shape-style", () => {
  it("applies border width with default solid on geometry", () => {
    const style = {
      borderWidth: "3px",
      borderColor: "#ff0000",
    };
    const geom = layerShapeGeometryExtras(style, "square");
    expect(geom.borderWidth).toBe("3px");
    expect(geom.borderStyle).toBe("solid");
    expect(geom.borderColor).toBe("#ff0000");
  });

  it("puts border on chrome for triangle and icons, not duplicate on geometry", () => {
    const style = { borderWidth: "2px", borderColor: "#00ff00" };
    const triChrome = layerShapeChromeStyle(style, "triangle");
    expect(triChrome.borderWidth).toBe("2px");
    expect(layerShapeGeometryExtras(style, "triangle")).toEqual({});
    expect(layerShapeChromeStyle(style, "star").borderWidth).toBe("2px");
    expect(layerShapeGeometryExtras(style, "star")).toEqual({});

    const heartChrome = layerShapeChromeStyle(style, "heart");
    expect(heartChrome.borderStyle).toBe("solid");
    expect(layerShapeGeometryExtras(style, "heart")).toEqual({});
  });

  it("maps shadow, outline, opacity, filter on chrome", () => {
    const style = {
      boxShadow: "0 4px 8px #000",
      outlineWidth: "2px",
      outlineColor: "#3366ff",
      opacity: "0.8",
      filter: "blur(1px)",
    };
    const chrome = layerShapeChromeStyle(style, "square");
    expect(chrome.boxShadow).toBe("0 4px 8px #000");
    expect(chrome.outlineStyle).toBe("solid");
    expect(chrome.outlineWidth).toBe("2px");
    expect(chrome.opacity).toBe("0.8");
    expect(chrome.filter).toBe("blur(1px)");
  });
});