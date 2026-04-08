import { describe, it, expect, beforeEach, vi } from "vitest";
import { readJson, writeJson } from "../storage-utils";

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
    },
  });
});

describe("readJson", () => {
  it("returns null for missing key", () => {
    expect(readJson("nope")).toBeNull();
  });

  it("parses stored JSON", () => {
    store["test"] = JSON.stringify({ a: 1 });
    expect(readJson("test")).toEqual({ a: 1 });
  });

  it("returns null for corrupt JSON", () => {
    store["bad"] = "not json{{{";
    expect(readJson("bad")).toBeNull();
  });
});

describe("writeJson", () => {
  it("serializes value to localStorage", () => {
    writeJson("key", { b: 2 });
    expect(JSON.parse(store["key"])).toEqual({ b: 2 });
  });
});
