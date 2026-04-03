"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { SyncStateIndicator } from "@/components/sync-state-indicator";
import { getCompletedDays, getPrefs, savePrefs } from "@/lib/workout-store";
import { getProgramMeta, getDaysInCycle, getDayTitle } from "@/lib/program-registry";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { RAVAGE_PROGRAM } from "@/lib/program-data-ravage";

const statusClassMap = {
  done: "status-done",
  planned: "status-planned",
} as const;

const statusLabelMap = {
  done: "Done",
  planned: "Planned",
} as const;

type Tile = {
  label: string;
  title: string;
  status: keyof typeof statusClassMap;
  dayNumber: number;
};

export function PlannerScreen() {
  const router = useRouter();

  // Read program ID from the active profile's stored prefs
  const programId = useMemo(() => {
    const stored = getStoredPrefsFromLocalStorage();
    const activeUser = stored.activeUser;
    return stored.profiles[activeUser].selectedProgram ?? "mass-impact";
  }, []);

  const programMeta = useMemo(() => getProgramMeta(programId), [programId]);

  // For ongoing programs (cycleLength === 0) cap the week selector at 52
  const totalWeeks = useMemo(() => {
    if (!programMeta) return 12;
    return programMeta.cycleLength === 0 ? 52 : programMeta.cycleLength;
  }, [programMeta]);

  const daysPerCycle = useMemo(() => getDaysInCycle(programId), [programId]);

  // isOngoing = no fixed end (auto-regulated programs)
  const isOngoing = programMeta?.cycleLength === 0;

  const [currentWeek, setCurrentWeek] = useState(() => getPrefs().currentWeek);
  const updateWeek = (nextWeek: number) => {
    setCurrentWeek(nextWeek);
    savePrefs({ currentWeek: nextWeek });
  };

  // Detect deload for RAVAGE only — for auto-regulated programs, deload detection is Task 21
  const isDeloadWeek = useMemo(() => {
    if (programId !== "ravage") return false;
    return RAVAGE_PROGRAM.weeks.find((w) => w.weekNumber === currentWeek)?.isDeload ?? false;
  }, [programId, currentWeek]);

  const completedDays = getCompletedDays(currentWeek);

  const tiles = useMemo<Tile[]>(() => {
    return Array.from({ length: daysPerCycle }, (_, i) => {
      const dayNumber = i + 1;
      const status: keyof typeof statusClassMap = completedDays.includes(dayNumber) ? "done" : "planned";
      return {
        label: `Day ${dayNumber}`,
        dayNumber,
        title: getDayTitle(programId, dayNumber),
        status,
      };
    });
  }, [daysPerCycle, completedDays, currentWeek, programId]);

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
        <div className="flex justify-between items-center gap-2">
          <div>
            <p className="subtle-label">
              Week Timeline
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="section-title">
                {isOngoing ? `Week ${currentWeek}` : `Week ${currentWeek} of ${totalWeeks}`}
              </h2>
              {isDeloadWeek && (
                <span
                  style={{
                    background: "var(--accent-power, #f08a24)",
                    color: "var(--bg-0, #0b0d10)",
                    borderRadius: "var(--radius-sm, 4px)",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    padding: "0.15em 0.5em",
                    textTransform: "uppercase",
                    lineHeight: 1.4,
                  }}
                >
                  DELOAD
                </span>
              )}
            </div>
          </div>
          <div className="cycle-toolbar">
            <label className="compact-field">
              <span className="subtle-label">Week</span>
              <select className="compact-select" value={currentWeek} onChange={(event) => updateWeek(Number(event.target.value))}>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((weekNum) => (
                  <option key={weekNum} value={weekNum}>
                    Week {weekNum}
                  </option>
                ))}
              </select>
            </label>
            <div className="compact-stepper">
              <button
                type="button"
                className="ghost-btn"
                aria-label="Previous week"
                style={{ minHeight: "44px" }}
                onClick={() => updateWeek(currentWeek <= 1 ? totalWeeks : currentWeek - 1)}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="ghost-btn"
                aria-label="Next week"
                style={{ minHeight: "44px" }}
                onClick={() => updateWeek(currentWeek >= totalWeeks ? 1 : currentWeek + 1)}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="week-strip" style={{ marginTop: "0.9rem" }}>
          {tiles.map((tile) => (
            <button
              key={`day-${tile.dayNumber}`}
              type="button"
              className="day-tile"
              aria-label={`${tile.label}: ${tile.title || "Rest"}`}
              onClick={() => {
                savePrefs({ currentWeek, currentDay: tile.dayNumber });
                router.push("/today");
              }}
              style={{ textAlign: "left", cursor: "pointer", minHeight: "44px" }}
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
