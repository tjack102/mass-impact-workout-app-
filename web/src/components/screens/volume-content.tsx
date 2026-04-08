"use client";

import { useState, useEffect, useMemo } from "react";
import type { MuscleGroup } from "@/lib/types";
import { TRACKED_MUSCLES } from "@/lib/types";
import { calculateWeeklyVolume, calculateRecoveryAverage, getVolumeRecommendation, suggestSetPlacement, isDeloadDue } from "@/lib/volume-engine";
import { getVolumeLandmarks, getMesoState } from "@/lib/volume-store";
import { EXERCISE_LIBRARY } from "@/lib/exercise-library";
import { getAllSessions } from "@/lib/workout-store";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { getProgramMeta, getExercisesForDay, getDaysInCycle } from "@/lib/program-registry";
import { VolumeBar } from "@/components/volume-bar";
import { Sparkline } from "@/components/sparkline";
import { useAccess } from "@/components/access-context";
import { ChevronDown } from "@/components/icons";
import { getRecoveryRatings } from "@/lib/volume-store";
import { formatMuscleName } from "@/lib/format-utils";

// --- Helpers ----------------------------------------------------------------

/** Collect direct volume per week for a single muscle, across all session history. */
function buildSparklineData(
  sessions: ReturnType<typeof getAllSessions>,
  muscle: MuscleGroup,
): number[] {
  // Group sessions by weekNumber, compute direct sets for each week
  const weekMap = new Map<number, ReturnType<typeof getAllSessions>>();
  for (const s of sessions) {
    const w = s.weekNumber;
    if (!weekMap.has(w)) weekMap.set(w, []);
    weekMap.get(w)!.push(s);
  }

  // Sort week numbers for a chronological sparkline
  const sortedWeeks = Array.from(weekMap.keys()).sort((a, b) => a - b);

  return sortedWeeks.map((w) => {
    const weekSessions = weekMap.get(w)!;
    // calculateWeeklyVolume uses a time window -- pass a very large window
    // so all sessions in the group are counted regardless of age.
    // Simpler: count sets directly since we already have the sessions.
    const byName = new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e]));
    let direct = 0;
    for (const session of weekSessions) {
      const setCounts = new Map<string, number>();
      for (const set of session.sets) {
        setCounts.set(set.exerciseName, (setCounts.get(set.exerciseName) ?? 0) + 1);
      }
      for (const [exName, count] of setCounts) {
        const def = byName.get(exName.toLowerCase());
        if (def && def.primaryMuscle === muscle) {
          direct += count;
        }
      }
    }
    return direct;
  });
}

/** Collect all exercises across every day of a program for suggestSetPlacement. */
function getAllProgramExercises(programId: string, daysPerCycle: number, currentWeek: number) {
  const exercises: ReturnType<typeof getExercisesForDay> = [];
  for (let d = 1; d <= daysPerCycle; d++) {
    exercises.push(...getExercisesForDay(programId, d, currentWeek));
  }
  return exercises;
}

// --- Recovery dot colors ----------------------------------------------------

function recoveryDotColor(rating: number): string {
  if (rating >= 1) return "var(--ok)";
  if (rating === 0) return "var(--warn)";
  return "var(--danger)";
}

// --- Subcomponents ----------------------------------------------------------

type VolumeMode = "direct" | "total";

interface MuscleCardProps {
  muscle: MuscleGroup;
  currentDirect: number;
  currentTotal: number;
  sparklineData: number[];
  landmarks: {
    mev: number;
    mavLow: number;
    mavHigh: number;
    mrvLow: number;
    mrvHigh: number;
  };
  recentRatings: number[];
  recommendation: string | null; // null = no auto-reg (Mass Impact)
}

function MuscleCard({
  muscle,
  currentDirect,
  currentTotal,
  sparklineData,
  landmarks,
  recentRatings,
  recommendation,
}: MuscleCardProps) {
  const [mode, setMode] = useState<VolumeMode>("direct");
  const displayVolume = mode === "direct" ? currentDirect : Math.round(currentTotal);

  return (
    <div
      className="card panel grid"
      style={{ gap: "0.65rem" }}
    >
      {/* Header row: muscle name + volume number */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="subtle-label">{formatMuscleName(muscle)}</p>
          <p
            className="mono"
            style={{
              fontSize: "2rem",
              lineHeight: 1,
              color: "var(--text-0)",
              marginTop: "0.15rem",
            }}
          >
            {displayVolume}
            <span style={{ fontSize: "0.8rem", color: "var(--text-1)", marginLeft: "0.3rem" }}>sets</span>
          </p>
        </div>

        {/* Direct / Total toggle */}
        <div
          style={{
            display: "inline-grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2px",
            padding: "2px",
            borderRadius: "999px",
            border: "1px solid var(--border)",
            background: "var(--bg-input)",
          }}
        >
          {(["direct", "total"] as VolumeMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                border: "none",
                borderRadius: "999px",
                minHeight: "44px",
                padding: "0.5rem 0.75rem",
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
                fontFamily: "var(--font-mono), monospace",
                background: mode === m ? "var(--accent-primary)" : "transparent",
                color: mode === m ? "var(--text-on-accent)" : "var(--text-1)",
                transition: "background 180ms, color 180ms",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Volume bar */}
      <VolumeBar
        current={displayVolume}
        mev={landmarks.mev}
        mavLow={landmarks.mavLow}
        mavHigh={landmarks.mavHigh}
        mrvLow={landmarks.mrvLow}
        mrvHigh={landmarks.mrvHigh}
      />

      {/* Landmark labels */}
      <div className="flex justify-between">
        <span className="subtle-label" style={{ fontSize: "0.62rem" }}>MEV {landmarks.mev}</span>
        <span className="subtle-label" style={{ fontSize: "0.62rem" }}>MAV {landmarks.mavLow}–{landmarks.mavHigh}</span>
        <span className="subtle-label" style={{ fontSize: "0.62rem" }}>MRV {landmarks.mrvLow}</span>
      </div>

      {/* Bottom row: sparkline + recovery dots + recommendation */}
      <div className="flex justify-between items-end flex-wrap gap-2">
        {/* Sparkline (null if <2 data points -- handled inside component) */}
        <div className="shrink-0">
          <Sparkline data={sparklineData} width={100} height={28} />
          {sparklineData.length < 2 && (
            <span className="subtle-label" style={{ fontSize: "0.62rem" }}>No trend yet</span>
          )}
        </div>

        <div className="flex flex-col items-end" style={{ gap: "0.35rem" }}>
          {/* Recovery dots -- last 5 ratings */}
          {recentRatings.length > 0 && (
            <div className="flex items-center" style={{ gap: "4px" }}>
              <span className="subtle-label" style={{ fontSize: "0.6rem", marginRight: "2px" }}>Recovery</span>
              {recentRatings.slice(-5).map((r, i) => (
                <div
                  key={i}
                  title={`${r > 0 ? "+" : ""}${r}`}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: recoveryDotColor(r),
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          )}

          {/* Recommendation badge (auto-reg programs only) */}
          {recommendation !== null && (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "0.22rem 0.6rem",
                fontSize: "0.68rem",
                fontFamily: "var(--font-mono), monospace",
                color: recommendation.startsWith("+") ? "var(--ok)"
                  : recommendation.startsWith("-") ? "var(--danger)"
                  : "var(--text-1)",
                background: recommendation.startsWith("+") ? "color-mix(in srgb, var(--ok), transparent 92%)"
                  : recommendation.startsWith("-") ? "color-mix(in srgb, var(--danger), transparent 92%)"
                  : "transparent",
                whiteSpace: "nowrap",
              }}
            >
              {recommendation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main content -----------------------------------------------------------

export function VolumeContent() {
  const { activeUser } = useAccess();

  // All data loaded client-side (localStorage)
  const [ready, setReady] = useState(false);

  // Declare state up front so hooks are never conditional
  const [sessions, setSessions] = useState<ReturnType<typeof getAllSessions>>([]);
  const [storedPrefs, setStoredPrefs] = useState(getStoredPrefsFromLocalStorage);
  const [mesoState, setMesoState] = useState<ReturnType<typeof getMesoState>>(null);
  const [landmarks, setLandmarks] = useState<ReturnType<typeof getVolumeLandmarks> | null>(null);
  const [recoveryRatings, setRecoveryRatings] = useState<ReturnType<typeof getRecoveryRatings>>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- SSR guard: hydrate from localStorage on mount */
  useEffect(() => {
    const prefs = getStoredPrefsFromLocalStorage();
    setStoredPrefs(prefs);
    setSessions(getAllSessions(activeUser));
    setMesoState(getMesoState(activeUser));
    setLandmarks(getVolumeLandmarks(activeUser));
    setRecoveryRatings(getRecoveryRatings(activeUser));
    setReady(true);
  }, [activeUser]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const profilePrefs = storedPrefs.profiles[activeUser];
  const currentWeek = profilePrefs.currentWeek;
  const selectedProgram = profilePrefs.selectedProgram ?? "mass-impact";
  const programMeta = getProgramMeta(selectedProgram);
  const daysPerCycle = getDaysInCycle(selectedProgram);

  // Current weekly volume (rolling 7-day window)
  const weeklyVolume = useMemo(
    () => calculateWeeklyVolume(sessions, EXERCISE_LIBRARY, 7),
    [sessions],
  );

  // All program exercises for this week (for suggestSetPlacement)
  const allProgramExercises = useMemo(
    () => getAllProgramExercises(selectedProgram, daysPerCycle, currentWeek),
    [selectedProgram, daysPerCycle, currentWeek],
  );

  // Build per-muscle sparkline data
  const sparklineByMuscle = useMemo(
    () => {
      const result: Partial<Record<MuscleGroup, number[]>> = {};
      for (const muscle of TRACKED_MUSCLES) {
        result[muscle] = buildSparklineData(sessions, muscle);
      }
      return result;
    },
    [sessions],
  );

  // --- Meso overview header text --------------------------------------------

  function renderMesoHeader() {
    if (!programMeta) return null;

    const isAutoReg = programMeta.hasAutoRegulation;
    const isMassImpact = selectedProgram === "mass-impact";
    const isRavage = selectedProgram === "ravage";

    let progressLine: string;
    let deloadBadge: React.ReactNode = null;

    if (isMassImpact) {
      progressLine = `Week ${currentWeek} of 12`;
    } else if (isRavage) {
      progressLine = `Week ${currentWeek} of 10`;
      const isDeload = currentWeek === 5 || currentWeek === 10;
      if (isDeload) {
        deloadBadge = (
          <span
            style={{
              border: "1px solid color-mix(in srgb, var(--accent-power), transparent 42%)",
              color: "var(--accent-power)",
              borderRadius: "999px",
              padding: "0.2rem 0.6rem",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginLeft: "0.5rem",
            }}
          >
            Deload
          </span>
        );
      }
    } else if (isAutoReg && mesoState) {
      progressLine = `Meso ${mesoState.mesoNumber} — Week ${mesoState.weekInMeso} of ${mesoState.mesoLength}`;
      if (isDeloadDue(mesoState)) {
        deloadBadge = (
          <span
            style={{
              border: "1px solid color-mix(in srgb, var(--accent-power), transparent 42%)",
              color: "var(--accent-power)",
              borderRadius: "999px",
              padding: "0.2rem 0.6rem",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginLeft: "0.5rem",
            }}
          >
            Deload
          </span>
        );
      } else {
        const weeksLeft = mesoState.mesoLength - mesoState.weekInMeso;
        if (weeksLeft <= 1) {
          deloadBadge = (
            <span
              style={{
                border: "1px solid color-mix(in srgb, var(--warn), transparent 42%)",
                color: "var(--warn)",
                borderRadius: "999px",
                padding: "0.2rem 0.6rem",
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono), monospace",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginLeft: "0.5rem",
              }}
            >
              Deload Soon
            </span>
          );
        }
      }
    } else {
      progressLine = `Week ${currentWeek}`;
    }

    return (
      <div className="card panel grid" style={{ gap: "0.45rem" }}>
        <div className="flex items-center flex-wrap" style={{ gap: "0.4rem" }}>
          {/* Program name badge */}
          <span
            style={{
              border: "1px solid color-mix(in srgb, var(--accent-primary), transparent 52%)",
              color: "var(--accent-primary)",
              borderRadius: "999px",
              padding: "0.22rem 0.7rem",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono), monospace",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            {programMeta.name}
          </span>
          {deloadBadge}
        </div>
        <p
          className="mono"
          style={{
            fontSize: "1rem",
            color: "var(--text-1)",
          }}
        >
          {progressLine}
        </p>
      </div>
    );
  }

  // --- Muscle cards ---------------------------------------------------------

  function buildRecommendation(muscle: MuscleGroup): string | null {
    // No recommendation for programs without auto-regulation
    if (!programMeta?.hasAutoRegulation) return null;
    if (!landmarks) return null;

    const lm = landmarks[muscle];
    const currentTarget = mesoState?.weeklyTargets[muscle] ?? lm.mev;
    const currentVol = weeklyVolume[muscle]?.direct ?? 0;
    const recoveryAvg = calculateRecoveryAverage(recoveryRatings, muscle);

    const recommended = getVolumeRecommendation(currentVol, recoveryAvg, lm, currentTarget);
    const delta = recommended - currentTarget;

    if (delta === 0) return "Hold";

    const action: "add" | "remove" = delta > 0 ? "add" : "remove";
    const exerciseName = suggestSetPlacement(muscle, action, allProgramExercises, EXERCISE_LIBRARY);
    const sign = delta > 0 ? `+${delta}` : `${delta}`;

    if (!exerciseName) return `${sign} set`;
    return `${sign} set \u2192 ${exerciseName}`;
  }

  function buildRecentRatings(muscle: MuscleGroup): number[] {
    return recoveryRatings
      .map((r) => r.ratings[muscle])
      .filter((v): v is number => v !== undefined);
  }

  // --- Render ---------------------------------------------------------------

  if (!ready || !landmarks) {
    return (
      <p className="page-note">Loading...</p>
    );
  }

  return (
    <>
      {/* Meso overview */}
      {renderMesoHeader()}

      {/* Muscle group cards -- 2-col on desktop, 1-col on mobile */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "0.8rem",
        }}
      >
        {TRACKED_MUSCLES.map((muscle) => {
          const vol = weeklyVolume[muscle] ?? { direct: 0, total: 0 };
          return (
            <MuscleCard
              key={muscle}
              muscle={muscle}
              currentDirect={vol.direct}
              currentTotal={vol.total}
              sparklineData={sparklineByMuscle[muscle] ?? []}
              landmarks={landmarks[muscle]}
              recentRatings={buildRecentRatings(muscle)}
              recommendation={buildRecommendation(muscle)}
            />
          );
        })}
      </div>

      {/* Next Week Recommendations -- auto-regulated programs only */}
      {programMeta?.hasAutoRegulation && mesoState && (
        <div className="card panel grid" style={{ gap: "0.65rem" }}>
          <p className="subtle-label">Next Week Recommendations</p>
          <div className="grid" style={{ gap: "0.35rem" }}>
            {TRACKED_MUSCLES.map((muscle) => {
              const rec = buildRecommendation(muscle);
              if (rec === null) return null;
              return (
                <div
                  key={muscle}
                  className="flex justify-between items-center"
                  style={{
                    padding: "0.3rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span className="subtle-label">{formatMuscleName(muscle)}</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: "0.78rem",
                      color: rec.startsWith("+") ? "var(--ok)"
                        : rec.startsWith("-") ? "var(--danger)"
                        : "var(--text-1)",
                    }}
                  >
                    {rec}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meso history -- collapsed by default */}
      <details
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-1)",
          overflow: "hidden",
        }}
      >
        <summary
          className="flex justify-between items-center list-none select-none cursor-pointer"
          style={{
            padding: "0.75rem 1rem",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-0)",
            }}
          >
            Meso History
          </span>
          <ChevronDown size={14} aria-hidden="true" style={{ color: "var(--text-1)" }} />
        </summary>

        <div style={{ padding: "0 1rem 1rem" }}>
          <p className="page-note">No previous meso data recorded yet.</p>
        </div>
      </details>
    </>
  );
}
