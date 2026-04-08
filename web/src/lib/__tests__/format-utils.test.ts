import { describe, it, expect } from "vitest";
import { formatMuscleName, formatClock, formatDuration } from "../format-utils";

describe("formatMuscleName", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatMuscleName("side_delts")).toBe("Side Delts");
  });

  it("capitalizes single word", () => {
    expect(formatMuscleName("back")).toBe("Back");
  });

  it("handles front_delts", () => {
    expect(formatMuscleName("front_delts")).toBe("Front Delts");
  });
});

describe("formatClock", () => {
  it("formats 90 seconds as 1:30", () => {
    expect(formatClock(90)).toBe("1:30");
  });

  it("pads single-digit seconds", () => {
    expect(formatClock(65)).toBe("1:05");
  });

  it("formats 0 seconds", () => {
    expect(formatClock(0)).toBe("0:00");
  });
});

describe("formatDuration", () => {
  it("formats as Mm SSs", () => {
    expect(formatDuration(125)).toBe("2m 05s");
  });

  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0m 00s");
  });
});
