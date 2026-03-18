# Theme System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-theme switchable visual identity system (Iron Ledger, WARZONE, NEON OVERLOAD, CONCRETE) that changes colors, typography, borders, shadows, and structural elements while keeping all UX identical.

**Architecture:** CSS custom properties on `:root` define the Iron Ledger baseline. Each theme overrides via `[data-theme="X"]` selectors. A two-layer font variable system (raw `next/font` vars → semantic `--font-display`/`--font-ui`/`--font-mono`) allows per-theme typography. Theme persists in `localStorage` under `mi_theme`, applied before first paint via a blocking `<script>`.

**Tech Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + CSS custom properties + `next/font/google` + `color-mix()` + `backdrop-filter`

**Spec:** `docs/superpowers/specs/2026-03-18-theme-system-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|---|---|
| `web/src/lib/theme-store.ts` | ThemeId type, THEMES record, getTheme(), setTheme(), SSR guard |
| `web/src/components/theme-picker.tsx` | 2×2 grid theme selector (settings integration) |

### Modified Files
| File | Changes |
|---|---|
| `web/src/app/globals.css` | Add missing tokens to `:root`, tokenize hardcoded hex/rgba, add 3 theme blocks + structural overrides |
| `web/src/app/layout.tsx` | Import 8 additional Google Fonts, add all font variable classes to `<body>`, add flash-prevention `<script>` |
| `web/src/components/volume-bar.tsx` | Replace ~16 hardcoded hex colors with CSS variable references |
| `web/src/components/rest-timer-dial.tsx` | Replace 1 hardcoded hex with CSS variable |
| `web/src/components/screens/volume-screen.tsx` | Replace 4 hardcoded hex/rgba with CSS variables |
| `web/src/components/screens/settings-screen.tsx` | Import and render `<ThemePicker />` at top of settings |
| `web/src/components/screens/planner-screen.tsx` | Minor: verify CSS var fallbacks work across themes (Task 13) |

---

## Chunk 1: Foundation

### Task 1: Create theme-store.ts

**Files:**
- Create: `web/src/lib/theme-store.ts`

- [ ] **Step 1: Create theme-store.ts with types and THEMES record**

```typescript
// web/src/lib/theme-store.ts
export type ThemeId = "iron-ledger" | "warzone" | "neon-overload" | "concrete";

export const THEMES: Record<ThemeId, { name: string; description: string; themeColor: string }> = {
  "iron-ledger": { name: "Iron Ledger", description: "The original. Clean and composed.", themeColor: "#0B0D10" },
  "warzone": { name: "WARZONE", description: "Stencil. Steel. Sharp edges.", themeColor: "#0a0a0a" },
  "neon-overload": { name: "NEON OVERLOAD", description: "Glow hard or go home.", themeColor: "#08080f" },
  "concrete": { name: "CONCRETE", description: "Loud type. Quiet surfaces.", themeColor: "#d4cfc8" },
};

const THEME_KEY = "mi_theme";

export function getTheme(): ThemeId {
  if (typeof window === "undefined") return "iron-ledger";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored && stored in THEMES) return stored as ThemeId;
  return "iron-ledger";
}

export function setTheme(id: ThemeId): void {
  localStorage.setItem(THEME_KEY, id);
  document.documentElement.setAttribute("data-theme", id);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEMES[id].themeColor);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to theme-store.ts

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/theme-store.ts
git commit -m "feat(theme): add theme-store with types, THEMES record, get/set"
```

---

### Task 2: Add missing tokens to :root in globals.css

The existing `:root` is missing several tokens that themes need to override. Add them with Iron Ledger's values so the current UI is unchanged but themes can target them.

**Files:**
- Modify: `web/src/app/globals.css` (`:root` block, lines 2-23)

**Reference:** Spec section "Hardcoded Colors Audit → New tokens needed"

- [ ] **Step 1: Add new tokens inside the existing `:root` block**

Add these tokens to the end of the `:root` block (before the closing `}`):

```css
  /* Theme tokens — new */
  --bg-input: #0f141a;
  --bg-index: #10151b;
  --bg-stat: #0f1318;
  --bg-heat: #11161d;
  --text-2: #8891a4;
  --text-on-accent: #03201f;
  --text-on-accent-hers: #260613;
  --text-on-power: #180f01;
  --nav-bg: rgba(18, 22, 27, 0.78);
  --btn-radius: 10px;
  --btn-letter-spacing: 0.08em;
  --card-bg: linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), #12161b;
  --card-backdrop: none;
  --dial-inner-bg: linear-gradient(160deg, rgba(26,32,40,0.96), rgba(10,11,14,0.96));
  --glow-strength: 0;
  --noise-opacity: 0;
  --overlay-opacity: 1;
  --body-bg: radial-gradient(circle at 12% 10%, rgba(38,217,209,0.16), transparent 34%), radial-gradient(circle at 84% 14%, rgba(240,138,36,0.17), transparent 30%), linear-gradient(154deg, #0a0d11 10%, #0d1015 36%, #090b0f 100%);
  --accent-gradient-his: linear-gradient(135deg, color-mix(in srgb, #26d9d1, white 12%), #b1f0ed);
  --accent-gradient-hers: linear-gradient(135deg, color-mix(in srgb, #ff5a8b, white 12%), #ffb1c7);
  --font-display: var(--font-teko);
  --font-ui: var(--font-source-sans);
  --font-mono: var(--font-jetbrains-mono);
```

- [ ] **Step 2: Verify the app still renders identically**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): add missing Iron Ledger tokens to :root"
```

---

### Task 3: Font loading in layout.tsx

Add the 8 additional Google Font imports to `layout.tsx` and attach their CSS variable classes to `<body>`.

**Files:**
- Modify: `web/src/app/layout.tsx`

**Current state (lines 3-5):**
```typescript
import { JetBrains_Mono, Source_Sans_3, Teko } from "next/font/google";
```

**Current font variables:**
- `teko` → `--font-display` (needs rename to `--font-teko`)
- `sourceSans` → `--font-ui` (needs rename to `--font-source-sans`)
- `mono` → `--font-mono` (needs rename to `--font-jetbrains-mono`)

- [ ] **Step 1: Read current layout.tsx to see exact structure**

Read: `web/src/app/layout.tsx`

- [ ] **Step 2: Update font imports and variable names**

Replace the existing 3 font imports and their configuration with all 11 fonts. Change the variable names from semantic (`--font-display`) to raw (`--font-teko`) so the two-layer system works.

```typescript
import {
  Teko,
  Source_Sans_3,
  JetBrains_Mono,
  Black_Ops_One,
  Barlow_Condensed,
  Share_Tech_Mono,
  Orbitron,
  Exo_2,
  Bebas_Neue,
  DM_Sans,
  IBM_Plex_Mono,
} from "next/font/google";

// Iron Ledger fonts
const teko = Teko({ variable: "--font-teko", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

// WARZONE fonts
const blackOpsOne = Black_Ops_One({ variable: "--font-black-ops-one", weight: "400", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow-condensed", weight: ["400", "600"], subsets: ["latin"] });
const shareTechMono = Share_Tech_Mono({ variable: "--font-share-tech-mono", weight: "400", subsets: ["latin"] });

// NEON OVERLOAD fonts
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const exo2 = Exo_2({ variable: "--font-exo2", subsets: ["latin"] });
// (JetBrains Mono shared with Iron Ledger)

// CONCRETE fonts
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", weight: "400", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-ibm-plex-mono", weight: ["400", "500"], subsets: ["latin"] });
```

- [ ] **Step 3: Update body className to include all font variable classes**

The `<body>` tag's `className` needs all 11 font variable classes so the raw CSS variables are available on the DOM:

```tsx
<body className={`${teko.variable} ${sourceSans.variable} ${jetbrainsMono.variable} ${blackOpsOne.variable} ${barlowCondensed.variable} ${shareTechMono.variable} ${orbitron.variable} ${exo2.variable} ${bebasNeue.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}>
```

- [ ] **Step 4: Add flash-prevention script as first child of `<body>`**

Insert immediately before `{children}` inside the `<body>` tag:

```tsx
<script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('mi_theme');if(t){document.documentElement.setAttribute('data-theme',t);var m={'iron-ledger':'#0B0D10','warzone':'#0a0a0a','neon-overload':'#08080f','concrete':'#d4cfc8'};var c=m[t];if(c){var e=document.querySelector('meta[name="theme-color"]');if(e)e.setAttribute('content',c)}}}catch(e){}` }} />
```

- [ ] **Step 5: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -10`
Expected: Build succeeds. All 11 routes prerender.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat(theme): load all 11 font families + flash prevention script"
```

---

### Task 4: Tokenize hardcoded colors in globals.css

Replace all hardcoded hex/rgba values in `globals.css` component rules with CSS variable references. This is the largest single task.

**Files:**
- Modify: `web/src/app/globals.css`

**Strategy:** Work through the file top-to-bottom, replacing each hardcoded value with its token. This task does NOT add theme blocks — just makes the existing CSS token-ready.

- [ ] **Step 1: Read globals.css to see current state (it may have changed from Task 2)**

Read: `web/src/app/globals.css`

- [ ] **Step 2: Replace body background with `--body-bg` token**

Find the `body` rule (around line 38-50). The body background is a multi-line compound gradient — replace the entire `background:` property value (which spans multiple lines) with a single `var(--body-bg)`:

```css
/* After: */
body {
  background: var(--body-bg);
  /* keep other properties (color, font-family, etc.) unchanged */
}
```

**Note:** The "before" value spans 3-4 lines in the actual file. Match the entire `background:` declaration from `radial-gradient(...)` through the semicolon.

- [ ] **Step 3: Replace hardcoded input/surface backgrounds**

Replace all instances of `#0f141a` with `var(--bg-input)`:
- `.gate-input` background
- `.profile-toggle` background
- `.compact-select` background
- `.set-cell input` / `.set-cell select` background
- `.day-tile` background
- `.tree-item` / `.exercise-item` background
- `.editor-form input` / `.editor-form textarea` background

Replace `#10151b` with `var(--bg-index)`:
- `.set-index` background

Replace `#0f1318` with `var(--bg-stat)`:
- `.stat-pill` background

Replace `#11161d` with `var(--bg-heat)`:
- `.heat-cell` background

- [ ] **Step 4: Replace hardcoded text-on-accent colors**

Replace `#03201f` with `var(--text-on-accent)`:
- `.profile-toggle-btn.active` color
- `.primary-btn` color

Replace `#260613` with `var(--text-on-accent-hers)`:
- `.profile-toggle-btn.active.hers` color

Replace `#180f01` with `var(--text-on-power)`:
- `.set-save-btn` color

- [ ] **Step 5: Replace hardcoded accent rgba() values with color-mix()**

Replace all `rgba(38, 217, 209, ...)` patterns:
- `.nav-link.active` background: `rgba(38, 217, 209, 0.16)` → `color-mix(in srgb, var(--accent-primary), transparent 84%)`
- `.nav-link.active` border-bottom: `rgba(38, 217, 209, 0.03)` → `color-mix(in srgb, var(--accent-primary), transparent 97%)`
- `.logged-set-chip` background: `rgba(38, 217, 209, 0.06)` → `color-mix(in srgb, var(--accent-primary), transparent 94%)`
- `.trend-bar` gradient: `rgba(38, 217, 209, 0.2)` → `color-mix(in srgb, var(--accent-primary), transparent 80%)`
- `.mobile-link.active` background: `rgba(38, 217, 209, 0.1)` → `color-mix(in srgb, var(--accent-primary), transparent 90%)`

Replace hardcoded gradient endpoints:
- `.primary-btn` gradient: `#7ef5ef` → `color-mix(in srgb, var(--accent-primary), white 40%)`
- `.set-save-btn` gradient: `#f6ae62` → `color-mix(in srgb, var(--accent-power), white 40%)`

- [ ] **Step 6: Replace hardcoded compound backgrounds**

Card background:
```css
/* Before: */
.card { background: linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), var(--bg-1); }
/* After: */
.card { background: var(--card-bg); }
```

Live console background (slightly different opacity — 0.04 vs card's 0.03 — but we're unifying under `--card-bg` for consistency):
```css
.live-console { background: var(--card-bg); }
```

Rest dial inner surface:
```css
/* Before: */
.rest-dial::after { background: linear-gradient(160deg, rgba(26,32,40,0.96), rgba(10,11,14,0.96)); }
/* After: */
.rest-dial::after { background: var(--dial-inner-bg); }
```

Mobile nav:
```css
/* Before: */
.mobile-nav { background: rgba(18, 22, 27, 0.78); }
/* After: */
.mobile-nav { background: var(--nav-bg); }
```

- [ ] **Step 7: Replace profile toggle gradients**

Read the actual `.profile-toggle-btn.active` and `.profile-toggle-btn.active.hers` rules to find the exact gradient syntax (the spec's "before" examples may not match the real file). Replace whatever gradient/background value is there:

```css
/* After: */
.profile-toggle-btn.active {
  background: var(--accent-gradient-his);
}

.profile-toggle-btn.active.hers {
  background: var(--accent-gradient-hers);
}
```

Also replace the hardcoded gradient endpoint `#7ef5ef` in `.primary-btn` (this was already listed in Step 5 but verify it's caught).

- [ ] **Step 8: Replace any remaining hardcoded values**

Check for remaining hardcoded hex/rgba in component rules. Replace:
- `.app-shell::before` opacity: use `var(--overlay-opacity)` for the opacity property
- `.danger-btn` background `rgba(248, 113, 113, 0.08)` → `color-mix(in srgb, var(--danger), transparent 92%)`
- `.ghost-btn` background `rgba(255,255,255,0.02)` → leave as-is (white shimmer works across dark themes; CONCRETE overrides separately)

- [ ] **Step 9: Verify build passes and UI looks identical**

Run: `cd web && npm run build 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): tokenize all hardcoded colors in globals.css"
```

---

## Chunk 2: Theme Definitions

### Task 5: WARZONE theme block

Add the complete WARZONE `[data-theme="warzone"]` CSS block and noise grain effect.

**Files:**
- Modify: `web/src/app/globals.css` (add after `:root` block, before component rules)

- [ ] **Step 1: Add WARZONE token block**

Insert after the `:root` closing brace, before any component rules:

```css
/* ============================================
   WARZONE — Military surplus, brutalist, flat
   ============================================ */
[data-theme="warzone"] {
  --bg-0: #0a0a0a;
  --bg-1: #1a1e14;
  --bg-2: #252b1e;
  --bg-input: #14180e;
  --bg-index: #1e2216;
  --bg-stat: #16190f;
  --bg-heat: #1c2014;
  --text-0: #e8e0d4;
  --text-1: #9a9480;
  --text-2: #7a7568;
  --text-on-accent: #1a0808;
  --text-on-accent-hers: #1a1008;
  --text-on-power: #1a1808;
  --accent-primary: #c42b2b;
  --accent-hers: #d4873a;
  --accent-power: #c8b832;
  --accent-gradient-his: linear-gradient(135deg, #c42b2b, #8a1e1e);
  --accent-gradient-hers: linear-gradient(135deg, #d4873a, #9a5f28);
  --border: #3a3a2a;
  --border-width: 2px;
  --ok: #5a8a32;
  --warn: #b8a428;
  --danger: #b42020;
  --nav-bg: rgba(10, 10, 10, 0.88);
  --radius-xl: 0px;
  --radius-lg: 0px;
  --radius-sm: 0px;
  --btn-radius: 0px;
  --btn-letter-spacing: 0.12em;
  --shadow-card: none;
  --shadow-soft: none;
  --card-bg: #1a1e14;
  --card-backdrop: none;
  --dial-inner-bg: linear-gradient(160deg, rgba(26,30,20,0.96), rgba(10,10,10,0.96));
  --glow-strength: 0;
  --noise-opacity: 0.04;
  --overlay-opacity: 0;
  --body-bg: #0a0a0a;
  --font-display: var(--font-black-ops-one);
  --font-ui: var(--font-barlow-condensed);
  --font-mono: var(--font-share-tech-mono);
}
```

- [ ] **Step 2: Add WARZONE noise grain pseudo-element**

Add after the WARZONE token block:

```css
[data-theme="warzone"] body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: var(--noise-opacity);
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>");
  background-repeat: repeat;
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): add WARZONE theme definition + noise grain"
```

---

### Task 6: NEON OVERLOAD theme block

Add the complete NEON OVERLOAD `[data-theme="neon-overload"]` CSS block with glassmorphism and glow effects.

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add NEON OVERLOAD token block**

Insert after the WARZONE block:

```css
/* ============================================
   NEON OVERLOAD — Cyberpunk, glow, glassmorphism
   ============================================ */
[data-theme="neon-overload"] {
  --bg-0: #08080f;
  --bg-1: #0d0e1a;
  --bg-2: #141528;
  --bg-input: #0e0e1e;
  --bg-index: #12122a;
  --bg-stat: #101020;
  --bg-heat: #0e0e20;
  --text-0: #eeeeff;
  --text-1: #8888aa;
  --text-2: #666688;
  --text-on-accent: #0a0008;
  --text-on-accent-hers: #000816;
  --text-on-power: #082a00;
  --accent-primary: #ff2d7b;
  --accent-hers: #3d5afe;
  --accent-power: #76ff03;
  --accent-gradient-his: linear-gradient(135deg, #ff2d7b, #ff6b9d);
  --accent-gradient-hers: linear-gradient(135deg, #3d5afe, #7b8cff);
  --border: #2a2a44;
  --border-width: 1px;
  --ok: #76ff03;
  --warn: #ffea00;
  --danger: #ff2d7b;
  --nav-bg: rgba(8, 8, 15, 0.82);
  --radius-xl: 8px;
  --radius-lg: 8px;
  --radius-sm: 6px;
  --btn-radius: 6px;
  --btn-letter-spacing: 0.10em;
  --shadow-card: 0 0 12px rgba(255, 45, 123, 0.15);
  --shadow-soft: 0 0 8px rgba(255, 45, 123, 0.10);
  --card-bg: rgba(14, 14, 30, 0.7);
  --card-backdrop: blur(12px);
  --dial-inner-bg: linear-gradient(160deg, rgba(13,14,26,0.96), rgba(8,8,15,0.96));
  --glow-strength: 12px;
  --noise-opacity: 0;
  --overlay-opacity: 0.6;
  --body-bg: radial-gradient(circle at 20% 20%, rgba(255, 45, 123, 0.12), transparent 40%), radial-gradient(circle at 80% 10%, rgba(61, 90, 254, 0.10), transparent 35%), radial-gradient(circle at 50% 80%, rgba(118, 255, 3, 0.06), transparent 40%), linear-gradient(160deg, #06060c 0%, #0a0a18 50%, #060610 100%);
  --font-display: var(--font-orbitron);
  --font-ui: var(--font-exo2);
  --font-mono: var(--font-jetbrains-mono);
}
```

- [ ] **Step 2: Add NEON OVERLOAD glassmorphism + glow effects**

Add after the token block:

```css
/* Glassmorphism cards */
[data-theme="neon-overload"] .card {
  backdrop-filter: var(--card-backdrop);
  -webkit-backdrop-filter: var(--card-backdrop);
}

@supports not (backdrop-filter: blur(1px)) {
  [data-theme="neon-overload"] .card {
    background: rgba(14, 14, 30, 0.92);
  }
}

/* Glow on card hover */
[data-theme="neon-overload"] .card:hover {
  box-shadow: 0 0 var(--glow-strength) color-mix(in srgb, var(--accent-primary), transparent 75%);
}

/* Neon stroke glow on progress rings and timer dials */
[data-theme="neon-overload"] .progress-ring__fill {
  filter: drop-shadow(0 0 4px var(--accent-primary));
}

[data-theme="neon-overload"] .rest-dial {
  filter: drop-shadow(0 0 6px var(--accent-primary));
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): add NEON OVERLOAD theme + glassmorphism + glow effects"
```

---

### Task 7: CONCRETE theme block

Add the complete CONCRETE `[data-theme="concrete"]` CSS block with light-theme overrides.

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Add CONCRETE token block**

Insert after the NEON OVERLOAD block:

```css
/* ============================================
   CONCRETE — Brutalist light theme, typography-driven
   ============================================ */
[data-theme="concrete"] {
  --bg-0: #d4cfc8;
  --bg-1: #f2efe8;
  --bg-2: #fafaf6;
  --bg-input: #eae6de;
  --bg-index: #e4e0d8;
  --bg-stat: #ece8e0;
  --bg-heat: #e8e4dc;
  --text-0: #0d0d0d;
  --text-1: #5a5650;
  --text-2: #8a857e;
  --text-on-accent: #ffffff;
  --text-on-accent-hers: #ffffff;
  --text-on-power: #ffffff;
  --accent-primary: #ff5722;
  --accent-hers: #e91e63;
  --accent-power: #ff5722;
  --accent-gradient-his: linear-gradient(135deg, #ff5722, #ff8a65);
  --accent-gradient-hers: linear-gradient(135deg, #e91e63, #f06292);
  --border: #c8c2b8;
  --border-width: 1px;
  --ok: #2e7d32;
  --warn: #f57f17;
  --danger: #c62828;
  --nav-bg: rgba(242, 239, 232, 0.88);
  --radius-xl: 16px;
  --radius-lg: 12px;
  --radius-sm: 0px;
  --btn-radius: 0px;
  --btn-letter-spacing: 0.14em;
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-soft: 0 1px 2px rgba(0, 0, 0, 0.05);
  --card-bg: #fafaf6;
  --card-backdrop: none;
  --dial-inner-bg: linear-gradient(160deg, rgba(242,239,232,0.96), rgba(250,250,246,0.96));
  --glow-strength: 0;
  --noise-opacity: 0;
  --overlay-opacity: 0;
  --body-bg: #f2efe8;
  --font-display: var(--font-bebas-neue);
  --font-ui: var(--font-dm-sans);
  --font-mono: var(--font-ibm-plex-mono);
}
```

- [ ] **Step 2: Add CONCRETE light-theme structural overrides**

```css
/* CONCRETE light-theme-specific overrides */

/* Ghost buttons need visible borders on light bg */
[data-theme="concrete"] .ghost-btn {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--border);
}

/* Scrollbar for light theme */
[data-theme="concrete"] ::-webkit-scrollbar-track {
  background: var(--bg-1);
}
[data-theme="concrete"] ::-webkit-scrollbar-thumb {
  background: var(--border);
}

/* Selection highlight for light bg */
[data-theme="concrete"] ::selection {
  background: color-mix(in srgb, var(--accent-primary), transparent 70%);
  color: var(--text-0);
}

/* Danger button on light bg */
[data-theme="concrete"] .danger-btn {
  background: color-mix(in srgb, var(--danger), transparent 92%);
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): add CONCRETE light theme + structural overrides"
```

---

## Chunk 3: Component Fixes + UI

### Task 8: Convert volume-bar.tsx to CSS variables

This is the most hardcoded component. Replace all 16 inline hex colors with CSS variable references.

**Files:**
- Modify: `web/src/components/volume-bar.tsx`

- [ ] **Step 1: Read current file**

Read: `web/src/components/volume-bar.tsx`

- [ ] **Step 2: Replace all hardcoded color values**

Apply these replacements throughout the file:

| Current | Replacement |
|---|---|
| `"#34d399"` | `"var(--ok)"` |
| `"#fbbf24"` | `"var(--warn)"` |
| `"#f87171"` | `"var(--danger)"` |
| `"#6b7280"` | `"var(--text-2)"` |
| `"#1a2028"` | `"var(--bg-2)"` |
| `"#2a3340"` | `"var(--border)"` |
| `"#8891a4"` | `"var(--text-2)"` |
| `"#f4f7fa"` | `"var(--text-0)"` |

The `fillColor` variable assignment logic stays the same — just uses CSS var strings instead of hex:

```typescript
let fillColor = "var(--text-2)";  // was "#6b7280"
if (current >= mev) fillColor = "var(--ok)";  // was "#34d399"
if (current >= (mav.low + mav.high) / 2) fillColor = "var(--warn)";  // was "#fbbf24"
if (current > mav.high) fillColor = "var(--danger)";  // was "#f87171"
```

**Note:** The `fillColor` is used in inline styles like `backgroundColor: fillColor` and `borderColor: fillColor`. CSS variables work in inline styles as string values. The `--text-2` token must already exist in `:root` (added in Task 2).

- [ ] **Step 3: Verify no remaining hardcoded hex colors**

Run: `grep -nE '"#[0-9a-fA-F]{3,8}"' web/src/components/volume-bar.tsx`
Expected: Zero matches. If any remain, replace with the appropriate CSS variable.

- [ ] **Step 4: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/volume-bar.tsx
git commit -m "feat(theme): convert volume-bar.tsx to CSS variables"
```

---

### Task 9: Convert rest-timer-dial.tsx and volume-screen.tsx

Fix the remaining hardcoded colors in these two component files.

**Files:**
- Modify: `web/src/components/rest-timer-dial.tsx`
- Modify: `web/src/components/screens/volume-screen.tsx`

- [ ] **Step 1: Read both files**

Read: `web/src/components/rest-timer-dial.tsx`
Read: `web/src/components/screens/volume-screen.tsx`

- [ ] **Step 2: Fix rest-timer-dial.tsx**

Replace the hardcoded conic-gradient dead-arc color:

```typescript
// Before:
background: `conic-gradient(${color} ${progress * 360}deg, #10151b 0deg)`,
// After:
background: `conic-gradient(${color} ${progress * 360}deg, var(--bg-index) 0deg)`,
```

Use `--bg-index` (`#10151b`) — it's an exact color match.

- [ ] **Step 3: Fix volume-screen.tsx**

Replace hardcoded colors:

| Current | Replacement |
|---|---|
| `"#0f141a"` (toggle pill bg) | `"var(--bg-input)"` |
| `"#03201f"` (active toggle text) | `"var(--text-on-accent)"` |
| `rgba(52, 211, 153, 0.08)` (recommendation + bg) | `"color-mix(in srgb, var(--ok), transparent 92%)"` |
| `rgba(248, 113, 113, 0.08)` (recommendation - bg) | `"color-mix(in srgb, var(--danger), transparent 92%)"` |

- [ ] **Step 4: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/rest-timer-dial.tsx web/src/components/screens/volume-screen.tsx
git commit -m "feat(theme): convert rest-timer-dial + volume-screen to CSS variables"
```

---

### Task 10: Add button radius and letter-spacing tokens

The spec defines `--btn-radius` and `--btn-letter-spacing` per theme. Wire these into the button classes.

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Read globals.css and locate button rules**

Read: `web/src/app/globals.css`

Find `.primary-btn`, `.ghost-btn`, `.set-save-btn`, `.danger-btn`. Current state: these buttons use `border-radius: var(--radius-sm)` (from existing tokens) and `letter-spacing: 0.08em` (hardcoded). For any button class that does NOT already have `letter-spacing`, add it with the token value. For any that have a hardcoded `border-radius`, replace with `--btn-radius`.

- [ ] **Step 2: Update button styles to use tokens**

For each button class, ensure `border-radius` uses `--btn-radius` and `letter-spacing` uses `--btn-letter-spacing`. Add the property if it doesn't exist yet:

```css
.primary-btn {
  border-radius: var(--btn-radius);
  letter-spacing: var(--btn-letter-spacing);
  /* ... rest unchanged ... */
}

.ghost-btn {
  border-radius: var(--btn-radius);
  letter-spacing: var(--btn-letter-spacing);
  /* ... */
}

.set-save-btn {
  border-radius: var(--btn-radius);
  letter-spacing: var(--btn-letter-spacing);
  /* ... */
}

.danger-btn {
  border-radius: var(--btn-radius);
  /* ... */
}
```

- [ ] **Step 3: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(theme): wire --btn-radius and --btn-letter-spacing tokens into buttons"
```

---

### Task 11: Create theme-picker.tsx component

Build the 2×2 theme selector grid component for the settings screen.

**Files:**
- Create: `web/src/components/theme-picker.tsx`

- [ ] **Step 1: Create theme-picker.tsx**

```tsx
"use client";

import { useEffect, useState } from "react";
import { type ThemeId, THEMES, getTheme, setTheme } from "@/lib/theme-store";

// Hardcoded preview colors — intentional. Each card shows its theme's colors
// regardless of which theme is active. The light/dark text detection uses
// CONCRETE's bg-0 as the signal for light-theme cards.
const SWATCH_COLORS: Record<ThemeId, string[]> = {
  "iron-ledger": ["#0b0d10", "#12161b", "#26d9d1", "#f08a24"],
  "warzone": ["#0a0a0a", "#1a1e14", "#c42b2b", "#c8b832"],
  "neon-overload": ["#08080f", "#0d0e1a", "#ff2d7b", "#76ff03"],
  "concrete": ["#d4cfc8", "#f2efe8", "#ff5722", "#e91e63"],
};

export function ThemePicker() {
  const [active, setActive] = useState<ThemeId>("iron-ledger");

  useEffect(() => {
    setActive(getTheme());
  }, []);

  function pick(id: ThemeId) {
    setTheme(id);
    setActive(id);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {(Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][]).map(([id, theme]) => (
        <button
          key={id}
          onClick={() => pick(id)}
          className="card"
          style={{
            padding: "16px 12px",
            cursor: "pointer",
            border: active === id
              ? "2px solid var(--accent-primary)"
              : "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            background: SWATCH_COLORS[id][1],
            textAlign: "left",
            transition: "border-color 0.15s ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: SWATCH_COLORS[id][0] === "#d4cfc8" ? "#0d0d0d" : "#f4f7fa",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            {theme.name}
          </div>
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "6px",
            }}
          >
            {SWATCH_COLORS[id].map((color, i) => (
              <div
                key={i}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  background: color,
                  border: "1px solid rgba(128,128,128,0.3)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: SWATCH_COLORS[id][0] === "#d4cfc8" ? "#5a5650" : "#a9b5c3",
            }}
          >
            {theme.description}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/theme-picker.tsx
git commit -m "feat(theme): add ThemePicker 2x2 grid component"
```

---

### Task 12: Integrate theme picker into settings screen

Add the `<ThemePicker />` to the top of the settings screen.

**Files:**
- Modify: `web/src/components/screens/settings-screen.tsx`

- [ ] **Step 1: Read current settings-screen.tsx**

Read: `web/src/components/screens/settings-screen.tsx`

- [ ] **Step 2: Add import for ThemePicker**

Add at the top of the file with other imports:

```typescript
import { ThemePicker } from "@/components/theme-picker";
```

- [ ] **Step 3: Add Theme section to the settings screen JSX**

Find the first `<div className="card panel">` section in the settings JSX and insert a new Theme section before it:

```tsx
<div className="card panel">
  <h2 className="section-title">Theme</h2>
  <ThemePicker />
</div>
```

- [ ] **Step 4: Verify build passes**

Run: `cd web && npm run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/screens/settings-screen.tsx
git commit -m "feat(theme): integrate theme picker into settings screen"
```

---

### Task 13: Visual verification across all themes

Verify all 4 themes render correctly by switching between them and checking key screens.

**Files:** None modified — verification only.

- [ ] **Step 1: Start dev server**

Run: `cd web && npm run dev`

- [ ] **Step 2: Test each theme**

Open browser to `http://localhost:3000`. Navigate to Settings and switch between all 4 themes. For each theme, verify:

1. **Settings screen** — Theme picker renders, cards show correct swatches
2. **Today screen** — Exercise cards, set entry, rest timer dial all render with correct theme colors
3. **Volume screen** — Volume bars use theme semantic colors, toggle pills use theme tokens
4. **Planner screen** — Day tiles, deload badges render correctly
5. **Profile toggle** — His/Hers gradients use theme-appropriate colors
6. **Mobile nav** — Background uses theme's `--nav-bg`
7. **CONCRETE** — All text is readable on light backgrounds, no black-on-dark artifacts

- [ ] **Step 3: Test persistence**

1. Switch to WARZONE
2. Refresh the page
3. Verify WARZONE persists (no flash of Iron Ledger)
4. Open a new tab — verify WARZONE is active

- [ ] **Step 4: Fix any visual issues found**

Scope: only modify files in the File Structure table above (`globals.css`, `layout.tsx`, `volume-bar.tsx`, `rest-timer-dial.tsx`, `volume-screen.tsx`, `settings-screen.tsx`, `theme-picker.tsx`, `theme-store.ts`). Additionally check `planner-screen.tsx` — it has ~3 hardcoded CSS variable fallback values (e.g. `var(--accent-power, #f08a24)`) that should be fine but may need attention on CONCRETE.

For each fix: log what was broken, which file was changed, and what the fix was.

**Note:** CONCRETE is the highest-risk theme. Check every screen's `color-mix()` tinted backgrounds — these are calibrated for dark surfaces and may be too faint on light backgrounds. Increase the color percentage if needed (e.g., `transparent 88%` → `transparent 80%`).

**Note:** The spec mentions "Active/selected states get a subtle pulse glow animation" for NEON OVERLOAD — this was simplified to static glow effects (drop-shadow, hover box-shadow) in the plan. If static glow looks insufficient, add a `@keyframes neon-pulse` animation, but this is optional polish.

- [ ] **Step 5: Final build check**

Run: `cd web && npm run build 2>&1 | tail -10`
Expected: Build succeeds with all routes.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "feat(theme): visual fixes from cross-theme verification"
```

(Skip if no fixes needed.)
