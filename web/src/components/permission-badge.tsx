type PermissionBadgeProps = {
  level: "owner" | "partner" | "view";
};

const labels: Record<PermissionBadgeProps["level"], string> = {
  owner: "Owner Edit",
  partner: "Partner Edit",
  view: "View Only",
};

export function PermissionBadge({ level }: PermissionBadgeProps) {
  return <span className={`permission-badge ${level}`}>{labels[level]}</span>;
}
