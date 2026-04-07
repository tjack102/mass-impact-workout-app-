"use client";

import { getAvailablePrograms } from "@/lib/program-registry";
import {
  getStoredPrefsFromLocalStorage,
  PREFS_STORAGE_KEY,
} from "@/lib/household-profiles";
import type { HouseholdUser } from "@/lib/household-profiles";
import { clearRpState } from "@/lib/rp-store";

interface ProgramSelectorProps {
  activeUser: HouseholdUser;
}

export function ProgramSelector({ activeUser }: ProgramSelectorProps) {
  const programs = getAvailablePrograms(activeUser);
  const prefs = getStoredPrefsFromLocalStorage();
  const currentProgram = prefs.profiles[activeUser].selectedProgram ?? programs[0]?.id ?? "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newProgramId = e.target.value;

    // Clear RP state when switching away from an RP program
    if (currentProgram.startsWith("rp-") && !newProgramId.startsWith("rp-")) {
      clearRpState(activeUser);
    }

    // Read full stored prefs, update just this profile's selectedProgram, write back.
    // We re-read from localStorage here rather than closing over `prefs` to avoid
    // stale data if something else updated storage since mount.
    const stored = getStoredPrefsFromLocalStorage();
    stored.profiles[activeUser].selectedProgram = newProgramId;

    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // localStorage unavailable (private browsing, storage full) — skip silently
      // but don't reload so the UI doesn't get stuck in a bad state
      return;
    }

    // Remount everything so today-screen and other consumers pick up the new program
    window.location.reload();
  }

  return (
    <select
      value={currentProgram}
      onChange={handleChange}
      aria-label="Active program"
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        color: "var(--text-0)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-ui)",
        padding: "8px 12px",
        width: "100%",
        cursor: "pointer",
      }}
    >
      {programs.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
