type ExerciseQueueCardProps = {
  orderLabel: string;
  name: string;
  scheme: string;
  lastPerformance: string;
  track: "his" | "hers";
  targetSets: number;
  completedSets: number;
  isActive: boolean;
  onSelect: () => void;
};

export function ExerciseQueueCard({
  orderLabel,
  name,
  scheme,
  lastPerformance,
  track,
  targetSets,
  completedSets,
  isActive,
  onSelect,
}: ExerciseQueueCardProps) {
  const isDone = completedSets >= targetSets;

  return (
    <button
      type="button"
      className={`surface exercise-card${isActive ? " active" : ""}${isDone ? " done" : ""}`}
      onClick={onSelect}
    >
      <div className="exercise-line">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="track-chip mono" style={{ padding: "0.1rem 0.35rem" }}>
            {orderLabel}
          </span>
          <h3 className="exercise-name">{name}</h3>
        </div>
        <span className={`track-chip ${track}`}>{track}</span>
      </div>
      <div className="exercise-line">
        <span className="mono">{scheme}</span>
        <span className="page-note" style={{ margin: 0 }}>
          Last: {lastPerformance}
        </span>
      </div>
      <div className="exercise-line">
        <span className="page-note" style={{ margin: 0 }}>
          Logged {completedSets} of {targetSets} sets
        </span>
      </div>
      <div className="completion-dots" aria-label={`${completedSets}/${targetSets} sets complete`}>
        {Array.from({ length: targetSets }).map((_, idx) => (
          <span
            key={`${name}-${idx}`}
            className={`completion-dot${idx < completedSets ? " complete" : ""}`}
          />
        ))}
      </div>
    </button>
  );
}
