"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SyncStateIndicator } from "@/components/sync-state-indicator";
import { getProgram, getProgramDay } from "@/lib/program-store";
import { getCompletedDays, getPrefs, savePrefs } from "@/lib/workout-store";

const statusClassMap = {
  done: "status-done",
  planned: "status-planned",
  rest: "status-rest",
} as const;

const statusLabelMap = {
  done: "Done",
  planned: "Planned",
  rest: "Rest",
} as const;

type Tile = {
  label: string;
  title: string;
  status: keyof typeof statusClassMap;
  dayNumber?: number;
};

export function PlannerScreen() {
  const router = useRouter();
  const [program] = useState(() => getProgram());
  const [currentWeek, setCurrentWeek] = useState(() => getPrefs().currentWeek);
  const updateWeek = (nextWeek: number) => {
    setCurrentWeek(nextWeek);
    savePrefs({ currentWeek: nextWeek });
  };

  const completedDays = getCompletedDays(currentWeek);
  const tiles = useMemo<Tile[]>(() => {
    const workoutTiles: Tile[] = [
      { label: "Mon", dayNumber: 1, title: getProgramDay(program, currentWeek, 1)?.title ?? "Pull", status: "planned" },
      { label: "Tue", dayNumber: 2, title: getProgramDay(program, currentWeek, 2)?.title ?? "Push", status: "planned" },
      {
        label: "Wed",
        dayNumber: 3,
        title: getProgramDay(program, currentWeek, 3)?.title ?? "Legs / Density",
        status: "planned",
      },
      { label: "Thu", dayNumber: 4, title: getProgramDay(program, currentWeek, 4)?.title ?? "Pull", status: "planned" },
      { label: "Fri", dayNumber: 5, title: getProgramDay(program, currentWeek, 5)?.title ?? "Push", status: "planned" },
      { label: "Sat", title: "Recovery", status: "rest" },
      { label: "Sun", title: "Recovery", status: "rest" },
    ];

    return workoutTiles.map((tile) => {
      if (tile.dayNumber && completedDays.includes(tile.dayNumber)) {
        return { ...tile, status: "done" as const };
      }
      return tile;
    });
  }, [completedDays, currentWeek, program]);

  return (
    <section className="screen">
      <header className="screen-head reveal">
        <div>
          <h1 className="page-title">Planner</h1>
          <p className="page-note">Weekly assignments and completion status from your logged sessions.</p>
        </div>
        <SyncStateIndicator state="synced" />
      </header>

      <article className="card panel reveal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <div>
            <p className="subtle-label" style={{ margin: 0 }}>
              Week Timeline
            </p>
            <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
              Week {currentWeek}
            </h2>
          </div>
          <div className="cycle-toolbar">
            <label className="compact-field">
              <span className="subtle-label">Week</span>
              <select className="compact-select" value={currentWeek} onChange={(event) => updateWeek(Number(event.target.value))}>
                {program.weeks.map((week) => (
                  <option key={week.weekNumber} value={week.weekNumber}>
                    Week {week.weekNumber}
                  </option>
                ))}
              </select>
            </label>
            <div className="compact-stepper">
            <button
              type="button"
              className="ghost-btn"
              style={{ height: "34px" }}
              onClick={() => updateWeek(currentWeek <= 1 ? 12 : currentWeek - 1)}
            >
              {"<"}
            </button>
            <button
              type="button"
              className="ghost-btn"
              style={{ height: "34px" }}
              onClick={() => updateWeek(currentWeek >= 12 ? 1 : currentWeek + 1)}
            >
              {">"}
            </button>
            </div>
          </div>
        </div>

        <div className="week-strip" style={{ marginTop: "0.9rem" }}>
          {tiles.map((tile) => (
            <button
              key={`${tile.label}-${tile.title}`}
              type="button"
              className="day-tile"
              onClick={() => {
                if (!tile.dayNumber) {
                  return;
                }
                savePrefs({ currentWeek, currentDay: tile.dayNumber });
                router.push("/today");
              }}
              style={{ textAlign: "left", cursor: tile.dayNumber ? "pointer" : "default" }}
            >
              <p className="subtle-label" style={{ margin: 0 }}>
                {tile.label}
              </p>
              <p style={{ margin: "0.35rem 0 0", fontSize: "0.92rem" }}>{tile.title}</p>
              <p className={`day-status ${statusClassMap[tile.status]}`}>{statusLabelMap[tile.status]}</p>
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}
