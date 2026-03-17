import type { HouseholdUser } from "./household-profiles";
import type { VolumeLandmarks, MesocycleState, RecoveryRating } from "./types";
import { TRACKED_MUSCLES } from "./types";

const KEYS = {
  VOLUME_STATE: "mi_volume_state",
  RECOVERY_RATINGS: "mi_recovery_ratings",
  VOLUME_LANDMARKS: "mi_volume_landmarks",
} as const;

// --- Default volume landmarks (from spec) ---
export const DEFAULT_HIS_LANDMARKS: VolumeLandmarks = {
  back: { mev: 8, mavLow: 14, mavHigh: 18, mrvLow: 20, mrvHigh: 25 },
  chest: { mev: 8, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 22 },
  side_delts: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 26 },
  rear_delts: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 22 },
  biceps: { mev: 4, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 20 },
  triceps: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 14, mrvHigh: 18 },
  quads: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 18, mrvHigh: 24 },
  hamstrings: { mev: 4, mavLow: 8, mavHigh: 14, mrvLow: 14, mrvHigh: 18 },
  glutes: { mev: 0, mavLow: 4, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  traps: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 20 },
  calves: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 16 },
  abs: { mev: 0, mavLow: 6, mavHigh: 12, mrvLow: 14, mrvHigh: 18 },
} as VolumeLandmarks;

export const DEFAULT_HERS_LANDMARKS: VolumeLandmarks = {
  glutes: { mev: 6, mavLow: 12, mavHigh: 18, mrvLow: 20, mrvHigh: 24 },
  hamstrings: { mev: 6, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 20 },
  quads: { mev: 6, mavLow: 10, mavHigh: 16, mrvLow: 16, mrvHigh: 22 },
  back: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 20 },
  side_delts: { mev: 6, mavLow: 10, mavHigh: 14, mrvLow: 16, mrvHigh: 20 },
  rear_delts: { mev: 4, mavLow: 8, mavHigh: 12, mrvLow: 14, mrvHigh: 18 },
  biceps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  triceps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  chest: { mev: 2, mavLow: 4, mavHigh: 8, mrvLow: 10, mrvHigh: 14 },
  calves: { mev: 4, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
  traps: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 10, mrvHigh: 14 },
  abs: { mev: 2, mavLow: 6, mavHigh: 10, mrvLow: 12, mrvHigh: 16 },
} as VolumeLandmarks;

// --- Helpers ---
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

export function getDefaultLandmarks(profile: HouseholdUser): VolumeLandmarks {
  return profile === "his" ? { ...DEFAULT_HIS_LANDMARKS } : { ...DEFAULT_HERS_LANDMARKS };
}

// --- Volume Landmarks ---
export function getVolumeLandmarks(user: HouseholdUser): VolumeLandmarks {
  const raw = readRaw(KEYS.VOLUME_LANDMARKS);
  if (!raw || typeof raw !== "object") {
    return getDefaultLandmarks(user);
  }

  const byUser = raw as Partial<Record<HouseholdUser, unknown>>;
  const userLandmarks = byUser[user];

  if (!userLandmarks || typeof userLandmarks !== "object") {
    return getDefaultLandmarks(user);
  }

  // Validate that all tracked muscles are present
  const landmarks = userLandmarks as Partial<VolumeLandmarks>;
  const defaults = getDefaultLandmarks(user);
  const result: VolumeLandmarks = { ...defaults };

  for (const muscle of TRACKED_MUSCLES) {
    if (landmarks[muscle]) {
      const entry = landmarks[muscle];
      if (
        entry &&
        typeof entry === "object" &&
        typeof entry.mev === "number" &&
        typeof entry.mavLow === "number" &&
        typeof entry.mavHigh === "number" &&
        typeof entry.mrvLow === "number" &&
        typeof entry.mrvHigh === "number"
      ) {
        result[muscle] = entry;
      }
    }
  }

  return result;
}

export function saveVolumeLandmarks(user: HouseholdUser, landmarks: VolumeLandmarks): void {
  const raw = readRaw(KEYS.VOLUME_LANDMARKS);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, VolumeLandmarks>;

  byUser[user] = landmarks;
  write(KEYS.VOLUME_LANDMARKS, byUser);
}

export function resetVolumeLandmarks(user: HouseholdUser): VolumeLandmarks {
  const defaults = getDefaultLandmarks(user);
  saveVolumeLandmarks(user, defaults);
  return defaults;
}

// --- Recovery Ratings ---
export function getRecoveryRatings(user: HouseholdUser): RecoveryRating[] {
  const raw = readRaw(KEYS.RECOVERY_RATINGS);
  if (!raw || typeof raw !== "object") {
    return [];
  }

  const byUser = raw as Partial<Record<HouseholdUser, unknown>>;
  const userRatings = byUser[user];

  if (!Array.isArray(userRatings)) {
    return [];
  }

  return userRatings.filter(
    (rating): rating is RecoveryRating =>
      rating &&
      typeof rating === "object" &&
      typeof rating.date === "number" &&
      typeof rating.sessionId === "string" &&
      typeof rating.ratings === "object",
  );
}

export function saveRecoveryRating(user: HouseholdUser, rating: RecoveryRating): void {
  const raw = readRaw(KEYS.RECOVERY_RATINGS);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, RecoveryRating[]>;

  if (!Array.isArray(byUser[user])) {
    byUser[user] = [];
  }

  byUser[user].push(rating);
  write(KEYS.RECOVERY_RATINGS, byUser);
}

// --- Mesocycle State ---
export function getMesoState(user: HouseholdUser): MesocycleState | null {
  const raw = readRaw(KEYS.VOLUME_STATE);
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const byUser = raw as Partial<Record<HouseholdUser, unknown>>;
  const userState = byUser[user];

  if (!userState || typeof userState !== "object") {
    return null;
  }

  const state = userState as Partial<MesocycleState>;
  if (
    typeof state.mesoNumber === "number" &&
    typeof state.weekInMeso === "number" &&
    typeof state.mesoLength === "number" &&
    typeof state.startDate === "number" &&
    state.weeklyTargets &&
    typeof state.weeklyTargets === "object"
  ) {
    return state as MesocycleState;
  }

  return null;
}

export function saveMesoState(user: HouseholdUser, state: MesocycleState): void {
  const raw = readRaw(KEYS.VOLUME_STATE);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, MesocycleState>;

  byUser[user] = state;
  write(KEYS.VOLUME_STATE, byUser);
}

export function initMesoState(user: HouseholdUser, mesoLength: number = 5): MesocycleState {
  const state: MesocycleState = {
    mesoNumber: 1,
    weekInMeso: 1,
    mesoLength,
    startDate: Date.now(),
    weeklyTargets: {},
  };
  saveMesoState(user, state);
  return state;
}
