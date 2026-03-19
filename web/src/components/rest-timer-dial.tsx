import type { CSSProperties } from "react";

type RestTimerDialProps = {
  targetSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  targetReached: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onAdjustDuration: (delta: number) => void;
  onSetDuration: (seconds: number) => void;
};

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export function RestTimerDial({
  targetSeconds,
  remainingSeconds,
  isRunning,
  targetReached,
  onToggle,
  onSkip,
  onAdjustDuration,
  onSetDuration,
}: RestTimerDialProps) {
  const durationOptions = Array.from(new Set([45, 60, 75, 90, 120, 150, 180, targetSeconds])).sort((a, b) => a - b);
  const progress =
    targetSeconds <= 0 ? 0 : Math.min(1, Math.max(0, (targetSeconds - remainingSeconds) / targetSeconds));
  const color = targetReached
    ? "var(--accent-power)"
    : isRunning
      ? "var(--accent-primary)"
      : "var(--text-1)";

  const dialStyle: CSSProperties = {
    background: `conic-gradient(${color} ${progress * 360}deg, var(--bg-index) 0deg)`,
    boxShadow: `0 0 34px color-mix(in srgb, ${color}, transparent 78%)`,
  };

  return (
    <div className="rest-dial-wrap">
      <button
        type="button"
        className="rest-dial"
        style={{ ...dialStyle, cursor: "pointer", transition: "transform 220ms var(--ease-standard)" }}
        onClick={onToggle}
        title="Start or stop rest timer"
      >
        <div className="rest-dial-content">
          <p className="subtle-label" style={{ margin: 0 }}>
            Auto Rest
          </p>
          <p className="timer-value">{formatClock(remainingSeconds)}</p>
          <p className="page-note" style={{ margin: 0 }}>
            {targetReached ? "Target reached" : isRunning ? "Running" : "Idle"}
          </p>
        </div>
      </button>
      <div className="timer-row">
        <button type="button" className="ghost-btn" onClick={onToggle}>
          {isRunning ? "Stop" : "Start"}
        </button>
        <button type="button" className="ghost-btn" onClick={onSkip}>
          Skip Rest
        </button>
      </div>
      <div className="timer-adjust-row">
        <button type="button" className="ghost-btn" onClick={() => onAdjustDuration(-15)}>
          -15s
        </button>
        <label className="timer-select-field">
          <span className="subtle-label">Rest Target</span>
          <select value={targetSeconds} onChange={(event) => onSetDuration(Number(event.target.value))}>
            {durationOptions.map((seconds) => (
              <option key={seconds} value={seconds}>
                {formatClock(seconds)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-btn" onClick={() => onAdjustDuration(15)}>
          +15s
        </button>
      </div>
    </div>
  );
}
