import type { ProgramExercise } from "./program-data";
import { getDefaultRestSeconds } from "./program-data";
import { RP_TEMPLATE_NF3 } from "./rp-template-nf3";
import { RP_TEMPLATE_NF4 } from "./rp-template-nf4";
import { RP_TEMPLATE_NA4 } from "./rp-template-na4";
import { RP_TEMPLATE_NC4 } from "./rp-template-nc4";
import { getRpExercisesForCategory } from "./rp-exercise-library";
import { findExercise } from "./exercise-library";
import type { RpTemplate } from "./rp-types";

const TEMPLATE_MAP: Record<string, RpTemplate> = {
  "split-fb3": RP_TEMPLATE_NF3,
  "split-fb4": RP_TEMPLATE_NF4,
  "split-arms4": RP_TEMPLATE_NA4,
  "split-chest4": RP_TEMPLATE_NC4,
};

export function getSplitDayTemplate(
  programId: string,
  dayNumber: number,
): { title: string; exercises: ProgramExercise[] } | null {
  const template = TEMPLATE_MAP[programId];
  if (!template) return null;

  const title = template.dayTitles[dayNumber - 1];
  if (!title) return null;

  const daySlots = template.slots.filter(
    s => s.dayNumber === dayNumber && s.baseSets.basic > 0
  );

  const usedNames = new Set<string>();
  const exercises: ProgramExercise[] = daySlots.map((slot, i) => {
    const categoryExercises = getRpExercisesForCategory(slot.muscleCategory);
    const name = categoryExercises.find(e => !usedNames.has(e)) ?? categoryExercises[0] ?? slot.muscleCategory;
    usedNames.add(name);
    const def = findExercise(name);
    const isIsolation = def?.type === "isolation";
    const reps = isIsolation ? "10-15 reps" : "8-12 reps";

    return {
      order: i + 1,
      orderLabel: String(i + 1),
      name,
      setGroups: [{ sets: slot.baseSets.basic, reps }],
      restSeconds: getDefaultRestSeconds(name),
    };
  });

  return { title, exercises };
}
