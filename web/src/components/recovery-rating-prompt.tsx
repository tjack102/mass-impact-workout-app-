"use client";

import { useState } from "react";
import type { MuscleGroup } from "@/lib/types";

interface RecoveryRatingPromptProps {
  musclesTrained: MuscleGroup[];
  onSubmit: (ratings: Partial<Record<MuscleGroup, number>>) => void;
  onSkip: () => void;
}

const RATING_OPTIONS = [-2, -1, 0, 1, 2] as const;

// Convert snake_case muscle keys to Title Case for display
function formatMuscleName(muscle: MuscleGroup): string {
  return muscle
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function RecoveryRatingPrompt({
  musclesTrained,
  onSubmit,
  onSkip,
}: RecoveryRatingPromptProps) {
  // Initialize all trained muscles to 0 (neutral)
  const [ratings, setRatings] = useState<Partial<Record<MuscleGroup, number>>>(
    () => Object.fromEntries(musclesTrained.map((m) => [m, 0])),
  );

  function handleRatingChange(muscle: MuscleGroup, value: number) {
    setRatings((prev) => ({ ...prev, [muscle]: value }));
  }

  function handleSubmit() {
    onSubmit(ratings);
  }

  if (musclesTrained.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem 1.25rem 1rem",
        marginBottom: "1rem",
      }}
    >
      <p className="subtle-label" style={{ margin: 0 }}>
        Post-Workout
      </p>
      <h3
        className="section-title"
        style={{ marginTop: "0.25rem", marginBottom: "0.1rem" }}
      >
        Recovery Rating
      </h3>
      <p
        className="page-note"
        style={{ marginTop: "0.25rem", marginBottom: "1rem" }}
      >
        How well did each muscle recover? Rate soreness / readiness on a -2 to
        +2 scale.
      </p>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
      >
        {/* Column headers — only shown once above the rows */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span />
          <div
            style={{
              display: "flex",
              gap: "0.3rem",
              justifyContent: "flex-end",
            }}
          >
            {RATING_OPTIONS.map((val) => (
              <span
                key={val}
                style={{
                  width: "36px",
                  textAlign: "center",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-2)",
                }}
              >
                {val > 0 ? `+${val}` : val}
              </span>
            ))}
          </div>
        </div>

        {musclesTrained.map((muscle) => {
          const selected = ratings[muscle] ?? 0;
          return (
            <div
              key={muscle}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  color: "var(--text-1)",
                  fontSize: "0.9rem",
                }}
              >
                {formatMuscleName(muscle)}
              </span>
              <div style={{ display: "flex", gap: "0.3rem" }}>
                {RATING_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleRatingChange(muscle, val)}
                    style={{
                      width: "36px",
                      height: "28px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background:
                        selected === val
                          ? "var(--accent-primary)"
                          : "var(--bg-2)",
                      color:
                        selected === val ? "var(--bg-0)" : "var(--text-2)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      // Slightly stronger contrast on the negative end
                      fontWeight: selected === val ? 700 : 400,
                      transition: "background 0.12s, color 0.12s",
                    }}
                    aria-pressed={selected === val}
                    aria-label={`${formatMuscleName(muscle)} recovery ${val > 0 ? `+${val}` : val}`}
                  >
                    {val > 0 ? `+${val}` : val}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.55rem",
          justifyContent: "flex-end",
          marginTop: "1.1rem",
        }}
      >
        <button type="button" className="ghost-btn" onClick={onSkip}>
          Skip
        </button>
        <button type="button" className="ghost-btn" onClick={handleSubmit}>
          Save Ratings
        </button>
      </div>
    </section>
  );
}
