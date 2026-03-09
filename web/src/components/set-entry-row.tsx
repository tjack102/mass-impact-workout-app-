export type SetDraft = {
  weight: string;
  reps: string;
  rpe: string;
};

export type LastSet = {
  weight: number;
  reps: number;
  rpe?: number;
};

type SetEntryRowProps = {
  setIndex: number;
  draft: SetDraft;
  lastSet?: LastSet;
  saveFlash: boolean;
  onDraftChange: (draft: SetDraft) => void;
  onSave: () => void;
};

export function SetEntryRow({
  setIndex,
  draft,
  lastSet,
  saveFlash,
  onDraftChange,
  onSave,
}: SetEntryRowProps) {
  return (
    <div className="surface set-row">
      <div className="set-grid">
        <div className="set-index">{setIndex}</div>
        <label className="set-cell">
          <span className="subtle-label">Weight</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="lb"
            value={draft.weight}
            onChange={(event) => onDraftChange({ ...draft, weight: event.target.value })}
          />
        </label>
        <label className="set-cell">
          <span className="subtle-label">Reps</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={draft.reps}
            onChange={(event) => onDraftChange({ ...draft, reps: event.target.value })}
          />
        </label>
        <label className="set-cell">
          <span className="subtle-label">RPE</span>
          <select
            value={draft.rpe}
            onChange={(event) => onDraftChange({ ...draft, rpe: event.target.value })}
          >
            <option value="">--</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
        </label>
      </div>
      <p className="page-note" style={{ margin: 0 }}>
        {lastSet
          ? `Last logged: ${lastSet.weight} lb x ${lastSet.reps}${lastSet.rpe ? ` @ ${lastSet.rpe}` : ""}`
          : "Last logged: none yet"}
      </p>
      <button type="button" className={`set-save-btn${saveFlash ? " flash" : ""}`} onClick={onSave}>
        Log Set
      </button>
    </div>
  );
}
