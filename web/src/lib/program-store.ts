import { resolveUser, type HouseholdUser } from "@/lib/household-profiles";
import { MASS_IMPACT_PROGRAM, cloneProgram, type Program, type ProgramDay } from "@/lib/program-data";

const PROGRAM_KEY = "mi_program";

export type ProgramsByUser = Record<HouseholdUser, Program>;

function getDefaultPrograms(): ProgramsByUser {
  return {
    his: cloneProgram(MASS_IMPACT_PROGRAM),
    hers: cloneProgram(MASS_IMPACT_PROGRAM),
  };
}

function clonePrograms(programs: ProgramsByUser): ProgramsByUser {
  return {
    his: cloneProgram(programs.his),
    hers: cloneProgram(programs.hers),
  };
}

function readPrograms(): ProgramsByUser {
  if (typeof window === "undefined") {
    return getDefaultPrograms();
  }

  try {
    const raw = window.localStorage.getItem(PROGRAM_KEY);
    if (!raw) {
      return getDefaultPrograms();
    }
    const parsed = JSON.parse(raw) as Partial<ProgramsByUser> | Program;
    if ("weeks" in parsed) {
      const legacyProgram = parsed as Program;
      return {
        his: cloneProgram(legacyProgram),
        hers: cloneProgram(legacyProgram),
      };
    }
    return {
      his: cloneProgram((parsed as Partial<ProgramsByUser>).his ?? MASS_IMPACT_PROGRAM),
      hers: cloneProgram((parsed as Partial<ProgramsByUser>).hers ?? MASS_IMPACT_PROGRAM),
    };
  } catch {
    return getDefaultPrograms();
  }
}

function writePrograms(programs: ProgramsByUser): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROGRAM_KEY, JSON.stringify(programs));
}

export function getProgram(user?: HouseholdUser): Program {
  return cloneProgram(readPrograms()[resolveUser(user)]);
}

export function getProgramsByUser(): ProgramsByUser {
  return clonePrograms(readPrograms());
}

export function saveProgram(program: Program, user?: HouseholdUser): Program {
  const programs = readPrograms();
  const targetUser = resolveUser(user);
  programs[targetUser] = cloneProgram(program);
  writePrograms(programs);
  return cloneProgram(programs[targetUser]);
}

export function saveProgramsByUser(programs: ProgramsByUser): ProgramsByUser {
  const cloned = clonePrograms(programs);
  writePrograms(cloned);
  return cloned;
}

export function resetProgram(user?: HouseholdUser): Program {
  const programs = readPrograms();
  const targetUser = resolveUser(user);
  programs[targetUser] = cloneProgram(MASS_IMPACT_PROGRAM);
  writePrograms(programs);
  return cloneProgram(programs[targetUser]);
}

export function clearProgram(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(PROGRAM_KEY);
}

export function getProgramDay(program: Program, weekNumber: number, dayNumber: number): ProgramDay | undefined {
  const week = program.weeks.find((item) => item.weekNumber === weekNumber);
  return week?.days.find((day) => day.dayNumber === dayNumber);
}
