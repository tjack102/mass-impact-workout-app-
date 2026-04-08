import type { ProgramExercise } from "./program-data";
import { getDayForWeek, getDefaultRestSeconds } from "./program-data";
import { getDayForWeekMaxVolume } from "./program-data-mass-impact-max-volume";
import { RAVAGE_PROGRAM, getRavageDayTemplate } from "./program-data-ravage";
import { RAMPAGE_PROGRAM, getRampageDayTemplate } from "./program-data-rampage";
import { UPPER_LOWER_PROGRAM, getUpperLowerDayTemplate } from "./program-data-upper-lower";
import { getHersDayTemplate } from "./program-data-hers";
import { getMinimalistDayTemplate } from "./program-data-nippard-minimalist";
import { getSplitDayTemplate } from "./program-data-splits";
import type { RpProgramState } from "./rp-types";
import type { RpTemplate } from "./rp-types";
import { RP_TEMPLATE_NF3 } from "./rp-template-nf3";
import { RP_TEMPLATE_NF4 } from "./rp-template-nf4";
import { RP_TEMPLATE_NA4 } from "./rp-template-na4";
import { RP_TEMPLATE_NC4 } from "./rp-template-nc4";
import {
  getWeekWeight,
  getDeloadWeight,
  getCurrentSets,
  getDeloadSets,
  getRirTarget,
  isDeloadWeek,
  getMesoRestSeconds,
} from "./rp-engine";
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
    profile: "both",
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
  {
    id: "rp-nf3",
    name: "RP Full Body 3-Day",
    profile: "both",
    daysPerCycle: 3,
    cycleLength: 13,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "rp-nf4",
    name: "RP Full Body 4-Day",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 13,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "rp-na4",
    name: "RP Arms-Focus 4-Day",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 13,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "rp-nc4",
    name: "RP Chest/Back 4-Day",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 13,
    periodizationType: "auto-regulated",
    hasAutoRegulation: true,
    hasVolumeTracking: true,
  },
  {
    id: "split-fb3",
    name: "Full Body 3-Day (Push/Legs/Pull)",
    profile: "both",
    daysPerCycle: 3,
    cycleLength: 0,
    periodizationType: "double-progression",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "split-fb4",
    name: "Full Body 4-Day (Upper/Lower)",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 0,
    periodizationType: "double-progression",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "split-arms4",
    name: "Arms-Focus 4-Day",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 0,
    periodizationType: "double-progression",
    hasAutoRegulation: false,
    hasVolumeTracking: true,
  },
  {
    id: "split-chest4",
    name: "Chest/Back 4-Day",
    profile: "both",
    daysPerCycle: 4,
    cycleLength: 0,
    periodizationType: "double-progression",
    hasAutoRegulation: false,
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

// Helper to look up RP template by program ID
export function getRpTemplate(programId: string): RpTemplate | undefined {
  switch (programId) {
    case "rp-nf3": return RP_TEMPLATE_NF3;
    case "rp-nf4": return RP_TEMPLATE_NF4;
    case "rp-na4": return RP_TEMPLATE_NA4;
    case "rp-nc4": return RP_TEMPLATE_NC4;
    default: return undefined;
  }
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
  if (programId.startsWith("split-")) {
    const template = getSplitDayTemplate(programId, dayNumber);
    if (!template) return [];
    return template.exercises;
  }
  if (programId.startsWith("rp-")) {
    // RP programs use getRpExercisesForDay() instead -- called by today-screen directly
    return [];
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
  if (programId.startsWith("split-")) {
    const template = getSplitDayTemplate(programId, dayNumber);
    return template?.title ?? `Day ${dayNumber}`;
  }
  if (programId.startsWith("rp-")) {
    const template = getRpTemplate(programId);
    return template?.dayTitles[dayNumber - 1] ?? `Day ${dayNumber}`;
  }
  return `Day ${dayNumber}`;
}

// Get total days in cycle for a program
export function getDaysInCycle(programId: string): number {
  return getProgramMeta(programId)?.daysPerCycle ?? 5;
}

/**
 * Build ProgramExercise[] for an RP program day.
 * Pure function -- caller passes rpState from localStorage.
 */
export function getRpExercisesForDay(
  templateId: string,
  dayNumber: number,
  rpState: RpProgramState,
): ProgramExercise[] {
  const template = getRpTemplate(templateId);
  if (!template) return [];

  const meso = rpState.currentMeso;
  const week = rpState.currentWeek;
  const deload = isDeloadWeek(meso, week);
  const restRange = getMesoRestSeconds(meso);
  const daySlots = template.slots.filter(s => s.dayNumber === dayNumber);

  // Build superset group map: for each slot that has supersetWith, group them
  const supersetMap = new Map<string, string>();
  let ssCounter = 0;
  for (const slot of daySlots) {
    if (slot.supersetWith && meso === "metabolite") {
      const partnerId = slot.supersetWith;
      // Check if partner already has a group
      const existingGroup = supersetMap.get(partnerId);
      if (existingGroup) {
        supersetMap.set(slot.slotId, existingGroup);
      } else {
        ssCounter++;
        const group = `ss-${ssCounter}`;
        supersetMap.set(slot.slotId, group);
        supersetMap.set(partnerId, group);
      }
    }
  }

  // Determine order labels -- supersets get A/B suffixes
  const orderLabels: string[] = [];
  let labelNum = 0;
  const assignedGroups = new Map<string, { num: number; nextSuffix: string }>();
  for (const slot of daySlots) {
    const ssGroup = supersetMap.get(slot.slotId);
    if (ssGroup) {
      const existing = assignedGroups.get(ssGroup);
      if (existing) {
        orderLabels.push(`${existing.num}${existing.nextSuffix}`);
        existing.nextSuffix = String.fromCharCode(existing.nextSuffix.charCodeAt(0) + 1);
      } else {
        labelNum++;
        orderLabels.push(`${labelNum}A`);
        assignedGroups.set(ssGroup, { num: labelNum, nextSuffix: "B" });
      }
    } else {
      labelNum++;
      orderLabels.push(String(labelNum));
    }
  }

  const exercises: ProgramExercise[] = [];
  let orderNum = 1;

  for (let i = 0; i < daySlots.length; i++) {
    const slot = daySlots[i];
    const sel = rpState.selections[slot.slotId];
    if (!sel) continue;

    // Detect if this is a superset secondary (its supersetWith partner is in a lower order position)
    const isSupersetSecondary = !!(slot.supersetWith &&
      daySlots.findIndex(s => s.slotId === slot.supersetWith) < i);

    const sets = deload
      ? getDeloadSets()
      : getCurrentSets(slot, meso, week, rpState.ratings);

    const weight = deload
      ? getDeloadWeight(sel.tenRepMax, meso, i >= daySlots.length / 2)
      : getWeekWeight(sel.tenRepMax, meso, week, isSupersetSecondary);

    const rir = getRirTarget(week, deload);
    const repRange = meso === "basic" ? "8-12 reps"
      : meso === "metabolite" ? "15-25 reps"
      : "5-8 reps";

    exercises.push({
      order: orderNum,
      orderLabel: orderLabels[i],
      name: sel.exerciseName,
      setGroups: [{ sets, reps: repRange }],
      restSeconds: restRange.min,
      prescribedWeight: weight,
      rirTarget: rir,
      rpSlotId: slot.slotId,
      supersetGroup: supersetMap.get(slot.slotId),
    });

    orderNum++;
  }

  return exercises;
}
