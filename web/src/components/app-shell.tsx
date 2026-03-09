"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const initialPrefs = getPrefs();
  const [activeUser, setActiveUserState] = useState<HouseholdUser>(initialPrefs.activeUser);
  const currentWeek = getPrefs().currentWeek;

  function setActiveUser(nextUser: HouseholdUser) {
    const updated = getPrefs().activeUser === nextUser ? getPrefs() : savePrefs({ activeUser: nextUser });
    setActiveUserState(updated.activeUser);
  }

  return (
    <AccessContext.Provider value={{ activeUser, setActiveUser, ownerPinEnabled: false, ownerUnlocked: true, unlockOwner: () => true, lockOwner: () => {} }}>
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
