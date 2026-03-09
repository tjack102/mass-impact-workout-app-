type WorkoutHeaderProps = {
  dayLabel: string;
  sessionStatus: "Not Started" | "In Progress" | "Completed";
  onPrimaryAction: () => void;
};

function getStatusClass(status: WorkoutHeaderProps["sessionStatus"]) {
  if (status === "In Progress") {
    return "inprogress";
  }

  if (status === "Completed") {
    return "completed";
  }

  return "notstarted";
}

function getPrimaryLabel(status: WorkoutHeaderProps["sessionStatus"]) {
  if (status === "Not Started") {
    return "Start Workout";
  }

  if (status === "In Progress") {
    return "Resume";
  }

  return "Review";
}

export function WorkoutHeader({
  dayLabel,
  sessionStatus,
  onPrimaryAction,
}: WorkoutHeaderProps) {
  return (
    <header className="screen-head reveal">
      <div>
        <h1 className="page-title">Today</h1>
        <p className="page-note">{dayLabel}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <span className={`chip ${getStatusClass(sessionStatus)}`}>{sessionStatus}</span>
        <button type="button" className="primary-btn" onClick={onPrimaryAction}>
          {getPrimaryLabel(sessionStatus)}
        </button>
      </div>
    </header>
  );
}
