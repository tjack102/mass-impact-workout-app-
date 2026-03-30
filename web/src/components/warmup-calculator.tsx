"use client";

import { useState, useMemo } from "react";
import { calculateWarmupSets, type WarmupOptions } from "../lib/warmup-engine";

type WarmupSettings = {
  roundingIncrement: number;
  startPercent: number;
};

const SETTINGS_KEY = "mi_warmup_settings";
const DEFAULT_SETTINGS: WarmupSettings = { roundingIncrement: 5, startPercent: 45 };

function loadSettings(): WarmupSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      roundingIncrement: parsed.roundingIncrement ?? DEFAULT_SETTINGS.roundingIncrement,
      startPercent: parsed.startPercent ?? DEFAULT_SETTINGS.startPercent,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: WarmupSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

type WarmupCalculatorProps = {
  /** Pre-filled exercise name (display-only when provided) */
  exerciseName?: string;
  /** Pre-filled working weight from last session */
  initialWeight?: number;
  /** Auto-detected: same muscle group already worked this session */
  autoAbbreviated?: boolean;
};

export function WarmupCalculator({
  exerciseName,
  initialWeight,
  autoAbbreviated = false,
}: WarmupCalculatorProps) {
  const [settings, setSettings] = useState<WarmupSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [abbreviated, setAbbreviated] = useState(autoAbbreviated);
  const [manualName, setManualName] = useState("");

  const workingWeight = parseFloat(weight) || 0;

  const warmupSets = useMemo(() => {
    if (workingWeight <= 0) return [];
    const opts: WarmupOptions = {
      roundingIncrement: settings.roundingIncrement,
      startPercent: settings.startPercent,
      abbreviated,
    };
    return calculateWarmupSets(workingWeight, opts);
  }, [workingWeight, settings.roundingIncrement, settings.startPercent, abbreviated]);

  const updateSetting = (patch: Partial<WarmupSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  return (
    <div className="warmup-calc">
      {/* Settings toggle */}
      <button
        className="ghost-btn warmup-settings-toggle"
        onClick={() => setSettingsOpen(!settingsOpen)}
        aria-label="Settings"
        aria-expanded={settingsOpen}
      >
        ⚙
      </button>

      {/* Settings row */}
      {settingsOpen && (
        <div className="warmup-settings">
          <div className="warmup-setting-group">
            <span className="subtle-label">Round to</span>
            <div className="warmup-radio-group">
              {[2.5, 5, 10].map((inc) => (
                <label key={inc} className={`warmup-radio${settings.roundingIncrement === inc ? " active" : ""}`}>
                  <input
                    type="radio"
                    name="roundingIncrement"
                    value={inc}
                    checked={settings.roundingIncrement === inc}
                    onChange={() => updateSetting({ roundingIncrement: inc })}
                  />
                  {inc} lb
                </label>
              ))}
            </div>
          </div>
          <div className="warmup-setting-group">
            <span className="subtle-label">Start %</span>
            <input
              type="number"
              className="warmup-pct-input mono"
              value={settings.startPercent}
              min={20}
              max={60}
              step={5}
              onChange={(e) => updateSetting({ startPercent: parseInt(e.target.value, 10) || 45 })}
            />
          </div>
        </div>
      )}

      {/* Exercise name */}
      <div className="warmup-input-row">
        {exerciseName ? (
          <p className="warmup-exercise-name subtle-label">{exerciseName}</p>
        ) : (
          <input
            type="text"
            className="warmup-name-input"
            placeholder="Exercise (optional)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
          />
        )}
      </div>

      {/* Working weight input */}
      <div className="warmup-input-row">
        <label className="subtle-label" htmlFor="warmup-weight">Working Weight (lbs)</label>
        <input
          id="warmup-weight"
          type="number"
          className="warmup-weight-input mono"
          placeholder="e.g. 225"
          value={weight}
          min={0}
          step={settings.roundingIncrement}
          onChange={(e) => setWeight(e.target.value)}
          autoFocus={!initialWeight}
        />
      </div>

      {/* Abbreviated toggle */}
      <label className="warmup-toggle-row">
        <input
          type="checkbox"
          checked={abbreviated}
          onChange={(e) => setAbbreviated(e.target.checked)}
        />
        <span>Abbreviated (same muscle already warmed up)</span>
      </label>

      {/* Results */}
      {workingWeight <= 0 ? (
        <p className="warmup-empty subtle-label">Enter your working weight</p>
      ) : (
        <table className="warmup-results">
          <thead>
            <tr>
              <th>Set</th>
              <th>Weight</th>
              <th>Reps</th>
            </tr>
          </thead>
          <tbody>
            {warmupSets.map((set, i) => (
              <tr key={i} className={`warmup-row warmup-row--${set.label.split(" ")[0].toLowerCase()}`}>
                <td className="subtle-label">{set.label}</td>
                <td className="mono warmup-weight-cell">{set.weight}</td>
                <td className="mono">{set.repsDisplay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="warmup-footer subtle-label">Warm-up sets are for reference only -- not logged</p>
    </div>
  );
}
