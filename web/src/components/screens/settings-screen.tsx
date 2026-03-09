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
    </section>
  );
}
