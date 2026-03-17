"use client";

import { useEffect, useRef, useState } from "react";
import { SyncStateIndicator } from "@/components/sync-state-indicator";
import {
  clearAllData,
  exportSnapshot,
  getActiveSession,
  getAllSessions,
  getPrefs,
  importSnapshot,
  type WorkoutSnapshot,
} from "@/lib/workout-store";
import { useAccess } from "@/components/access-context";
import { TRACKED_MUSCLES } from "@/lib/types";
import type { VolumeLandmarks } from "@/lib/types";
import {
  getVolumeLandmarks,
  saveVolumeLandmarks,
  resetVolumeLandmarks,
  getMesoState,
  saveMesoState,
  initMesoState,
} from "@/lib/volume-store";
import { getStoredPrefsFromLocalStorage } from "@/lib/household-profiles";
import { getProgramMeta } from "@/lib/program-registry";

// Convert snake_case muscle names (e.g. "side_delts") to "Side Delts"
function muscleName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return "Never";
  }
  return new Date(timestamp).toLocaleString();
}

function buildSnapshotStats() {
  const active = getActiveSession();
  const sessions = getAllSessions();
  const prefs = getPrefs();
  const setCount = active?.sets.length ?? 0;
  const lastCompleted = sessions
    .filter((session) => Boolean(session.completedAt))
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];
  return {
    activeUser: prefs.activeUser,
    activeSetCount: setCount,
    sessionCount: sessions.length,
    lastCompletedAt: lastCompleted?.completedAt,
    currentWeek: prefs.currentWeek,
  };
}

export function SettingsScreen() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [installMessage, setInstallMessage] = useState("Install prompt status unknown.");
  const [notificationStatus, setNotificationStatus] = useState(
    typeof Notification === "undefined" ? "not-supported" : Notification.permission,
  );
  const [snapshotStats, setSnapshotStats] = useState(() => buildSnapshotStats());
  const [feedback, setFeedback] = useState("");

  // --- Hypertrophy Hub additions ---
  const { activeUser } = useAccess();

  // Determine if active profile's program has auto-regulation
  const storedPrefs = typeof window !== "undefined" ? getStoredPrefsFromLocalStorage() : null;
  const selectedProgram = storedPrefs?.profiles[activeUser]?.selectedProgram ?? "mass-impact";
  const programMeta = getProgramMeta(selectedProgram);
  const isAutoReg = programMeta?.hasAutoRegulation ?? false;

  // Volume landmarks — lazy-init from store
  const [landmarks, setLandmarks] = useState<VolumeLandmarks>(() =>
    typeof window !== "undefined" ? getVolumeLandmarks(activeUser) : ({} as VolumeLandmarks),
  );

  // Meso state — lazy-init; create if missing for auto-reg programs
  const [mesoLength, setMesoLength] = useState<number>(() => {
    if (typeof window === "undefined") return 5;
    const existing = getMesoState(activeUser);
    if (existing) return existing.mesoLength;
    if (isAutoReg) {
      const fresh = initMesoState(activeUser, 5);
      return fresh.mesoLength;
    }
    return 5;
  });

  // When the active user changes, reload both stores
  /* eslint-disable react-hooks/set-state-in-effect -- SSR guard: reload localStorage on profile change */
  useEffect(() => {
    setLandmarks(getVolumeLandmarks(activeUser));
    const existing = getMesoState(activeUser);
    if (existing) {
      setMesoLength(existing.mesoLength);
    } else if (isAutoReg) {
      const fresh = initMesoState(activeUser, 5);
      setMesoLength(fresh.mesoLength);
    } else {
      setMesoLength(5);
    }
  }, [activeUser, isAutoReg]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleMesoLengthChange(newLength: number) {
    setMesoLength(newLength);
    const existing = getMesoState(activeUser);
    if (existing) {
      saveMesoState(activeUser, { ...existing, mesoLength: newLength });
    } else {
      initMesoState(activeUser, newLength);
    }
  }

  function handleLandmarkChange(
    muscle: (typeof TRACKED_MUSCLES)[number],
    field: keyof VolumeLandmarks[typeof muscle],
    raw: string,
  ) {
    const value = parseInt(raw, 10);
    if (isNaN(value) || value < 0) return;
    const updated: VolumeLandmarks = {
      ...landmarks,
      [muscle]: { ...landmarks[muscle], [field]: value },
    };
    setLandmarks(updated);
    saveVolumeLandmarks(activeUser, updated);
  }

  function handleResetLandmarks() {
    const confirmed = window.confirm("Reset volume landmarks to defaults for this profile?");
    if (!confirmed) return;
    const defaults = resetVolumeLandmarks(activeUser);
    setLandmarks(defaults);
  }

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
      setInstallMessage("Install is available on this device.");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  function refreshStats() {
    setSnapshotStats(buildSnapshotStats());
  }

  async function handleInstallCheck() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setInstallMessage(choice.outcome === "accepted" ? "Install accepted." : "Install dismissed.");
      setDeferredPrompt(null);
      return;
    }
    const inStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone);
    if (inStandalone) {
      setInstallMessage("App is already installed.");
      return;
    }
    setInstallMessage("Install prompt not currently available on this browser.");
  }

  async function handleEnableAlerts() {
    if (typeof Notification === "undefined") {
      setNotificationStatus("not-supported");
      setFeedback("Notifications are not supported in this browser.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    setFeedback(`Notification permission: ${permission}`);
  }

  function handleExportSnapshot() {
    const snapshot = exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const dateLabel = new Date(snapshot.exportedAt).toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mass-impact-backup-${dateLabel}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("Backup exported.");
  }

  function handleImportSnapshot(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<WorkoutSnapshot>;
        importSnapshot(parsed);
        refreshStats();
        setFeedback("Backup imported successfully.");
      } catch {
        setFeedback("Import failed: invalid backup file.");
      }
    };
    reader.readAsText(file);
  }

  function handleClearData() {
    const confirmed = window.confirm("Clear all workout data and preferences? This cannot be undone.");
    if (!confirmed) {
      return;
    }
    clearAllData();
    refreshStats();
    setFeedback("All local data cleared.");
  }

  return (
    <section className="screen">
      <header className="screen-head reveal">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-note">PWA install, reminders, backup, and local data management.</p>
        </div>
        <SyncStateIndicator state="synced" />
      </header>

      <section className="grid-3">
        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            PWA
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            Install App
          </h2>
          <p className="page-note">{installMessage}</p>
          <button type="button" className="primary-btn" style={{ marginTop: "0.7rem" }} onClick={handleInstallCheck}>
            Check Install
          </button>
        </article>

        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Runtime Alerts
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            Rest Notifications
          </h2>
          <p className="page-note">Permission: {notificationStatus}</p>
          <button type="button" className="ghost-btn" style={{ marginTop: "0.7rem" }} onClick={handleEnableAlerts}>
            Enable Alerts
          </button>
        </article>

        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Data Safety
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            Backup
          </h2>
          <p className="page-note">Export or import both profiles, including workout history, preferences, and template edits.</p>
          <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.7rem" }}>
            <button type="button" className="ghost-btn" onClick={handleExportSnapshot}>
              Export Snapshot
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                importInputRef.current?.click();
              }}
            >
              Import Backup
            </button>
          </div>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImportSnapshot(file);
              }
              event.target.value = "";
            }}
          />
        </article>
      </section>

      <article className="card panel reveal">
        <p className="subtle-label" style={{ margin: 0 }}>
          Queue Visibility
        </p>
        <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
          Local Sync Monitor
        </h2>
        <div className="queue-list" style={{ marginTop: "0.7rem" }}>
          <div className="surface pad">
            <div className="exercise-line">
              <span>Active profile</span>
              <span className="mono">{snapshotStats.activeUser === "his" ? "His" : "Hers"}</span>
            </div>
          </div>
          <div className="surface pad">
            <div className="exercise-line">
              <span>Sets in active session</span>
              <span className="mono">{snapshotStats.activeSetCount}</span>
            </div>
          </div>
          <div className="surface pad">
            <div className="exercise-line">
              <span>Saved sessions</span>
              <span className="mono">{snapshotStats.sessionCount}</span>
            </div>
          </div>
          <div className="surface pad">
            <div className="exercise-line">
              <span>Last completed workout</span>
              <span className="mono">{formatDateTime(snapshotStats.lastCompletedAt)}</span>
            </div>
          </div>
          <div className="surface pad">
            <div className="exercise-line">
              <span>Current week preference</span>
              <span className="mono">Week {snapshotStats.currentWeek}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.8rem" }}>
          <button type="button" className="ghost-btn" onClick={refreshStats}>
            Refresh Stats
          </button>
          <button type="button" className="ghost-btn danger-btn" onClick={handleClearData}>
            Clear All Data
          </button>
        </div>
        {feedback ? (
          <p className="page-note" style={{ marginTop: "0.65rem" }}>
            {feedback}
          </p>
        ) : null}
      </article>

      {/* Mesocycle Settings — only visible for programs with auto-regulation */}
      {isAutoReg ? (
        <article className="card panel reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Periodization
          </p>
          <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
            Mesocycle Settings
          </h2>
          <p className="page-note">
            Set the number of training weeks per mesocycle before a deload. Applies to{" "}
            {programMeta?.name ?? selectedProgram}.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
            <label className="subtle-label" style={{ margin: 0 }} htmlFor="meso-length-select">
              Meso length
            </label>
            <select
              id="meso-length-select"
              value={mesoLength}
              onChange={(e) => handleMesoLengthChange(Number(e.target.value))}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.9rem",
                padding: "0.3rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              <option value={4}>4 weeks</option>
              <option value={5}>5 weeks</option>
            </select>
          </div>
        </article>
      ) : null}

      {/* Volume Landmarks editor — always visible */}
      <article className="card panel reveal">
        <p className="subtle-label" style={{ margin: 0 }}>
          RP Auto-Regulation
        </p>
        <h2 className="section-title" style={{ marginTop: "0.2rem" }}>
          Volume Landmarks
        </h2>
        <p className="page-note">
          Weekly set targets per muscle group. MEV = minimum effective volume. MAV = maximum adaptive
          volume range. MRV = maximum recoverable volume range. Changes save immediately.
        </p>

        {/* Horizontal scroll wrapper for compact table on mobile */}
        <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.82rem",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            <thead>
              <tr>
                {["Muscle", "MEV", "MAV Lo", "MAV Hi", "MRV Lo", "MRV Hi"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Muscle" ? "left" : "center",
                      padding: "0.3rem 0.4rem",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-1)",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRACKED_MUSCLES.map((muscle) => {
                const entry = landmarks[muscle];
                if (!entry) return null;
                const fields: Array<[keyof typeof entry, string]> = [
                  ["mev", "MEV"],
                  ["mavLow", "MAV Lo"],
                  ["mavHigh", "MAV Hi"],
                  ["mrvLow", "MRV Lo"],
                  ["mrvHigh", "MRV Hi"],
                ];
                return (
                  <tr key={muscle}>
                    <td
                      style={{
                        padding: "0.3rem 0.4rem",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {muscleName(muscle)}
                    </td>
                    {fields.map(([field, label]) => (
                      <td
                        key={field}
                        style={{
                          padding: "0.25rem 0.3rem",
                          borderBottom: "1px solid var(--border)",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="number"
                          aria-label={`${muscleName(muscle)} ${label}`}
                          value={entry[field]}
                          min={0}
                          onChange={(e) => handleLandmarkChange(muscle, field, e.target.value)}
                          style={{
                            width: "4ch",
                            background: "var(--bg-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text-1)",
                            fontFamily: "var(--font-mono), monospace",
                            fontSize: "0.82rem",
                            textAlign: "center",
                            padding: "0.2rem",
                            borderRadius: "3px",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "0.85rem" }}>
          <button type="button" className="ghost-btn danger-btn" onClick={handleResetLandmarks}>
            Reset to Defaults
          </button>
        </div>
      </article>
    </section>
  );
}
