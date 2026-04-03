"use client";

import { useState } from "react";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import type { ExerciseDefinition, MuscleGroup } from "@/lib/types";
import { ExternalLink, Pencil, Plus, ChevronRight, ChevronDown } from "@/components/icons";
import { useAccess } from "@/components/access-context";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { getDaysInCycle, getDayTitle, getExercisesForDay } from "@/lib/program-registry";
import { getProgram, getProgramDay, saveProgram } from "@/lib/program-store";
import { addExerciseToDay } from "@/lib/exercise-additions";
import { setPermanentSub } from "@/lib/exercise-substitutions";
import { getExerciseUrl, setExerciseUrl, clearExerciseUrl } from "@/lib/exercise-url-store";
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

function ExerciseRow({ exercise, onAdd, onEditUrl }: { exercise: ExerciseDefinition; onAdd: () => void; onEditUrl: (name: string) => void }) {
  const url = getExerciseUrl(exercise.name);
  return (
    <div className="library-row">
      <div className="library-row-info">
        <span className="library-row-name">{exercise.name}</span>
        <span className="picker-row-tags">
          <span className="picker-pill">{exercise.equipment.replace("_", " ")}</span>
          <span className="picker-pill">{exercise.type}</span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="picker-exrx picker-exrx--active"
              onClick={(e) => e.stopPropagation()}
              aria-label="View demo video"
            >
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
          <button
            type="button"
            className={`picker-exrx-edit${url ? " has-url" : ""}`}
            onClick={(e) => { e.stopPropagation(); onEditUrl(exercise.name); }}
            aria-label={url ? "Edit exercise URL" : "Add exercise URL"}
          >
            {url ? <Pencil size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
          </button>
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
  search,
  onAdd,
  onEditUrl,
}: {
  label: string;
  muscle: MuscleGroup;
  search: string;
  onAdd: (exercise: ExerciseDefinition) => void;
  onEditUrl: (name: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const query = search.toLowerCase();
  const exercises = EXERCISE_LIBRARY.filter((e) =>
    e.primaryMuscle === muscle && (e.tier === "S" || e.tier === "A") &&
    (!query || e.name.toLowerCase().includes(query))
  );
  const sTier = exercises.filter((e) => e.tier === "S").sort((a, b) => a.name.localeCompare(b.name));
  const aTier = exercises.filter((e) => e.tier === "A").sort((a, b) => a.name.localeCompare(b.name));

  if (exercises.length === 0) return null;

  return (
    <section className="library-section">
      <button
        type="button"
        className="library-section-header"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${label} section`}
      >
        <h2>{label}</h2>
        <span className="library-chevron">{collapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}</span>
      </button>
      {!collapsed && (
        <div className="library-section-body">
          {sTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-s">S TIER</h3>
              {sTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} onEditUrl={onEditUrl} />
              ))}
            </>
          )}
          {aTier.length > 0 && (
            <>
              <h3 className="picker-tier-header picker-tier-a">A TIER</h3>
              {aTier.map((e) => (
                <ExerciseRow key={e.id} exercise={e} onAdd={() => onAdd(e)} onEditUrl={onEditUrl} />
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
  const [urlEditName, setUrlEditName] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlVersion, setUrlVersion] = useState(0); // bump to re-render after URL save
  const [search, setSearch] = useState("");

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
      <input
        aria-label="Search exercises"
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        className="library-search"
      />
      {MUSCLE_SECTIONS.map(({ muscle, label }) => (
        <MuscleSection
          key={`${muscle}-${urlVersion}`}
          label={label}
          muscle={muscle}
          search={search}
          onAdd={(exercise) => setAddTarget(exercise)}
          onEditUrl={(name) => { setUrlEditName(name); setUrlDraft(getExerciseUrl(name) ?? ""); }}
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
                aria-label={`Select ${getDayTitle(programId, day)}`}
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
            <button type="button" className="ghost-btn" onClick={() => handleAppend()} aria-label="Add exercise to end of day">
              Add to end
            </button>
            <button type="button" className="ghost-btn" onClick={() => setAddAction("replace")} aria-label="Replace an existing exercise">
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
                aria-label={`Replace ${ex.name}`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* URL editor modal */}
      {urlEditName && (
        <Modal open onClose={() => setUrlEditName(null)} title={`Demo Link: ${urlEditName}`}>
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              aria-label="Exercise demo URL"
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="Paste YouTube or ExRx URL..."
              autoFocus
              style={{
                background: "var(--bg-1)",
                border: "1px solid var(--border)",
                color: "var(--text-0)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-ui)",
                padding: "10px 12px",
                width: "100%",
                fontSize: "0.9rem",
              }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="ghost-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  if (urlDraft.trim()) {
                    setExerciseUrl(urlEditName, urlDraft.trim());
                  }
                  setUrlEditName(null);
                  setUrlVersion((v) => v + 1);
                }}
                aria-label="Save demo URL"
              >
                Save
              </button>
              {getExerciseUrl(urlEditName) && (
                <button
                  type="button"
                  className="ghost-btn"
                  style={{ color: "var(--text-muted)" }}
                  onClick={() => {
                    clearExerciseUrl(urlEditName);
                    setUrlEditName(null);
                    setUrlVersion((v) => v + 1);
                  }}
                  aria-label="Remove demo URL"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
