# UX/UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical UX/UI issues across all 7 screens + app shell: consolidate nav to 5 items, merge Volume into Progress, replace text abbreviations with SVG icons, add focus states, standardize CSS, and improve accessibility. All changes must work across all 4 themes (Iron Ledger, Warzone, Neon Overload, Concrete).

**Architecture:** Theme-aware CSS variables already handle cross-theme styling -- new components use existing `var(--*)` tokens. Navigation drops from 6 to 5 items by merging Volume into Progress as a tabbed screen. A new `<ConfirmDialog>` component replaces all `window.confirm()` calls. SVG icons via Lucide React replace all text abbreviations and Unicode characters. A new CSS utility layer eliminates ~168 inline styles.

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + Lucide React (new dep)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `web/src/components/icons.tsx` | Centralized SVG icon exports (wraps Lucide) |
| `web/src/components/confirm-dialog.tsx` | Accessible confirmation dialog for destructive actions |
| `web/src/components/tabs.tsx` | Reusable tab bar component |
| `web/src/components/screens/strength-content.tsx` | Extracted Progress screen content (Strength tab) |
| `web/src/components/screens/volume-content.tsx` | Extracted Volume screen content (Volume tab) |

### Modified Files
| File | What Changes |
|------|-------------|
| `web/src/app/globals.css` | Add focus styles, utility classes, spacing scale, skip-link, sr-only, safe areas, p margin reset, touch target minimums |
| `web/src/components/app-shell.tsx` | 5-item nav, SVG icons, skip link, safe area padding |
| `web/src/components/modal.tsx` | Replace Unicode X with SVG icon |
| `web/src/components/screens/progress-screen.tsx` | Rewrite: tab container with Strength + Volume tabs |
| `web/src/components/screens/volume-screen.tsx` | Delete (content moves to volume-content.tsx) |
| `web/src/components/screens/planner-screen.tsx` | Aria-labels, touch targets, inline style cleanup |
| `web/src/components/screens/library-screen.tsx` | SVG icons, aria-labels, inline style cleanup |
| `web/src/components/screens/settings-screen.tsx` | ConfirmDialog, aria-labels, inline style cleanup |
| `web/src/components/screens/templates-screen.tsx` | ConfirmDialog, empty state, inline style cleanup |
| `web/src/components/screens/today-screen.tsx` | Aria-labels, aria-live, inline style cleanup |
| `web/src/app/volume/page.tsx` | Redirect to /progress?tab=volume |
| `web/src/app/layout.tsx` | May need font import for Lucide |

### Deleted Files
| File | Reason |
|------|--------|
| `web/src/components/screens/volume-screen.tsx` | Content extracted to volume-content.tsx, screen merged into progress |
| `web/src/app/volume/page.tsx` | Route replaced with redirect |

---

## Task 1: Install Lucide React + Add Icon Component

**Files:**
- Modify: `web/package.json` (add lucide-react)
- Create: `web/src/components/icons.tsx`

- [ ] **Step 1: Install lucide-react**

```bash
cd web && npm install lucide-react
```

- [ ] **Step 2: Create centralized icon exports**

Create `web/src/components/icons.tsx`:
```tsx
export {
  Dumbbell,
  Calendar,
  TrendingUp,
  ClipboardList,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Pencil,
  Plus,
  GripVertical,
  Trash2,
  Search,
  Flame,
} from "lucide-react";
```

- [ ] **Step 3: Verify import works**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/package.json web/package-lock.json web/src/components/icons.tsx
git commit -m "feat: add lucide-react icon library with centralized exports"
```

---

## Task 2: Add Global CSS Foundation (Focus, Utilities, Reset, Safe Areas)

**Files:**
- Modify: `web/src/app/globals.css`

This task adds the CSS infrastructure all subsequent tasks depend on. All styles use existing CSS variables so they work across all 4 themes automatically.

- [ ] **Step 1: Add paragraph margin reset after the `body` rule (after line ~262)**

```css
p {
  margin: 0;
}
```

- [ ] **Step 2: Add focus-visible styles after the `a` rule (after line ~267)**

```css
/* Focus states — works across all themes via CSS variables */
:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}
```

- [ ] **Step 3: Add skip link styles**

```css
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0.5rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: var(--accent-primary);
  color: var(--text-on-accent);
  font-family: var(--font-ui);
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.skip-link:focus {
  left: 1rem;
}
```

- [ ] **Step 4: Add screen reader utility**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

- [ ] **Step 5: Note on utility classes**

**Do NOT add custom spacing/layout utility classes.** This project uses Tailwind CSS 4 (`@import "tailwindcss"` at line 1 of globals.css), which already provides all standard utilities:
- Spacing: `mt-0`, `mt-1`, `mt-2`, `mt-3`, `mt-4`, `mb-2`, `gap-1`, `gap-2`, `gap-3`
- Layout: `flex`, `flex-col`, `items-center`, `justify-between`, `flex-wrap`

When replacing inline styles in Tasks 11-12, use Tailwind classes directly in JSX. Only add custom CSS classes for patterns that Tailwind doesn't cover (e.g., `.flex-between` is `flex justify-between items-center` in Tailwind -- just use the Tailwind version).

- [ ] **Step 7: Add touch target minimum to ghost-btn**

Find the existing `.ghost-btn` rule (line ~594) and change `height: 40px` to `min-height: 44px`:
```css
.ghost-btn {
  /* ... existing properties ... */
  min-height: 44px;  /* was height: 40px */
  /* ... */
}
```

- [ ] **Step 8: Add safe area padding to mobile nav**

Find `.mobile-nav` (line ~1255) and add safe area support:
```css
.mobile-nav {
  /* ... existing properties ... */
  bottom: max(0.74rem, env(safe-area-inset-bottom, 0.74rem));
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

- [ ] **Step 9: Add reduced-motion media query at end of file**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 10: Verify build passes**

```bash
cd web && npx next build 2>&1 | head -20
```

- [ ] **Step 11: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat: add focus states, utility classes, safe areas, reduced-motion support"
```

---

## Task 3: Redesign App Shell Navigation (5 Items + SVG Icons)

**Files:**
- Modify: `web/src/components/app-shell.tsx`
- Modify: `web/src/app/globals.css` (nav icon styles)

- [ ] **Step 1: Update navItems array and add skip link**

In `app-shell.tsx`, replace the navItems array and update imports:
```tsx
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
```

- [ ] **Step 2: Add skip link as first child of app-shell div**

```tsx
<div className={`app-shell${hasSession ? " workout-active" : ""}`}>
  <a href="#main-content" className="skip-link">Skip to content</a>
  {/* ... rest of shell ... */}
```

- [ ] **Step 3: Update desktop side rail nav links to use icons**

Replace the rail nav mapping:
```tsx
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
```

- [ ] **Step 4: Replace settings emoji with SVG icon**

Replace the `⚙` character:
```tsx
<Link href="/settings" className="settings-gear-btn" aria-label="Settings">
  <Settings size={20} aria-hidden="true" />
</Link>
```

- [ ] **Step 5: Update mobile bottom nav to use icons**

```tsx
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
```

- [ ] **Step 6: Add `id="main-content"` to the main element**

```tsx
<main id="main-content" key={`${pathname}-${activeUser}`}>{children}</main>
```

- [ ] **Step 7: Update CSS for icon-based nav**

In `globals.css`, update `.mobile-link-icon` and `.nav-icon` to handle SVG:
```css
.mobile-link-icon {
  display: flex;
  justify-content: center;
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
}
```

Remove the old `.mobile-link-icon` font-family/font-size/font-weight rules.

- [ ] **Step 8: Update mobile nav grid to 5 columns**

Find the `.mobile-nav` rule and update the grid:
```css
.mobile-nav {
  /* ... */
  grid-template-columns: repeat(5, minmax(0, 1fr));
  /* ... */
}
```

- [ ] **Step 9: Verify TypeScript and build**

```bash
cd web && npx tsc --noEmit && npx next build 2>&1 | head -20
```

- [ ] **Step 10: Commit**

```bash
git add web/src/components/app-shell.tsx web/src/app/globals.css
git commit -m "feat: redesign nav with 5 items, SVG icons, skip link, aria-current"
```

---

## Task 4: Create Confirmation Dialog Component

**Files:**
- Create: `web/src/components/confirm-dialog.tsx`

- [ ] **Step 1: Create the ConfirmDialog component**

```tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  /** If set, user must type this string to enable the confirm button */
  requireText?: string;
  destructive?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  requireText,
  destructive = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  const canConfirm = requireText ? typed === requireText : true;

  function handleConfirm() {
    if (!canConfirm) return;
    setTyped("");
    onConfirm();
  }

  function handleClose() {
    setTyped("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <p className="mt-2" style={{ color: "var(--text-1)" }}>{message}</p>
      {requireText && (
        <div className="mt-3">
          <label htmlFor="confirm-input" className="subtle-label">
            Type <strong style={{ color: "var(--text-0)" }}>{requireText}</strong> to confirm
          </label>
          <input
            id="confirm-input"
            type="text"
            className="compact-select mt-1"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            style={{ width: "100%" }}
          />
        </div>
      )}
      <div className="flex-between mt-4">
        <button type="button" className="ghost-btn" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className={destructive ? "danger-btn ghost-btn" : "ghost-btn"}
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={destructive ? { borderColor: `color-mix(in srgb, var(--danger), transparent 30%)` } : undefined}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/confirm-dialog.tsx
git commit -m "feat: add accessible ConfirmDialog component for destructive actions"
```

---

## Task 5: Create Tab Bar Component

**Files:**
- Create: `web/src/components/tabs.tsx`
- Modify: `web/src/app/globals.css` (tab styles)

- [ ] **Step 1: Create the Tabs component**

```tsx
"use client";

type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-item${active === tab.id ? " tab-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add tab CSS to globals.css**

```css
/* Tab bar */
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: var(--border-width) solid var(--border);
  margin-bottom: 1rem;
}

.tab-item {
  flex: 1;
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  color: var(--text-1);
  font-family: var(--font-ui);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: var(--btn-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 150ms var(--ease-standard),
              border-color 150ms var(--ease-standard);
}

.tab-item:hover {
  color: var(--text-0);
}

.tab-active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
}
```

- [ ] **Step 3: Verify build**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/tabs.tsx web/src/app/globals.css
git commit -m "feat: add accessible tab bar component"
```

---

## Task 6: Merge Volume into Progress Screen

**Files:**
- Create: `web/src/components/screens/strength-content.tsx`
- Create: `web/src/components/screens/volume-content.tsx`
- Modify: `web/src/components/screens/progress-screen.tsx`
- Modify: `web/src/app/volume/page.tsx` (redirect)

This is the most complex task. The strategy: extract existing progress-screen.tsx content into strength-content.tsx, extract volume-screen.tsx content into volume-content.tsx, then rewrite progress-screen.tsx as a tab container.

- [ ] **Step 1: Create strength-content.tsx**

Copy the entire body of the current `ProgressScreen` component into a new `StrengthContent` component. Keep all the same imports, logic, and JSX. Just rename the export and remove the `<section className="screen">` wrapper (the parent will provide it).

The component should export: `export function StrengthContent()`

Move these from progress-screen.tsx:
- `isoWeekKey()` helper
- All the session/history queries
- Chart components
- PR board
- Heatmap
- All JSX

- [ ] **Step 2: Create volume-content.tsx**

Copy the entire body of the current `VolumeScreen` component into `VolumeContent`. Keep all imports, state, effects, and JSX. Rename export to `export function VolumeContent()`. Remove the `<section className="screen">` wrapper.

Key pieces to preserve:
- `toTitleCase()` and `buildSparklineData()` helpers
- All `useState`/`useEffect`/`useMemo` hooks
- The `ready` loading state guard
- All muscle card rendering
- Recommendations section
- Meso history section

- [ ] **Step 3: Rewrite progress-screen.tsx as tab container**

```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs } from "@/components/tabs";
import { StrengthContent } from "@/components/screens/strength-content";
import { VolumeContent } from "@/components/screens/volume-content";

const TABS = [
  { id: "strength", label: "Strength" },
  { id: "volume", label: "Volume" },
];

export function ProgressScreen() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "volume" ? "volume" : "strength";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <section className="screen">
      <p className="subtle-label">PROGRESS</p>
      <h1 className="page-title">Progress</h1>
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === "strength" ? <StrengthContent /> : <VolumeContent />}
    </section>
  );
}
```

- [ ] **Step 4: Convert volume/page.tsx to redirect**

```tsx
import { redirect } from "next/navigation";

export default function VolumePage() {
  redirect("/progress?tab=volume");
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 6: Verify build**

```bash
cd web && npx next build 2>&1 | head -30
```

- [ ] **Step 7: Run existing tests**

```bash
cd web && npx vitest run
```

- [ ] **Step 8: Commit**

```bash
git add web/src/components/screens/strength-content.tsx web/src/components/screens/volume-content.tsx web/src/components/screens/progress-screen.tsx web/src/app/volume/page.tsx
git commit -m "feat: merge Volume into Progress as tabbed screen (Strength | Volume)"
```

---

## Task 7: Replace Unicode Characters with SVG Icons

**Files:**
- Modify: `web/src/components/modal.tsx`
- Modify: `web/src/components/screens/library-screen.tsx`
- Modify: `web/src/components/exercise-picker-modal.tsx`
- Modify: `web/src/components/screens/volume-content.tsx` (extracted in Task 6)
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/warmup-calculator.tsx`

- [ ] **Step 1: Replace modal close button**

In `modal.tsx`, import `X` from icons and replace `✕`:
```tsx
import { X } from "@/components/icons";
// ...
<button className="ghost-btn modal-close" onClick={onClose} aria-label="Close">
  <X size={18} aria-hidden="true" />
</button>
```

- [ ] **Step 2: Replace library screen icons**

In `library-screen.tsx`:
- Replace `↗` with `<ExternalLink size={16} />`
- Replace `✎` and `+↗` with `<Pencil size={16} />` and `<Plus size={16} />`
- Replace `▸`/`▾` chevrons with `<ChevronRight size={16} />` / `<ChevronDown size={16} />`

Add imports:
```tsx
import { ExternalLink, Pencil, Plus, ChevronRight, ChevronDown } from "@/components/icons";
```

- [ ] **Step 3: Replace exercise-picker-modal arrow**

In `exercise-picker-modal.tsx` line 81, replace `↗` with:
```tsx
import { ExternalLink } from "@/components/icons";
// ...
<ExternalLink size={14} aria-hidden="true" />
```

- [ ] **Step 4: Replace volume screen caret**

In `volume-content.tsx`, replace `&#9660;` with:
```tsx
import { ChevronDown } from "@/components/icons";
// ...
<ChevronDown size={14} aria-hidden="true" />
```

- [ ] **Step 5: Replace warmup calculator gear**

In `warmup-calculator.tsx`, replace `⚙` with:
```tsx
import { Settings } from "@/components/icons";
// ...
<Settings size={16} aria-hidden="true" />
```

- [ ] **Step 6: Replace today screen fire emoji**

In `today-screen.tsx`, replace `🔥` with:
```tsx
import { Flame } from "@/components/icons";
// ...
<Flame size={18} className="warmup-standalone-icon" aria-hidden="true" />
```

- [ ] **Step 7: Verify TypeScript and build**

```bash
cd web && npx tsc --noEmit && npx next build 2>&1 | head -20
```

- [ ] **Step 8: Commit**

```bash
git add web/src/components/modal.tsx web/src/components/exercise-picker-modal.tsx web/src/components/screens/library-screen.tsx web/src/components/screens/today-screen.tsx web/src/components/warmup-calculator.tsx
git commit -m "feat: replace all Unicode characters with Lucide SVG icons"
```

---

## Task 8: Replace window.confirm() with ConfirmDialog

**Files:**
- Modify: `web/src/components/screens/settings-screen.tsx`
- Modify: `web/src/components/screens/templates-screen.tsx`

- [ ] **Step 1: Update settings-screen.tsx**

Import and add state for each confirmation:
```tsx
import { ConfirmDialog } from "@/components/confirm-dialog";
```

Add state variables:
```tsx
const [confirmReset, setConfirmReset] = useState(false);
const [confirmClear, setConfirmClear] = useState(false);
```

Replace each `window.confirm()` call with:
```tsx
<button onClick={() => setConfirmReset(true)} ...>Reset Volume Landmarks</button>
<ConfirmDialog
  open={confirmReset}
  onClose={() => setConfirmReset(false)}
  onConfirm={() => { /* existing reset logic */ setConfirmReset(false); }}
  title="Reset Volume Landmarks"
  message="This will reset all volume landmarks to defaults. This cannot be undone."
  confirmLabel="Reset"
  destructive
/>
```

Do the same for "Clear All Data" with `requireText="DELETE"`.

- [ ] **Step 2: Update templates-screen.tsx**

Same pattern -- replace `window.confirm()` for "Restore template" and "Delete exercise" with `ConfirmDialog`.

- [ ] **Step 3: Verify TypeScript and build**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/screens/settings-screen.tsx web/src/components/screens/templates-screen.tsx
git commit -m "feat: replace window.confirm with accessible ConfirmDialog"
```

---

## Task 9: Add Aria-Labels and Accessibility Attributes

**Files:**
- Modify: `web/src/components/screens/planner-screen.tsx`
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/screens/library-screen.tsx`
- Modify: `web/src/components/screens/settings-screen.tsx`

- [ ] **Step 1: Fix planner navigation buttons**

Add aria-labels to week navigation:
```tsx
<button aria-label="Previous week" ...>
  <ChevronLeft size={16} aria-hidden="true" />
</button>
<button aria-label="Next week" ...>
  <ChevronRight size={16} aria-hidden="true" />
</button>
```

Add aria-label to day tile buttons:
```tsx
<button aria-label={`${tile.label}: ${tile.title}`} ...>
```

- [ ] **Step 2: Fix today screen**

Add `aria-live="polite"` to the save flash feedback area.
Add aria-labels to set entry inputs:
```tsx
<input aria-label="Weight" .../>
<input aria-label="Reps" .../>
<input aria-label="RPE" .../>
```

- [ ] **Step 3: Fix library screen**

Add `aria-label="Search exercises"` to the search input.
Add aria-labels to action buttons:
```tsx
<button aria-label="View demo video" ...>
<button aria-label="Edit exercise URL" ...>
<button aria-label={`Expand ${muscle} section`} ...>
```

- [ ] **Step 4: Fix settings screen**

Add `aria-label` to all action buttons and form inputs that lack labels.
Associate labels with select elements using `htmlFor`/`id`.

- [ ] **Step 5: Verify build**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/screens/planner-screen.tsx web/src/components/screens/today-screen.tsx web/src/components/screens/library-screen.tsx web/src/components/screens/settings-screen.tsx
git commit -m "feat: add aria-labels and accessibility attributes across all screens"
```

---

## Task 10: Fix Touch Targets Across All Screens

**Files:**
- Modify: `web/src/components/screens/planner-screen.tsx`
- Modify: `web/src/components/screens/volume-content.tsx`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Fix planner week stepper buttons**

Change inline height from 34px to 44px min-height:
```tsx
style={{ minHeight: "44px", ... }}
```

Or better, add a CSS class and remove inline style.

- [ ] **Step 2: Fix volume toggle buttons**

The Direct/Total toggle buttons are 26px. Update the CSS or inline styles to ensure 44px min-height:
```css
.volume-toggle-btn {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
}
```

- [ ] **Step 3: Verify no buttons below 44px remain**

Search for `height:` values below 44px in inline styles across all screen components:
```bash
cd web && grep -rn "height.*3[0-9]px\|height.*2[0-9]px" src/components/screens/
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/screens/planner-screen.tsx web/src/app/globals.css
git commit -m "fix: ensure all interactive elements meet 44px minimum touch target"
```

---

## Task 11: Migrate Inline Styles to CSS Classes (Batch 1 -- High-frequency)

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/components/screens/today-screen.tsx`
- Modify: `web/src/components/screens/settings-screen.tsx`
- Modify: `web/src/components/screens/volume-content.tsx`

Focus on the top 3 files with most inline styles (today: 41, volume: 37, settings: 32).

- [ ] **Step 1: Replace `style={{ margin: 0 }}` with class `mt-0`**

The paragraph margin reset from Task 2 (`p { margin: 0 }`) eliminates most of these. Remove the redundant `style={{ margin: 0 }}` from `<p>` tags across all screens. Don't touch non-`<p>` elements where margin: 0 is intentional for other elements.

- [ ] **Step 2: Replace flex layout inline styles**

Find patterns like:
```tsx
style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
```
Replace with `className="flex justify-between items-center"` (Tailwind utilities).

Find patterns like:
```tsx
style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
```
Replace with `className="flex flex-col gap-2"` (Tailwind utilities).

- [ ] **Step 3: Replace margin-top inline styles**

Replace `style={{ marginTop: "0.5rem" }}` with `className="mt-2"` (Tailwind).
Replace `style={{ marginTop: "0.75rem" }}` with `className="mt-3"` (Tailwind).
Replace `style={{ marginTop: "1rem" }}` with `className="mt-4"` (Tailwind).

For non-standard values (0.2rem, 0.35rem, 0.85rem, 0.9rem), round to nearest Tailwind scale value or use arbitrary value syntax: `mt-[0.35rem]`.

- [ ] **Step 4: Verify nothing broke visually**

```bash
cd web && npx next build 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/globals.css web/src/components/screens/
git commit -m "refactor: migrate high-frequency inline styles to CSS utility classes"
```

---

## Task 12: Migrate Inline Styles (Batch 2 -- Remaining Screens)

**Files:**
- Modify: `web/src/components/screens/planner-screen.tsx`
- Modify: `web/src/components/screens/templates-screen.tsx`
- Modify: `web/src/components/screens/library-screen.tsx`
- Modify: `web/src/components/screens/progress-screen.tsx`
- Modify: `web/src/components/app-shell.tsx`

- [ ] **Step 1: Apply same patterns from Task 11**

Replace `margin: 0` on p tags (now redundant), flex layouts, and margin-top values with utility classes.

- [ ] **Step 2: Verify build**

```bash
cd web && npx tsc --noEmit && npx next build 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/screens/ web/src/components/app-shell.tsx
git commit -m "refactor: migrate remaining inline styles to CSS utility classes"
```

---

## Task 13: Delete Old Volume Route + Clean Up

**Files:**
- Delete: `web/src/components/screens/volume-screen.tsx`
- Verify: `web/src/app/volume/page.tsx` (should already be redirect from Task 6)

- [ ] **Step 1: Delete the old volume-screen.tsx**

```bash
rm web/src/components/screens/volume-screen.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
cd web && grep -rn "volume-screen" src/
```

If any imports remain, update them to point to volume-content.tsx.

- [ ] **Step 3: Verify build**

```bash
cd web && npx tsc --noEmit && npx next build 2>&1 | head -20
```

- [ ] **Step 4: Run all tests**

```bash
cd web && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old volume-screen after merge into progress"
```

---

## Task 14: Final Verification

- [ ] **Step 1: TypeScript check**

```bash
cd web && npx tsc --noEmit
```

- [ ] **Step 2: Full build**

```bash
cd web && npx next build
```

- [ ] **Step 3: Run all tests**

```bash
cd web && npx vitest run
```

- [ ] **Step 4: Verify all 4 themes render**

Check that the CSS changes don't break any theme. Focus states, utility classes, and tab bar all use CSS variables that are defined in all 4 theme blocks.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments from UX/UI overhaul verification"
```
