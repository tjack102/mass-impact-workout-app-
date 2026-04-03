"use client";

import { TrendChartCard } from "@/components/trend-chart-card";
import { StrengthChartCard } from "@/components/strength-chart-card";
import { getAllSessions, getExerciseHistory } from "@/lib/workout-store";

type PrEntry = {
  exerciseName: string;
  weight: number;
  reps: number;
  volume: number;
};

/**
 * Returns ISO 8601 year-week key like "2026-W12" for any timestamp.
 *
 * Limitation: uses local date for day extraction, then passes to UTC Date.UTC().
 * Sessions logged near midnight in timezones behind UTC may be binned to the
 * prior ISO week. This is an acceptable tradeoff -- no date-fns dependency.
 */
function isoWeekKey(ts: number): string {
  const d = new Date(ts);
  const thu = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  thu.setUTCDate(thu.getUTCDate() + 4 - (thu.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thu.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thu.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thu.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function StrengthContent() {
  const sessions = getAllSessions();
  const squatHistory = getExerciseHistory("Squat (Barbell)");
  const inclineHistory = getExerciseHistory("Incline Bench Press (Dumbbell)");
  const pullupHistory = getExerciseHistory("Pull-Up (Bodyweight)");

  // Aggregate sessions by ISO calendar week instead of program week number
  const weeklyVolumeMap = new Map<string, number>();
  for (const session of sessions) {
    const key = isoWeekKey(session.startedAt);
    weeklyVolumeMap.set(key, (weeklyVolumeMap.get(key) ?? 0) + session.sets.length);
  }
  // Sort by key (ISO keys sort correctly as strings), take last 12 weeks
  const sortedWeekKeys = Array.from(weeklyVolumeMap.keys()).sort();
  const last12 = sortedWeekKeys.slice(-12);
  const weeklyVolumePoints = last12.map((key) => ({
    label: key.split("-W")[1] ? `W${key.split("-W")[1]}` : key,
    value: weeklyVolumeMap.get(key) ?? 0,
  }));

  // Convert exercise history to StrengthPoint arrays
  const squatPoints = squatHistory.map((item) => ({
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));
  const inclinePoints = inclineHistory.map((item) => ({
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));
  const pullupPoints = pullupHistory.map((item) => ({
    weight: item.bestSet.weight,
    reps: item.bestSet.reps,
  }));

  const bestByExercise = new Map<string, PrEntry>();
  for (const session of sessions) {
    for (const set of session.sets) {
      const entry: PrEntry = {
        exerciseName: set.exerciseName,
        weight: set.weight,
        reps: set.reps,
        volume: set.weight * set.reps,
      };
      const existing = bestByExercise.get(set.exerciseName);
      if (!existing || entry.volume > existing.volume) {
        bestByExercise.set(set.exerciseName, entry);
      }
    }
  }

  const prBoard = Array.from(bestByExercise.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6);

  const completedPairs = new Set<string>();
  for (const session of sessions) {
    if (session.completedAt) {
      completedPairs.add(`${session.weekNumber}-${session.dayNumber}`);
    }
  }

  const completionCells: Array<"none" | "warm" | "hot"> = [];
  for (let week = 1; week <= 12; week += 1) {
    for (let day = 1; day <= 7; day += 1) {
      if (day > 5) {
        completionCells.push("none");
        continue;
      }
      completionCells.push(completedPairs.has(`${week}-${day}`) ? "hot" : "warm");
    }
  }

  const hasHistory = sessions.length > 0;

  return (
    <>
      {!hasHistory ? (
        <article className="card panel reveal">
          <h2 className="section-title">No History Yet</h2>
          <p className="page-note">Complete some workouts to see your progress charts and PR board here.</p>
        </article>
      ) : null}

      <section className="grid-3">
        <TrendChartCard
          title="Weekly Volume"
          subtitle="Total logged sets per week"
          points={weeklyVolumePoints.length > 0 ? weeklyVolumePoints : [{ label: "\u2014", value: 0 }]}
        />
        <StrengthChartCard
          title="Squat Strength"
          subtitle="Best set weight (lb)"
          points={squatPoints}
        />
        <StrengthChartCard
          title="Incline Progress"
          subtitle="Best set weight (lb)"
          points={inclinePoints}
        />
        <StrengthChartCard
          title="Pull-Up Progress"
          subtitle="Best set weight (lb)"
          points={pullupPoints}
        />
      </section>

      <section className="two-col">
        <article className="card panel reveal">
          <p className="subtle-label">
            PR Board
          </p>
          <h2 className="section-title mt-0.5">
            Best Logged Sets
          </h2>
          <div className="queue-list mt-3">
            {prBoard.length === 0 ? (
              <div className="surface pad">
                <p className="page-note">
                  No PR data yet.
                </p>
              </div>
            ) : (
              prBoard.map((entry) => (
                <div key={`${entry.exerciseName}-${entry.volume}`} className="surface pad">
                  <p>{entry.exerciseName}</p>
                  <p className="page-note mt-0.5">
                    Top set:{" "}
                    <span className="mono">
                      {entry.weight} x {entry.reps}
                    </span>
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card panel reveal">
          <p className="subtle-label">
            Consistency Heatmap
          </p>
          <h2 className="section-title mt-0.5">
            12-Week Cycle
          </h2>
          <div className="heatmap" style={{ marginTop: "0.9rem" }}>
            {completionCells.map((level, index) => (
              <span
                key={`heat-${index}`}
                className={`heat-cell${level === "warm" ? " warm" : ""}${level === "hot" ? " hot" : ""}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
