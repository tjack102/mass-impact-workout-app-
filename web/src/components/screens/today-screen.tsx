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
import { Modal } from "../modal";
import { WarmupCalculator } from "../warmup-calculator";
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
  clearActiveSession,
  completeSession,
  deleteSet,
  getActiveSession,
  getAllSessions,
  getLastPerformance,
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
import { RpSetupScreen } from "./rp-setup-screen";
import { findExercise, EXERCISE_LIBRARY } from "@/lib/exercise-library";
import { getRpState, saveRpState, addRating, clearRpState } from "@/lib/rp-store";
import { getRpExercisesForDay } from "@/lib/program-registry";
import type { RpProgramState, RpMesoType } from "@/lib/rp-types";
import { isDeloadWeek, getNextMeso, getMesoWeeks, getMesoRestSeconds, getRirTarget } from "@/lib/rp-engine";
import { RP_TEMPLATE_NF3 } from "@/lib/rp-template-nf3";
import { RP_TEMPLATE_NF4 } from "@/lib/rp-template-nf4";
import { RP_TEMPLATE_NA4 } from "@/lib/rp-template-na4";
import { RP_TEMPLATE_NC4 } from "@/lib/rp-template-nc4";
import type { RpTemplate, RpExerciseSlot } from "@/lib/rp-types";
import { TRACKED_MUSCLES, type MuscleGroup, type ExerciseDefinition } from "@/lib/types";
import { getPermanentSub, setPermanentSub } from "@/lib/exercise-substitutions";
import { getExerciseUrl, setExerciseUrl, clearExerciseUrl } from "@/lib/exercise-url-store";
import { getAdditions } from "@/lib/exercise-additions";
import { ExercisePickerModal } from "@/components/exercise-picker-modal";
import {
  saveRecoveryRating,
  getMesoState,
  saveMesoState,
  initMesoState,
  getRecoveryRatings,
  getVolumeLandmarks,
} from "@/lib/volume-store";
import {
  calculateWeeklyVolume,
  calculateRecoveryAverage,
  getVolumeRecommendation,
  isDeloadDue,
  advanceMeso,
} from "@/lib/volume-engine";
import { detectPR } from "@/lib/pr-engine";
import { Flame } from "@/components/icons";
import { RpMesoCard } from "@/components/rp-meso-card";

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
  originalName?: string;  // set when exercise has been substituted
  scheme: string;
  lastPerformance: string;
  targetSets: number;
  completedSets: number;
  restTargetSeconds: number;
  track: "his" | "hers";
  supersetGroup?: string;
  notes?: string;
  exrxUrl?: string;
  prescribedWeight?: number;
  rirTarget?: string;
  rpSlotId?: string;
  muscleGroup: string;
  reps: string;
  lastWeight?: number;
  isSkipped?: boolean;
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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

function formatMuscleGroup(exerciseName: string): string {
  const def = findExercise(exerciseName);
  if (!def) return "";
  const primary = def.primaryMuscle.replace(/_/g, " ");
  const title = primary.charAt(0).toUpperCase() + primary.slice(1);
  const secondaries = def.secondaryMuscles
    .filter(s => s.factor >= 0.3)
    .map(s => {
      const n = s.muscle.replace(/_/g, " ");
      return n.charAt(0).toUpperCase() + n.slice(1);
    });
  return secondaries.length > 0 ? `${title} & ${secondaries[0]}` : title;
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

function getRpTemplateById(id: string): RpTemplate | undefined {
  switch (id) {
    case "rp-nf3": return RP_TEMPLATE_NF3;
    case "rp-nf4": return RP_TEMPLATE_NF4;
    case "rp-na4": return RP_TEMPLATE_NA4;
    case "rp-nc4": return RP_TEMPLATE_NC4;
    default: return undefined;
  }
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
  // Track PR exercises by name for badge display during this session
  const [prExercises, setPrExercises] = useState<Set<string>>(new Set());
  const [prFlash, setPrFlash] = useState(false);
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
  // Meso advancement notification — shown briefly after session completion
  const [mesoNotification, setMesoNotification] = useState<string | null>(null);
  // Override editor state — inline form shown when user taps the scheme text
  const [overrideEditorOpen, setOverrideEditorOpen] = useState(false);
  const [overrideDraftSets, setOverrideDraftSets] = useState("");
  const [overrideDraftReps, setOverrideDraftReps] = useState("");
  const [warmupOpen, setWarmupOpen] = useState(false);
  const [warmupProps, setWarmupProps] = useState<{
    exerciseName?: string;
    initialWeight?: number;
    autoAbbreviated?: boolean;
  }>({});
  const [swapTarget, setSwapTarget] = useState<{ index: number; muscleGroup: MuscleGroup; originalTemplateName: string } | null>(null);
  const [swapConfirm, setSwapConfirm] = useState<{ exercise: ExerciseDefinition; originalTemplateName: string } | null>(null);
  // Bumped whenever a permanent sub is written so queueExercises memo re-runs
  const [subVersion, setSubVersion] = useState(0);
  // Bumped when exercise URLs finish loading from server
  const [urlVersion, setUrlVersion] = useState(0);
  // URL editor state for adding demo links from today screen
  const [urlEditName, setUrlEditName] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");

  // RP program state
  const isRpProgram = programId.startsWith("rp-");
  const [rpState, setRpState] = useState<RpProgramState | null>(() =>
    isRpProgram ? getRpState(activeUser) : null
  );
  // Track which exercises have been rated this session
  const [rpRatedSlots, setRpRatedSlots] = useState<Set<string>>(new Set());
  // 10RM editor state for RP exercises
  const [rpTenRmEdit, setRpTenRmEdit] = useState<string | null>(null);
  const [rpTenRmDraft, setRpTenRmDraft] = useState("");
  // Meso transition state
  const [rpMesoComplete, setRpMesoComplete] = useState(false);
  const [rpCarryForward, setRpCarryForward] = useState<Record<string, { exerciseName: string; tenRepMax: number }> | undefined>();

  useEffect(() => {
    const handler = () => setUrlVersion((v) => v + 1);
    window.addEventListener("exercise-urls-loaded", handler);
    return () => window.removeEventListener("exercise-urls-loaded", handler);
  }, []);
  const flashTimeout = useRef<number | null>(null);
  const prFlashTimeout = useRef<number | null>(null);
  const restStartedAtRef = useRef<number | null>(null);
  const restTargetRef = useRef<number>(90);

  // Mass Impact uses program-store (preserves user template edits); all others use registry
  const programDay = programId === "mass-impact" ? getProgramDay(program, prefs.currentWeek, prefs.currentDay) : null;
  const exercises = useMemo<ProgramExercise[]>(() => {
    if (programId === "mass-impact") {
      return programDay?.exercises ?? [];
    }
    if (isRpProgram && rpState) {
      return getRpExercisesForDay(programId, prefs.currentDay, rpState);
    }
    return getExercisesForDay(programId, prefs.currentDay, prefs.currentWeek);
  }, [programId, programDay, prefs.currentDay, prefs.currentWeek, isRpProgram, rpState]);

  const rpDaySlots = useMemo<RpExerciseSlot[]>(() => {
    if (!isRpProgram) return [];
    const template = getRpTemplateById(programId);
    if (!template) return [];
    return template.slots.filter(s => s.dayNumber === prefs.currentDay);
  }, [isRpProgram, programId, prefs.currentDay]);

  const rpCompletedDays = useMemo<Set<number>>(() => {
    if (!isRpProgram || !rpState) return new Set();
    const done = new Set<number>();
    for (let day = 1; day <= daysPerCycle; day++) {
      const dayDone = sessionHistory.some(
        s => s.dayNumber === day &&
             s.weekNumber === prefs.currentWeek &&
             s.programId === programId &&
             Boolean(s.completedAt)
      );
      if (dayDone) done.add(day);
    }
    return done;
  }, [isRpProgram, rpState, sessionHistory, prefs.currentWeek, daysPerCycle, programId]);

  const rpAllDaysComplete = rpCompletedDays.size >= daysPerCycle;

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
    // Resolve additions for registry programs
    const additions = programId !== "mass-impact"
      ? getAdditions(prefs.activeUser, programId, prefs.currentDay)
      : [];
    const allExercises = additions.length > 0
      ? [...exercises, ...additions]
      : exercises;

    return allExercises.map((exercise, index) => {
      // Resolve substitution: session > permanent > original
      const sessionSub = matchingActiveSession?.substitutions?.[exercise.name];
      const permanentSub = getPermanentSub(prefs.activeUser, programId, prefs.currentDay, exercise.name);
      const resolvedName = sessionSub ?? permanentSub ?? exercise.name;
      const originalName = resolvedName !== exercise.name ? exercise.name : undefined;

      const completedSets = matchingActiveSession
        ? matchingActiveSession.sets.filter((set) => set.exerciseName === resolvedName).length
        : 0;
      const lastPerformance = getLastPerformanceFromSessions(sessionHistory, resolvedName);

      // Apply session-only override keyed on RESOLVED name
      const override = matchingActiveSession?.overrides?.[resolvedName];
      const effectiveSets = override?.sets ?? getTotalSets(exercise);
      const effectiveScheme = override
        ? `${override.sets ?? getTotalSets(exercise)} x ${override.reps ?? exercise.setGroups[0]?.reps ?? "?"}`
        : formatScheme(exercise);

      return {
        id: `${prefs.currentWeek}-${prefs.currentDay}-${exercise.orderLabel}-${index}`,
        orderLabel: exercise.orderLabel,
        name: resolvedName,
        originalName,
        scheme: effectiveScheme,
        lastPerformance: formatLastSet(lastPerformance),
        targetSets: effectiveSets,
        completedSets,
        restTargetSeconds: getRestSecondsForExercise(exercise),
        track: prefs.activeUser,
        supersetGroup: exercise.supersetGroup,
        notes: exercise.notes,
        exrxUrl: getExerciseUrl(resolvedName),
        prescribedWeight: exercise.prescribedWeight,
        rirTarget: exercise.rirTarget,
        rpSlotId: exercise.rpSlotId,
        muscleGroup: formatMuscleGroup(resolvedName),
        reps: exercise.setGroups[0]?.reps ?? "---",
        lastWeight: lastPerformance?.weight,
        isSkipped: effectiveSets === 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- subVersion/urlVersion are intentional cache-busters
  }, [exercises, matchingActiveSession, prefs.activeUser, prefs.currentDay, prefs.currentWeek, sessionHistory, programId, subVersion, urlVersion, rpDaySlots]);

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
      if (prFlashTimeout.current) {
        window.clearTimeout(prFlashTimeout.current);
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
      setRpRatedSlots(new Set());
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

  const handleRpSelectDay = useCallback((day: number) => {
    applyDaySelection(prefs.currentWeek, day);
    setRpRatedSlots(new Set());
  }, [applyDaySelection, prefs.currentWeek]);

  const handleRpAdvanceWeek = useCallback(() => {
    if (!rpState) return;
    const newRpWeek = rpState.currentWeek + 1;
    const updated: RpProgramState = { ...rpState, currentWeek: newRpWeek };
    saveRpState(activeUser, updated);
    setRpState(updated);
    // Advance global week linearly so session weekNumbers stay unique
    persistPrefs(prefs.currentWeek + 1, 1);
    setRpRatedSlots(new Set());
  }, [rpState, activeUser, persistPrefs, prefs.currentWeek]);

  const handleRpCompleteMeso = useCallback(() => {
    if (!rpState) return;
    const nextMeso = getNextMeso(rpState.currentMeso);
    if (nextMeso) {
      setRpCarryForward(rpState.selections);
      clearRpState(activeUser);
      setRpState(null);
      setRpMesoComplete(true);
    } else {
      // Macrocycle complete -- clean slate
      clearRpState(activeUser);
      setRpState(null);
      setRpMesoComplete(false);
      setMesoNotification("Macrocycle Complete! Start a fresh cycle from the setup screen.");
      window.setTimeout(() => setMesoNotification(null), 10000);
    }
  }, [rpState, activeUser]);

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

      // Pre-fill weight for faster logging
      if (selected) {
        const prefillWeight = selected.prescribedWeight ?? selected.lastWeight;
        if (prefillWeight) {
          setDraft(prev => ({ ...prev, weight: String(prefillWeight) }));
        }
      }
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

    // PR detection -- runs against completed session history (not the active session)
    const prResult = detectPR(activeExercise.name, weight, reps, sessionHistory);
    if (prResult.isPR) {
      setPrExercises((prev) => new Set([...prev, activeExercise.name]));
      setPrFlash(true);
      if (prFlashTimeout.current) {
        window.clearTimeout(prFlashTimeout.current);
      }
      prFlashTimeout.current = window.setTimeout(() => setPrFlash(false), 400);
      // Haptic feedback -- double pulse; silently no-ops on iOS and desktop
      if ("vibrate" in navigator) {
        navigator.vibrate([80, 40, 80]);
      }
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
  }, [activeExercise, draft, ensureActiveSession, handleSelectExercise, queueExercises, safeActiveIndex, sessionHistory, startTimer, targetSeconds]);

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

    // Meso advancement — only for programs with auto-regulation
    if (programMeta?.hasAutoRegulation) {
      let meso = getMesoState(activeUser) ?? initMesoState(activeUser);
      // Re-read all sessions now that the new one is committed
      const allSessions = getAllSessions(activeUser);
      const sessionsInMeso = allSessions.filter(
        (s) => s.completedAt && s.completedAt >= meso.startDate,
      );

      // Determine which week we should be in based on session count
      const expectedWeek = Math.floor((sessionsInMeso.length - 1) / daysPerCycle) + 1;

      if (expectedWeek > meso.weekInMeso) {
        // Week boundary crossed — recalculate volume targets for the new week
        const ratings = getRecoveryRatings(activeUser);
        const lm = getVolumeLandmarks(activeUser);
        const vol = calculateWeeklyVolume(allSessions, EXERCISE_LIBRARY, 7);
        const newTargets: Partial<Record<MuscleGroup, number>> = {};
        for (const muscle of TRACKED_MUSCLES) {
          const recoveryAvg = calculateRecoveryAverage(ratings, muscle);
          const currentTarget = meso.weeklyTargets[muscle] ?? lm[muscle]?.mev ?? 0;
          const currentVol = vol[muscle]?.direct ?? 0;
          newTargets[muscle] = getVolumeRecommendation(currentVol, recoveryAvg, lm[muscle], currentTarget);
        }
        meso = { ...meso, weekInMeso: expectedWeek, weeklyTargets: newTargets };
        saveMesoState(activeUser, meso);
      }

      if (isDeloadDue(meso)) {
        // Count how many sessions fall in the deload week (beyond mesoLength)
        const deloadWeekSessions = sessionsInMeso.length - meso.mesoLength * daysPerCycle;
        if (deloadWeekSessions >= daysPerCycle) {
          // Deload week complete — start new meso
          const ratings = getRecoveryRatings(activeUser);
          const lm = getVolumeLandmarks(activeUser);
          const recoveryAverages: Partial<Record<MuscleGroup, number>> = {};
          for (const muscle of TRACKED_MUSCLES) {
            recoveryAverages[muscle] = calculateRecoveryAverage(ratings, muscle);
          }
          const newMeso = advanceMeso(meso, recoveryAverages, lm);
          saveMesoState(activeUser, newMeso);
          setMesoNotification("New Mesocycle Started — Volume targets updated");
        } else {
          setMesoNotification("Deload Week — reduce volume to MEV levels");
        }
        // Auto-dismiss after 8 seconds
        window.setTimeout(() => setMesoNotification(null), 8000);
      }
    }
  }, [activeUser, daysPerCycle, programMeta]);

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

  function handleOpenSwap(index: number) {
    const qe = queueExercises[index];
    if (!qe) return;
    const templateName = qe.originalName ?? qe.name;
    const def = findExercise(qe.name);
    const muscle = def?.primaryMuscle ?? "back";
    setSwapTarget({ index, muscleGroup: muscle, originalTemplateName: templateName });
  }

  function handleSwapSelect(exercise: ExerciseDefinition) {
    if (!swapTarget) return;
    setSwapConfirm({ exercise, originalTemplateName: swapTarget.originalTemplateName });
    setSwapTarget(null);
  }

  function handleSwapConfirm(permanent: boolean) {
    if (!swapConfirm) return;
    const { exercise, originalTemplateName } = swapConfirm;

    if (permanent) {
      setPermanentSub(prefs.activeUser, programId, prefs.currentDay, originalTemplateName, exercise.name);
      setSubVersion((v) => v + 1);
    } else if (matchingActiveSession) {
      const updated: WorkoutSession = {
        ...matchingActiveSession,
        substitutions: {
          ...matchingActiveSession.substitutions,
          [originalTemplateName]: exercise.name,
        },
      };
      saveActiveSession(updated);
      setActiveSession(updated);
    }
    setSwapConfirm(null);
  }

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

  // RP setup screen -- shown when RP program selected but no meso state exists
  if (isRpProgram && (!rpState || rpMesoComplete)) {
    const nextMeso: RpMesoType = rpMesoComplete
      ? (getNextMeso(rpState?.currentMeso ?? "basic") ?? "basic")
      : "basic";
    return (
      <RpSetupScreen
        templateId={programId}
        meso={nextMeso}
        carryForward={rpCarryForward}
        onComplete={(state) => {
          saveRpState(activeUser, state);
          setRpState(state);
          setRpMesoComplete(false);
          setRpCarryForward(undefined);
        }}
      />
    );
  }

  return (
    <>
    <section className="screen">
      <WorkoutHeader
        dayLabel={`Week ${prefs.currentWeek} - Day ${prefs.currentDay}  |  ${getDayTitle(programId, prefs.currentDay)}`}
        sessionStatus={sessionStatus}
        onPrimaryAction={() => {
          ensureActiveSession();
        }}
      />

      {!matchingActiveSession && (
        <button
          className="surface warmup-standalone-card"
          onClick={() => {
            setWarmupProps({});
            setWarmupOpen(true);
          }}
        >
          <Flame size={18} className="warmup-standalone-icon" aria-hidden="true" />
          <span>Warm-Up Calculator</span>
        </button>
      )}

      <div className="two-col">
        <article className="card panel reveal">
          <div className="flex justify-between items-center gap-2">
            <div></div>
            <div>
              {isRpProgram && rpState ? (
                <RpMesoCard
                  meso={rpState.currentMeso}
                  currentWeek={rpState.currentWeek}
                  totalWeeks={getMesoWeeks(rpState.currentMeso)}
                  daysPerWeek={daysPerCycle}
                  dayTitles={(() => {
                    const t = getRpTemplateById(programId);
                    return t?.dayTitles ?? [];
                  })()}
                  completedDays={rpCompletedDays}
                  selectedDay={prefs.currentDay}
                  onSelectDay={handleRpSelectDay}
                  rirTarget={getRirTarget(rpState.currentWeek, isDeloadWeek(rpState.currentMeso, rpState.currentWeek))}
                  restRange={getMesoRestSeconds(rpState.currentMeso)}
                  isDeload={isDeloadWeek(rpState.currentMeso, rpState.currentWeek)}
                  allDaysComplete={rpAllDaysComplete}
                  onAdvanceWeek={handleRpAdvanceWeek}
                  onCompleteMeso={handleRpCompleteMeso}
                />
              ) : (
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
                    <button type="button" className="ghost-btn" style={{ height: "36px" }} onClick={() => handleShiftDay(-1)} aria-label="Previous day">
                      {"<"}
                    </button>
                    <button type="button" className="ghost-btn" style={{ height: "36px" }} onClick={() => handleShiftDay(1)} aria-label="Next day">
                      {">"}
                    </button>
                  </div>
                </div>
              )}
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
          </div>

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

            <div className="queue-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {queueExercises.map((qe, index) => (
                <div key={qe.id} style={qe.targetSets === 0 ? { opacity: 0.4, position: "relative" } : undefined}>
                  <ExerciseQueueCard
                    key={qe.id}
                    orderLabel={qe.orderLabel}
                    name={qe.name}
                    muscleGroup={qe.muscleGroup}
                    reps={qe.reps}
                    targetSets={qe.targetSets}
                    completedSets={qe.completedSets}
                    lastWeight={qe.lastWeight}
                    prescribedWeight={qe.prescribedWeight}
                    rirTarget={qe.rirTarget}
                    isActive={index === safeActiveIndex}
                    isSkipped={qe.isSkipped}
                    onSelect={() => handleSelectExercise(index)}
                    onSwap={() => handleOpenSwap(index)}
                    supersetGroup={qe.supersetGroup}
                    prFlash={index === safeActiveIndex ? prFlash : false}
                    originalName={qe.originalName}
                    notes={qe.notes}
                    exrxUrl={qe.exrxUrl}
                    onEditUrl={() => {
                      setUrlEditName(qe.name);
                      setUrlDraft(getExerciseUrl(qe.name) ?? "");
                    }}
                  />
                  {qe.targetSets === 0 && (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "var(--bg-1)",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.8rem",
                      color: "var(--accent-power)",
                      whiteSpace: "nowrap",
                    }}>
                      Skipped -- recovery needed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </article>

        <article className="card panel reveal live-console glass-card">
            <div className="flex justify-between items-center" style={{ gap: "0.7rem" }}>
              <div>
                <p className="subtle-label">
                  Live Set Console
                </p>
                <h2 style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "1.4rem",
                  textTransform: "uppercase",
                  margin: 0,
                  letterSpacing: "0.02em",
                }}>
                  {activeExercise?.name ?? "No exercise selected"}
                </h2>
                {isRpProgram && rpState && activeExercise?.rpSlotId && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
                    {rpTenRmEdit === activeExercise.rpSlotId ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--text-2)" }}>10RM:</span>
                        <input type="number" min={0} step={5} value={rpTenRmDraft}
                          onChange={e => setRpTenRmDraft(e.target.value)}
                          style={{ width: "5rem", background: "var(--surface-high)", border: "none", color: "var(--text-0)", fontFamily: "var(--font-mono)", fontSize: "0.9rem", padding: "0.25rem 0.4rem", borderRadius: "6px" }}
                        />
                        <button type="button" className="ghost-btn" style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem" }}
                          onClick={() => {
                            const val = parseInt(rpTenRmDraft, 10);
                            if (!isNaN(val) && val > 0 && rpState) {
                              const updated = {
                                ...rpState,
                                selections: {
                                  ...rpState.selections,
                                  [activeExercise.rpSlotId!]: {
                                    ...rpState.selections[activeExercise.rpSlotId!],
                                    tenRepMax: val,
                                  },
                                },
                              };
                              saveRpState(activeUser, updated);
                              setRpState(updated);
                            }
                            setRpTenRmEdit(null);
                          }}>Save</button>
                        <button type="button" className="ghost-btn" style={{ fontSize: "0.78rem", padding: "0.2rem 0.5rem" }}
                          onClick={() => setRpTenRmEdit(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => {
                        const sel = rpState?.selections[activeExercise.rpSlotId!];
                        setRpTenRmDraft(String(sel?.tenRepMax ?? ""));
                        setRpTenRmEdit(activeExercise.rpSlotId!);
                      }} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", padding: 0 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-primary)" }}>
                          {activeExercise.prescribedWeight ? `Target: ${activeExercise.prescribedWeight} lbs` : "No 10RM set"}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-2)" }}>[edit]</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              {activeExercise && (
                <button
                  className="ghost-btn"
                  style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
                  onClick={openWarmupFromConsole}
                >
                  Warm Up
                </button>
              )}
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
                  aria-label="Override sets and reps for this session"
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
                    <p className="subtle-label">
                      Override for this session only
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <label className="flex flex-col" style={{ gap: "0.2rem" }}>
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
                      <label className="flex flex-col" style={{ gap: "0.2rem" }}>
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

                {/* RP prescribed weight */}
                {activeExercise?.prescribedWeight ? (
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    color: "var(--accent-primary)",
                    margin: "0.3rem 0 0",
                  }}>
                    Target: {activeExercise.prescribedWeight} lbs
                  </p>
                ) : null}

                {/* RP RIR badge */}
                {activeExercise?.rirTarget && !activeExercise.rirTarget.includes("reps") ? (
                  <span style={{
                    display: "inline-block",
                    padding: "0.15rem 0.5rem",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    color: "var(--accent-power)",
                    marginTop: "0.3rem",
                  }}>
                    RIR: {activeExercise.rirTarget.split("/")[0]}
                  </span>
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
                  <p className="subtle-label">
                    Logged Sets
                  </p>
                  <p className="page-note mt-0.5">
                    {activeExercise
                      ? `${activeExerciseSets.length} of ${activeExercise.targetSets} sets complete`
                      : "Select an exercise to start logging"}
                  </p>
                </div>
                {activeExercise ? <span className="mono">{activeExerciseSets.length}/{activeExercise.targetSets}</span> : null}
              </div>
              {activeExerciseSets.length === 0 ? (
                <p className="page-note mt-3">
                  Save each completed set here so the workout queue and progress charts stay accurate.
                </p>
              ) : (
                <div className="logged-set-list">
                  {activeExerciseSets.map((set) => (
                    <div key={`${set.exerciseName}-${set.setIndex}-${set.timestamp}`} className="logged-set-chip">
                      <div>
                        <p className="mono">
                          Set {set.setIndex}
                        </p>
                        <p className="flex items-center" style={{ margin: "0.18rem 0 0", gap: "0.4rem" }}>
                          {set.weight} lb x {set.reps}
                          {set.rpe ? ` @ ${set.rpe}` : ""}
                          {prExercises.has(set.exerciseName) && <span className="pr-badge">PR</span>}
                        </p>
                      </div>
                      <span className="page-note">
                        {formatSetTimestamp(set.timestamp)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = deleteSet(set.exerciseName, set.setIndex);
                          if (updated) setActiveSession(updated);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-2)",
                          cursor: "pointer",
                          padding: "2px 6px",
                          fontSize: "0.85rem",
                          borderRadius: "4px",
                          marginLeft: "auto",
                        }}
                        aria-label={`Delete set ${set.setIndex}`}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RP inline recovery rating */}
            {isRpProgram && activeExercise?.rpSlotId && rpState && (() => {
              const slot = rpDaySlots.find(s => s.slotId === activeExercise.rpSlotId);
              if (!slot?.isAutoregulated) return null;
              if (isDeloadWeek(rpState.currentMeso, rpState.currentWeek)) return null;
              if (activeExerciseSets.length < activeExercise.targetSets) return null;
              if (rpRatedSlots.has(activeExercise.rpSlotId)) return null;

              return (
                <div style={{
                  padding: "0.75rem",
                  background: "var(--bg-2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                  marginTop: "0.5rem",
                }}>
                  <p className="subtle-label" style={{ marginBottom: "0.5rem" }}>
                    Recovery Rating for {activeExercise.name}
                  </p>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {([
                      { value: 1 as const, label: "Recovered", desc: "Not sore, reps easy", color: "var(--accent-primary)" },
                      { value: 0 as const, label: "Neutral", desc: "Sore, reps manageable", color: "var(--text-1)" },
                      { value: -1 as const, label: "Struggling", desc: "Very sore, reps hard", color: "var(--accent-power)" },
                    ]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          addRating(activeUser, {
                            slotId: activeExercise.rpSlotId!,
                            week: rpState.currentWeek,
                            meso: rpState.currentMeso,
                            value: opt.value,
                          });
                          setRpState(getRpState(activeUser));
                          setRpRatedSlots(prev => new Set([...prev, activeExercise.rpSlotId!]));
                        }}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          background: "var(--bg-1)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          color: opt.color,
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
                          {opt.value > 0 ? "+1" : opt.value === 0 ? "0" : "-1"}
                        </span>
                        <span style={{ display: "block", fontSize: "0.75rem", fontFamily: "var(--font-ui)" }}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* RP deload hint -- ratings disabled during deload */}
            {isRpProgram && rpState && activeExercise?.rpSlotId &&
             isDeloadWeek(rpState.currentMeso, rpState.currentWeek) &&
             activeExerciseSets.length >= activeExercise.targetSets && (
              <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--text-2)", marginTop: "0.5rem" }}>
                Deload week -- no ratings needed
              </p>
            )}

            <div className="flex justify-between flex-wrap" style={{ gap: "0.55rem" }}>
              <button type="button" className="ghost-btn" onClick={() => setDraft({ weight: "", reps: "", rpe: "" })}>
                Clear Inputs
              </button>
              <button type="button" className="ghost-btn danger-btn" onClick={handleFinishExercise}>
                Finish Exercise
              </button>
            </div>
          </article>
      </div>

      {exerciseSummary ? (
        <section className="card panel reveal">
          <p className="subtle-label">
            Exercise Summary
          </p>
          <h3 className="section-title mt-1">
            {exerciseSummary.name}
          </h3>
          <div className="stats-row mt-3.5">
            <SessionStatPill label="Elapsed" value={formatDuration(exerciseSummary.elapsedSeconds)} />
            <SessionStatPill label="Rest" value={formatDuration(exerciseSummary.restSeconds)} />
            <SessionStatPill label="Active" value={formatDuration(exerciseSummary.activeSeconds)} />
          </div>
        </section>
      ) : null}

      {pendingCompletion && !isRpProgram ? (
        <RecoveryRatingPrompt
          musclesTrained={musclesTrained}
          onSubmit={handleRecoverySubmit}
          onSkip={handleRecoverySkip}
        />
      ) : null}

      {mesoNotification ? (
        <button
          type="button"
          aria-label="Dismiss mesocycle notification"
          onClick={() => setMesoNotification(null)}
          style={{
            display: "block",
            width: "100%",
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: "1.05rem",
            textAlign: "center",
            background: mesoNotification.startsWith("New Meso")
              ? "var(--accent-primary)"
              : "var(--accent-power)",
            color: "var(--bg-0)",
          }}
        >
          {mesoNotification}
        </button>
      ) : null}

      <section className="runtime-tray card reveal">
        <div>
          <p className="subtle-label">
            Active
          </p>
          <p style={{ margin: "0.2rem 0 0" }}>{activeExercise?.name ?? "Workout complete"}</p>
        </div>
        <div className="flex items-center flex-wrap" style={{ gap: "0.55rem" }}>
          <div className="stats-row">
            <SessionStatPill label="Workout Time" value={formatDuration(workoutElapsedSeconds)} />
            <SessionStatPill label="Total Rest" value={formatDuration(workoutRestSeconds)} />
          </div>
          <button type="button" className="ghost-btn" onClick={handleFinishWorkout} disabled={!matchingActiveSession} aria-label={matchingActiveSession ? "Finish workout and log session" : "Start a workout first"}>
            Finish Workout
          </button>
          {matchingActiveSession && (
            <button
              type="button"
              className="ghost-btn"
              style={{ color: "var(--danger)", fontSize: "0.8rem" }}
              onClick={() => {
                if (window.confirm("Cancel this workout? All logged sets will be discarded.")) {
                  clearActiveSession(activeUser);
                  setActiveSession(null);
                  setExerciseSummary(null);
                  setExerciseRestSeconds(0);
                  setWorkoutRestSeconds(0);
                  setDraft({ weight: "", reps: "", rpe: "" });
                  setPendingCompletion(null);
                  stopTimer();
                }
              }}
            >
              Cancel Workout
            </button>
          )}
        </div>
      </section>
    </section>

    <Modal open={warmupOpen} onClose={() => setWarmupOpen(false)} title="Warm-Up Calculator">
      <WarmupCalculator
        exerciseName={warmupProps.exerciseName}
        initialWeight={warmupProps.initialWeight}
        autoAbbreviated={warmupProps.autoAbbreviated}
      />
    </Modal>

    {/* Exercise Swap Picker */}
    <ExercisePickerModal
      open={swapTarget !== null}
      muscleGroup={swapTarget?.muscleGroup}
      onSelect={handleSwapSelect}
      onClose={() => setSwapTarget(null)}
    />

    {/* Swap Confirmation */}
    {swapConfirm && (
      <Modal open onClose={() => setSwapConfirm(null)} title="Swap Exercise">
        <div style={{ padding: "1rem" }}>
          <p>Replace with <strong>{swapConfirm.exercise.name}</strong>?</p>
          <div className="flex gap-2 mt-4">
            {matchingActiveSession && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => handleSwapConfirm(false)}
              >
                Just this session
              </button>
            )}
            <button
              type="button"
              className="ghost-btn"
              onClick={() => handleSwapConfirm(true)}
            >
              All future sessions
            </button>
          </div>
        </div>
      </Modal>
    )}

    {urlEditName && (
      <Modal open onClose={() => setUrlEditName(null)} title={`Demo Link: ${urlEditName}`}>
        <div className="flex flex-col gap-3" style={{ padding: "1rem" }}>
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
          <div className="flex gap-2">
            <button
              type="button"
              className="ghost-btn flex-1"
              onClick={() => {
                if (urlDraft.trim()) {
                  setExerciseUrl(urlEditName, urlDraft.trim());
                }
                setUrlEditName(null);
                setUrlVersion((v) => v + 1);
              }}
            >
              Save
            </button>
            {getExerciseUrl(urlEditName) && (
              <button
                type="button"
                className="ghost-btn"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  clearExerciseUrl(urlEditName);
                  setUrlEditName(null);
                  setUrlVersion((v) => v + 1);
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </Modal>
    )}

    {matchingActiveSession ? (
      <div className="workout-status-bar" role="status" aria-label="Active workout status">
        <span className="workout-status-time">{formatElapsed(workoutElapsedSeconds)}</span>
        <span className="workout-status-sets">{matchingActiveSession.sets.length} sets</span>
        <span className="workout-status-exercise">
          {activeExercise?.name
            ? activeExercise.name.length > 20
              ? activeExercise.name.slice(0, 18) + "…"
              : activeExercise.name
            : "—"}
        </span>
        <button
          type="button"
          className="workout-status-end-btn"
          onClick={handleFinishWorkout}
        >
          End Workout
        </button>
      </div>
    ) : null}
    </>
  );
}
