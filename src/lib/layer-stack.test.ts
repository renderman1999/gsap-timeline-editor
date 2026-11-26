import { describe, expect, it } from "vitest";
import { layerStackZIndex } from "./layer-stack";

describe("layer-stack", () => {
  it("increases z-index with list position", () => {
    expect(layerStackZIndex(0)).toBe(1);
    expect(layerStackZIndex(2)).toBe(3);
  });
});