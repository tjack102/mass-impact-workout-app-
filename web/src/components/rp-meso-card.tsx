"use client";

import type { RpMesoType } from "@/lib/rp-types";

const MESO_NAMES: Record<RpMesoType, string> = {
  basic: "Basic Hypertrophy",
  metabolite: "Metabolite Focus",
  resensitization: "Resensitization",
};

const MESO_NUMBER: Record<RpMesoType, number> = {
  basic: 1,
  metabolite: 2,
  resensitization: 3,
};

function getWeekMultiplierLabel(week: number, isDeload: boolean): string {
  if (isDeload) return "Deload";
  const labels: Record<number, string> = { 1: "Base", 2: "+5%", 3: "+7.5%", 4: "+10%" };
  return labels[week] ?? "Base";
}

function formatRestRange(range: { min: number; max: number }): string {
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return `${fmt(range.min)} - ${fmt(range.max)}`;
}

interface RpMesoCardProps {
  meso: RpMesoType;
  currentWeek: number;
  totalWeeks: number;
  daysPerWeek: number;
  dayTitles: string[];
  completedDays: Set<number>;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  rirTarget: string;
  restRange: { min: number; max: number };
  isDeload: boolean;
  allDaysComplete: boolean;
  onAdvanceWeek: () => void;
  onCompleteMeso: () => void;
}

export function RpMesoCard({
  meso,
  currentWeek,
  totalWeeks,
  daysPerWeek,
  dayTitles,
  completedDays,
  selectedDay,
  onSelectDay,
  rirTarget,
  restRange,
  isDeload,
  allDaysComplete,
  onAdvanceWeek,
  onCompleteMeso,
}: RpMesoCardProps) {
  const mesoNum = MESO_NUMBER[meso];
  const weightLabel = getWeekMultiplierLabel(currentWeek, isDeload);

  return (
    <div className={`rp-meso-card${isDeload ? " rp-meso-card--deload" : ""}`}>
      {/* Header */}
      <div className="rp-meso-header">
        <span className="rp-meso-title">
          Meso {mesoNum}: {MESO_NAMES[meso]}
        </span>
        <span className="rp-meso-week">
          Week {currentWeek} of {totalWeeks}
          {isDeload && <span className="rp-deload-badge">DELOAD</span>}
        </span>
      </div>

      {/* Day checkboxes */}
      <div className="rp-day-row">
        {Array.from({ length: daysPerWeek }, (_, i) => i + 1).map((day) => {
          const done = completedDays.has(day);
          const active = day === selectedDay;
          return (
            <button
              key={day}
              type="button"
              className={`rp-day-btn${done ? " rp-day-btn--done" : ""}${active ? " rp-day-btn--active" : ""}`}
              onClick={() => onSelectDay(day)}
              title={dayTitles[day - 1] ?? `Day ${day}`}
            >
              <span className="rp-day-check">{done ? "✓" : "○"}</span>
              <span className="rp-day-label">Day {day}</span>
            </button>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="rp-meso-stats">
        <div>
          <span className="queue-card-label">RIR</span>
          <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>{rirTarget}</span>
        </div>
        <div>
          <span className="queue-card-label">REST</span>
          <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>{formatRestRange(restRange)}</span>
        </div>
        <div>
          <span className="queue-card-label">WEIGHT</span>
          <span className="queue-card-value" style={{ fontSize: "0.9rem" }}>{weightLabel}</span>
        </div>
      </div>

      {/* Advance button */}
      {allDaysComplete && !isDeload && (
        <button type="button" className="btn-primary" style={{ width: "100%", marginTop: "12px" }} onClick={onAdvanceWeek}>
          Advance to Week {currentWeek + 1}
        </button>
      )}
      {allDaysComplete && isDeload && (
        <button type="button" className="btn-primary" style={{ width: "100%", marginTop: "12px" }} onClick={onCompleteMeso}>
          Complete Mesocycle
        </button>
      )}
    </div>
  );
}
