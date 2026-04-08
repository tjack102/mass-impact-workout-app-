export type HouseholdUser = "his" | "hers";

export const HOUSEHOLD_USERS: HouseholdUser[] = ["his", "hers"];

export type ProfilePrefs = {
  currentWeek: number;
  currentDay: number;
  selectedProgram?: string;
};

export type StoredPrefs = {
  activeUser: HouseholdUser;
  profiles: Record<HouseholdUser, ProfilePrefs>;
};

export const PREFS_STORAGE_KEY = "mi_prefs";

export function getDefaultProfilePrefs(): ProfilePrefs {
  return { currentWeek: 1, currentDay: 1, selectedProgram: "mass-impact" };
}

export function getDefaultStoredPrefs(): StoredPrefs {
  return {
    activeUser: "his",
    profiles: {
      his: { currentWeek: 1, currentDay: 1, selectedProgram: "mass-impact" },
      hers: { currentWeek: 1, currentDay: 1, selectedProgram: "hers-lulul" },
    },
  };
}

export function isHouseholdUser(value: unknown): value is HouseholdUser {
  return value === "his" || value === "hers";
}

function sanitizeProfilePrefs(value: unknown, fallback: ProfilePrefs): ProfilePrefs {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const profile = value as Partial<ProfilePrefs>;
  return {
    currentWeek:
      typeof profile.currentWeek === "number" && Number.isFinite(profile.currentWeek)
        ? profile.currentWeek
        : fallback.currentWeek,
    currentDay:
      typeof profile.currentDay === "number" && Number.isFinite(profile.currentDay)
        ? profile.currentDay
        : fallback.currentDay,
    // Preserve selectedProgram from stored data; fall back to per-user default
    selectedProgram: typeof profile.selectedProgram === "string" ? profile.selectedProgram : fallback.selectedProgram,
  };
}

export function parseStoredPrefs(value: unknown): StoredPrefs {
  const fallback = getDefaultStoredPrefs();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const raw = value as {
    activeUser?: unknown;
    currentWeek?: unknown;
    currentDay?: unknown;
    profiles?: Partial<Record<HouseholdUser, unknown>>;
  };

  if (raw.profiles && typeof raw.profiles === "object") {
    return {
      activeUser: isHouseholdUser(raw.activeUser) ? raw.activeUser : fallback.activeUser,
      profiles: {
        his: sanitizeProfilePrefs(raw.profiles.his, fallback.profiles.his),
        hers: sanitizeProfilePrefs(raw.profiles.hers, fallback.profiles.hers),
      },
    };
  }

  const legacyWeek =
    typeof raw.currentWeek === "number" && Number.isFinite(raw.currentWeek)
      ? raw.currentWeek
      : fallback.profiles.his.currentWeek;
  const legacyDay =
    typeof raw.currentDay === "number" && Number.isFinite(raw.currentDay)
      ? raw.currentDay
      : fallback.profiles.his.currentDay;

  return {
    activeUser: isHouseholdUser(raw.activeUser) ? raw.activeUser : fallback.activeUser,
    profiles: {
      // Legacy format had no per-user selectedProgram; use per-user defaults from fallback
      his: { currentWeek: legacyWeek, currentDay: legacyDay, selectedProgram: fallback.profiles.his.selectedProgram },
      hers: { currentWeek: legacyWeek, currentDay: legacyDay, selectedProgram: fallback.profiles.hers.selectedProgram },
    },
  };
}

export function getStoredPrefsFromLocalStorage(): StoredPrefs {
  if (typeof window === "undefined") {
    return getDefaultStoredPrefs();
  }

  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    return parseStoredPrefs(raw ? JSON.parse(raw) : null);
  } catch {
    return getDefaultStoredPrefs();
  }
}

export function getActiveUserFromLocalStorage(): HouseholdUser {
  return getStoredPrefsFromLocalStorage().activeUser;
}

export function getUserLabel(user: HouseholdUser): string {
  return user === "his" ? "His" : "Hers";
}

/** Resolve optional user param to concrete user, defaulting to active profile. */
export function resolveUser(user?: HouseholdUser): HouseholdUser {
  if (user) return user;
  return getStoredPrefsFromLocalStorage().activeUser;
}
