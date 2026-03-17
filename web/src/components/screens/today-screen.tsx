"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/components/access-context";
import {
  ExerciseTemplateInlineEditor,
  type ExerciseTemplateDraft,
} from "@/components/exercise-template-inline-editor";
import { ExerciseQueueCard } from "@/components/exercise-queue-card";
import type { SetDraft } from "@/components/set-entry-row";
import { SetEntryRow } from "@/components/set-entry-row";
import { RestTimerDial } from "@/components/rest-timer-dial";
import { SessionStatPill } from "@/components/session-stat-pill";
import { SyncStateIndicator } from "@/components/sync-state-indicator";
import { WorkoutHeader } from "@/components/workout-header";
import type { ProgramExercise } from "@/lib/program-data";
import { formatScheme, getRestSecondsForExercise, getTotalSets } from "@/lib/program-data";
import { getProgram, getProgramDay, saveProgram } from "@/lib/program-store";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import {
  getExercisesForDay,
  getDayTitle,
  getDaysInCycle,
  getProgramMeta,
} from "@/lib/program-registry";
import {
  completeSession,
  getActiveSession,
  getAllSessions,
  getPrefs,
  logSet,
  saveActiveSession,
  savePrefs,
  startSession,
  type LoggedSet,
  type UserPrefs,
  type WorkoutSession,
} from "@/lib/workout-store";
import { RecoveryRatingPrompt } from "@/components/recovery-rating-prompt";
import { findExercise } from "@/lib/exercise-library";
import { TRACKED_MUSCLES, type MuscleGroup } from "@/lib/types";
import { saveRecoveryRating } from "@/lib/volume-store";

type SessionStatus = "Not Started" | "In Progress" | "Completed";

type ExerciseSummary = {
  name: string;
  elapsedSeconds: number;
  restSeconds: number;
  activeSeconds: number;
};

type QueueExercise = {
  id: string;
  orderLabel: string;
  name: string;
  scheme: string;
  lastPerformance: string;
  targetSets: number;
  completedSets: number;
  restTargetSeconds: number;
  track: "his" | "hers";
  supersetGroup?: string;
};

function buildTemplateDraft(exercise?: ProgramExercise): ExerciseTemplateDraft {
  return {
    name: exercise?.name ?? "",
    setGroups: exercise?.setGroups.map((group) => ({ ...group })) ?? [{ sets: 1, reps: "8-12 reps" }],
  };
}

// Parse the upper bound of a rep range string like "8-12", "8-12 reps", "12", "12 reps"
function parseRepCeiling(repsStr: string): number | null {
  const match = repsStr.match(/(\d+)\s*(?:reps?)?$/i);
  if (!match) return null;
  // If there's a dash range (e.g. "8-12"), the last number is the ceiling
  return Number.parseInt(match[1], 10);
}

// Returns true when every logged set for this exercise hit the top of the rep range.
// False if no sets logged yet.
function isRepCeilingHit(exercise: ProgramExercise, loggedSets: LoggedSet[]): boolean {
  if (loggedSets.length === 0) return false;
  const repsStr = exercise.setGroups[0]?.reps ?? "";
  const ceiling = parseRepCeiling(repsStr);
  if (ceiling === null) return false;
  return loggedSets.every((set) => set.reps >= ceiling);
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatLastSet(set?: LoggedSet) {
  if (!set) {
    return "none yet";
  }
  return `${set.weight} x ${set.reps}`;
}

function formatSetTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLastPerformanceFromSessions(sessions: WorkoutSession[], exerciseName: string) {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const sets = sessions[index].sets.filter((set) => set.exerciseName === exerciseName);
    if (sets.length > 0) {
      return sets.reduce((best, set) => (set.weight > best.weight ? set : best), sets[0]);
    }
  }
  return undefined;
}

function shiftWeekDay(currentWeek: number, currentDay: number, step: 1 | -1, daysPerCycle: number, totalWeeks: number) {
  let week = currentWeek;
  let day = currentDay + step;

  if (day > daysPerCycle) {
    day = 1;
    week = week >= totalWeeks ? 1 : week + 1;
  } else if (day < 1) {
    day = daysPerCycle;
    week = week <= 1 ? totalWeeks : week - 1;
  }

  return { week, day };
}

function clampDayPrefs(prefs: UserPrefs, daysPerCycle: number, totalWeeks: number): UserPrefs {
  return {
    ...prefs,
    currentWeek: Math.min(totalWeeks, Math.max(1, prefs.currentWeek)),
    currentDay: Math.min(daysPerCycle, Math.max(1, prefs.currentDay)),
  };
}

export function TodayScreen() {
  const router = useRouter();
  const { ownerPinEnabled, ownerUnlocked, activeUser } = useAccess();

  // Read selectedProgram for the active profile
  const storedPrefs = getStoredPrefsFromLocalStorage();
  const programId = storedPrefs.profiles[storedPrefs.activeUser]?.selectedProgram ?? "mass-impact";
  const programMeta = getProgramMeta(programId);
  const daysPerCycle = getDaysInCycle(programId);
  // For ongoing programs (cycleLength = 0), use 52 as a reasonable upper bound
  const totalWeeks = programMeta && programMeta.cycleLength > 0 ? programMeta.cycleLength : 52;

  const canEditTemplate = (!ownerPinEnabled || ownerUnlocked) && programId === "mass-impact";
  const [program, setProgram] = useState(() => getProgram());
  const [prefs, setPrefs] = useState<UserPrefs>(() => clampDayPrefs(getPrefs(), daysPerCycle, totalWeeks));
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() => getActiveSession());
  const [sessionHistory, setSessionHistory] = useState<WorkoutSession[]>(() => getAllSessions());
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState<SetDraft>({ weight: "", reps: "", rpe: "" });
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<ExerciseTemplateDraft>(buildTemplateDraft());
  const [saveFlash, setSaveFlash] = useState(false);
  const [syncState, setSyncState] = useState<"synced" | "pending" | "retrying">("synced");
  const [targetSeconds, setTargetSeconds] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [targetReached, setTargetReached] = useState(false);
  const [exerciseStartedAt, setExerciseStartedAt] = useState<number | null>(null);
  const [exerciseRestSeconds, setExerciseRestSeconds] = useState(0);
  const [workoutRestSeconds, setWorkoutRestSeconds] = useState(0);
  const [exerciseSummary, setExerciseSummary] = useState<ExerciseSummary | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);
  // Captures session data when "Finish Workout" is tapped, before actually completing the session.
  // This lets the recovery prompt read the sets without the session being nulled out.
  const [pendingCompletion, setPendingCompletion] = useState<{ sessionId: string; sets: LoggedSet[] } | null>(null);
  // Override editor state — inline form shown when user taps the scheme text
  const [overrideEditorOpen, setOverrideEditorOpen] = useState(false);
  const [overrideDraftSets, setOverrideDraftSets] = useState("");
  const [overrideDraftReps, setOverrideDraftReps] = useState("");
  const flashTimeout = useRef<number | null>(null);
  const restStartedAtRef = useRef<number | null>(null);
  const restTargetRef = useRef<number>(90);

  // Mass Impact uses program-store (preserves user template edits); all others use registry
  const programDay = programId === "mass-impact" ? getProgramDay(program, prefs.currentWeek, prefs.currentDay) : null;
  const exercises = useMemo<ProgramExercise[]>(() => {
    if (programId === "mass-impact") {
      return programDay?.exercises ?? [];
    }
    return getExercisesForDay(programId, prefs.currentDay, prefs.currentWeek);
  }, [programId, programDay, prefs.currentDay, prefs.currentWeek]);

  const matchingActiveSession =
    activeSession && activeSession.weekNumber === prefs.currentWeek && activeSession.dayNumber === prefs.currentDay
      ? activeSession
      : null;

  const dayCompleted = useMemo(
    () =>
      sessionHistory.some(
        (session) =>
          session.weekNumber === prefs.currentWeek &&
          session.dayNumber === prefs.currentDay &&
          Boolean(session.completedAt),
      ),
    [prefs.currentDay, prefs.currentWeek, sessionHistory],
  );

  const sessionStatus: SessionStatus = matchingActiveSession
    ? "In Progress"
    : dayCompleted
      ? "Completed"
      : "Not Started";

  const queueExercises = useMemo<QueueExercise[]>(() => {
    return exercises.map((exercise, index) => {
      const completedSets = matchingActiveSession
        ? matchingActiveSession.sets.filter((set) => set.exerciseName === exercise.name).length
        : 0;
      const lastPerformance = getLastPerformanceFromSessions(sessionHistory, exercise.name);

      // Apply session-only override if present for this exercise
      const override = matchingActiveSession?.overrides?.[exercise.name];
      const effectiveSets = override?.sets ?? getTotalSets(exercise);
      const effectiveScheme = override
        ? `${override.sets ?? getTotalSets(exercise)} x ${override.reps ?? exercise.setGroups[0]?.reps ?? "?"}`
        : formatScheme(exercise);

      return {
        id: `${prefs.currentWeek}-${prefs.currentDay}-${exercise.orderLabel}-${index}`,
        orderLabel: exercise.orderLabel,
        name: exercise.name,
        scheme: effectiveScheme,
        lastPerformance: formatLastSet(lastPerformance),
        targetSets: effectiveSets,
        completedSets,
        restTargetSeconds: getRestSecondsForExercise(exercise),
        track: prefs.activeUser,
        supersetGroup: exercise.supersetGroup,
      };
    });
  }, [exercises, matchingActiveSession, prefs.activeUser, prefs.currentDay, prefs.currentWeek, sessionHistory]);

  const safeActiveIndex =
    queueExercises.length === 0 ? 0 : Math.min(activeIndex, Math.max(0, queueExercises.length - 1));
  const activeExercise = queueExercises[safeActiveIndex];
  // Only used for template editing, which is Mass Impact-only
  const activeProgramExercise = exercises[safeActiveIndex];
  const activeExerciseSets = useMemo(
    () =>
      !matchingActiveSession || !activeExercise
        ? []
        : matchingActiveSession.sets.filter((set) => set.exerciseName === activeExercise.name),
    [activeExercise, matchingActiveSession],
  );
  const lastSet = activeExerciseSets[activeExerciseSets.length - 1];

  const finalizeRest = useCallback(() => {
    if (restStartedAtRef.current == null) {
      return;
    }
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - restStartedAtRef.current) / 1000));
    const loggedSeconds = Math.min(elapsedSeconds, restTargetRef.current);
    restStartedAtRef.current = null;
    if (loggedSeconds > 0) {
      setExerciseRestSeconds((prev) => prev + loggedSeconds);
      setWorkoutRestSeconds((prev) => prev + loggedSeconds);
    }
  }, []);

  const stopTimer = useCallback(() => {
    finalizeRest();
    setTimerRunning(false);
    setTargetReached(false);
    setRemainingSeconds(0);
  }, [finalizeRest]);

  const setTimerTarget = useCallback(
    (seconds: number) => {
      const nextTarget = Math.max(0, seconds);
      restTargetRef.current = nextTarget;

      if (timerRunning) {
        const elapsed = Math.max(0, targetSeconds - remainingSeconds);
        const nextRemaining = Math.max(0, nextTarget - elapsed);
        setTargetSeconds(nextTarget);
        setRemainingSeconds(nextRemaining);

        if (nextRemaining === 0) {
          finalizeRest();
          setTimerRunning(false);
          setTargetReached(true);
          return;
        }

        setTargetReached(false);
        return;
      }

      setTargetSeconds(nextTarget);
      setRemainingSeconds(nextTarget);
      setTargetReached(false);
    },
    [finalizeRest, remainingSeconds, targetSeconds, timerRunning],
  );

  const startTimer = useCallback(
    (seconds: number) => {
      finalizeRest();
      if (seconds <= 0) {
        restTargetRef.current = 0;
        setTargetSeconds(0);
        setRemainingSeconds(0);
        setTimerRunning(false);
        setTargetReached(true);
        return;
      }
      restTargetRef.current = seconds;
      restStartedAtRef.current = Date.now();
      setTargetSeconds(seconds);
      setRemainingSeconds(seconds);
      setTimerRunning(true);
      setTargetReached(false);
    },
    [finalizeRest],
  );

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          finalizeRest();
          setTimerRunning(false);
          setTargetReached(true);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(120);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [finalizeRest, timerRunning]);

  useEffect(() => {
    return () => {
      if (flashTimeout.current) {
        window.clearTimeout(flashTimeout.current);
      }
      finalizeRest();
    };
  }, [finalizeRest]);

  const workoutElapsedSeconds = useMemo(() => {
    if (nowMs == null || !matchingActiveSession) {
      return 0;
    }
    return Math.max(0, Math.round((nowMs - matchingActiveSession.startedAt) / 1000));
  }, [matchingActiveSession, nowMs]);

  const ensureActiveSession = useCallback(() => {
    if (matchingActiveSession) {
      return matchingActiveSession;
    }
    const session = startSession(prefs.currentWeek, prefs.currentDay, undefined, programId);
    setActiveSession(session);
    setNowMs(Date.now());
    setExerciseStartedAt(Date.now());
    setExerciseRestSeconds(0);
    return session;
  }, [matchingActiveSession, prefs.currentDay, prefs.currentWeek, programId]);

  const persistPrefs = useCallback(
    (nextWeek: number, nextDay: number) => {
      const updated = savePrefs({ currentWeek: nextWeek, currentDay: nextDay });
      setPrefs(updated);
    },
    [setPrefs],
  );

  const applyDaySelection = useCallback(
    (nextWeek: number, nextDay: number) => {
      persistPrefs(nextWeek, nextDay);
      setActiveSession(getActiveSession());
      setSessionHistory(getAllSessions());
      setActiveIndex(0);
      setExerciseSummary(null);
      setDraft({ weight: "", reps: "", rpe: "" });
      setExerciseStartedAt(null);
      setExerciseRestSeconds(0);
      setTemplateEditorOpen(false);
      setOverrideEditorOpen(false);
      stopTimer();

      // Get first exercise for the next day to pre-set the template draft and rest timer
      let firstExercise: ProgramExercise | undefined;
      if (programId === "mass-impact") {
        firstExercise = getProgramDay(program, nextWeek, nextDay)?.exercises[0];
      } else {
        firstExercise = getExercisesForDay(programId, nextDay, nextWeek)[0];
      }
      setTemplateDraft(buildTemplateDraft(firstExercise));
      const nextRest = firstExercise ? getRestSecondsForExercise(firstExercise) : 90;
      setTimerTarget(nextRest);
    },
    [persistPrefs, program, programId, setTimerTarget, stopTimer],
  );

  const handleShiftDay = useCallback(
    (step: 1 | -1) => {
      const shifted = shiftWeekDay(prefs.currentWeek, prefs.currentDay, step, daysPerCycle, totalWeeks);
      applyDaySelection(shifted.week, shifted.day);
    },
    [applyDaySelection, daysPerCycle, prefs.currentDay, prefs.currentWeek, totalWeeks],
  );

  const handleSelectExercise = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setExerciseStartedAt(Date.now());
      setExerciseRestSeconds(0);
      setExerciseSummary(null);
      setTemplateEditorOpen(false);
      setOverrideEditorOpen(false);
      const selected = queueExercises[index];
      setTemplateDraft(buildTemplateDraft(exercises[index]));
      const rest = selected ? selected.restTargetSeconds : 90;
      stopTimer();
      setTimerTarget(rest);
    },
    [exercises, queueExercises, setTimerTarget, stopTimer],
  );

  const handleSaveSet = useCallback(() => {
    if (!activeExercise) {
      return;
    }

    const weight = Number.parseFloat(draft.weight);
    const reps = Number.parseInt(draft.reps, 10);
    const rpe = draft.rpe ? Number.parseInt(draft.rpe, 10) : undefined;
    if (Number.isNaN(weight) || Number.isNaN(reps)) {
      return;
    }

    const session = ensureActiveSession();
    const setIndex = session.sets.filter((set) => set.exerciseName === activeExercise.name).length + 1;

    setSyncState("pending");
    setSaveFlash(true);
    if (flashTimeout.current) {
      window.clearTimeout(flashTimeout.current);
    }
    flashTimeout.current = window.setTimeout(() => setSaveFlash(false), 240);

    const updated = logSet({
      exerciseName: activeExercise.name,
      setIndex,
      weight,
      reps,
      rpe,
      timestamp: Date.now(),
    });
    if (updated) {
      setActiveSession(updated);
    }
    setDraft({ weight: draft.weight, reps: draft.reps, rpe: "" });
    window.setTimeout(() => setSyncState("synced"), 520);

    // Superset behavior: if the current exercise is the "A" partner, auto-advance to the "B"
    // partner instead of starting the rest timer. Rest happens after the B set.
    const currentExercise = queueExercises[safeActiveIndex];
    if (currentExercise?.supersetGroup) {
      const isA = currentExercise.orderLabel.toUpperCase().endsWith("A");
      if (isA) {
        const bIndex = queueExercises.findIndex(
          (ex, idx) => idx > safeActiveIndex && ex.supersetGroup === currentExercise.supersetGroup
        );
        if (bIndex >= 0) {
          handleSelectExercise(bIndex);
          return;
        }
      }
    }

    startTimer(targetSeconds);
  }, [activeExercise, draft, ensureActiveSession, handleSelectExercise, queueExercises, safeActiveIndex, startTimer, targetSeconds]);

  const handleFinishExercise = useCallback(() => {
    if (!activeExercise) {
      return;
    }
    stopTimer();
    const elapsedSeconds =
      exerciseStartedAt == null ? 0 : Math.max(1, Math.round((Date.now() - exerciseStartedAt) / 1000));
    setExerciseSummary({
      name: activeExercise.name,
      elapsedSeconds,
      restSeconds: exerciseRestSeconds,
      activeSeconds: Math.max(0, elapsedSeconds - exerciseRestSeconds),
    });

    const nextIdx = queueExercises.findIndex(
      (exercise, index) => index > safeActiveIndex && exercise.completedSets < exercise.targetSets,
    );
    if (nextIdx >= 0) {
      handleSelectExercise(nextIdx);
    }
  }, [activeExercise, exerciseRestSeconds, exerciseStartedAt, handleSelectExercise, queueExercises, safeActiveIndex, stopTimer]);

  // Step 1: Stop the timer and capture current session data.
  // Completion is deferred until the user submits or skips the recovery prompt.
  const handleFinishWorkout = useCallback(() => {
    if (!matchingActiveSession) {
      return;
    }
    stopTimer();
    setPendingCompletion({
      sessionId: matchingActiveSession.id,
      sets: matchingActiveSession.sets,
    });
  }, [matchingActiveSession, stopTimer]);

  // Shared teardown after the recovery prompt is resolved (submit or skip).
  const finalizeCompletion = useCallback(() => {
    setSyncState("pending");
    const completed = completeSession();
    if (completed) {
      setSessionHistory((prev) => [...prev, completed]);
    }
    setActiveSession(null);
    setExerciseSummary(null);
    setExerciseRestSeconds(0);
    setDraft({ weight: "", reps: "", rpe: "" });
    setPendingCompletion(null);
    window.setTimeout(() => setSyncState("synced"), 620);
  }, []);

  // Step 2a: User submitted ratings — save them, then complete the session.
  const handleRecoverySubmit = useCallback(
    (ratings: Partial<Record<MuscleGroup, number>>) => {
      if (pendingCompletion) {
        saveRecoveryRating(activeUser, {
          date: Date.now(),
          sessionId: pendingCompletion.sessionId,
          ratings,
        });
      }
      finalizeCompletion();
    },
    [activeUser, finalizeCompletion, pendingCompletion],
  );

  // Step 2b: User skipped — complete the session without saving a rating.
  const handleRecoverySkip = useCallback(() => {
    finalizeCompletion();
  }, [finalizeCompletion]);

  const handleSaveTemplateEdit = useCallback(() => {
    if (!activeProgramExercise) {
      return;
    }

    const nextName = templateDraft.name.trim();
    if (!nextName) {
      return;
    }

    const nextExercise: ProgramExercise = {
      ...activeProgramExercise,
      name: nextName,
      setGroups: templateDraft.setGroups.map((group) => ({
        sets: Math.max(1, group.sets),
        reps: group.reps.trim() || "8-12 reps",
      })),
    };

    const previousName = activeProgramExercise.name;

    setProgram((previousProgram) => {
      const nextProgram = {
        ...previousProgram,
        weeks: previousProgram.weeks.map((week) =>
          week.weekNumber !== prefs.currentWeek
            ? week
            : {
                ...week,
                days: week.days.map((day) =>
                  day.dayNumber !== prefs.currentDay
                    ? day
                    : {
                        ...day,
                        exercises: day.exercises.map((exercise, index) =>
                          index === safeActiveIndex
                            ? {
                                ...nextExercise,
                                setGroups: nextExercise.setGroups.map((group) => ({ ...group })),
                              }
                            : exercise,
                        ),
                      },
                ),
              },
        ),
      };

      return saveProgram(nextProgram);
    });

    if (matchingActiveSession) {
      const renamedSession: WorkoutSession = {
        ...matchingActiveSession,
        sets: matchingActiveSession.sets.map((set) =>
          set.exerciseName === previousName ? { ...set, exerciseName: nextName } : set,
        ),
      };
      saveActiveSession(renamedSession);
      setActiveSession(renamedSession);
    }

    setTemplateEditorOpen(false);
  }, [activeProgramExercise, matchingActiveSession, prefs.currentDay, prefs.currentWeek, safeActiveIndex, templateDraft]);

  const nextSetIndex = activeExerciseSets.length + 1;

  // Derive trained muscle groups from the pending (captured) session sets.
  // Only muscles in TRACKED_MUSCLES are included — matches the volume engine's scope.
  const musclesTrained = useMemo<MuscleGroup[]>(() => {
    if (!pendingCompletion?.sets.length) return [];
    const muscles = new Set<MuscleGroup>();
    for (const set of pendingCompletion.sets) {
      const def = findExercise(set.exerciseName);
      if (def) muscles.add(def.primaryMuscle);
    }
    return [...muscles].filter((m) => TRACKED_MUSCLES.includes(m));
  }, [pendingCompletion]);

  return (
    <section className="screen">
      <WorkoutHeader
        dayLabel={`Week ${prefs.currentWeek} - Day ${prefs.currentDay}  |  ${getDayTitle(programId, prefs.currentDay)}`}
        sessionStatus={sessionStatus}
        onPrimaryAction={() => {
          ensureActiveSession();
        }}
      />

      <div className="two-col">
        <details className="collapsible-section" open>
          <summary className="collapsible-summary">
            <span className="collapsible-title">Exercise Queue</span>
            <span className="collapsible-chevron" />
          </summary>
          <article className="card panel reveal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <div>
                <p className="subtle-label" style={{ margin: 0 }}>
                  Exercise Queue
                </p>
                <h2 className="section-title" style={{ marginTop: "0.25rem" }}>
                  Today Pipeline
                </h2>
              </div>
              <div className="cycle-toolbar">
                <label className="compact-field">
                  <span className="subtle-label">Week</span>
                  <select
                    className="compact-select"
                    value={prefs.currentWeek}
                    onChange={(event) => applyDaySelection(Number(event.target.value), prefs.currentDay)}
                  >
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => (
                      <option key={weekNum} value={weekNum}>
                        Week {weekNum}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="compact-field">
                  <span className="subtle-label">Day</span>
                  <select
                    className="compact-select"
                    value={prefs.currentDay}
                    onChange={(event) => applyDaySelection(prefs.currentWeek, Number(event.target.value))}
                  >
                    {Array.from({ length: daysPerCycle }, (_, i) => i + 1).map((dayNum) => (
                      <option key={dayNum} value={dayNum}>
                        Day {dayNum} - {getDayTitle(programId, dayNum)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="compact-stepper">
                  <button type="button" className="ghost-btn" style={{ height: "36px" }} onClick={() => handleShiftDay(-1)}>
                    {"<"}
                  </button>
                  <button type="button" className="ghost-btn" style={{ height: "36px" }} onClick={() => handleShiftDay(1)}>
                    {">"}
                  </button>
                </div>
              </div>
            </div>

            {programId === "mass-impact" ? (
              <div className="queue-action-row">
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!canEditTemplate || !activeProgramExercise}
                  title={!canEditTemplate ? "Unlock Coach Mode in Templates to edit" : ""}
                  onClick={() => {
                    setTemplateDraft(buildTemplateDraft(activeProgramExercise));
                    setTemplateEditorOpen((current) => !current);
                  }}
                >
                  {templateEditorOpen ? "Close Exercise Edit" : "Edit Selected"}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={!activeProgramExercise}
                  onClick={() =>
                    router.push(`/templates?week=${prefs.currentWeek}&day=${prefs.currentDay}&exercise=${safeActiveIndex}`)
                  }
                >
                  Open in Templates
                </button>
              </div>
            ) : null}

            {templateEditorOpen && activeProgramExercise ? (
              <ExerciseTemplateInlineEditor
                draft={templateDraft}
                canEdit={canEditTemplate}
                onDraftChange={setTemplateDraft}
                onSave={handleSaveTemplateEdit}
                onCancel={() => {
                  setTemplateDraft(buildTemplateDraft(activeProgramExercise));
                  setTemplateEditorOpen(false);
                }}
              />
            ) : null}

            <div className="queue-list">
              {queueExercises.map((exercise, index) => (
                <ExerciseQueueCard
                  key={exercise.id}
                  orderLabel={exercise.orderLabel}
                  name={exercise.name}
                  scheme={exercise.scheme}
                  track={exercise.track}
                  targetSets={exercise.targetSets}
                  completedSets={exercise.completedSets}
                  lastPerformance={exercise.lastPerformance}
                  isActive={index === safeActiveIndex}
                  onSelect={() => handleSelectExercise(index)}
                  supersetGroup={exercise.supersetGroup}
                />
              ))}
            </div>
          </article>
        </details>

        <details className="collapsible-section" open>
          <summary className="collapsible-summary">
            <span className="collapsible-title">Live Console</span>
            <span className="collapsible-chevron" />
          </summary>
          <article className="card panel reveal live-console">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.7rem" }}>
              <div>
                <p className="subtle-label" style={{ margin: 0 }}>
                  Live Set Console
                </p>
                <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
                  {activeExercise?.name ?? "No exercise selected"}
                </h2>
              </div>
              <SyncStateIndicator state={syncState} />
            </div>

            {activeExercise ? (
              <div style={{ marginBottom: "0.5rem" }}>
                {/* Scheme text — tap to open the override editor */}
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  title="Tap to override sets/reps for this session"
                  onClick={() => {
                    if (overrideEditorOpen) {
                      setOverrideEditorOpen(false);
                      return;
                    }
                    // Pre-fill with current effective values (override if set, else template)
                    const currentOverride = matchingActiveSession?.overrides?.[activeExercise.name];
                    setOverrideDraftSets(
                      String(currentOverride?.sets ?? (activeProgramExercise ? getTotalSets(activeProgramExercise) : activeExercise.targetSets))
                    );
                    setOverrideDraftReps(
                      currentOverride?.reps ?? activeProgramExercise?.setGroups[0]?.reps ?? ""
                    );
                    setOverrideEditorOpen(true);
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      // Highlight in accent color when an override is active, otherwise muted
                      color: matchingActiveSession?.overrides?.[activeExercise.name]
                        ? "var(--accent-primary)"
                        : "var(--text-1)",
                      fontSize: "0.92rem",
                    }}
                  >
                    {activeExercise.scheme}
                  </span>
                  {matchingActiveSession?.overrides?.[activeExercise.name] ? (
                    <span style={{ color: "var(--accent-primary)", fontSize: "0.75rem" }}>*</span>
                  ) : (
                    <span style={{ color: "var(--text-1)", fontSize: "0.75rem", opacity: 0.6 }}>[edit]</span>
                  )}
                </button>

                {overrideEditorOpen ? (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      padding: "0.75rem",
                      background: "var(--bg-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    <p className="subtle-label" style={{ margin: 0 }}>
                      Override for this session only
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span className="subtle-label" style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem" }}>
                          Sets
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={overrideDraftSets}
                          onChange={(e) => setOverrideDraftSets(e.target.value)}
                          style={{
                            width: "4.5rem",
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
                      <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                        <span className="subtle-label" style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem" }}>
                          Reps
                        </span>
                        <input
                          type="text"
                          value={overrideDraftReps}
                          onChange={(e) => setOverrideDraftReps(e.target.value)}
                          placeholder="e.g. 6-8 reps"
                          style={{
                            width: "8rem",
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
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => {
                            const setsNum = Number.parseInt(overrideDraftSets, 10);
                            if (Number.isNaN(setsNum) || setsNum < 1) return;
                            const repsStr = overrideDraftReps.trim();
                            const session = ensureActiveSession();
                            const updatedSession: WorkoutSession = {
                              ...session,
                              overrides: {
                                ...session.overrides,
                                [activeExercise.name]: { sets: setsNum, reps: repsStr || undefined },
                              },
                            };
                            saveActiveSession(updatedSession);
                            setActiveSession(updatedSession);
                            setOverrideEditorOpen(false);
                          }}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => setOverrideEditorOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <RestTimerDial
              targetSeconds={targetSeconds}
              remainingSeconds={remainingSeconds}
              isRunning={timerRunning}
              targetReached={targetReached}
              onToggle={() => {
                if (!activeExercise) {
                  return;
                }
                if (timerRunning) {
                  stopTimer();
                  return;
                }
                startTimer(remainingSeconds > 0 ? remainingSeconds : targetSeconds);
              }}
              onSkip={stopTimer}
              onAdjustDuration={(delta) => setTimerTarget(targetSeconds + delta)}
              onSetDuration={setTimerTarget}
            />

            <SetEntryRow
              setIndex={nextSetIndex}
              draft={draft}
              lastSet={lastSet}
              saveFlash={saveFlash}
              onDraftChange={setDraft}
              onSave={handleSaveSet}
            />

            {programMeta?.periodizationType === "double-progression" &&
             activeExerciseSets.length > 0 &&
             activeProgramExercise &&
             isRepCeilingHit(activeProgramExercise, activeExerciseSets) && (
              <div style={{
                background: "var(--accent-power)",
                color: "var(--bg-0)",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-display)",
                fontSize: "1.1rem",
                textAlign: "center",
                marginTop: "8px",
              }}>
                All sets hit top of range — bump weight next session
              </div>
            )}

            <section className="surface logged-set-panel">
              <div className="exercise-line">
                <div>
                  <p className="subtle-label" style={{ margin: 0 }}>
                    Logged Sets
                  </p>
                  <p className="page-note" style={{ marginTop: "0.2rem" }}>
                    {activeExercise
                      ? `${activeExerciseSets.length} of ${activeExercise.targetSets} sets complete`
                      : "Select an exercise to start logging"}
                  </p>
                </div>
                {activeExercise ? <span className="mono">{activeExerciseSets.length}/{activeExercise.targetSets}</span> : null}
              </div>
              {activeExerciseSets.length === 0 ? (
                <p className="page-note" style={{ marginTop: "0.75rem" }}>
                  Save each completed set here so the workout queue and progress charts stay accurate.
                </p>
              ) : (
                <div className="logged-set-list">
                  {activeExerciseSets.map((set) => (
                    <div key={`${set.exerciseName}-${set.setIndex}-${set.timestamp}`} className="logged-set-chip">
                      <div>
                        <p className="mono" style={{ margin: 0 }}>
                          Set {set.setIndex}
                        </p>
                        <p style={{ margin: "0.18rem 0 0" }}>
                          {set.weight} lb x {set.reps}
                          {set.rpe ? ` @ ${set.rpe}` : ""}
                        </p>
                      </div>
                      <span className="page-note" style={{ margin: 0 }}>
                        {formatSetTimestamp(set.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.55rem", flexWrap: "wrap" }}>
              <button type="button" className="ghost-btn" onClick={() => setDraft({ weight: "", reps: "", rpe: "" })}>
                Clear Inputs
              </button>
              <button type="button" className="ghost-btn danger-btn" onClick={handleFinishExercise}>
                Finish Exercise
              </button>
            </div>
          </article>
        </details>
      </div>

      {exerciseSummary ? (
        <section className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Exercise Summary
          </p>
          <h3 className="section-title" style={{ marginTop: "0.25rem" }}>
            {exerciseSummary.name}
          </h3>
          <div className="stats-row" style={{ marginTop: "0.85rem" }}>
            <SessionStatPill label="Elapsed" value={formatDuration(exerciseSummary.elapsedSeconds)} />
            <SessionStatPill label="Rest" value={formatDuration(exerciseSummary.restSeconds)} />
            <SessionStatPill label="Active" value={formatDuration(exerciseSummary.activeSeconds)} />
          </div>
        </section>
      ) : null}

      {pendingCompletion ? (
        <RecoveryRatingPrompt
          musclesTrained={musclesTrained}
          onSubmit={handleRecoverySubmit}
          onSkip={handleRecoverySkip}
        />
      ) : null}

      <section className="runtime-tray card reveal">
        <div>
          <p className="subtle-label" style={{ margin: 0 }}>
            Active
          </p>
          <p style={{ margin: "0.2rem 0 0" }}>{activeExercise?.name ?? "Workout complete"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.55rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="stats-row">
            <SessionStatPill label="Workout Time" value={formatDuration(workoutElapsedSeconds)} />
            <SessionStatPill label="Total Rest" value={formatDuration(workoutRestSeconds)} />
          </div>
          <button type="button" className="ghost-btn" onClick={handleFinishWorkout} disabled={!matchingActiveSession}>
            Finish Workout
          </button>
        </div>
      </section>
    </section>
  );
}
