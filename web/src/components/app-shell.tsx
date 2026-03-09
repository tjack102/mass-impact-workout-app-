"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { AccessContext } from "@/components/access-context";
import { ProfileToggle } from "@/components/profile-toggle";
import type { HouseholdUser } from "@/lib/household-profiles";
import { getPrefs, savePrefs } from "@/lib/workout-store";

const navItems = [
  { href: "/", label: "Today", short: "TD" },
  { href: "/planner", label: "Planner", short: "PL" },
  { href: "/progress", label: "Progress", short: "PR" },
  { href: "/templates", label: "Templates", short: "TP" },
  { href: "/settings", label: "Settings", short: "ST" },
];

type AppShellProps = {
  children: React.ReactNode;
  initialUnlocked: boolean;
  initialOwnerUnlocked: boolean;
};

const COOKIE_ACCESS_KEY = "mi_household_unlocked";
const COOKIE_OWNER_ACCESS_KEY = "mi_owner_unlocked";

export function AppShell({ children, initialUnlocked, initialOwnerUnlocked }: AppShellProps) {
  const pathname = usePathname();
  const initialPrefs = getPrefs();
  const [gateState, setGateState] = useState<"locked" | "unlocked">(
    initialUnlocked ? "unlocked" : "locked",
  );
  const [ownerUnlocked, setOwnerUnlocked] = useState(initialOwnerUnlocked);
  const [activeUser, setActiveUserState] = useState<HouseholdUser>(initialPrefs.activeUser);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");

  const expectedCode = (process.env.NEXT_PUBLIC_HOUSEHOLD_CODE ?? "massimpact").trim().toLowerCase();
  const expectedOwnerPin = (process.env.NEXT_PUBLIC_OWNER_PIN ?? "").trim();
  const ownerPinEnabled = expectedOwnerPin.length > 0;
  const currentWeek = getPrefs().currentWeek;

  function setActiveUser(nextUser: HouseholdUser) {
    const updated = getPrefs().activeUser === nextUser ? getPrefs() : savePrefs({ activeUser: nextUser });
    setActiveUserState(updated.activeUser);
  }

  function lockOwner() {
    document.cookie = `${COOKIE_OWNER_ACCESS_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    setOwnerUnlocked(false);
  }

  function unlockOwner(pin: string) {
    if (!ownerPinEnabled) {
      return true;
    }

    const normalizedInput = pin.trim();
    if (!normalizedInput || normalizedInput !== expectedOwnerPin) {
      return false;
    }

    document.cookie = `${COOKIE_OWNER_ACCESS_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
    setOwnerUnlocked(true);
    return true;
  }

  function lockApp() {
    document.cookie = `${COOKIE_ACCESS_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    lockOwner();
    setInputCode("");
    setError("");
    setGateState("locked");
  }

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedInput = inputCode.trim().toLowerCase();
    if (!normalizedInput) {
      setError("Enter the household code.");
      return;
    }

    if (normalizedInput !== expectedCode) {
      setError("Code is incorrect.");
      return;
    }

    document.cookie = `${COOKIE_ACCESS_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
    setError("");
    setInputCode("");
    setGateState("unlocked");
  }

  if (gateState !== "unlocked") {
    return (
      <div className="app-shell gate-shell">
        <section className="card panel gate-card reveal">
          <p className="subtle-label" style={{ margin: 0 }}>
            Household Access
          </p>
          <h1 className="page-title" style={{ marginTop: "0.3rem" }}>
            Mass Impact
          </h1>
          <p className="page-note">
            Enter your shared household code to open the training console.
          </p>
          <form className="gate-form" onSubmit={handleUnlock}>
            <label className="subtle-label" htmlFor="household-code">
              Household Code
            </label>
            <input
              id="household-code"
              className="gate-input"
              value={inputCode}
              onChange={(event) => {
                setInputCode(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              type="password"
              autoComplete="off"
              inputMode="text"
            />
            {error ? <p className="gate-error">{error}</p> : null}
            <button type="submit" className="primary-btn">
              Unlock
            </button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <AccessContext.Provider value={{ activeUser, setActiveUser, ownerPinEnabled, ownerUnlocked, unlockOwner, lockOwner }}>
      <div className="app-shell">
        <div className="shell-grid">
          <aside className="side-rail card panel reveal">
            <div>
              <div className="brand-block">
                <h1 className="brand-title">Mass Impact</h1>
                <p className="brand-sub">Iron Ledger Console</p>
              </div>
              <nav className="rail-nav" aria-label="Primary">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link${active ? " active" : ""}`}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        {item.short}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div>
              <p className="subtle-label">Household</p>
              <p style={{ margin: "0.2rem 0 0.3rem" }}>Terence + Cheril</p>
              <p className="page-note" style={{ margin: 0 }} suppressHydrationWarning>
                {activeUser === "his" ? "His" : "Hers"} cycle: Week {currentWeek}
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <ProfileToggle activeUser={activeUser} onChange={setActiveUser} />
              </div>
              {ownerPinEnabled ? (
                <p className="page-note" style={{ marginTop: "0.45rem" }}>
                  Coach mode: {ownerUnlocked ? "Unlocked" : "Locked"}
                </p>
              ) : null}
              <button type="button" className="ghost-btn" style={{ marginTop: "0.9rem" }} onClick={lockApp}>
                Lock App
              </button>
            </div>
          </aside>

          <div className="content-pane">
            <section className="profile-banner card panel reveal">
              <div>
                <p className="subtle-label" style={{ margin: 0 }}>
                  Active Profile
                </p>
                <p className="page-note" style={{ marginTop: "0.2rem" }}>
                  Switch workouts, templates, and progress with one toggle.
                </p>
              </div>
              <ProfileToggle activeUser={activeUser} onChange={setActiveUser} />
            </section>
            <main key={`${pathname}-${activeUser}`}>{children}</main>
          </div>
        </div>

        <nav className="mobile-nav card" aria-label="Bottom navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </AccessContext.Provider>
  );
}
