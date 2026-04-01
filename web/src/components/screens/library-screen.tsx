"use client";

import { useState } from "react";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";
import { useAccess } from "@/components/access-context";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { getDaysInCycle, getDayTitle, getExercisesForDay } from "@/lib/program-registry";
import { getProgram, getProgramDay, saveProgram } from "@/lib/program-store";
import { addExerciseToDay } from "@/lib/exercise-additions";
import { setPermanentSub } from "@/lib/exercise-substitutions";
import { Modal } from "@/components/modal";
import type { ProgramExercise } from "@/lib/program-data";

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
  const { activeUser } = useAccess();
  const storedPrefs = getStoredPrefsFromLocalStorage();
  const programId = storedPrefs.profiles[activeUser]?.selectedProgram ?? "mass-impact";
  const daysInCycle = getDaysInCycle(programId);
  const isMassImpact = programId === "mass-impact";

  const [addTarget, setAddTarget] = useState<ExerciseDefinition | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addAction, setAddAction] = useState<"append" | "replace" | null>(null);

  function handleAppend() {
    if (!addTarget || selectedDay === null) return;
    if (isMassImpact) {
      const program = getProgram();
      if (program) {
        const day = getProgramDay(program, storedPrefs.profiles[activeUser]?.currentWeek ?? 1, selectedDay);
        if (day) {
          const nextOrder = day.exercises.length + 1;
          day.exercises.push({
            order: nextOrder,
            orderLabel: String(nextOrder),
            name: addTarget.name,
            setGroups: [{ sets: 3, reps: "8-12 reps" }],
          });
          saveProgram(program);
        }
      }
    } else {
      const dayExercises = getExercisesForDay(programId, selectedDay, storedPrefs.profiles[activeUser]?.currentWeek ?? 1);
      const nextOrder = dayExercises.length + 1;
      const newExercise: ProgramExercise = {
        order: nextOrder,
        orderLabel: String(nextOrder),
        name: addTarget.name,
        setGroups: [{ sets: 3, reps: "8-12 reps" }],
      };
      addExerciseToDay(activeUser, programId, selectedDay, newExercise);
    }
    setAddTarget(null);
    setSelectedDay(null);
  }

  function handleReplace(originalName: string) {
    if (!addTarget || selectedDay === null) return;
    setPermanentSub(activeUser, programId, selectedDay, originalName, addTarget.name);
    setAddTarget(null);
    setSelectedDay(null);
    setAddAction(null);
  }

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

      {/* Day picker */}
      {addTarget && !selectedDay && (
        <Modal open onClose={() => setAddTarget(null)} title={`Add ${addTarget.name}`}>
          <div style={{ padding: "1rem" }}>
            <p className="page-note" style={{ marginBottom: "0.75rem" }}>Which day?</p>
            {Array.from({ length: daysInCycle }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                className="picker-row"
                onClick={() => setSelectedDay(day)}
              >
                {getDayTitle(programId, day)}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Action picker: append or replace */}
      {addTarget && selectedDay && !addAction && (
        <Modal open onClose={() => { setSelectedDay(null); setAddTarget(null); }} title="How to add?">
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button type="button" className="ghost-btn" onClick={() => handleAppend()}>
              Add to end
            </button>
            <button type="button" className="ghost-btn" onClick={() => setAddAction("replace")}>
              Replace an exercise
            </button>
          </div>
        </Modal>
      )}

      {/* Replace exercise picker */}
      {addTarget && selectedDay && addAction === "replace" && (
        <Modal open onClose={() => { setAddAction(null); setSelectedDay(null); setAddTarget(null); }} title="Replace which exercise?">
          <div style={{ padding: "1rem" }}>
            {getExercisesForDay(programId, selectedDay, storedPrefs.profiles[activeUser]?.currentWeek ?? 1).map((ex) => (
              <button
                key={ex.name}
                type="button"
                className="picker-row"
                onClick={() => handleReplace(ex.name)}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
