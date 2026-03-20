# Theme Persistence Fix

**Date:** 2026-03-20
**Type:** Bug fix
**Scope:** 2 files, ~4 lines changed

## Problem

Theme selection (e.g., WARZONE) resets to the default Iron Ledger on any full page reload. The theme is saved correctly in `localStorage` (`mi_theme` key), but the `data-theme` attribute on `<html>` -- which the CSS selectors depend on -- gets stripped during React 19 hydration.

**Root cause:** The inline `<script>` in `layout.tsx` sets `data-theme` before hydration. React 19 hydrates the `<html>` element (rendered server-side without `data-theme`) and reconciles by removing the attribute.

## Fix

1. **`layout.tsx`** -- Add `suppressHydrationWarning` to `<html>` to prevent React from reconciling attributes on that element.
2. **`app-shell.tsx`** -- Add a `useEffect` that calls `setTheme(getTheme())` on mount, re-applying the stored theme after hydration completes.

The inline script remains for FOUC prevention. The `useEffect` is the safety net that restores the attribute after hydration.
