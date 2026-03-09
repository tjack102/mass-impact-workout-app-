type SessionStatPillProps = {
  label: string;
  value: string;
};

export function SessionStatPill({ label, value }: SessionStatPillProps) {
  return (
    <div className="stat-pill">
      <div className="subtle-label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
