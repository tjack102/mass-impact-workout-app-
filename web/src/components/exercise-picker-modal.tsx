"use client";

import { useMemo, useState } from "react";
import { Modal } from "./modal";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";

type ExercisePickerModalProps = {
  open: boolean;
  muscleGroup?: MuscleGroup;
  onSelect: (exercise: ExerciseDefinition) => void;
  onClose: () => void;
  title?: string;
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  side_delts: "Side Delts",
  rear_delts: "Rear Delts",
  front_delts: "Front Delts",
  biceps: "Biceps",
  triceps: "Triceps",
  traps: "Traps",
  calves: "Calves",
  abs: "Abs",
  forearms: "Forearms",
  neck: "Neck",
};

export function ExercisePickerModal({
  open,
  muscleGroup,
  onSelect,
  onClose,
  title,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState("");

  const modalTitle = title ?? (muscleGroup ? `${MUSCLE_LABELS[muscleGroup]} Exercises` : "All Exercises");

  const filtered = useMemo(() => {
    let exercises = EXERCISE_LIBRARY.filter((e) => e.tier === "S" || e.tier === "A");
    if (muscleGroup) {
      exercises = exercises.filter((e) => e.primaryMuscle === muscleGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      exercises = exercises.filter((e) => e.name.toLowerCase().includes(q));
    }
    return exercises;
  }, [muscleGroup, search]);

  const sTier = filtered.filter((e) => e.tier === "S").sort((a, b) => a.name.localeCompare(b.name));
  const aTier = filtered.filter((e) => e.tier === "A").sort((a, b) => a.name.localeCompare(b.name));

  function renderRow(exercise: ExerciseDefinition) {
    return (
      <button
        key={exercise.id}
        type="button"
        className="picker-row"
        onClick={() => { onSelect(exercise); }}
      >
        <span className="picker-row-name">{exercise.name}</span>
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
      </button>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={modalTitle}>
      <div className="picker-search-wrap">
        <input
          type="text"
          className="picker-search"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="picker-body">
        {sTier.length > 0 && (
          <>
            <h3 className="picker-tier-header picker-tier-s">S TIER</h3>
            {sTier.map(renderRow)}
          </>
        )}
        {aTier.length > 0 && (
          <>
            <h3 className="picker-tier-header picker-tier-a">A TIER</h3>
            {aTier.map(renderRow)}
          </>
        )}
        {sTier.length === 0 && aTier.length === 0 && (
          <p className="picker-empty">No exercises found.</p>
        )}
      </div>
    </Modal>
  );
}
