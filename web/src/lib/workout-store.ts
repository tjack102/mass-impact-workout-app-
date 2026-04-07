import type { Program } from "@/lib/program-data";
import {
  getActiveUserFromLocalStorage,
  getDefaultStoredPrefs,
  getStoredPrefsFromLocalStorage,
  parseStoredPrefs,
  PREFS_STORAGE_KEY,
  type HouseholdUser,
  type StoredPrefs,
} from "@/lib/household-profiles";
import {
  clearProgram,
  getProgramsByUser,
  saveProgram,
  saveProgramsByUser,
  type ProgramsByUser,
} from "@/lib/program-store";

export type LoggedSet = {
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number;
  rpe?: number;
  timestamp: number;
};

export type WorkoutSession = {
  id: string;
  programId: string;
  weekNumber: number;
  dayNumber: number;
  startedAt: number;
  completedAt?: number;
  sets: LoggedSet[];
  // Session-only overrides: keyed by exercise name, values replace template scheme for this session
  overrides?: Record<string, { sets?: number; reps?: string }>;
  substitutions?: Record<string, string>;  // originalExerciseName -> replacementExerciseName
};

export type UserPrefs = {
  currentWeek: number;
  currentDay: number;
  activeUser: HouseholdUser;
};

export type WorkoutSnapshot = {
  exportedAt: number;
  prefs: StoredPrefs;
  sessionsByUser: SessionsByUser;
  activeSessionsByUser: ActiveSessionsByUser;
  programsByUser: ProgramsByUser;
  sessions?: WorkoutSession[];
  activeSession?: WorkoutSession | null;
  program?: Program;
};

export type SessionsByUser = Record<HouseholdUser, WorkoutSession[]>;

export type ActiveSessionsByUser = Record<HouseholdUser, WorkoutSession | null>;

export const KEYS = {
  PREFS: PREFS_STORAGE_KEY,
  SESSIONS: "mi_sessions",
  ACTIVE_SESSION: "mi_active_session",
} as const;

// Only dispatches on session lifecycle changes (null → session, session → null).
// saveActiveSession and logSet mutate within an existing session and don't need to fire.
function dispatchSessionChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("workout-session-change"));
  }
}

function readRaw(key: string): unknown {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getStoredPrefs(): StoredPrefs {
  return getStoredPrefsFromLocalStorage();
}

function writeStoredPrefs(prefs: StoredPrefs): void {
  write(KEYS.PREFS, prefs);
}

function toUserPrefs(storedPrefs: StoredPrefs): UserPrefs {
  const activeProfile = storedPrefs.profiles[storedPrefs.activeUser];
  return {
    activeUser: storedPrefs.activeUser,
    currentWeek: activeProfile.currentWeek,
    currentDay: activeProfile.currentDay,
  };
}

function getDefaultSessionsByUser(): SessionsByUser {
  return {
    his: [],
    hers: [],
  };
}

function getDefaultActiveSessionsByUser(): ActiveSessionsByUser {
  return {
    his: null,
    hers: null,
  };
}

function readSessionsByUser(): SessionsByUser {
  const raw = readRaw(KEYS.SESSIONS);
  if (Array.isArray(raw)) {
    const legacySessions = raw as WorkoutSession[];
    return {
      his: [...legacySessions],
      hers: [...legacySessions],
    };
  }

  if (!raw || typeof raw !== "object") {
    return getDefaultSessionsByUser();
  }

  const sessions = raw as Partial<SessionsByUser>;
  return {
    his: Array.isArray(sessions.his) ? sessions.his : [],
    hers: Array.isArray(sessions.hers) ? sessions.hers : [],
  };
}

function writeSessionsByUser(sessionsByUser: SessionsByUser): void {
  write(KEYS.SESSIONS, sessionsByUser);
}

function readActiveSessionsByUser(): ActiveSessionsByUser {
  const raw = readRaw(KEYS.ACTIVE_SESSION);
  if (raw && typeof raw === "object" && "id" in raw) {
    const legacySession = raw as WorkoutSession;
    const activeUser = getActiveUserFromLocalStorage();
    return {
      his: activeUser === "his" ? legacySession : null,
      hers: activeUser === "hers" ? legacySession : null,
    };
  }

  if (!raw || typeof raw !== "object") {
    return getDefaultActiveSessionsByUser();
  }

  const sessions = raw as Partial<ActiveSessionsByUser>;
  return {
    his: sessions.his ?? null,
    hers: sessions.hers ?? null,
  };
}

function writeActiveSessionsByUser(activeSessionsByUser: ActiveSessionsByUser): void {
  write(KEYS.ACTIVE_SESSION, activeSessionsByUser);
}

function resolveUser(user?: HouseholdUser): HouseholdUser {
  return user ?? getStoredPrefs().activeUser;
}

// Run once per page load to backfill programId on sessions created before it existed
let migrated = false;

function migrateSessionData(): void {
  if (typeof window === "undefined") return;
  if (migrated) return;
  migrated = true;

  // Migrate completed sessions
  const rawSessions = readRaw(KEYS.SESSIONS);
  if (rawSessions && typeof rawSessions === "object") {
    const byUser = rawSessions as Partial<SessionsByUser>;
    let changed = false;

    const migrateList = (list: unknown): WorkoutSession[] => {
      if (!Array.isArray(list)) return [];
      return list.map((session: WorkoutSession) => {
        if (!session.programId) {
          changed = true;
          return { ...session, programId: "mass-impact" };
        }
        return session;
      });
    };

    const nextHis = migrateList(byUser.his);
    const nextHers = migrateList(byUser.hers);

    if (changed) {
      writeSessionsByUser({ his: nextHis, hers: nextHers });
    }
  }

  // Migrate active session
  const rawActive = readRaw(KEYS.ACTIVE_SESSION);
  if (rawActive && typeof rawActive === "object") {
    const byUser = rawActive as Partial<ActiveSessionsByUser>;
    let activeChanged = false;

    const migrateOne = (session: WorkoutSession | null | undefined): WorkoutSession | null => {
      if (!session) return null;
      if (!session.programId) {
        activeChanged = true;
        return { ...session, programId: "mass-impact" };
      }
      return session;
    };

    const nextHisActive = migrateOne(byUser.his ?? null);
    const nextHersActive = migrateOne(byUser.hers ?? null);

    if (activeChanged) {
      writeActiveSessionsByUser({ his: nextHisActive, hers: nextHersActive });
    }
  }
}

export function getPrefs(): UserPrefs {
  return toUserPrefs(getStoredPrefs());
}

export function savePrefs(prefs: Partial<UserPrefs>): UserPrefs {
  const current = getStoredPrefs();
  const nextActiveUser = prefs.activeUser ?? current.activeUser;
  const currentProfile = current.profiles[nextActiveUser] ?? getDefaultStoredPrefs().profiles[nextActiveUser];

  const updated: StoredPrefs = {
    activeUser: nextActiveUser,
    profiles: {
      ...current.profiles,
      [nextActiveUser]: {
        currentWeek: prefs.currentWeek ?? currentProfile.currentWeek,
        currentDay: prefs.currentDay ?? currentProfile.currentDay,
        // Preserve selectedProgram — savePrefs only manages week/day progression
        selectedProgram: currentProfile.selectedProgram,
      },
    },
  };
  writeStoredPrefs(updated);
  return toUserPrefs(updated);
}

export function getActiveSession(user?: HouseholdUser): WorkoutSession | null {
  migrateSessionData();
  return readActiveSessionsByUser()[resolveUser(user)];
}

export function startSession(
  weekNumber: number,
  dayNumber: number,
  user?: HouseholdUser,
  programId: string = "mass-impact",
): WorkoutSession {
  const targetUser = resolveUser(user);
  const session: WorkoutSession = {
    id: `${programId}-w${weekNumber}-d${dayNumber}-${Date.now()}`,
    programId,
    weekNumber,
    dayNumber,
    startedAt: Date.now(),
    sets: [],
  };
  const activeSessions = readActiveSessionsByUser();
  activeSessions[targetUser] = session;
  writeActiveSessionsByUser(activeSessions);
  dispatchSessionChange();
  return session;
}

export function saveActiveSession(session: WorkoutSession, user?: HouseholdUser): WorkoutSession {
  const targetUser = resolveUser(user);
  const activeSessions = readActiveSessionsByUser();
  activeSessions[targetUser] = session;
  writeActiveSessionsByUser(activeSessions);
  return session;
}

export function logSet(set: LoggedSet, user?: HouseholdUser): WorkoutSession | null {
  const targetUser = resolveUser(user);
  const activeSessions = readActiveSessionsByUser();
  const session = activeSessions[targetUser];
  if (!session) {
    return null;
  }
  session.sets.push(set);
  activeSessions[targetUser] = session;
  writeActiveSessionsByUser(activeSessions);
  return session;
}

export function deleteSet(
  exerciseName: string,
  setIndex: number,
  user?: HouseholdUser
): WorkoutSession | null {
  const targetUser = resolveUser(user);
  const activeSessions = readActiveSessionsByUser();
  const session = activeSessions[targetUser];
  if (!session) {
    return null;
  }
  // Remove the set matching exerciseName and setIndex
  session.sets = session.sets.filter(
    (set) => !(set.exerciseName === exerciseName && set.setIndex === setIndex)
  );
  activeSessions[targetUser] = session;
  writeActiveSessionsByUser(activeSessions);
  return session;
}

export function completeSession(user?: HouseholdUser): WorkoutSession | null {
  const targetUser = resolveUser(user);
  const activeSessions = readActiveSessionsByUser();
  const session = activeSessions[targetUser];
  if (!session) {
    return null;
  }
  session.completedAt = Date.now();

  const sessionsByUser = readSessionsByUser();
  sessionsByUser[targetUser].push(session);
  writeSessionsByUser(sessionsByUser);

  activeSessions[targetUser] = null;
  writeActiveSessionsByUser(activeSessions);
  dispatchSessionChange();
  return session;
}

export function clearActiveSession(user?: HouseholdUser): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!user) {
    window.localStorage.removeItem(KEYS.ACTIVE_SESSION);
    dispatchSessionChange();
    return;
  }
  const activeSessions = readActiveSessionsByUser();
  activeSessions[user] = null;
  writeActiveSessionsByUser(activeSessions);
  dispatchSessionChange();
}

export function getAllSessions(user?: HouseholdUser): WorkoutSession[] {
  migrateSessionData();
  return readSessionsByUser()[resolveUser(user)];
}

export function setAllSessions(sessions: WorkoutSession[], user?: HouseholdUser): void {
  const targetUser = resolveUser(user);
  const sessionsByUser = readSessionsByUser();
  sessionsByUser[targetUser] = sessions;
  writeSessionsByUser(sessionsByUser);
}

export function getSessionsForWeekDay(weekNumber: number, dayNumber: number, user?: HouseholdUser): WorkoutSession[] {
  return getAllSessions(user).filter((session) => session.weekNumber === weekNumber && session.dayNumber === dayNumber);
}

export function getLastPerformance(exerciseName: string, user?: HouseholdUser): LoggedSet | undefined {
  const sessions = getAllSessions(user);
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const sets = sessions[index].sets.filter((set) => set.exerciseName === exerciseName);
    if (sets.length > 0) {
      return sets.reduce((best, set) => (set.weight > best.weight ? set : best), sets[0]);
    }
  }
  return undefined;
}

export function getExerciseHistory(exerciseName: string, user?: HouseholdUser): { date: number; bestSet: LoggedSet }[] {
  const sessions = getAllSessions(user);
  const history: { date: number; bestSet: LoggedSet }[] = [];

  for (const session of sessions) {
    const sets = session.sets.filter((set) => set.exerciseName === exerciseName);
    if (sets.length > 0) {
      const best = sets.reduce(
        (bestSet, set) => (set.weight * set.reps > bestSet.weight * bestSet.reps ? set : bestSet),
        sets[0],
      );
      history.push({ date: session.startedAt, bestSet: best });
    }
  }

  return history;
}

export function getWeeklyVolume(user?: HouseholdUser): { week: number; totalSets: number }[] {
  const sessions = getAllSessions(user);
  const weekMap = new Map<number, number>();

  for (const session of sessions) {
    const current = weekMap.get(session.weekNumber) ?? 0;
    weekMap.set(session.weekNumber, current + session.sets.length);
  }

  return Array.from(weekMap.entries())
    .map(([week, totalSets]) => ({ week, totalSets }))
    .sort((a, b) => a.week - b.week);
}

export function getCompletedDays(weekNumber: number, user?: HouseholdUser): number[] {
  const days = getAllSessions(user)
    .filter((session) => session.weekNumber === weekNumber && Boolean(session.completedAt))
    .map((session) => session.dayNumber);
  return Array.from(new Set(days)).sort((a, b) => a - b);
}

export function clearAllData(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(KEYS.PREFS);
  window.localStorage.removeItem(KEYS.SESSIONS);
  window.localStorage.removeItem(KEYS.ACTIVE_SESSION);
  clearProgram();
}

export function exportSnapshot(): WorkoutSnapshot {
  return {
    exportedAt: Date.now(),
    prefs: getStoredPrefs(),
    sessionsByUser: readSessionsByUser(),
    activeSessionsByUser: readActiveSessionsByUser(),
    programsByUser: getProgramsByUser(),
  };
}

export function importSnapshot(snapshot: Partial<WorkoutSnapshot>): void {
  const prefs = parseStoredPrefs(snapshot.prefs ?? getStoredPrefs());
  writeStoredPrefs(prefs);

  if (snapshot.sessionsByUser) {
    writeSessionsByUser(snapshot.sessionsByUser);
  } else if (Array.isArray(snapshot.sessions)) {
    writeSessionsByUser({
      his: [...snapshot.sessions],
      hers: [...snapshot.sessions],
    });
  }

  if (snapshot.activeSessionsByUser) {
    writeActiveSessionsByUser(snapshot.activeSessionsByUser);
  } else if (snapshot.activeSession) {
    const activeUser = prefs.activeUser ?? getActiveUserFromLocalStorage();
    writeActiveSessionsByUser({
      his: activeUser === "his" ? snapshot.activeSession : null,
      hers: activeUser === "hers" ? snapshot.activeSession : null,
    });
  } else {
    clearActiveSession();
  }

  if (snapshot.programsByUser) {
    saveProgramsByUser(snapshot.programsByUser);
  } else if (snapshot.program) {
    saveProgram(snapshot.program, "his");
    saveProgram(snapshot.program, "hers");
  }
}
