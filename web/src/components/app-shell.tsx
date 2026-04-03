"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTheme, setTheme } from "@/lib/theme-store";
import { AccessContext } from "@/components/access-context";
import { ProfileToggle } from "@/components/profile-toggle";
import { ProgramSelector } from "@/components/program-selector";
import type { HouseholdUser } from "@/lib/household-profiles";
import { getActiveSession, getPrefs, savePrefs } from "@/lib/workout-store";
import { loadExerciseUrls } from "@/lib/exercise-url-store";
import {
  Dumbbell,
  Calendar,
  TrendingUp,
  ClipboardList,
  BookOpen,
  Settings,
} from "@/components/icons";

const navItems = [
  { href: "/", label: "Today", icon: Dumbbell },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/templates", label: "Templates", icon: ClipboardList },
  { href: "/library", label: "Library", icon: BookOpen },
];

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const initialPrefs = getPrefs();
  const [activeUser, setActiveUserState] = useState<HouseholdUser>(initialPrefs.activeUser);
  const currentWeek = getPrefs().currentWeek;
  const [hasSession, setHasSession] = useState(false);

  // Re-apply stored theme after React hydration (hydration strips the data-theme attribute)
  useEffect(() => {
    setTheme(getTheme());
    loadExerciseUrls();
  }, []);

  useEffect(() => {
    const sync = () => setHasSession(getActiveSession() !== null);
    sync(); // initial read after hydration
    window.addEventListener("workout-session-change", sync);
    return () => window.removeEventListener("workout-session-change", sync);
  }, [activeUser]); // re-sync on profile switch

  function setActiveUser(nextUser: HouseholdUser) {
    const updated = getPrefs().activeUser === nextUser ? getPrefs() : savePrefs({ activeUser: nextUser });
    setActiveUserState(updated.activeUser);
  }

  return (
    <AccessContext.Provider value={{ activeUser, setActiveUser, ownerPinEnabled: false, ownerUnlocked: true, unlockOwner: () => true, lockOwner: () => {} }}>
      <div className={`app-shell${hasSession ? " workout-active" : ""}`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
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
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link${active ? " active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon size={20} aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div>
              <p className="subtle-label">Household</p>
              <p style={{ margin: "0.2rem 0 0.3rem" }}>Terence + Cheril</p>
              <p className="page-note" suppressHydrationWarning>
                {activeUser === "his" ? "His" : "Hers"} cycle: Week {currentWeek}
              </p>
              <div className="mt-3">
                <ProfileToggle activeUser={activeUser} onChange={setActiveUser} />
              </div>
              <div className="mt-3">
                <p className="subtle-label" style={{ marginBottom: "0.3rem" }}>Program</p>
                <ProgramSelector activeUser={activeUser} />
              </div>
            </div>
          </aside>

          <div className="content-pane">
            <section className="profile-banner card panel reveal">
              <div className="flex-1">
                <p className="subtle-label">
                  Active Profile
                </p>
                <p className="page-note mt-0.5">
                  Switch workouts, templates, and progress with one toggle.
                </p>
                <div className="mt-2">
                  <ProgramSelector activeUser={activeUser} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link href="/settings" className="settings-gear-btn" aria-label="Settings">
                  <Settings size={20} aria-hidden="true" />
                </Link>
                <ProfileToggle activeUser={activeUser} onChange={setActiveUser} />
              </div>
            </section>
            <main id="main-content" key={`${pathname}-${activeUser}`}>{children}</main>
          </div>
        </div>

        {!hasSession && (
          <nav className="mobile-nav" aria-label="Bottom navigation">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-link${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={20} className="mobile-link-icon" aria-hidden="true" />
                  <span className="mobile-link-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </AccessContext.Provider>
  );
}
