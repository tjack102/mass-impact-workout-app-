"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAccess } from "@/components/access-context";
import { PermissionBadge } from "@/components/permission-badge";
import { TemplateExerciseEditor } from "@/components/template-exercise-editor";
import { cloneProgram, type Program, type ProgramExercise } from "@/lib/program-data";
import { getProgram, resetProgram, saveProgram } from "@/lib/program-store";

function buildNewExercise(dayExercises: ProgramExercise[]): ProgramExercise {
  const nextOrder = dayExercises.reduce((max, exercise) => Math.max(max, exercise.order), 0) + 1;
  return {
    order: nextOrder,
    orderLabel: String(nextOrder),
    name: "New Exercise",
    restSeconds: 75,
    setGroups: [{ sets: 3, reps: "8-12 reps" }],
  };
}

export function TemplatesScreen() {
  const searchParams = useSearchParams();
  const { ownerPinEnabled, ownerUnlocked, unlockOwner, lockOwner } = useAccess();
  const [program, setProgram] = useState<Program>(() => getProgram());
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const initialSelectedWeek = (() => {
    const requestedWeek = Number(searchParams.get("week"));
    return Number.isFinite(requestedWeek) && requestedWeek >= 1 && requestedWeek <= program.weeks.length ? requestedWeek : 1;
  })();
  const initialSelectedDay = (() => {
    const requestedDay = Number(searchParams.get("day"));
    return Number.isFinite(requestedDay) && requestedDay >= 1 && requestedDay <= 5 ? requestedDay : 1;
  })();
  const initialSelectedExerciseIndex = (() => {
    const requestedExerciseIndex = Number(searchParams.get("exercise"));
    return Number.isFinite(requestedExerciseIndex) && requestedExerciseIndex >= 0 ? requestedExerciseIndex : 0;
  })();
  const [selectedWeek, setSelectedWeek] = useState(initialSelectedWeek);
  const [selectedDay, setSelectedDay] = useState(initialSelectedDay);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(initialSelectedExerciseIndex);

  const canEdit = !ownerPinEnabled || ownerUnlocked;
  const selectedWeekData = program.weeks.find((week) => week.weekNumber === selectedWeek);
  const selectedDayData = selectedWeekData?.days.find((day) => day.dayNumber === selectedDay);
  const selectedExercise =
    selectedDayData && selectedDayData.exercises.length > 0
      ? selectedDayData.exercises[Math.min(selectedExerciseIndex, selectedDayData.exercises.length - 1)]
      : undefined;

  function commitProgram(mutator: (draft: Program) => void) {
    setProgram((previous) => {
      const next = cloneProgram(previous);
      mutator(next);
      return saveProgram(next);
    });
  }

  function updateSelectedExercise(mutator: (exercise: ProgramExercise) => ProgramExercise) {
    commitProgram((draft) => {
      const week = draft.weeks.find((item) => item.weekNumber === selectedWeek);
      const day = week?.days.find((item) => item.dayNumber === selectedDay);
      if (!day) {
        return;
      }
      const safeIndex = Math.min(selectedExerciseIndex, day.exercises.length - 1);
      if (safeIndex < 0) {
        return;
      }
      day.exercises[safeIndex] = mutator(day.exercises[safeIndex]);
    });
  }

  function handleUnlockOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = unlockOwner(pinInput);
    if (!success) {
      setPinError("Incorrect owner PIN.");
      return;
    }
    setPinError("");
    setPinInput("");
  }

  return (
    <section className="screen">
      <header className="screen-head reveal">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-note">Coach mode for structure edits, defaults, and publish controls.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <PermissionBadge level={canEdit ? "owner" : "view"} />
          <button
            type="button"
            className="primary-btn"
            disabled={!canEdit}
            title={!canEdit ? "Unlock owner PIN" : ""}
            onClick={() => {
              if (!canEdit) {
                return;
              }
              const confirmed = window.confirm("Restore the full program back to the original Mass Impact template?");
              if (!confirmed) {
                return;
              }
              setProgram(resetProgram());
              setSelectedWeek(1);
              setSelectedDay(1);
              setSelectedExerciseIndex(0);
            }}
          >
            Restore Defaults
          </button>
        </div>
      </header>

      {ownerPinEnabled ? (
        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Owner Access
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            {ownerUnlocked ? "Coach Mode Unlocked" : "Coach Mode Locked"}
          </h2>
          {ownerUnlocked ? (
            <div style={{ marginTop: "0.7rem", display: "flex", justifyContent: "space-between", gap: "0.8rem" }}>
              <p className="page-note" style={{ margin: 0 }}>
                Template edits and publish controls are active.
              </p>
              <button type="button" className="ghost-btn" onClick={lockOwner}>
                Lock Coach Mode
              </button>
            </div>
          ) : (
            <form className="gate-form" style={{ marginTop: "0.8rem" }} onSubmit={handleUnlockOwner}>
              <label className="subtle-label" htmlFor="owner-pin-input">
                Owner PIN
              </label>
              <input
                id="owner-pin-input"
                className="gate-input"
                value={pinInput}
                onChange={(event) => {
                  setPinInput(event.target.value);
                  if (pinError) {
                    setPinError("");
                  }
                }}
                type="password"
                autoComplete="off"
                inputMode="numeric"
                placeholder="Enter owner PIN"
              />
              {pinError ? <p className="gate-error">{pinError}</p> : null}
              <button type="submit" className="ghost-btn">
                Unlock Coach Mode
              </button>
            </form>
          )}
        </article>
      ) : null}

      <section className="template-grid">
        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Week / Day Tree
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            {program.name} v1
          </h2>
          <div className="tree-list" style={{ marginTop: "0.75rem" }}>
            {program.weeks.map((week) => (
              <button
                key={week.weekNumber}
                type="button"
                className="tree-item"
                onClick={() => {
                  setSelectedWeek(week.weekNumber);
                  setSelectedDay(1);
                  setSelectedExerciseIndex(0);
                }}
                style={{
                  textAlign: "left",
                  borderColor: week.weekNumber === selectedWeek ? "var(--accent-primary)" : undefined,
                }}
              >
                Week {week.weekNumber}
              </button>
            ))}
          </div>
          <div className="tree-list" style={{ marginTop: "0.75rem" }}>
            {(selectedWeekData?.days ?? []).map((day) => (
              <button
                key={`day-${day.dayNumber}`}
                type="button"
                className="tree-item"
                onClick={() => {
                  setSelectedDay(day.dayNumber);
                  setSelectedExerciseIndex(0);
                }}
                style={{
                  textAlign: "left",
                  borderColor: day.dayNumber === selectedDay ? "var(--accent-power)" : undefined,
                }}
              >
                Day {day.dayNumber} - {day.title}
              </button>
            ))}
          </div>
        </article>

        <article className="card panel reveal">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Ordered Exercises
            </h3>
            <PermissionBadge level="partner" />
          </div>
          <div className="exercise-list" style={{ marginTop: "0.75rem" }}>
            {(selectedDayData?.exercises ?? []).map((exercise, index) => (
              <button
                key={`${selectedWeek}-${selectedDay}-${exercise.orderLabel}`}
                type="button"
                className="exercise-item"
                onClick={() => setSelectedExerciseIndex(index)}
                style={{
                  textAlign: "left",
                  borderColor: index === selectedExerciseIndex ? "var(--accent-primary)" : undefined,
                }}
              >
                <div className="exercise-line">
                  <span className="mono">{exercise.orderLabel}</span>
                  <p style={{ margin: 0 }}>{exercise.name}</p>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="ghost-btn"
              disabled={!canEdit}
              onClick={() => {
                if (!selectedDayData) {
                  return;
                }
                commitProgram((draft) => {
                  const week = draft.weeks.find((item) => item.weekNumber === selectedWeek);
                  const day = week?.days.find((item) => item.dayNumber === selectedDay);
                  if (!day) {
                    return;
                  }
                  day.exercises.push(buildNewExercise(day.exercises));
                });
                setSelectedExerciseIndex(selectedDayData.exercises.length);
              }}
            >
              Add Exercise
            </button>
            <p className="page-note" style={{ margin: 0 }}>
              Changes save instantly on this device.
            </p>
          </div>
        </article>

        <TemplateExerciseEditor
          canEdit={canEdit}
          exercise={selectedExercise}
          onNameChange={(name) =>
            updateSelectedExercise((exercise) => ({
              ...exercise,
              name,
            }))
          }
          onRestSecondsChange={(restSeconds) =>
            updateSelectedExercise((exercise) => ({
              ...exercise,
              restSeconds,
            }))
          }
          onSetGroupChange={(index, setGroup) =>
            updateSelectedExercise((exercise) => ({
              ...exercise,
              setGroups: exercise.setGroups.map((existing, existingIndex) =>
                existingIndex === index ? setGroup : existing,
              ),
            }))
          }
          onAddSetGroup={() =>
            updateSelectedExercise((exercise) => ({
              ...exercise,
              setGroups: [...exercise.setGroups, { sets: 1, reps: "8-12 reps" }],
            }))
          }
          onRemoveSetGroup={(index) =>
            updateSelectedExercise((exercise) => ({
              ...exercise,
              setGroups:
                exercise.setGroups.length <= 1
                  ? exercise.setGroups
                  : exercise.setGroups.filter((_, existingIndex) => existingIndex !== index),
            }))
          }
          onDeleteExercise={() => {
            if (!selectedDayData || !selectedExercise) {
              return;
            }
            const confirmed = window.confirm(`Delete ${selectedExercise.name}?`);
            if (!confirmed) {
              return;
            }
            commitProgram((draft) => {
              const week = draft.weeks.find((item) => item.weekNumber === selectedWeek);
              const day = week?.days.find((item) => item.dayNumber === selectedDay);
              if (!day) {
                return;
              }
              day.exercises = day.exercises.filter((_, index) => index !== selectedExerciseIndex);
            });
            setSelectedExerciseIndex((current) => Math.max(0, current - 1));
          }}
        />
      </section>
    </section>
  );
}
