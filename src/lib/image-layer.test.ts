import { describe, expect, it } from "vitest";
import { isAllowedImageFile } from "./image-layer";

describe("image-layer", () => {
  it("accepts common image extensions", () => {
    expect(isAllowedImageFile({ name: "photo.JPG", type: "" } as File)).toBe(
      true
    );
    expect(isAllowedImageFile({ name: "x.txt", type: "text/plain" } as File)).toBe(
      false
    );
  });
});