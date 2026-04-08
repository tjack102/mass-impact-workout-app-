import type { HouseholdUser } from "@/lib/household-profiles";
import type { RpProgramState, RpRatingEntry } from "./rp-types";
import { readJson, writeJson } from "./storage-utils";

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mi_rp_state";

// ---------------------------------------------------------------------------
// Private helpers (same pattern as volume-store.ts)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read the RP program state for a user.
 * Returns null if no state has been saved (e.g. fresh program selection).
 */
export function getRpState(user: HouseholdUser): RpProgramState | null {
  const raw = readJson(STORAGE_KEY);
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const byUser = raw as Partial<Record<HouseholdUser, unknown>>;
  const userState = byUser[user];

  if (!userState || typeof userState !== "object") {
    return null;
  }

  // Minimal shape validation -- we trust our own writes, but guard against
  // corrupted or partially-migrated data.
  const state = userState as Partial<RpProgramState>;
  if (
    typeof state.templateId === "string" &&
    typeof state.currentMeso === "string" &&
    typeof state.currentWeek === "number" &&
    state.selections !== null &&
    typeof state.selections === "object" &&
    Array.isArray(state.ratings)
  ) {
    return state as RpProgramState;
  }

  return null;
}

/**
 * Persist the full RP program state for a user.
 * Reads the current record first so the other user's data is preserved.
 */
export function saveRpState(user: HouseholdUser, state: RpProgramState): void {
  const raw = readJson(STORAGE_KEY);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, RpProgramState | null>;

  byUser[user] = state;
  writeJson(STORAGE_KEY, byUser);
}

/**
 * Append a rating entry to the user's RP state.
 * No-op if the user has no active RP state (defensive -- callers should check).
 */
export function addRating(user: HouseholdUser, entry: RpRatingEntry): void {
  const state = getRpState(user);
  if (!state) {
    return;
  }

  const updated: RpProgramState = {
    ...state,
    ratings: [...state.ratings, entry],
  };

  saveRpState(user, updated);
}

/**
 * Wipe the RP state for a user.
 * Called when the user switches away from an RP program (spec: mid-meso switch edge case).
 */
export function clearRpState(user: HouseholdUser): void {
  const raw = readJson(STORAGE_KEY);
  const byUser = (raw && typeof raw === "object" ? raw : {}) as Record<HouseholdUser, RpProgramState | null>;

  byUser[user] = null;
  writeJson(STORAGE_KEY, byUser);
}
