/** Convert snake_case muscle name to Title Case: "side_delts" -> "Side Delts" */
export function formatMuscleName(muscle: string): string {
  return muscle
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Format seconds as M:SS clock display: 90 -> "1:30" */
export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format seconds as human-readable duration: 125 -> "2m 05s" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}
