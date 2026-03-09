import { getUserLabel, type HouseholdUser } from "@/lib/household-profiles";

type ProfileToggleProps = {
  activeUser: HouseholdUser;
  onChange: (user: HouseholdUser) => void;
};

export function ProfileToggle({ activeUser, onChange }: ProfileToggleProps) {
  return (
    <div className="profile-toggle" role="tablist" aria-label="Active workout profile">
      {(["his", "hers"] as const).map((user) => (
        <button
          key={user}
          type="button"
          className={`profile-toggle-btn${activeUser === user ? " active" : ""}${user === "hers" ? " hers" : ""}`}
          onClick={() => onChange(user)}
          aria-pressed={activeUser === user}
        >
          {getUserLabel(user)}
        </button>
      ))}
    </div>
  );
}
