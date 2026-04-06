import { describe, it, expect, beforeEach } from "vitest";
import { getRpState, saveRpState, addRating, clearRpState } from "../rp-store";
import type { RpProgramState, RpRatingEntry } from "../rp-types";

// ---------------------------------------------------------------------------
// localStorage shim (Vitest runs in node -- no DOM)
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => { store[key] = value; },
  removeItem: (key: string): void => { delete store[key]; },
  clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
};

beforeEach(() => {
  // Clear the in-memory store between tests
  localStorageMock.clear();

  // rp-store reads/writes via `window.localStorage`, so shim both
  globalThis.window = { localStorage: localStorageMock } as unknown as Window & typeof globalThis;
  globalThis.localStorage = localStorageMock as unknown as Storage;
});

// ---------------------------------------------------------------------------
// Shared fixture factories
// ---------------------------------------------------------------------------

function makeState(overrides: Partial<RpProgramState> = {}): RpProgramState {
  return {
    templateId: "rp-4day",
    currentMeso: "basic",
    currentWeek: 1,
    selections: {
      "d1-01": { exerciseName: "Bench Press (Barbell)", tenRepMax: 135 },
    },
    ratings: [],
    ...overrides,
  };
}

function makeRating(overrides: Partial<RpRatingEntry> = {}): RpRatingEntry {
  return {
    slotId: "d1-01",
    week: 1,
    meso: "basic",
    value: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getRpState -- empty / missing user
// ---------------------------------------------------------------------------

describe("getRpState", () => {
  it("returns null when storage is empty", () => {
    expect(getRpState("his")).toBeNull();
  });

  it("returns null for a user that has no saved state", () => {
    saveRpState("his", makeState());
    expect(getRpState("hers")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// saveRpState / getRpState -- round-trip
// ---------------------------------------------------------------------------

describe("saveRpState / getRpState round-trip", () => {
  it("saves and retrieves the full state unchanged", () => {
    const state = makeState({
      currentWeek: 3,
      currentMeso: "metabolite",
      ratings: [makeRating({ week: 2, value: 1 })],
    });

    saveRpState("his", state);
    const loaded = getRpState("his");

    expect(loaded).not.toBeNull();
    expect(loaded!.templateId).toBe("rp-4day");
    expect(loaded!.currentMeso).toBe("metabolite");
    expect(loaded!.currentWeek).toBe(3);
    expect(loaded!.selections["d1-01"].tenRepMax).toBe(135);
    expect(loaded!.ratings).toHaveLength(1);
    expect(loaded!.ratings[0].value).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addRating -- append
// ---------------------------------------------------------------------------

describe("addRating", () => {
  it("appends multiple ratings in order", () => {
    saveRpState("his", makeState());

    const r1 = makeRating({ slotId: "d1-01", week: 1, value: 0 });
    const r2 = makeRating({ slotId: "d1-02", week: 1, value: 1 });
    const r3 = makeRating({ slotId: "d1-01", week: 2, value: -1 });

    addRating("his", r1);
    addRating("his", r2);
    addRating("his", r3);

    const loaded = getRpState("his");
    expect(loaded).not.toBeNull();
    expect(loaded!.ratings).toHaveLength(3);
    expect(loaded!.ratings[0]).toEqual(r1);
    expect(loaded!.ratings[1]).toEqual(r2);
    expect(loaded!.ratings[2]).toEqual(r3);
  });

  it("is a no-op when no state exists for the user", () => {
    // no saveRpState call -- state is absent
    addRating("his", makeRating());
    // should not throw, and state should still be absent
    expect(getRpState("his")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// clearRpState
// ---------------------------------------------------------------------------

describe("clearRpState", () => {
  it("causes getRpState to return null after clearing", () => {
    saveRpState("his", makeState());
    expect(getRpState("his")).not.toBeNull();

    clearRpState("his");
    expect(getRpState("his")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Per-user isolation
// ---------------------------------------------------------------------------

describe("per-user isolation", () => {
  it("saving for 'his' does not affect 'hers'", () => {
    saveRpState("his", makeState({ currentWeek: 5 }));
    expect(getRpState("hers")).toBeNull();
  });

  it("saving for 'hers' does not affect 'his'", () => {
    saveRpState("his", makeState({ currentWeek: 2 }));
    saveRpState("hers", makeState({ currentWeek: 7, currentMeso: "resensitization" }));

    expect(getRpState("his")!.currentWeek).toBe(2);
    expect(getRpState("hers")!.currentWeek).toBe(7);
    expect(getRpState("hers")!.currentMeso).toBe("resensitization");
  });

  it("clearing one user leaves the other intact", () => {
    saveRpState("his", makeState({ currentWeek: 1 }));
    saveRpState("hers", makeState({ currentWeek: 4 }));

    clearRpState("his");

    expect(getRpState("his")).toBeNull();
    expect(getRpState("hers")).not.toBeNull();
    expect(getRpState("hers")!.currentWeek).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Shape validation -- corrupted data returns null gracefully
// ---------------------------------------------------------------------------

describe("shape validation", () => {
  it("returns null when storage contains a non-object value", () => {
    // Write a raw string directly (bypasses saveRpState)
    localStorageMock.setItem("mi_rp_state", "not-valid-json{{{{");
    expect(getRpState("his")).toBeNull();
  });

  it("returns null when user's entry is missing required fields", () => {
    // Structurally valid JSON, but the user object is incomplete
    const corrupt = {
      his: {
        templateId: "rp-4day",
        // currentMeso, currentWeek, selections, ratings all missing
      },
    };
    localStorageMock.setItem("mi_rp_state", JSON.stringify(corrupt));
    expect(getRpState("his")).toBeNull();
  });

  it("returns null when ratings field is not an array", () => {
    const corrupt = {
      his: {
        templateId: "rp-4day",
        currentMeso: "basic",
        currentWeek: 1,
        selections: {},
        ratings: "oops", // wrong type
      },
    };
    localStorageMock.setItem("mi_rp_state", JSON.stringify(corrupt));
    expect(getRpState("his")).toBeNull();
  });

  it("returns null when selections field is null", () => {
    const corrupt = {
      his: {
        templateId: "rp-4day",
        currentMeso: "basic",
        currentWeek: 1,
        selections: null,
        ratings: [],
      },
    };
    localStorageMock.setItem("mi_rp_state", JSON.stringify(corrupt));
    expect(getRpState("his")).toBeNull();
  });
});
