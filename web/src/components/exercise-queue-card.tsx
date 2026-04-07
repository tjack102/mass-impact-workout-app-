
export type ExerciseQueueCardProps = {
  orderLabel: string;
  name: string;
  muscleGroup: string;
  reps: string;
  targetSets: number;
  completedSets: number;
  lastWeight?: number;
  prescribedWeight?: number;
  rirTarget?: string;
  isActive: boolean;
  isSkipped?: boolean;
  onSelect: () => void;
  onSwap?: () => void;
  supersetGroup?: string;
  prFlash?: boolean;
  originalName?: string;
  notes?: string;
  exrxUrl?: string;
  onEditUrl?: () => void;
};

export function ExerciseQueueCard({
  orderLabel,
  name,
  muscleGroup,
  reps,
  targetSets,
  completedSets,
  lastWeight,
  prescribedWeight,
  rirTarget,
  isActive,
  isSkipped,
  onSelect,
  onSwap,
  prFlash,
  originalName,
  notes,
  exrxUrl,
  onEditUrl,
}: ExerciseQueueCardProps) {
  const isDone = completedSets >= targetSets && targetSets > 0;
  const weightDisplay = prescribedWeight
    ? `${prescribedWeight} LBS`
    : lastWeight
      ? `${lastWeight} LBS`
      : "---";

  return (
    <button
      type="button"
      className={`queue-card${prFlash ? " pr-pulse" : ""}`}
      data-active={isActive}
      data-complete={isDone}
      data-skipped={isSkipped || false}
      onClick={onSelect}
    >
      {/* Row 1: Order + Name + Actions */}
      <div className="queue-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="queue-card-order">{orderLabel}</span>
          <span className="queue-card-name">{name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {exrxUrl ? (
            <span
              role="link"
              className="queue-card-url"
              onClick={(e) => { e.stopPropagation(); window.open(exrxUrl, "_blank", "noopener"); }}
              aria-label={`How to: ${name}`}
            >?</span>
          ) : onEditUrl ? (
            <span
              role="button"
              className="queue-card-url"
              onClick={(e) => { e.stopPropagation(); onEditUrl(); }}
              aria-label={`Add demo link for ${name}`}
            >+</span>
          ) : null}
          {onSwap && (
            <button
              type="button"
              className="queue-card-swap"
              onClick={(e) => { e.stopPropagation(); onSwap(); }}
              aria-label={`Swap ${name}`}
            >
              ⇄
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Muscle group + original name */}
      {muscleGroup && <span className="queue-card-muscles">{muscleGroup}</span>}
      {originalName && <span className="queue-card-muscles">Replaces: {originalName}</span>}

      {/* Row 3: Data cluster */}
      <div className="queue-card-data">
        <div className="queue-card-stat">
          <span className="queue-card-label">SETS</span>
          <span className="queue-card-value">{targetSets}</span>
        </div>
        <div className="queue-card-stat">
          <span className="queue-card-label">REPS</span>
          <span className="queue-card-value">{reps}</span>
        </div>
        <div className="queue-card-stat">
          <span className="queue-card-label">WEIGHT</span>
          <span className="queue-card-value">{weightDisplay}</span>
        </div>
      </div>

      {/* Row 4: Footer */}
      {(completedSets > 0 || rirTarget || notes) && (
        <div className="queue-card-footer">
          {completedSets > 0 && (
            <span className="queue-card-progress">{completedSets}/{targetSets} done</span>
          )}
          {rirTarget && <span className="queue-card-rir">RIR {rirTarget}</span>}
        </div>
      )}
      {notes && <div className="queue-card-notes">{notes}</div>}
    </button>
  );
}
