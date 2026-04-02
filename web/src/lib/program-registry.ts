import type { ProgramExercise } from "./program-data";
import { getDayForWeek, getDefaultRestSeconds } from "./program-data";
import { getDayForWeekMaxVolume } from "./program-data-mass-impact-max-volume";
import { RAVAGE_PROGRAM, getRavageDayTemplate } from "./program-data-ravage";
import { RAMPAGE_PROGRAM, getRampageDayTemplate } from "./program-data-rampage";
import { UPPER_LOWER_PROGRAM, getUpperLowerDayTemplate } from "./program-data-upper-lower";
import { getHersDayTemplate } from "./program-data-hers";
import { getMinimalistDayTemplate } from "./program-data-nippard-minimalist";
import type { ProgramMeta } from "./types";
import type { HouseholdUser } from "./household-profiles";

// Program metadata for all programs
export const PROGRAM_REGISTRY: ProgramMeta[] = [
  {
    id: "mass-impact",
    name: "Mass Impact",
    profile: "both",
    daysPerCycle: 5,
    cycleLength: 12,
    periodizationType: "block",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "mass-impact-max-volume",
    name: "Mass Impact (Max Volume)",
    profile: "both",
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
    id: "rampage",
    name: "RAMPAGE",
    profile: "his",
    daysPerCycle: 3,
    cycleLength: 10,
    periodizationType: "double-progression",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "upper-lower",
    name: "4-Day Upper/Lower",
    profile: "his",
    daysPerCycle: 4,
    cycleLength: 12,
    periodizationType: "double-progression",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "nippard-minimalist",
    name: "Nippard Minimalist",
    profile: "both",
    daysPerCycle: 2,
    cycleLength: 0,
    periodizationType: "auto-regulated",
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
  if (programId === "mass-impact-max-volume") {
    const day = getDayForWeekMaxVolume(weekNumber, dayNumber);
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
  if (programId === "rampage") {
    const template = getRampageDayTemplate(dayNumber);
    if (!template) return [];
    const isDeload =
      RAMPAGE_PROGRAM.weeks.find((w) => w.weekNumber === weekNumber)?.isDeload ?? false;
    return template.exercises.map((ex, i) => {
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
  if (programId === "upper-lower") {
    const template = getUpperLowerDayTemplate(dayNumber);
    if (!template) return [];
    const isDeload =
      UPPER_LOWER_PROGRAM.weeks.find((w) => w.weekNumber === weekNumber)?.isDeload ?? false;
    return template.exercises.map((ex, i) => {
      // Deload: cut sets in half (round up), not down to 1
      const setGroups = isDeload
        ? ex.setGroups.map((sg) => ({ ...sg, sets: Math.ceil(sg.sets / 2) }))
        : ex.setGroups;
      return {
        order: i + 1,
        orderLabel: ex.orderLabel,
        name: ex.name,
        setGroups,
        restSeconds: getDefaultRestSeconds(ex.name),
      } satisfies ProgramExercise;
    });
  }
  if (programId === "nippard-minimalist") {
    const template = getMinimalistDayTemplate(dayNumber);
    if (!template) return [];
    return template.exercises.map((ex, i) => ({
      order: i + 1,
      orderLabel: ex.orderLabel,
      name: ex.name,
      setGroups: ex.setGroups,
      restSeconds: getDefaultRestSeconds(ex.name),
      supersetGroup: ex.supersetGroup,
      notes: ex.notes,
    } satisfies ProgramExercise));
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
  if (programId === "mass-impact-max-volume") {
    const titles = ["Pull", "Push", "Legs / Density", "Pull", "Push"];
    return titles[dayNumber - 1] ?? `Day ${dayNumber}`;
  }
  if (programId === "ravage") {
    return getRavageDayTemplate(dayNumber)?.title ?? `Day ${dayNumber}`;
  }
  if (programId === "rampage") {
    return getRampageDayTemplate(dayNumber)?.title ?? `Day ${dayNumber}`;
  }
  if (programId === "upper-lower") {
    return getUpperLowerDayTemplate(dayNumber)?.title ?? `Day ${dayNumber}`;
  }
  if (programId === "nippard-minimalist") {
    return getMinimalistDayTemplate(dayNumber)?.title ?? `Day ${dayNumber}`;
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
