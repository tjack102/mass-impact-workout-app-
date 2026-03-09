import type { ExerciseSet, ProgramExercise } from "@/lib/program-data";
import { getRestSecondsForExercise } from "@/lib/program-data";

type TemplateExerciseEditorProps = {
  canEdit: boolean;
  exercise?: ProgramExercise;
  onNameChange: (name: string) => void;
  onRestSecondsChange: (restSeconds: number) => void;
  onSetGroupChange: (index: number, setGroup: ExerciseSet) => void;
  onAddSetGroup: () => void;
  onRemoveSetGroup: (index: number) => void;
  onDeleteExercise: () => void;
};

export function TemplateExerciseEditor({
  canEdit,
  exercise,
  onNameChange,
  onRestSecondsChange,
  onSetGroupChange,
  onAddSetGroup,
  onRemoveSetGroup,
  onDeleteExercise,
}: TemplateExerciseEditorProps) {
  if (!exercise) {
    return (
      <section className="card panel reveal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            Exercise Properties
          </h3>
          <span className={`permission-badge ${canEdit ? "owner" : "view"}`}>
            {canEdit ? "Editable" : "View only"}
          </span>
        </div>
        <p className="page-note" style={{ marginTop: "0.85rem" }}>
          Select an exercise to edit its name, set blocks, reps, and rest target.
        </p>
      </section>
    );
  }

  const totalSets = exercise.setGroups.reduce((sum, group) => sum + group.sets, 0);

  return (
    <section className="card panel reveal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          Exercise Properties
        </h3>
        <span className={`permission-badge ${canEdit ? "owner" : "view"}`}>
          {canEdit ? "Editable" : "View only"}
        </span>
      </div>

      <form className="editor-form" style={{ marginTop: "0.8rem" }}>
        <label>
          Exercise Name
          <input
            value={exercise.name}
            disabled={!canEdit}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </label>

        <div className="editor-summary-grid">
          <label>
            Total Sets
            <input value={String(totalSets)} disabled readOnly />
          </label>
          <label>
            Rest Target (sec)
            <input
              type="number"
              min="0"
              step="15"
              value={String(getRestSecondsForExercise(exercise))}
              disabled={!canEdit}
              onChange={(event) => onRestSecondsChange(Math.max(0, Number(event.target.value) || 0))}
            />
          </label>
        </div>

        <div className="editor-group-stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
            <div>
              <p className="subtle-label" style={{ margin: 0 }}>
                Set Blocks
              </p>
              <p className="page-note" style={{ marginTop: "0.2rem" }}>
                Use one block for simple schemes, or multiple blocks for ramps and back-off work.
              </p>
            </div>
            <button type="button" className="ghost-btn" disabled={!canEdit} onClick={onAddSetGroup}>
              Add Block
            </button>
          </div>

          {exercise.setGroups.map((setGroup, index) => (
            <div key={`${exercise.orderLabel}-group-${index}`} className="surface editor-set-group">
              <div className="editor-set-group-grid">
                <label>
                  Sets
                  <input
                    type="number"
                    min="1"
                    value={String(setGroup.sets)}
                    disabled={!canEdit}
                    onChange={(event) =>
                      onSetGroupChange(index, {
                        ...setGroup,
                        sets: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </label>
                <label>
                  Reps / Goal
                  <input
                    value={setGroup.reps}
                    disabled={!canEdit}
                    onChange={(event) =>
                      onSetGroupChange(index, {
                        ...setGroup,
                        reps: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <p className="page-note" style={{ margin: 0 }}>
                  Block {index + 1}
                </p>
                <button
                  type="button"
                  className="ghost-btn danger-btn"
                  disabled={!canEdit || exercise.setGroups.length <= 1}
                  onClick={() => onRemoveSetGroup(index)}
                >
                  Remove Block
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
          <p className="page-note" style={{ margin: 0 }}>
            Changes save instantly on this device.
          </p>
          <button type="button" className="ghost-btn danger-btn" disabled={!canEdit} onClick={onDeleteExercise}>
            Delete Exercise
          </button>
        </div>
      </form>
    </section>
  );
}
