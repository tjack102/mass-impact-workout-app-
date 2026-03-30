# Warm-Up Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an RP-style warm-up calculator modal that generates warm-up set recommendations from a working weight, accessible from the Live Console during workouts (auto-filled) and as a standalone card when idle.

**Architecture:** Pure calculation engine (`warmup-engine.ts`) feeds a `WarmupCalculator` component rendered inside a generic `Modal` portal. Two entry points in `today-screen.tsx` trigger the same modal with different initial state. Settings stored in `mi_warmup_settings` localStorage key.

**Tech Stack:** React 19, TypeScript, Vitest, CSS custom properties (Iron Ledger theme system)

**Spec:** `docs/superpowers/specs/2026-03-29-warmup-calculator-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `web/src/lib/warmup-engine.ts` | Pure `calculateWarmupSets()` + `WarmupSet`/`WarmupOptions` types |
| `web/src/lib/__tests__/warmup-engine.test.ts` | Unit tests for calculation engine |
| `web/src/components/modal.tsx` | Generic reusable overlay modal (portal, backdrop, inert, scroll lock) |
| `web/src/components/warmup-calculator.tsx` | Calculator UI -- inputs, settings gear, results table |

### Modified Files

| File | Change |
|------|--------|
| `web/src/components/screens/today-screen.tsx` | "Warm Up" button in Live Console + standalone card when idle |
| `web/src/app/globals.css` | Modal overlay + warmup calculator styles |

---

## Task 1: Warmup Engine -- Types and Failing Tests

**Files:**
- Create: `web/src/lib/warmup-engine.ts`
- Create: `web/src/lib/__tests__/warmup-engine.test.ts`

- [ ] **Step 1: Create the engine file with types and stub function**

```typescript
// web/src/lib/warmup-engine.ts

export type WarmupSet = {
  weight: number;
  reps: number;
  repsDisplay: string;
  label: string;
};

export type WarmupOptions = {
  roundingIncrement?: number;
  startPercent?: number;
  abbreviated?: boolean;
};

export function calculateWarmupSets(
  workingWeight: number,
  options?: WarmupOptions,
): WarmupSet[] {
  return [];
}
```

- [ ] **Step 2: Write the full test suite**

Follow the existing test pattern in `web/src/lib/__tests__/volume-engine.test.ts` -- `describe/it/expect` from vitest, factory helpers where useful.

```typescript
// web/src/lib/__tests__/warmup-engine.test.ts

import { describe, it, expect } from "vitest";
import { calculateWarmupSets } from "../warmup-engine";
import type { WarmupSet } from "../warmup-engine";

describe("calculateWarmupSets", () => {
  // --- Edge cases (evaluated first) ---

  it("returns empty array for 0 weight", () => {
    expect(calculateWarmupSets(0)).toEqual([]);
  });

  it("returns empty array for negative weight", () => {
    expect(calculateWarmupSets(-10)).toEqual([]);
  });

  it("returns only potentiation set for weight <= 45", () => {
    const result = calculateWarmupSets(45);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Potentiation");
    expect(result[0].weight).toBe(45);
    expect(result[0].repsDisplay).toBe("2-3");
  });

  it("returns light + potentiation only for weight 46-65 (no intermediates)", () => {
    const result = calculateWarmupSets(60);
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Light");
    expect(result[0].reps).toBe(10);
    expect(result[1].label).toBe("Potentiation");
  });

  // --- Standard protocol (> 65 lbs) ---

  it("returns light + 2 intermediates + potentiation for 66-200 lbs", () => {
    const result = calculateWarmupSets(135);
    expect(result).toHaveLength(4);
    expect(result[0].label).toBe("Light");
    expect(result[1].label).toBe("Intermediate 1");
    expect(result[2].label).toBe("Intermediate 2");
    expect(result[3].label).toBe("Potentiation");
    // All intermediate reps are 5
    expect(result[1].reps).toBe(5);
    expect(result[2].reps).toBe(5);
  });

  it("returns light + 3 intermediates + potentiation for 201-400 lbs", () => {
    const result = calculateWarmupSets(225);
    expect(result).toHaveLength(5);
    expect(result[0].label).toBe("Light");
    expect(result[1].label).toBe("Intermediate 1");
    expect(result[2].label).toBe("Intermediate 2");
    expect(result[3].label).toBe("Intermediate 3");
    expect(result[4].label).toBe("Potentiation");
  });

  it("returns light + 4 intermediates + potentiation for 401+ lbs", () => {
    const result = calculateWarmupSets(500);
    expect(result).toHaveLength(6);
    expect(result[0].label).toBe("Light");
    expect(result[4].label).toBe("Intermediate 4");
    expect(result[5].label).toBe("Potentiation");
  });

  // --- Threshold boundaries ---

  it("66 lbs uses 2 intermediates", () => {
    const result = calculateWarmupSets(66);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(2);
  });

  it("200 lbs uses 2 intermediates", () => {
    const result = calculateWarmupSets(200);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(2);
  });

  it("201 lbs uses 3 intermediates", () => {
    const result = calculateWarmupSets(201);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(3);
  });

  it("400 lbs uses 3 intermediates", () => {
    const result = calculateWarmupSets(400);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(3);
  });

  it("401 lbs uses 4 intermediates", () => {
    const result = calculateWarmupSets(401);
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(4);
  });

  // --- Rounding ---

  it("rounds weights to nearest 5 lbs by default", () => {
    const result = calculateWarmupSets(135);
    for (const set of result) {
      expect(set.weight % 5).toBe(0);
    }
  });

  it("rounds to nearest 2.5 when configured", () => {
    const result = calculateWarmupSets(135, { roundingIncrement: 2.5 });
    for (const set of result) {
      expect(set.weight % 2.5).toBe(0);
    }
  });

  it("rounds to nearest 10 when configured", () => {
    const result = calculateWarmupSets(225, { roundingIncrement: 10 });
    for (const set of result) {
      expect(set.weight % 10).toBe(0);
    }
  });

  // --- Bar weight clamping ---

  it("clamps calculated weights to 45 lbs minimum", () => {
    // 50 lbs working weight, 45% start = 22.5 -> should clamp to 45
    const result = calculateWarmupSets(50);
    for (const set of result) {
      expect(set.weight).toBeGreaterThanOrEqual(45);
    }
  });

  // --- Custom start percent ---

  it("uses custom start percent for light set", () => {
    const result = calculateWarmupSets(200, { startPercent: 30 });
    expect(result[0].label).toBe("Light");
    expect(result[0].weight).toBe(60); // 200 * 0.30 = 60
  });

  // --- Potentiation set ---

  it("potentiation set uses working weight exactly", () => {
    const result = calculateWarmupSets(225);
    const pot = result.find((s) => s.label === "Potentiation");
    expect(pot).toBeDefined();
    expect(pot!.weight).toBe(225);
    expect(pot!.repsDisplay).toBe("2-3");
    expect(pot!.reps).toBe(3);
  });

  // --- Abbreviated mode ---

  it("abbreviated mode returns 1 intermediate + potentiation only", () => {
    const result = calculateWarmupSets(225, { abbreviated: true });
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe("Intermediate 1");
    expect(result[0].reps).toBe(5);
    expect(result[1].label).toBe("Potentiation");
  });

  it("abbreviated mode with light weight (46-65) returns potentiation only", () => {
    const result = calculateWarmupSets(60, { abbreviated: true });
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Potentiation");
  });

  // --- Deduplication ---

  it("no adjacent warm-up sets share the same weight", () => {
    // Large rounding increment on moderate weight forces collisions
    const result = calculateWarmupSets(135, { roundingIncrement: 10 });
    for (let i = 1; i < result.length; i++) {
      expect(result[i].weight).not.toBe(result[i - 1].weight);
    }
  });

  it("dedup retains the set with more reps when collapsing", () => {
    // 66 lbs, 45% start, increment 25: light = clamp(29.7->25->45)=45,
    // int1 = 45+(66-45)/3*1=52->50, int2 = 45+(66-45)/3*2=59->50, pot=66->75
    // int1 and int2 both round to 50 -> should collapse to one set with 5 reps
    // Result: [Light 45, Intermediate 50, Potentiation 75] = 3 sets
    const result = calculateWarmupSets(66, { roundingIncrement: 25 });
    const intermediates = result.filter((s) => s.label.startsWith("Intermediate"));
    expect(intermediates).toHaveLength(1);
    expect(intermediates[0].reps).toBe(5);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd web && npx vitest run src/lib/__tests__/warmup-engine.test.ts`
Expected: All tests FAIL (stub returns empty array)

- [ ] **Step 4: Commit test suite + stub**

```bash
git add web/src/lib/warmup-engine.ts web/src/lib/__tests__/warmup-engine.test.ts
git commit -m "test: add warmup engine test suite (all failing, stub only)"
```

---

## Task 2: Warmup Engine -- Implementation

**Files:**
- Modify: `web/src/lib/warmup-engine.ts`

- [ ] **Step 1: Implement `calculateWarmupSets`**

Replace the stub with the full implementation:

```typescript
// web/src/lib/warmup-engine.ts

export type WarmupSet = {
  weight: number;
  reps: number;
  repsDisplay: string;
  label: string;
};

export type WarmupOptions = {
  roundingIncrement?: number;
  startPercent?: number;
  abbreviated?: boolean;
};

const BAR_WEIGHT = 45;

function roundTo(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function clampToBar(weight: number): number {
  return Math.max(weight, BAR_WEIGHT);
}

function getIntermediateCount(workingWeight: number): number {
  if (workingWeight <= 200) return 2;
  if (workingWeight <= 400) return 3;
  return 4;
}

function dedup(sets: WarmupSet[]): WarmupSet[] {
  const result: WarmupSet[] = [];
  for (const set of sets) {
    const prev = result[result.length - 1];
    if (prev && prev.weight === set.weight) {
      // Keep the one with more reps
      if (set.reps > prev.reps) {
        result[result.length - 1] = set;
      }
    } else {
      result.push(set);
    }
  }
  return result;
}

export function calculateWarmupSets(
  workingWeight: number,
  options?: WarmupOptions,
): WarmupSet[] {
  if (workingWeight <= 0) return [];

  const increment = options?.roundingIncrement ?? 5;
  const startPercent = (options?.startPercent ?? 45) / 100;
  const abbreviated = options?.abbreviated ?? false;

  const potentiation: WarmupSet = {
    weight: roundTo(workingWeight, increment),
    reps: 3,
    repsDisplay: "2-3",
    label: "Potentiation",
  };

  // Edge case: very light weight
  if (workingWeight <= BAR_WEIGHT) {
    return [potentiation];
  }

  // Edge case: light weight (46-65) -- abbreviated skips light set
  if (workingWeight <= 65) {
    if (abbreviated) return [potentiation];
    const lightWeight = clampToBar(roundTo(workingWeight * startPercent, increment));
    return dedup([
      { weight: lightWeight, reps: 10, repsDisplay: "10", label: "Light" },
      potentiation,
    ]);
  }

  // Standard protocol (> 65 lbs)
  const lightWeight = clampToBar(roundTo(workingWeight * startPercent, increment));

  if (abbreviated) {
    // 1 intermediate (midpoint between light and working) + potentiation
    const midWeight = clampToBar(roundTo((lightWeight + workingWeight) / 2, increment));
    return dedup([
      { weight: midWeight, reps: 5, repsDisplay: "5", label: "Intermediate 1" },
      potentiation,
    ]);
  }

  const intermediateCount = getIntermediateCount(workingWeight);
  const gap = workingWeight - lightWeight;
  const step = gap / (intermediateCount + 1);

  const sets: WarmupSet[] = [
    { weight: lightWeight, reps: 10, repsDisplay: "10", label: "Light" },
  ];

  for (let i = 1; i <= intermediateCount; i++) {
    const raw = lightWeight + step * i;
    sets.push({
      weight: clampToBar(roundTo(raw, increment)),
      reps: 5,
      repsDisplay: "5",
      label: `Intermediate ${i}`,
    });
  }

  sets.push(potentiation);
  return dedup(sets);
}
```

- [ ] **Step 2: Run tests to verify they all pass**

Run: `cd web && npx vitest run src/lib/__tests__/warmup-engine.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/warmup-engine.ts
git commit -m "feat: implement warmup engine calculation logic"
```

---

## Task 3: Generic Modal Component

**Files:**
- Create: `web/src/components/modal.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Create the modal component**

```typescript
// web/src/components/modal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const triggerRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Capture the element that had focus when the modal opens
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
    }
  }, [open]);

  // Inert + scroll lock + focus management
  useEffect(() => {
    if (!open) return;

    const appShell = document.querySelector(".app-shell");
    const prevOverflow = document.body.style.overflow;

    if (appShell) appShell.setAttribute("inert", "");
    document.body.style.overflow = "hidden";

    // Move focus into the modal
    dialogRef.current?.focus();

    return () => {
      if (appShell) appShell.removeAttribute("inert");
      document.body.style.overflow = prevOverflow;

      // Restore focus to trigger element
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    };
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = "modal-title";

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-panel surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">{title}</h2>
          <button
            className="ghost-btn modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Add modal CSS to globals.css**

Append to the end of `web/src/app/globals.css`:

```css
/* ── Modal ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-panel {
  width: 100%;
  max-width: 400px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1rem;
  outline: none;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 1.3rem;
  color: var(--text-0);
  margin: 0;
}

.modal-close {
  font-size: 1.2rem;
  padding: 0.3rem 0.5rem;
  color: var(--text-1);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add web/src/components/modal.tsx web/src/app/globals.css
git commit -m "feat: add generic overlay modal component"
```

---

## Task 4: Warmup Calculator Component

**Files:**
- Create: `web/src/components/warmup-calculator.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Create the warmup calculator component**

```typescript
// web/src/components/warmup-calculator.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { calculateWarmupSets, type WarmupOptions } from "../lib/warmup-engine";

type WarmupSettings = {
  roundingIncrement: number;
  startPercent: number;
};

const SETTINGS_KEY = "mi_warmup_settings";
const DEFAULT_SETTINGS: WarmupSettings = { roundingIncrement: 5, startPercent: 45 };

function loadSettings(): WarmupSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      roundingIncrement: parsed.roundingIncrement ?? DEFAULT_SETTINGS.roundingIncrement,
      startPercent: parsed.startPercent ?? DEFAULT_SETTINGS.startPercent,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: WarmupSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

type WarmupCalculatorProps = {
  /** Pre-filled exercise name (display-only when provided) */
  exerciseName?: string;
  /** Pre-filled working weight from last session */
  initialWeight?: number;
  /** Auto-detected: same muscle group already worked this session */
  autoAbbreviated?: boolean;
};

export function WarmupCalculator({
  exerciseName,
  initialWeight,
  autoAbbreviated = false,
}: WarmupCalculatorProps) {
  const [settings, setSettings] = useState<WarmupSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [abbreviated, setAbbreviated] = useState(autoAbbreviated);
  const [manualName, setManualName] = useState("");

  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const workingWeight = parseFloat(weight) || 0;

  const warmupSets = useMemo(() => {
    if (workingWeight <= 0) return [];
    const opts: WarmupOptions = {
      roundingIncrement: settings.roundingIncrement,
      startPercent: settings.startPercent,
      abbreviated,
    };
    return calculateWarmupSets(workingWeight, opts);
  }, [workingWeight, settings.roundingIncrement, settings.startPercent, abbreviated]);

  const updateSetting = (patch: Partial<WarmupSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="warmup-calc">
      {/* Settings toggle */}
      <button
        className="ghost-btn warmup-settings-toggle"
        onClick={() => setSettingsOpen(!settingsOpen)}
        aria-label="Settings"
        aria-expanded={settingsOpen}
      >
        ⚙
      </button>

      {/* Settings row */}
      {settingsOpen && (
        <div className="warmup-settings">
          <div className="warmup-setting-group">
            <span className="subtle-label">Round to</span>
            <div className="warmup-radio-group">
              {[2.5, 5, 10].map((inc) => (
                <label key={inc} className={`warmup-radio${settings.roundingIncrement === inc ? " active" : ""}`}>
                  <input
                    type="radio"
                    name="roundingIncrement"
                    value={inc}
                    checked={settings.roundingIncrement === inc}
                    onChange={() => updateSetting({ roundingIncrement: inc })}
                  />
                  {inc} lb
                </label>
              ))}
            </div>
          </div>
          <div className="warmup-setting-group">
            <span className="subtle-label">Start %</span>
            <input
              type="number"
              className="warmup-pct-input mono"
              value={settings.startPercent}
              min={20}
              max={60}
              step={5}
              onChange={(e) => updateSetting({ startPercent: parseInt(e.target.value, 10) || 45 })}
            />
          </div>
        </div>
      )}

      {/* Exercise name */}
      <div className="warmup-input-row">
        {exerciseName ? (
          <p className="warmup-exercise-name subtle-label">{exerciseName}</p>
        ) : (
          <input
            type="text"
            className="warmup-name-input"
            placeholder="Exercise (optional)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
        )}
      </div>

      {/* Working weight input */}
      <div className="warmup-input-row">
        <label className="subtle-label" htmlFor="warmup-weight">Working Weight (lbs)</label>
        <input
          id="warmup-weight"
          type="number"
          className="warmup-weight-input mono"
          placeholder="e.g. 225"
          value={weight}
          min={0}
          step={settings.roundingIncrement}
          onChange={(e) => setWeight(e.target.value)}
          autoFocus={!initialWeight}
        />
      </div>

      {/* Abbreviated toggle */}
      <label className="warmup-toggle-row">
        <input
          type="checkbox"
          checked={abbreviated}
          onChange={(e) => setAbbreviated(e.target.checked)}
        />
        <span>Abbreviated (same muscle already warmed up)</span>
      </label>

      {/* Results */}
      {workingWeight <= 0 ? (
        <p className="warmup-empty subtle-label">Enter your working weight</p>
      ) : (
        <table className="warmup-results">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
            </tr>
          </thead>
          <tbody>
            {warmupSets.map((set, i) => (
              <tr key={i} className={`warmup-row warmup-row--${set.label.split(" ")[0].toLowerCase()}`}>
                <td className="subtle-label">{set.label}</td>
                <td className="mono warmup-weight-cell">{set.weight}</td>
                <td className="mono">{set.repsDisplay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="warmup-footer subtle-label">Warm-up sets are for reference only -- not logged</p>
    </div>
  );
}
```

- [ ] **Step 2: Add warmup calculator CSS to globals.css**

Append to end of `web/src/app/globals.css`:

```css
/* ── Warmup Calculator ── */
.warmup-calc {
  position: relative;
}

.warmup-settings-toggle {
  position: absolute;
  top: -2.8rem;
  right: 2.2rem;
  font-size: 1.1rem;
  color: var(--text-1);
}

.warmup-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.6rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.warmup-setting-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.warmup-radio-group {
  display: flex;
  gap: 0.25rem;
}

.warmup-radio {
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  color: var(--text-1);
}
.warmup-radio input { display: none; }
.warmup-radio.active {
  background: var(--accent-primary);
  color: var(--bg-0);
  border-color: var(--accent-primary);
}

.warmup-pct-input {
  width: 3.5rem;
  padding: 0.2rem 0.4rem;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-0);
  text-align: center;
  font-size: 0.85rem;
}

.warmup-input-row {
  margin-bottom: 0.6rem;
}

.warmup-exercise-name {
  margin: 0 0 0.3rem;
  font-size: 0.85rem;
}

.warmup-name-input,
.warmup-weight-input {
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-0);
  font-size: 1rem;
}

.warmup-weight-input {
  font-size: 1.2rem;
  letter-spacing: 0.04em;
}

.warmup-toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-1);
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.warmup-empty {
  text-align: center;
  padding: 1.5rem 0;
  margin: 0;
}

.warmup-results {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
}

.warmup-results th {
  text-align: left;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-1);
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid var(--border);
}

.warmup-results td {
  padding: 0.45rem 0.4rem;
  font-size: 0.9rem;
}

.warmup-weight-cell {
  color: var(--accent-primary);
  font-weight: 600;
}

.warmup-row--potentiation td {
  border-top: 1px solid var(--border);
}

.warmup-row--light td {
  border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
}

.warmup-footer {
  text-align: center;
  font-size: 0.7rem;
  margin: 0.5rem 0 0;
  opacity: 0.6;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add web/src/components/warmup-calculator.tsx web/src/app/globals.css
git commit -m "feat: add warmup calculator component with settings persistence"
```

---

## Task 5: Today Screen Integration -- Live Console Button

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`

**Key references in today-screen.tsx:**
- `matchingActiveSession` -- line ~224-227
- `activeExercise` -- line ~275-277 (derived from `queueExercises[safeActiveIndex]`)
- Live Console flex row -- line ~881 (div with h2 exercise name + SyncStateIndicator)
- Import `getLastPerformance` from `workout-store.ts` (line ~360)
- Import `findExercise` from `exercise-library.ts` (line ~809)

- [ ] **Step 1: Add imports at top of today-screen.tsx**

Add these two new imports alongside existing ones:

```typescript
import { Modal } from "../modal";
import { WarmupCalculator } from "../warmup-calculator";
```

Note: `findExercise` is already imported from `@/lib/exercise-library` (line ~41). `getLastPerformance` is NOT currently imported -- add it to the existing `workout-store` import block (line ~27-39):

```typescript
import { getLastPerformance, /* ...existing imports... */ } from "@/lib/workout-store";
```

- [ ] **Step 2: Add warmup modal state**

Add near the other `useState` declarations (around line ~183-209):

```typescript
const [warmupOpen, setWarmupOpen] = useState(false);
const [warmupProps, setWarmupProps] = useState<{
  exerciseName?: string;
  initialWeight?: number;
  autoAbbreviated?: boolean;
}>({});
```

- [ ] **Step 3: Add warmup trigger function**

Add after the state declarations. This function computes auto-fill values and opens the modal:

```typescript
const openWarmupFromConsole = () => {
  if (!activeExercise) return;

  const name = activeExercise.name;
  const lastPerf = getLastPerformance(name);
  const initialWeight = lastPerf?.weight;

  // Check if same primary muscle was already worked in this session
  let autoAbbreviated = false;
  if (matchingActiveSession) {
    const currentDef = findExercise(name);
    if (currentDef) {
      const completedNames = new Set(
        matchingActiveSession.sets.map((s) => s.exerciseName),
      );
      completedNames.delete(name);
      for (const completedName of completedNames) {
        const completedDef = findExercise(completedName);
        if (completedDef && completedDef.primaryMuscle === currentDef.primaryMuscle) {
          autoAbbreviated = true;
          break;
        }
      }
    }
  }

  setWarmupProps({ exerciseName: name, initialWeight, autoAbbreviated });
  setWarmupOpen(true);
};
```

- [ ] **Step 4: Add "Warm Up" button to Live Console flex row**

In the Live Console section (around line ~881), find the flex row containing the exercise name h2 and `SyncStateIndicator`. Add the button in that row, between the exercise name div and the SyncStateIndicator:

Find:
```tsx
      <SyncStateIndicator state={syncState} />
    </div>
```

Add before `<SyncStateIndicator`:
```tsx
      {activeExercise && (
        <button
          className="ghost-btn"
          style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
          onClick={openWarmupFromConsole}
        >
          Warm Up
        </button>
      )}
```

- [ ] **Step 5: Add Modal render at bottom of component JSX**

The component returns a Fragment (`<>...</>`). Add the Modal inside the Fragment, after the `</section>` closing tag and before the workout-status-bar conditional (or at the very end before `</>`). Since Modal uses a React portal, its DOM position in JSX doesn't matter -- but placing it outside `<section>` keeps things clean:

```tsx
      <Modal open={warmupOpen} onClose={() => setWarmupOpen(false)} title="Warm-Up Calculator">
        <WarmupCalculator
          exerciseName={warmupProps.exerciseName}
          initialWeight={warmupProps.initialWeight}
          autoAbbreviated={warmupProps.autoAbbreviated}
        />
      </Modal>
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
git add web/src/components/screens/today-screen.tsx
git commit -m "feat: add warm-up calculator button to Live Console"
```

---

## Task 6: Today Screen Integration -- Standalone Card

**Files:**
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/app/globals.css`

**Key reference:** The standalone card goes between `WorkoutHeader` and the `two-col` div (~line 758), visible when `matchingActiveSession === null`.

- [ ] **Step 1: Add standalone card JSX**

Find the gap between `</WorkoutHeader>` (closing tag, around line ~758) and `<div className="two-col">`. Add:

```tsx
      {!matchingActiveSession && (
        <button
          className="surface warmup-standalone-card"
          onClick={() => {
            setWarmupProps({});
            setWarmupOpen(true);
          }}
        >
          <span className="warmup-standalone-icon">🔥</span>
          <span>Warm-Up Calculator</span>
        </button>
      )}
```

- [ ] **Step 2: Add standalone card CSS**

Append to `web/src/app/globals.css`:

```css
/* ── Warmup Standalone Card ── */
.warmup-standalone-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.8rem 1rem;
  margin-bottom: 0.75rem;
  font-family: var(--font-ui);
  font-size: 0.95rem;
  color: var(--text-0);
  cursor: pointer;
  text-align: left;
}

.warmup-standalone-icon {
  font-size: 1.2rem;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add web/src/components/screens/today-screen.tsx web/src/app/globals.css
git commit -m "feat: add standalone warm-up calculator card on today screen"
```

---

## Task 7: Final Verification

**Files:** None (read-only verification)

- [ ] **Step 1: Run all tests**

Run: `cd web && npx vitest run`
Expected: All tests pass (existing 29 + new warmup engine tests)

- [ ] **Step 2: TypeScript check**

Run: `cd web && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 3: Lint check**

Run: `cd web && npx next lint`
Expected: 0 errors (or only pre-existing warnings)

- [ ] **Step 4: Dev server smoke test**

Run: `cd web && npx next dev`
Verify in browser:
1. Today screen loads without errors
2. When no session is active, the "Warm-Up Calculator" card appears
3. Tapping the card opens the modal with empty fields
4. Entering a weight (e.g., 225) shows warm-up sets in real time
5. Settings gear toggles the rounding/percentage controls
6. Abbreviated toggle changes the output
7. Backdrop click and Escape both dismiss the modal
8. Start a workout session, select an exercise
9. "Warm Up" button appears in the Live Console
10. Tapping it opens the modal with the exercise name and weight pre-filled
11. Standalone card disappears when session is active

- [ ] **Step 5: Commit any fixes if needed, then tag complete**

If fixes were needed, commit them. Then update `docs/WORKLOG.md` with the completed feature.
