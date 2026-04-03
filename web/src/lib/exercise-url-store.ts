// User-managed exercise demo URLs stored in localStorage.
// Falls back to exrxUrl from exercise library if no user-set URL.

import { findExercise } from "./exercise-library";

const STORAGE_KEY = "mi_exercise_urls";

function getAll(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** Get demo URL for an exercise -- user-set URL takes priority, then library exrxUrl */
export function getExerciseUrl(exerciseName: string): string | undefined {
  const urls = getAll();
  return urls[exerciseName] ?? findExercise(exerciseName)?.exrxUrl;
}

/** Save a user-set demo URL for an exercise */
export function setExerciseUrl(exerciseName: string, url: string): void {
  const urls = getAll();
  urls[exerciseName] = url;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

/** Remove user-set URL (falls back to library exrxUrl if it exists) */
export function clearExerciseUrl(exerciseName: string): void {
  const urls = getAll();
  delete urls[exerciseName];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}
