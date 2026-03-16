import type { ProgramExercise } from "./program-data";
import { getDayForWeek, getDefaultRestSeconds } from "./program-data";
import { RAVAGE_PROGRAM, getRavageDayTemplate } from "./program-data-ravage";
import { getHersDayTemplate } from "./program-data-hers";
import type { ProgramMeta } from "./types";
import type { HouseholdUser } from "./household-profiles";

// Program metadata for all programs
export const PROGRAM_REGISTRY: ProgramMeta[] = [
  {
    id: "mass-impact",
    name: "Mass Impact",
    profile: "his",
    daysPerCycle: 5,
    cycleLength: 12,
    periodizationType: "block",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "ravage",
    name: "RAVAGE",
    profile: "his",
    daysPerCycle: 6,
    cycleLength: 10,
    periodizationType: "double-progression",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "hers-lulul",
    name: "LULUL (Glute Emphasis)",
    profile: "hers",
    daysPerCycle: 5,
    cycleLength: 0,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "hers-pplpp",
    name: "PPLPP",
    profile: "hers",
    daysPerCycle: 5,
    cycleLength: 0,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "hers-custom",
    name: "Custom Glute-Emphasis",
    profile: "hers",
    daysPerCycle: 5,
    cycleLength: 0,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
];

// Get programs available for a profile
export function getAvailablePrograms(profile: HouseholdUser): ProgramMeta[] {
  return PROGRAM_REGISTRY.filter((p) => p.profile === profile || p.profile === "both");
}

// Get program metadata by ID
export function getProgramMeta(programId: string): ProgramMeta | undefined {
  return PROGRAM_REGISTRY.find((p) => p.id === programId);
}

// Get exercises for a specific program/day/week, adapted to ProgramExercise[]
// ALL programs return ProgramExercise[] — uniform interface for today-screen.tsx
export function getExercisesForDay(
  programId: string,
  dayNumber: number,
  weekNumber: number
): ProgramExercise[] {
  if (programId === "mass-impact") {
    // Delegate to existing getDayForWeek() from program-data.ts
    const day = getDayForWeek(weekNumber, dayNumber);
    return day?.exercises ?? [];
  }
  if (programId === "ravage") {
    const template = getRavageDayTemplate(dayNumber);
    if (!template) return [];
    const isDeload =
      RAVAGE_PROGRAM.weeks.find((w) => w.weekNumber === weekNumber)?.isDeload ?? false;
    return template.exercises.map((ex, i) => {
      // On deload weeks reduce every set group to 1 set to lower volume
      const setGroups = isDeload
        ? ex.setGroups.map((sg) => ({ ...sg, sets: 1 }))
        : ex.setGroups;
      return {
        order: i + 1,
        orderLabel: ex.orderLabel,
        name: ex.name,
        setGroups,
        restSeconds: getDefaultRestSeconds(ex.name),
        supersetGroup: ex.supersetGroup,
      } satisfies ProgramExercise;
    });
  }
  if (programId.startsWith("hers-")) {
    const template = getHersDayTemplate(programId, dayNumber);
    if (!template) return [];
    return template.exercises.map((ex, i) => ({
      order: i + 1,
      orderLabel: ex.orderLabel,
      name: ex.name,
      setGroups: [{ sets: ex.sets, reps: ex.reps }],
      restSeconds: getDefaultRestSeconds(ex.name),
      supersetGroup: ex.supersetGroup,
    } satisfies ProgramExercise));
  }
  return [];
}

// Get day title for display
export function getDayTitle(programId: string, dayNumber: number): string {
  // Mass Impact titles (from program-data.ts)
  if (programId === "mass-impact") {
    const titles = ["Pull", "Push", "Legs / Density", "Pull", "Push"];
    return titles[dayNumber - 1] ?? `Day ${dayNumber}`;
  }
  if (programId === "ravage") {
    return getRavageDayTemplate(dayNumber)?.title ?? `Day ${dayNumber}`;
  }
  if (programId.startsWith("hers-")) {
    return getHersDayTemplate(programId, dayNumber)?.title ?? `Day ${dayNumber}`;
  }
  return `Day ${dayNumber}`;
}

// Get total days in cycle for a program
export function getDaysInCycle(programId: string): number {
  return getProgramMeta(programId)?.daysPerCycle ?? 5;
}
