"use client";

import { useState } from "react";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";

const MUSCLE_SECTIONS: { muscle: MuscleGroup; label: string }[] = [
  { muscle: "chest", label: "Chest" },
  { muscle: "back", label: "Back" },
  { muscle: "quads", label: "Quads" },
  { muscle: "hamstrings", label: "Hamstrings" },
  { muscle: "glutes", label: "Glutes" },
  { muscle: "side_delts", label: "Side Delts" },
  { muscle: "rear_delts", label: "Rear Delts" },
  { muscle: "front_delts", label: "Front Delts" },
  { muscle: "biceps", label: "Biceps" },
  { muscle: "triceps", label: "Triceps" },
  { muscle: "traps", label: "Traps" },
  { muscle: "calves", label: "Calves" },
  { muscle: "abs", label: "Abs" },
  { muscle: "forearms", label: "Forearms" },
];

function ExerciseRow({ exercise, onAdd }: { exercise: ExerciseDefinition; onAdd: () => void }) {
  return (
    <div className="library-row">
      <div className="library-row-info">
        <span className="library-row-name">{exercise.name}</span>
        <span className="picker-row-tags">
          <span className="picker-pill">{exercise.equipment.replace("_", " ")}</span>
          <span className="picker-pill">{exercise.type}</span>
          {exercise.exrxUrl && (
            <a
              href={exercise.exrxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="picker-exrx"
              onClick={(e) => e.stopPropagation()}
              aria-label={`ExRx page for ${exercise.name}`}
            >
              ↗
            </a>
          )}
        </span>
      </div>
      <button type="button" className="ghost-btn library-add-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
  );
}

function MuscleSection({
  label,
  muscle,
  onAdd,
}: {
  label: string;
  muscle: MuscleGroup;
  onAdd: (exercise: ExerciseDefinition) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const exercises = EXERCISE_LIBRARY.filter((e) => e.primaryMuscle === muscle && (e.tier === "S" || e.tier === "A"));
  const sTier = exercises.filter((e) => e.tier === "S").sort((a, b) => a.name.localeCompare(b.name));
  const aTier = exercises.filter((e) => e.tier === "A").sort((a, b) => a.name.localeCompare(b.name));

  if (exercises.length === 0) return null;

  return (
    <section className="library-section">
      <button
        type="button"
        className="library-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <h2>{label}</h2>
        <span className="library-chevron">{collapsed ? "▸" : "▾"}</span>
      </button>
      {!collapsed && (
        <div className="library-section-body">
          {sTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-s">S TIER</h3>
              {sTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} />
              ))}
            </>
          )}
          {aTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-a">A TIER</h3>
              {aTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}

export function LibraryScreen() {
  // Add-to-routine state will be wired in Task 9
  const [, setAddTarget] = useState<ExerciseDefinition | null>(null);

  return (
    <div className="screen-container">
      <h1 className="page-title">Exercise Library</h1>
      {MUSCLE_SECTIONS.map(({ muscle, label }) => (
        <MuscleSection
          key={muscle}
          label={label}
          muscle={muscle}
          onAdd={(exercise) => setAddTarget(exercise)}
        />
      ))}
    </div>
  );
}
