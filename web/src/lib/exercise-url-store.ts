// Exercise demo URLs -- synced via API (Vercel KV) so they work on all devices.
// Falls back to exrxUrl from exercise library if no user-set URL.

import { findExercise } from "./exercise-library";

// Module-level cache loaded once on app init. Synchronous reads after that.
let urlCache: Record<string, string> = {};
let loaded = false;

/** Fetch all URLs from server and populate cache. Call once on app mount. */
export async function loadExerciseUrls(): Promise<void> {
  try {
    const res = await fetch("/api/exercise-urls");
    if (res.ok) {
      urlCache = await res.json();
    }
  } catch {
    // Offline or API down -- cache stays empty, fall back to library exrxUrl
  }
  loaded = true;
}

/** True once loadExerciseUrls() has completed */
export function exerciseUrlsLoaded(): boolean {
  return loaded;
}

/** Get demo URL for an exercise (sync -- reads from cache) */
export function getExerciseUrl(exerciseName: string): string | undefined {
  return urlCache[exerciseName] ?? findExercise(exerciseName)?.exrxUrl;
}

/** Save a demo URL -- writes to server + updates cache */
export async function setExerciseUrl(exerciseName: string, url: string): Promise<void> {
  urlCache[exerciseName] = url;
  try {
    await fetch("/api/exercise-urls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: exerciseName, url }),
    });
  } catch {
    // Offline -- URL is in local cache until next page load
  }
}

/** Remove a demo URL -- deletes from server + cache */
export async function clearExerciseUrl(exerciseName: string): Promise<void> {
  delete urlCache[exerciseName];
  try {
    await fetch("/api/exercise-urls", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: exerciseName }),
    });
  } catch {
    // Offline
  }
}
