# Theme System Design Spec

## Overview

Add a multi-theme system to the workout app. Four themes with distinct visual identities, switchable from settings. Each theme changes colors, typography, border styles, shadows, and structural elements — not just a palette swap.

**Themes:** Iron Ledger (current, default), WARZONE, NEON OVERLOAD, CONCRETE

**Core constraint:** UX stays identical across all themes. Same screens, same flows, same components. Only the visual layer changes.

## Architecture

### Theme Application

Themes apply via a `data-theme` attribute on `<html>`:

```html
<html data-theme="iron-ledger">
<html data-theme="warzone">
<html data-theme="neon-overload">
<html data-theme="concrete">
```

### CSS Token System

Current `:root` custom properties become the Iron Ledger defaults. Each theme overrides them via `[data-theme="theme-name"]` selectors.

**Token categories controlled per theme:**

| Category | Tokens | Purpose |
|---|---|---|
| Backgrounds | `--bg-0`, `--bg-1`, `--bg-2`, `--bg-input` | Base, surface, elevated, input fields |
| Body | `--body-bg` | Full body background (gradient or solid) |
| Text | `--text-0`, `--text-1`, `--text-2`, `--text-on-accent`, `--text-on-accent-hers`, `--text-on-power` | Primary, secondary, muted/marker, text on accent fills |
| Accents | `--accent-primary`, `--accent-hers`, `--accent-power` | His color, Hers color, power/action color |
| Accent gradients | `--accent-gradient-his`, `--accent-gradient-hers` | Profile toggle / active-state gradient (derived from accent) |
| Semantic | `--ok`, `--warn`, `--danger` | Status colors |
| Borders | `--border`, `--border-width` | Border color and weight |
| Radius | `--radius-xl`, `--radius-lg`, `--radius-sm`, `--btn-radius` | Corner rounding (btn-radius separate for mixed-radius themes) |
| Shadows | `--shadow-card`, `--shadow-soft` | Elevation treatment |
| Fonts | `--font-display`, `--font-ui`, `--font-mono` | Typography stacks (see Font Loading section) |
| Buttons | `--btn-radius`, `--btn-letter-spacing` | Button-specific shape overrides |
| Cards | `--card-bg`, `--card-backdrop` | Card treatment (glassmorphism, etc.) |
| Dial | `--dial-inner-bg` | Rest timer inner dial surface |
| Effects | `--glow-strength`, `--noise-opacity` | Theme-specific visual effects |
| Nav | `--nav-bg` | Mobile bottom nav / side rail background |
| Overlay | `--overlay-opacity` | App shell overlay visibility (0 for CONCRETE) |

### Profile × Theme Interaction

- **Theme is global** — one theme for the whole app, both profiles
- **His/Hers accent colors are per-theme** — each theme defines its own `--accent-primary` (his) and `--accent-hers` values
- **Profile gradients are tokenized** — the profile toggle's active gradient uses `--accent-gradient-his` and `--accent-gradient-hers` instead of hardcoded hex endpoints. Each theme defines gradient stops that harmonize with its accent colors
- Profile switching continues to work as before (swapping which accent is active), just using theme-appropriate colors

### Persistence

- Stored in localStorage as `mi_theme` (string: `"iron-ledger"` | `"warzone"` | `"neon-overload"` | `"concrete"`)
- Default: `"iron-ledger"`
- Read on mount, applied before first paint to prevent flash of wrong theme (FOWT)

### Flash Prevention

Use `dangerouslySetInnerHTML` on a `<script>` tag placed as the **first child of `<body>`** in `layout.tsx`. This ensures it runs before React hydrates:

```tsx
<body>
  <script dangerouslySetInnerHTML={{ __html: `
    try {
      var t = localStorage.getItem('mi_theme');
      if (t) document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
  `}} />
  {children}
</body>
```

### Font Loading — Two-Layer Variable System

`next/font/google` binds font families to CSS variables when it generates class names. If we use `--font-display` directly, the theme can't override it because the `next/font` class on `<body>` wins on specificity.

**Solution: indirection layer.**

1. Load all 8 font families with **unique raw variable names**:

```typescript
// layout.tsx
const teko = Teko({ variable: "--font-teko", subsets: ["latin"] });
const blackOpsOne = Black_Ops_One({ variable: "--font-black-ops-one", weight: "400", subsets: ["latin"] });
const orbitron = Orbitron({ variable: "--font-orbitron", subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", weight: "400", subsets: ["latin"] });
const sourceSans = Source_Sans_3({ variable: "--font-source-sans", subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow-condensed", weight: ["400", "600"], subsets: ["latin"] });
const exo2 = Exo_2({ variable: "--font-exo2", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
const shareTechMono = Share_Tech_Mono({ variable: "--font-share-tech-mono", weight: "400", subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({ variable: "--font-ibm-plex-mono", weight: ["400", "500"], subsets: ["latin"] });
```

2. In each theme's CSS block, **map raw variables to semantic variables**:

```css
:root, [data-theme="iron-ledger"] {
  --font-display: var(--font-teko);
  --font-ui: var(--font-source-sans);
  --font-mono: var(--font-jetbrains-mono);
}

[data-theme="warzone"] {
  --font-display: var(--font-black-ops-one);
  --font-ui: var(--font-barlow-condensed);
  --font-mono: var(--font-share-tech-mono);
}
```

3. Update `@theme inline` to reference semantic variables:

```css
@theme inline {
  --font-sans: var(--font-ui);
  --font-mono: var(--font-mono);
  --font-display: var(--font-display);
}
```

**Font loading weight:** 11 unique font families ≈ 550-880KB total upfront. This is acceptable for a PWA-style app where the initial load is the main cost and subsequent navigations are client-side. All fonts use `font-display: swap` so text renders immediately with a fallback, then swaps when loaded. Non-active theme fonts will be cached by the browser after first load.

**Font inventory:**

| Theme | Display | UI | Mono |
|---|---|---|---|
| Iron Ledger | Teko | Source Sans 3 | JetBrains Mono |
| WARZONE | Black Ops One | Barlow Condensed | Share Tech Mono |
| NEON OVERLOAD | Orbitron | Exo 2 | JetBrains Mono |
| CONCRETE | Bebas Neue | DM Sans | IBM Plex Mono |

---

## Hardcoded Colors Audit

The following hardcoded hex colors in `globals.css` and component files must be tokenized before themes work correctly. This is especially critical for CONCRETE (light theme) where dark hardcoded values would be black rectangles on white.

### New tokens needed:

| Token | Current hardcoded value | Used by | Purpose |
|---|---|---|---|
| `--bg-input` | `#0f141a` | `.gate-input`, `.profile-toggle`, `.compact-select`, `.day-tile`, `.tree-item`, `.editor-form input`, `.set-cell input` | Input/interactive surface background |
| `--bg-index` | `#10151b` | `.set-index` | Set number pill background |
| `--bg-stat` | `#0f1318` | `.stat-pill` | Stat pill background |
| `--bg-heat` | `#11161d` | `.heat-cell` | Heat map cell background |
| `--text-on-accent` | `#03201f` | `.primary-btn`, `.profile-toggle-btn.active` | Dark text on cyan/accent fills |
| `--text-on-accent-hers` | `#260613` | `.profile-toggle-btn.active.hers` | Dark text on hers accent fills |
| `--text-on-power` | `#180f01` | `.set-save-btn` | Dark text on power/orange fills |
| `--nav-bg` | `rgba(18, 22, 27, 0.78)` | `.mobile-nav`, side rail | Navigation surface (translucent) |
| `--accent-gradient-his` | `linear-gradient(135deg, color-mix(...), #b1f0ed)` | `.profile-toggle-btn.active` | His active state gradient |
| `--accent-gradient-hers` | `linear-gradient(135deg, color-mix(...), #ffb1c7)` | `.profile-toggle-btn.active.hers` | Hers active state gradient |
| `--body-bg` | compound gradient | `body` | Full body background |
| `--overlay-opacity` | implicit | `.app-shell::before` | Overlay visibility (0 for light themes) |

### Hardcoded accent-derived rgba() values in globals.css:

These use raw RGB values of Iron Ledger's accents instead of `var()` references. They'll render the wrong color on every other theme. Convert to `color-mix()` expressions:

| Current value | Used by | Fix |
|---|---|---|
| `rgba(38, 217, 209, 0.16)` | `.nav-link.active` background | `color-mix(in srgb, var(--accent-primary), transparent 84%)` |
| `rgba(38, 217, 209, 0.03)` | `.nav-link.active` border-bottom | `color-mix(in srgb, var(--accent-primary), transparent 97%)` |
| `rgba(38, 217, 209, 0.06)` | `.logged-set-chip` | `color-mix(in srgb, var(--accent-primary), transparent 94%)` |
| `rgba(38, 217, 209, 0.2)` | `.trend-bar` | `color-mix(in srgb, var(--accent-primary), transparent 80%)` |
| `rgba(38, 217, 209, 0.1)` | `.mobile-link.active` | `color-mix(in srgb, var(--accent-primary), transparent 90%)` |
| `#7ef5ef` | `.primary-btn` gradient endpoint | `color-mix(in srgb, var(--accent-primary), white 40%)` |
| `#f6ae62` | `.set-save-btn` gradient endpoint | `color-mix(in srgb, var(--accent-power), white 40%)` |

### Hardcoded compound backgrounds in globals.css:

These elements use multi-layer backgrounds with hardcoded dark values that break on CONCRETE:

| Element | Current value | Fix |
|---|---|---|
| `.card` background | `linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), var(--bg-1)` | Use `background: var(--card-bg)`. Iron Ledger's `--card-bg` includes the shimmer gradient; other themes set a plain value |
| `.live-console` background | `linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0)), var(--bg-1)` | Same approach — use `--card-bg` |
| `.rest-dial::after` | `linear-gradient(160deg, rgba(26,32,40,0.96), rgba(10,11,14,0.96))` | New token `--dial-inner-bg`. Iron Ledger: dark gradient. CONCRETE: light gradient matching `--bg-1` |

### High-risk inline-style components:

These component files have the most hardcoded color values in inline styles and will break visibly on non-Iron-Ledger themes. Must be converted during implementation:

| File | ~Hardcoded values | Worst offenders |
|---|---|---|
| `volume-bar.tsx` | ~15 | `#34d399`, `#fbbf24`, `#f87171` (semantic colors), `#1a2028` (bg-2), `#f4f7fa` (text-0), `#8891a4` (no token — needs `--text-2` or `--marker`) |
| `rest-timer-dial.tsx` | ~5 | Dark backgrounds, accent rgba |
| `volume-screen.tsx` | ~5 | Semantic colors, background values |
| `planner-screen.tsx` | ~3 | Background values |

New token needed: `--marker` or `--text-2` for `#8891a4` (muted indicator/line color, used in volume-bar markers).

### Viewport theme-color meta tag:

`layout.tsx` exports `viewport.themeColor = "#0B0D10"` (Iron Ledger's bg-0). This controls browser chrome color and can't use CSS vars. Fix: `setTheme()` in `theme-store.ts` must also update `document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bgColor)`. Each theme needs a `themeColor` field in its THEMES record. The flash-prevention script should also set it.

---

## Theme Definitions

### Iron Ledger (Current — Default)

No visual changes. Existing design becomes the baseline theme.

**Colors:**
- `--bg-0`: `#0b0d10` / `--bg-1`: `#12161b` / `--bg-2`: `#1a2028`
- `--bg-input`: `#0f141a` / `--bg-index`: `#10151b` / `--bg-stat`: `#0f1318` / `--bg-heat`: `#11161d`
- `--text-0`: `#f4f7fa` / `--text-1`: `#a9b5c3` / `--text-2`: `#8891a4`
- `--text-on-accent`: `#03201f` / `--text-on-accent-hers`: `#260613` / `--text-on-power`: `#180f01`
- `--accent-primary`: `#26d9d1` (cyan) / `--accent-hers`: `#ff5a8b` (pink) / `--accent-power`: `#f08a24` (orange)
- `--accent-gradient-his`: `linear-gradient(135deg, color-mix(in srgb, #26d9d1, white 12%), #b1f0ed)`
- `--accent-gradient-hers`: `linear-gradient(135deg, color-mix(in srgb, #ff5a8b, white 12%), #ffb1c7)`
- `--border`: `#2a3340` / `--border-width`: `1px`
- `--ok`: `#34d399` / `--warn`: `#fbbf24` / `--danger`: `#f87171`
- `--nav-bg`: `rgba(18, 22, 27, 0.78)`

**Structure:**
- `--radius-xl`: `20px` / `--radius-lg`: `14px` / `--radius-sm`: `10px` / `--btn-radius`: `10px`
- `--btn-letter-spacing`: `0.08em`
- `--shadow-card`: `0 14px 28px rgba(0, 0, 0, 0.28)` / `--shadow-soft`: `0 8px 14px rgba(0, 0, 0, 0.2)`
- `--card-bg`: `linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), #12161b` / `--card-backdrop`: `none`
- `--dial-inner-bg`: `linear-gradient(160deg, rgba(26,32,40,0.96), rgba(10,11,14,0.96))`
- `--glow-strength`: `0` / `--noise-opacity`: `0` / `--overlay-opacity`: `1`
- `--body-bg`: `radial-gradient(circle at 12% 10%, rgba(38, 217, 209, 0.16), transparent 34%), radial-gradient(circle at 84% 14%, rgba(240, 138, 36, 0.17), transparent 30%), linear-gradient(154deg, #0a0d11 10%, #0d1015 36%, #090b0f 100%)`
- `themeColor`: `#0B0D10`
- Typography: Teko / Source Sans 3 / JetBrains Mono

---

### WARZONE

**Vibe:** Military surplus meets underground fight club. Utilitarian, aggressive, flat.

**Colors:**
- `--bg-0`: `#0a0a0a` / `--bg-1`: `#1a1e14` / `--bg-2`: `#252b1e`
- `--bg-input`: `#14180e` / `--bg-index`: `#1e2216` / `--bg-stat`: `#16190f` / `--bg-heat`: `#1c2014`
- `--text-0`: `#e8e0d4` / `--text-1`: `#9a9480` / `--text-2`: `#7a7568`
- `--text-on-accent`: `#1a0808` / `--text-on-accent-hers`: `#1a1008` / `--text-on-power`: `#1a1808`
- `--accent-primary`: `#c42b2b` (blood red) / `--accent-hers`: `#d4873a` (burnt amber) / `--accent-power`: `#c8b832` (raw yellow)
- `--accent-gradient-his`: `linear-gradient(135deg, #c42b2b, #8a1e1e)`
- `--accent-gradient-hers`: `linear-gradient(135deg, #d4873a, #9a5f28)`
- `--border`: `#3a3a2a` / `--border-width`: `2px`
- `--ok`: `#5a8a32` / `--warn`: `#b8a428` / `--danger`: `#b42020`
- `--nav-bg`: `rgba(10, 10, 10, 0.88)`

**Structure:**
- `--radius-xl`: `0px` / `--radius-lg`: `0px` / `--radius-sm`: `0px` / `--btn-radius`: `0px`
- `--btn-letter-spacing`: `0.12em`
- `--shadow-card`: `none` / `--shadow-soft`: `none`
- `--card-bg`: `#1a1e14` / `--card-backdrop`: `none`
- `--dial-inner-bg`: `linear-gradient(160deg, rgba(26,30,20,0.96), rgba(10,10,10,0.96))`
- `--glow-strength`: `0` / `--noise-opacity`: `0.04` / `--overlay-opacity`: `0`
- `--body-bg`: `#0a0a0a`
- `themeColor`: `#0a0a0a`
- Typography: Black Ops One / Barlow Condensed / Share Tech Mono

**WARZONE noise grain:** Implemented via a `::after` pseudo-element on `body` with a repeating SVG noise pattern at `opacity: var(--noise-opacity)`. Not optional — it's part of the theme identity.

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

---

### NEON OVERLOAD

**Vibe:** Cyberpunk gym in a neon-lit alley. Maximal, glowing, sensory overload.

**Colors:**
- `--bg-0`: `#08080f` / `--bg-1`: `#0d0e1a` / `--bg-2`: `#141528`
- `--bg-input`: `#0e0e1e` / `--bg-index`: `#12122a` / `--bg-stat`: `#101020` / `--bg-heat`: `#0e0e20`
- `--text-0`: `#eeeeff` / `--text-1`: `#8888aa` / `--text-2`: `#666688`
- `--text-on-accent`: `#0a0008` / `--text-on-accent-hers`: `#000816` / `--text-on-power`: `#082a00`
- `--accent-primary`: `#ff2d7b` (electric magenta) / `--accent-hers`: `#3d5afe` (UV blue) / `--accent-power`: `#76ff03` (acid green)
- `--accent-gradient-his`: `linear-gradient(135deg, #ff2d7b, #ff6b9d)`
- `--accent-gradient-hers`: `linear-gradient(135deg, #3d5afe, #7b8cff)`
- `--border`: `#2a2a44` / `--border-width`: `1px`
- `--ok`: `#76ff03` / `--warn`: `#ffea00` / `--danger`: `#ff2d7b`
- `--nav-bg`: `rgba(8, 8, 15, 0.82)`

**Structure:**
- `--radius-xl`: `8px` / `--radius-lg`: `8px` / `--radius-sm`: `6px` / `--btn-radius`: `6px`
- `--btn-letter-spacing`: `0.10em`
- `--shadow-card`: `0 0 12px rgba(255, 45, 123, 0.15)` / `--shadow-soft`: `0 0 8px rgba(255, 45, 123, 0.10)`
- `--card-bg`: `rgba(14, 14, 30, 0.7)` / `--card-backdrop`: `blur(12px)`
- `--dial-inner-bg`: `linear-gradient(160deg, rgba(13,14,26,0.96), rgba(8,8,15,0.96))`
- `--glow-strength`: `12px` / `--noise-opacity`: `0` / `--overlay-opacity`: `0.6`
- `--body-bg`: `radial-gradient(circle at 20% 20%, rgba(255, 45, 123, 0.12), transparent 40%), radial-gradient(circle at 80% 10%, rgba(61, 90, 254, 0.10), transparent 35%), radial-gradient(circle at 50% 80%, rgba(118, 255, 3, 0.06), transparent 40%), linear-gradient(160deg, #06060c 0%, #0a0a18 50%, #060610 100%)`
- `themeColor`: `#08080f`
- Typography: Orbitron / Exo 2 / JetBrains Mono

**Glassmorphism fallback:** For browsers that don't support `backdrop-filter`, cards use a higher-opacity solid background:

```css
[data-theme="neon-overload"] .card {
  background: var(--card-bg);
  backdrop-filter: var(--card-backdrop);
}
@supports not (backdrop-filter: blur(1px)) {
  [data-theme="neon-overload"] .card {
    background: rgba(14, 14, 30, 0.92);
  }
}
```

**Special effects:**
- Active/selected states get a subtle pulse glow animation
- Progress rings and timer dials get neon-colored stroke glow (`filter: drop-shadow(0 0 4px accent)`)
- Card borders glow on hover: `box-shadow: 0 0 var(--glow-strength) rgba(accent, 0.25)`

---

### CONCRETE

**Vibe:** Minimalist brutalism meets high-end streetwear lookbook. Light theme. Typography-driven.

**Colors:**
- `--bg-0`: `#d4cfc8` / `--bg-1`: `#f2efe8` / `--bg-2`: `#fafaf6`
- `--bg-input`: `#eae6de` / `--bg-index`: `#e4e0d8` / `--bg-stat`: `#ece8e0` / `--bg-heat`: `#e8e4dc`
- `--text-0`: `#0d0d0d` / `--text-1`: `#5a5650` / `--text-2`: `#8a857e`
- `--text-on-accent`: `#ffffff` / `--text-on-accent-hers`: `#ffffff` / `--text-on-power`: `#ffffff`
- `--accent-primary`: `#ff5722` (electric orange) / `--accent-hers`: `#e91e63` (deep rose) / `--accent-power`: `#ff5722`
- `--accent-gradient-his`: `linear-gradient(135deg, #ff5722, #ff8a65)`
- `--accent-gradient-hers`: `linear-gradient(135deg, #e91e63, #f06292)`
- `--border`: `#c8c2b8` / `--border-width`: `1px`
- `--ok`: `#2e7d32` / `--warn`: `#f57f17` / `--danger`: `#c62828`
- `--nav-bg`: `rgba(242, 239, 232, 0.88)`

**Structure:**
- `--radius-xl`: `16px` / `--radius-lg`: `12px` / `--radius-sm`: `0px` / `--btn-radius`: `0px`
- `--btn-letter-spacing`: `0.14em`
- `--shadow-card`: `0 1px 3px rgba(0, 0, 0, 0.08)` / `--shadow-soft`: `0 1px 2px rgba(0, 0, 0, 0.05)`
- `--card-bg`: `#fafaf6` / `--card-backdrop`: `none`
- `--dial-inner-bg`: `linear-gradient(160deg, rgba(242,239,232,0.96), rgba(250,250,246,0.96))`
- `--glow-strength`: `0` / `--noise-opacity`: `0` / `--overlay-opacity`: `0`
- `--body-bg`: `#f2efe8`
- `themeColor`: `#d4cfc8`
- Typography: Bebas Neue / DM Sans / IBM Plex Mono

**Light-theme-specific overrides:**

CONCRETE is the only light theme. Several dark-theme assumptions in the existing CSS must be handled:

1. **`color-mix()` expressions** — Many existing styles use `color-mix(in srgb, var(--accent-primary), transparent 80%)` or similar for subtle tinted backgrounds. These are calibrated for dark surfaces. On CONCRETE's light backgrounds, these produce barely-visible or washed-out results. Override with higher opacity mixes for CONCRETE: `color-mix(in srgb, var(--accent-primary), transparent 88%)` — test each usage during implementation.

2. **`.app-shell::before` overlay** — The existing faint white gradient + repeating line overlay is designed for dark themes. Set `--overlay-opacity: 0` for CONCRETE to hide it entirely.

3. **Mobile nav** — Current nav uses dark frosted glass (`rgba(18, 22, 27, 0.78)` + blur). CONCRETE uses `--nav-bg: rgba(242, 239, 232, 0.88)` — light frosted glass.

4. **Scrollbar styling** — If custom scrollbar styles exist (`::-webkit-scrollbar`), they need light-theme variants.

5. **Selection highlight** — `::selection` colors may need inversion for light backgrounds.

---

## Theme Switcher UX

### Location

Settings screen. New section: "Theme" — positioned at the top of settings since it's the most visually impactful option.

### UI

A 2×2 grid of theme preview cards. Each card shows:
- Theme name rendered in that theme's display font
- A small color swatch strip (bg + accent colors)
- Active state: highlighted border in the theme's accent color

Tapping a card applies the theme immediately (live preview). The selection persists to localStorage.

### No confirmation needed

Theme switching is instant and reversible. No "are you sure?" dialog.

---

## Implementation Approach

### CSS Organization

Add theme token blocks to `globals.css` after the existing `:root`:

```css
/* Iron Ledger is the :root default — no wrapper needed */
:root {
  /* existing tokens stay as-is */
  /* add new tokens (--bg-input, --text-on-accent, etc.) */
  /* add font mappings */
  --font-display: var(--font-teko);
  --font-ui: var(--font-source-sans);
  --font-mono: var(--font-jetbrains-mono);
}

[data-theme="warzone"] {
  --bg-0: #0a0a0a;
  --bg-1: #1a1e14;
  --font-display: var(--font-black-ops-one);
  --font-ui: var(--font-barlow-condensed);
  --font-mono: var(--font-share-tech-mono);
  /* ... all token overrides ... */
}

[data-theme="neon-overload"] { /* ... */ }
[data-theme="concrete"] { /* ... */ }
```

### Theme-Specific Structural Styles

For structural differences beyond token swaps:

```css
/* NEON OVERLOAD glassmorphism */
[data-theme="neon-overload"] .card {
  backdrop-filter: var(--card-backdrop);
  background: var(--card-bg);
}

/* WARZONE noise grain */
[data-theme="warzone"] body::after { /* SVG noise pattern */ }

/* CONCRETE light-theme nav override */
[data-theme="concrete"] .mobile-nav {
  background: var(--nav-bg);
}
```

### Theme Store

New file: `web/src/lib/theme-store.ts`

```typescript
export type ThemeId = "iron-ledger" | "warzone" | "neon-overload" | "concrete";

export const THEMES: Record<ThemeId, { name: string; description: string; themeColor: string }> = {
  "iron-ledger": { name: "Iron Ledger", description: "The original. Clean and composed.", themeColor: "#0B0D10" },
  "warzone": { name: "WARZONE", description: "Stencil. Steel. Sharp edges.", themeColor: "#0a0a0a" },
  "neon-overload": { name: "NEON OVERLOAD", description: "Glow hard or go home.", themeColor: "#08080f" },
  "concrete": { name: "CONCRETE", description: "Loud type. Quiet surfaces.", themeColor: "#d4cfc8" },
};

export function getTheme(): ThemeId { /* read mi_theme from localStorage, default iron-ledger */ }
export function setTheme(id: ThemeId): void {
  /* write mi_theme to localStorage + set data-theme on documentElement */
  /* also update: document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[id].themeColor) */
}
```

### Settings Integration

Add theme picker to the existing settings screen. No new page needed.

---

## Scope Boundaries

**In scope:**
- CSS token system with 4 theme definitions (all tokens explicit per theme)
- Tokenize all hardcoded colors in globals.css
- Convert hardcoded inline styles in components to CSS variables on contact
- Two-layer font variable system (raw → semantic)
- Theme store (localStorage read/write)
- Theme switcher UI in settings (2×2 grid)
- Flash prevention via dangerouslySetInnerHTML script
- Font loading for all 8+ font families
- Theme-specific structural overrides (glassmorphism, glow, noise grain, mixed-radius)
- CONCRETE light-theme overrides (nav, overlay, color-mix recalibration)
- Glassmorphism fallback for NEON OVERLOAD

**Out of scope:**
- Animated transitions between themes (just swap instantly)
- Per-profile theme selection (theme is global)
- Custom/user-created themes
- Theme scheduling (auto-switch by time of day)
- Theme preview in the switcher beyond swatches
- Lazy font loading (all loaded upfront — acceptable tradeoff)
