import { describe, expect, it } from "vitest";
import {
  clampImageWidth,
  imageLayerInlineStyle,
  isAllowedImageFile,
  MAX_IMAGE_WIDTH,
  MIN_IMAGE_WIDTH,
} from "./image-layer";

describe("image-layer", () => {
  it("accepts common image extensions", () => {
    expect(isAllowedImageFile({ name: "photo.JPG", type: "" } as File)).toBe(
      true
    );
    expect(isAllowedImageFile({ name: "x.txt", type: "text/plain" } as File)).toBe(
      false
    );
  });

  it("clamps image width and writes inline css", () => {
    expect(clampImageWidth(undefined)).toBe(160);
    expect(clampImageWidth(1)).toBe(MIN_IMAGE_WIDTH);
    expect(clampImageWidth(5000)).toBe(MAX_IMAGE_WIDTH);
    expect(imageLayerInlineStyle(240)).toBe(
      "width:240px;max-width:none;height:auto;object-fit:contain"
    );
  });
});