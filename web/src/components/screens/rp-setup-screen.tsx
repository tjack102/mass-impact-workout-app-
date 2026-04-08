"use client";

import { useState, useMemo } from "react";
import type { RpMesoType, RpProgramState, RpExerciseSlot } from "@/lib/rp-types";
import { getRpExercisesForCategory } from "@/lib/rp-exercise-library";
import { estimateTenRepMax, getRirTarget, getMesoRestSeconds } from "@/lib/rp-engine";
import { getRpExercisesForDay, getRpTemplate } from "@/lib/program-registry";
import type { RpTemplate } from "@/lib/rp-types";

const MESO_OPTIONS: RpMesoType[] = ["basic", "metabolite", "resensitization"];

interface RpSetupScreenProps {
  templateId: string;
  meso: RpMesoType;
  carryForward?: Record<string, { exerciseName: string; tenRepMax: number }>;
  onComplete: (state: RpProgramState) => void;
}

const MESO_INFO: Record<RpMesoType, { title: string; description: string }> = {
  basic: {
    title: "Mesocycle 1: Basic Hypertrophy",
    description: "Straight sets with standard rest (2-5 min). Focus on progressive overload at 85% of 10RM.",
  },
  metabolite: {
    title: "Mesocycle 2: Metabolite Focus",
    description: "Supersets with short rest (30-90s). Higher volume at 75% of 10RM. Chase the pump.",
  },
  resensitization: {
    title: "Mesocycle 3: Resensitization",
    description: "Low volume, heavy weight at 100% of 10RM. Reset muscle sensitivity for the next block.",
  },
};

export function RpSetupScreen({
  templateId,
  meso: initialMeso,
  carryForward,
  onComplete,
}: RpSetupScreenProps) {
  const template = getRpTemplate(templateId);
  if (!template) return <p>Template not found</p>;

  const t = template as RpTemplate;
  const [meso, setMeso] = useState<RpMesoType>(initialMeso);

  // State: selections keyed by slotId -> { exerciseName, tenRepMax }
  // Initialize from carryForward if provided
  const [selections, setSelections] = useState<
    Record<string, { exerciseName: string; tenRepMax: number }>
  >(() => {
    const init: Record<string, { exerciseName: string; tenRepMax: number }> = {};
    for (const slot of t.slots) {
      const carried = carryForward?.[slot.slotId];
      if (carried) {
        init[slot.slotId] = { ...carried };
      } else {
        // Default to first exercise in category, 10RM of 0
        const exercises = getRpExercisesForCategory(slot.muscleCategory);
        init[slot.slotId] = { exerciseName: exercises[0] ?? "", tenRepMax: 0 };
      }
    }
    return init;
  });

  // Estimation calculator state
  const [estimatorSlot, setEstimatorSlot] = useState<string | null>(null);
  const [estWeight, setEstWeight] = useState("");
  const [estReps, setEstReps] = useState("");

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped = new Map<number, RpExerciseSlot[]>();
    for (const slot of t.slots) {
      const arr = grouped.get(slot.dayNumber) ?? [];
      arr.push(slot);
      grouped.set(slot.dayNumber, arr);
    }
    return grouped;
  }, [t]);

  // Check if a slot is active in this meso (has baseSets[meso] > 0)
  const isSlotActive = (slot: RpExerciseSlot) => slot.baseSets[meso] > 0;

  // Check if all active slots have valid selections
  const isComplete = t.slots.every((slot) => {
    if (!isSlotActive(slot)) return true;
    const sel = selections[slot.slotId];
    return sel && sel.exerciseName;
  });

  function handleExerciseChange(slotId: string, exerciseName: string) {
    setSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        exerciseName,
        tenRepMax: prev[slotId]?.tenRepMax ?? 0,
      },
    }));
  }

  function handleTenRmChange(slotId: string, value: string) {
    const num = Number.parseInt(value, 10);
    setSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        exerciseName: prev[slotId]?.exerciseName ?? "",
        tenRepMax: Number.isNaN(num) ? 0 : num,
      },
    }));
  }

  function handleEstimate(slotId: string) {
    const w = Number.parseFloat(estWeight);
    const r = Number.parseInt(estReps, 10);
    if (Number.isNaN(w) || Number.isNaN(r) || r <= 0) return;
    const estimated = estimateTenRepMax(w, r);
    setSelections((prev) => ({
      ...prev,
      [slotId]: {
        ...prev[slotId],
        exerciseName: prev[slotId]?.exerciseName ?? "",
        tenRepMax: estimated,
      },
    }));
    setEstimatorSlot(null);
    setEstWeight("");
    setEstReps("");
  }

  function handleSubmit() {
    if (!isComplete) return;
    // Only include active slots in the final state
    const activeSelections: Record<
      string,
      { exerciseName: string; tenRepMax: number }
    > = {};
    for (const slot of t.slots) {
      if (isSlotActive(slot)) {
        activeSelections[slot.slotId] = selections[slot.slotId];
      }
    }
    const state: RpProgramState = {
      templateId,
      currentMeso: meso,
      currentWeek: 1,
      selections: activeSelections,
      ratings: [],
    };
    onComplete(state);
  }

  return (
    <section className="screen">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.8rem",
            color: "var(--accent-primary)",
            margin: 0,
          }}
        >
          {t.name}
        </h1>
        <p className="page-note" style={{ marginTop: "0.25rem" }}>
          {t.daysPerWeek} days/week -- {meso === "basic" ? "5 weeks" : meso === "metabolite" ? "5 weeks" : "3 weeks"} (incl. deload)
        </p>

        {/* Meso selector */}
        <div style={{ display: "flex", gap: "8px", marginTop: "0.75rem" }}>
          {MESO_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMeso(m)}
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-display)",
                fontSize: "0.85rem",
                fontWeight: m === meso ? 700 : 400,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                background: m === meso ? "var(--accent-primary)" : "var(--surface-high)",
                color: m === meso ? "var(--bg-0)" : "var(--text-1)",
                transition: "background 0.15s",
              }}
            >
              {m === "basic" ? "1: Basic" : m === "metabolite" ? "2: Metabolite" : "3: Resensitize"}
            </button>
          ))}
        </div>

        {/* Meso description */}
        <div style={{
          marginTop: "0.75rem",
          padding: "0.75rem",
          background: "var(--surface-mid)",
          borderRadius: "8px",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text-0)",
            margin: 0,
          }}>
            {MESO_INFO[meso].title}
          </p>
          <p className="page-note" style={{ marginTop: "0.3rem" }}>
            {MESO_INFO[meso].description}
          </p>
          <div style={{ display: "flex", gap: "16px", marginTop: "0.5rem" }}>
            <div>
              <span className="queue-card-label">RIR TARGET</span>
              <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>{getRirTarget(1, false)}</span>
            </div>
            <div>
              <span className="queue-card-label">REST</span>
              <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>
                {(() => { const r = getMesoRestSeconds(meso); return `${Math.floor(r.min / 60)}:${String(r.min % 60).padStart(2, "0")} - ${Math.floor(r.max / 60)}:${String(r.max % 60).padStart(2, "0")}`; })()}
              </span>
            </div>
            <div>
              <span className="queue-card-label">WEIGHT</span>
              <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>
                {meso === "basic" ? "85%" : meso === "metabolite" ? "75%" : "100%"} of 10RM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* For each day */}
      {Array.from(slotsByDay.entries()).map(([dayNum, slots]) => (
        <article
          key={dayNum}
          className="card panel"
          style={{ marginBottom: "1rem" }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.3rem",
              color: "var(--text-0)",
              margin: "0 0 0.75rem",
            }}
          >
            Day {dayNum}: {t.dayTitles[dayNum - 1]}
          </h2>

          {slots
            .filter(isSlotActive)
            .map((slot) => {
              const exercises = getRpExercisesForCategory(
                slot.muscleCategory,
              );
              const sel = selections[slot.slotId];

              return (
                <div
                  key={slot.slotId}
                  style={{
                    padding: "0.75rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Category label + set info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
                    <p className="subtle-label" style={{ margin: 0 }}>
                      {slot.muscleCategory}
                    </p>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      color: slot.isAutoregulated ? "var(--accent-primary)" : "var(--accent-power)",
                    }}>
                      {slot.baseSets[meso]} sets{slot.isAutoregulated ? " (auto)" : " (fixed)"}
                      {slot.supersetWith && meso === "metabolite" ? " -- superset" : ""}
                    </span>
                  </div>

                  {/* Exercise dropdown */}
                  <select
                    value={sel?.exerciseName ?? ""}
                    onChange={(e) =>
                      handleExerciseChange(slot.slotId, e.target.value)
                    }
                    style={{
                      width: "100%",
                      background: "var(--bg-1)",
                      border: "1px solid var(--border)",
                      color: "var(--text-0)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.5rem",
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.9rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {exercises.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  {/* 10RM input row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span className="subtle-label">10RM:</span>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={sel?.tenRepMax || ""}
                        onChange={(e) =>
                          handleTenRmChange(slot.slotId, e.target.value)
                        }
                        placeholder="lbs"
                        style={{
                          width: "5rem",
                          background: "var(--bg-0)",
                          border: "1px solid var(--border)",
                          color: "var(--text-0)",
                          fontFamily: "var(--font-mono)",
                          fontSize: "1rem",
                          padding: "0.3rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="ghost-btn"
                      style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem" }}
                      onClick={() => {
                        setEstimatorSlot(
                          estimatorSlot === slot.slotId ? null : slot.slotId,
                        );
                        setEstWeight("");
                        setEstReps("");
                      }}
                    >
                      {estimatorSlot === slot.slotId ? "Close" : "Estimate"}
                    </button>
                  </div>

                  {/* Estimation calculator (collapsible) */}
                  {estimatorSlot === slot.slotId && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        padding: "0.6rem",
                        background: "var(--bg-2)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p
                        className="subtle-label"
                        style={{ marginBottom: "0.4rem" }}
                      >
                        Enter a known weight + reps to estimate 10RM
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <label
                          className="flex flex-col"
                          style={{ gap: "0.15rem" }}
                        >
                          <span
                            className="subtle-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Weight (lbs)
                          </span>
                          <input
                            type="number"
                            value={estWeight}
                            onChange={(e) => setEstWeight(e.target.value)}
                            style={{
                              width: "5rem",
                              background: "var(--bg-0)",
                              border: "1px solid var(--border)",
                              color: "var(--text-0)",
                              fontFamily: "var(--font-mono)",
                              fontSize: "1rem",
                              padding: "0.3rem 0.5rem",
                              borderRadius: "var(--radius-sm)",
                            }}
                          />
                        </label>
                        <label
                          className="flex flex-col"
                          style={{ gap: "0.15rem" }}
                        >
                          <span
                            className="subtle-label"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Reps
                          </span>
                          <input
                            type="number"
                            value={estReps}
                            onChange={(e) => setEstReps(e.target.value)}
                            style={{
                              width: "4rem",
                              background: "var(--bg-0)",
                              border: "1px solid var(--border)",
                              color: "var(--text-0)",
                              fontFamily: "var(--font-mono)",
                              fontSize: "1rem",
                              padding: "0.3rem 0.5rem",
                              borderRadius: "var(--radius-sm)",
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => handleEstimate(slot.slotId)}
                        >
                          Calculate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </article>
      ))}

      {/* Week 1 Preview -- appears when all 10RMs are entered */}
      {isComplete && (
        <article className="card panel" style={{ marginTop: "1rem" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.2rem",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--accent-primary)",
            margin: "0 0 0.75rem",
            letterSpacing: "0.02em",
          }}>
            Week 1 Preview
          </h2>
          <p className="page-note" style={{ marginBottom: "0.75rem" }}>
            Verify your weights look right before starting.
          </p>
          {Array.from(slotsByDay.entries()).map(([dayNum, slots]) => {
            // Build temporary state to calculate Week 1 exercises
            const tempState: RpProgramState = {
              templateId,
              currentMeso: meso,
              currentWeek: 1,
              selections,
              ratings: [],
            };
            const dayExercises = getRpExercisesForDay(templateId, dayNum, tempState);
            if (dayExercises.length === 0) return null;

            return (
              <div key={dayNum} style={{ marginBottom: "1rem" }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  color: "var(--text-0)",
                  margin: "0 0 0.5rem",
                }}>
                  Day {dayNum}: {t.dayTitles[dayNum - 1]}
                </h3>
                {dayExercises.map((ex, i) => (
                  <div key={`${dayNum}-${i}`} style={{
                    display: "flex",
                    gap: "16px",
                    padding: "0.4rem 0",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    color: "var(--text-1)",
                  }}>
                    <span style={{ color: "var(--text-0)", minWidth: "40%" }}>{ex.name}</span>
                    <span>{ex.prescribedWeight} lbs</span>
                    <span>{ex.setGroups[0]?.sets} sets</span>
                    <span style={{ color: "var(--accent-power)" }}>{ex.rirTarget}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </article>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={!isComplete}
        onClick={handleSubmit}
        style={{
          width: "100%",
          padding: "0.85rem",
          background: isComplete
            ? "var(--accent-primary)"
            : "var(--bg-2)",
          color: isComplete
            ? "var(--bg-0)"
            : "var(--text-1)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-display)",
          fontSize: "1.3rem",
          cursor: isComplete ? "pointer" : "not-allowed",
          marginTop: "0.5rem",
        }}
      >
        Start Mesocycle
      </button>
    </section>
  );
}
