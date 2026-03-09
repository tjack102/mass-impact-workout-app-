export type SyncState = "synced" | "pending" | "retrying";

type SyncStateIndicatorProps = {
  state: SyncState;
};

const syncLabels: Record<SyncState, string> = {
  synced: "Synced",
  pending: "Pending",
  retrying: "Retrying",
};

export function SyncStateIndicator({ state }: SyncStateIndicatorProps) {
  return (
    <span className={`sync-indicator ${state}`}>
      <span className="sync-dot" aria-hidden="true" />
      {syncLabels[state]}
    </span>
  );
}
