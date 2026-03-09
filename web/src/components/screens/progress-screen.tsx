"use client";

import { TrendChartCard } from "@/components/trend-chart-card";
import { getAllSessions, getExerciseHistory, getWeeklyVolume } from "@/lib/workout-store";

type PrEntry = {
  exerciseName: string;
  weight: number;
  reps: number;
  volume: number;
};

function toPoints(values: number[]) {
  if (values.length === 0) {
    return [0];
  }
  return values;
}

export function ProgressScreen() {
  const sessions = getAllSessions();
  const weeklyVolume = getWeeklyVolume();
  const squatHistory = getExerciseHistory("Squat (Barbell)");
  const inclineHistory = getExerciseHistory("Incline Bench Press (Dumbbell)");
  const pullupHistory = getExerciseHistory("Pull-Up (Bodyweight)");

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
    <section className="screen">
      <header className="screen-head reveal">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-note">Strength, volume, and consistency metrics from your logged sessions.</p>
        </div>
      </header>

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
          points={toPoints(weeklyVolume.map((item) => item.totalSets))}
        />
        <TrendChartCard
          title="Squat Strength"
          subtitle="Best top set load (lb)"
          points={toPoints(squatHistory.map((item) => item.bestSet.weight))}
        />
        <TrendChartCard
          title="Upper Progress"
          subtitle="Incline/Pull-Up trend"
          points={toPoints([
            ...inclineHistory.map((item) => item.bestSet.weight),
            ...pullupHistory.map((item) => item.bestSet.weight),
          ])}
        />
      </section>

      <section className="two-col">
        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            PR Board
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            Best Logged Sets
          </h2>
          <div className="queue-list" style={{ marginTop: "0.75rem" }}>
            {prBoard.length === 0 ? (
              <div className="surface pad">
                <p className="page-note" style={{ margin: 0 }}>
                  No PR data yet.
                </p>
              </div>
            ) : (
              prBoard.map((entry) => (
                <div key={`${entry.exerciseName}-${entry.volume}`} className="surface pad">
                  <p style={{ margin: 0 }}>{entry.exerciseName}</p>
                  <p className="page-note" style={{ margin: "0.2rem 0 0" }}>
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
          <p className="subtle-label" style={{ margin: 0 }}>
            Consistency Heatmap
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
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
    </section>
  );
}
