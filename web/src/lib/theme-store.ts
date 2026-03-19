export type ThemeId = "iron-ledger" | "warzone" | "neon-overload" | "concrete";

export const THEMES: Record<ThemeId, { name: string; description: string; themeColor: string }> = {
  "iron-ledger": {
    name: "Iron Ledger",
    description: "The original. Clean and composed.",
    themeColor: "#0B0D10",
  },
  warzone: {
    name: "WARZONE",
    description: "Stencil. Steel. Sharp edges.",
    themeColor: "#0a0a0a",
  },
  "neon-overload": {
    name: "NEON OVERLOAD",
    description: "Glow hard or go home.",
    themeColor: "#08080f",
  },
  concrete: {
    name: "CONCRETE",
    description: "Loud type. Quiet surfaces.",
    themeColor: "#d4cfc8",
  },
};

const THEME_KEY = "mi_theme";
const DEFAULT_THEME: ThemeId = "iron-ledger";
const THEME_IDS = Object.keys(THEMES) as ThemeId[];

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.includes(value as ThemeId);
}

export function getTheme(): ThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const stored = window.localStorage.getItem(THEME_KEY);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

export function setTheme(id: ThemeId): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_KEY, id);
  document.documentElement.setAttribute("data-theme", id);

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEMES[id].themeColor);
  }
}
