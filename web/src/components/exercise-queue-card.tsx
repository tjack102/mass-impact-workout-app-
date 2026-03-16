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

function ProgressRing({ completed, total, isDone }: { completed: number; total: number; isDone: boolean }) {
  const size = 28;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        className="progress-ring__bg"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        className={`progress-ring__fill${isDone ? " progress-ring__fill--done" : ""}`}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

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
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
          <ProgressRing completed={completedSets} total={targetSets} isDone={isDone} />
          <span className={`track-chip ${track}`}>{track}</span>
        </div>
      </div>
      <div className="exercise-line">
        <span className="mono">{scheme}</span>
        <span className="page-note" style={{ margin: 0 }}>
          Last: {lastPerformance}
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
