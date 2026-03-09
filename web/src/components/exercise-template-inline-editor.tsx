import type { ExerciseSet } from "@/lib/program-data";

export type ExerciseTemplateDraft = {
  name: string;
  setGroups: ExerciseSet[];
};

type ExerciseTemplateInlineEditorProps = {
  draft: ExerciseTemplateDraft;
  canEdit: boolean;
  onDraftChange: (draft: ExerciseTemplateDraft) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function ExerciseTemplateInlineEditor({
  draft,
  canEdit,
  onDraftChange,
  onSave,
  onCancel,
}: ExerciseTemplateInlineEditorProps) {
  return (
    <section className="surface quick-editor">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
        <div>
          <p className="subtle-label" style={{ margin: 0 }}>
            Inline Template Edit
          </p>
          <p className="page-note" style={{ marginTop: "0.2rem" }}>
            Update the current profile&apos;s template going forward.
          </p>
        </div>
        <span className={`permission-badge ${canEdit ? "owner" : "view"}`}>
          {canEdit ? "Editable" : "View only"}
        </span>
      </div>

      <div className="editor-form" style={{ marginTop: "0.8rem" }}>
        <label>
          Exercise Name
          <input
            value={draft.name}
            disabled={!canEdit}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
          />
        </label>

        <div className="editor-group-stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
            <div>
              <p className="subtle-label" style={{ margin: 0 }}>
                Sets and Reps
              </p>
              <p className="page-note" style={{ marginTop: "0.2rem" }}>
                Edit the working blocks for this exercise.
              </p>
            </div>
            <button
              type="button"
              className="ghost-btn"
              disabled={!canEdit}
              onClick={() =>
                onDraftChange({
                  ...draft,
                  setGroups: [...draft.setGroups, { sets: 1, reps: "8-12 reps" }],
                })
              }
            >
              Add Block
            </button>
          </div>

          {draft.setGroups.map((setGroup, index) => (
            <div key={`inline-group-${index}`} className="surface editor-set-group">
              <div className="editor-set-group-grid">
                <label>
                  Sets
                  <input
                    type="number"
                    min="1"
                    value={String(setGroup.sets)}
                    disabled={!canEdit}
                    onChange={(event) =>
                      onDraftChange({
                        ...draft,
                        setGroups: draft.setGroups.map((group, groupIndex) =>
                          groupIndex === index
                            ? { ...group, sets: Math.max(1, Number(event.target.value) || 1) }
                            : group,
                        ),
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
                      onDraftChange({
                        ...draft,
                        setGroups: draft.setGroups.map((group, groupIndex) =>
                          groupIndex === index ? { ...group, reps: event.target.value } : group,
                        ),
                      })
                    }
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
                <p className="page-note" style={{ margin: 0 }}>
                  Block {index + 1}
                </p>
                <button
                  type="button"
                  className="ghost-btn danger-btn"
                  disabled={!canEdit || draft.setGroups.length <= 1}
                  onClick={() =>
                    onDraftChange({
                      ...draft,
                      setGroups: draft.setGroups.length <= 1
                        ? draft.setGroups
                        : draft.setGroups.filter((_, groupIndex) => groupIndex !== index),
                    })
                  }
                >
                  Remove Block
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.55rem", flexWrap: "wrap", marginTop: "0.85rem" }}>
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-btn" disabled={!canEdit} onClick={onSave}>
          Save Template Changes
        </button>
      </div>
    </section>
  );
}
