"use client";

import { useEffect, useState } from "react";
import { THEMES, getTheme, setTheme, type ThemeId } from "@/lib/theme-store";

const SWATCH_COLORS: Record<ThemeId, readonly [string, string, string, string]> = {
  "iron-ledger": ["#0b0d10", "#12161b", "#26d9d1", "#f08a24"],
  warzone: ["#0a0a0a", "#1a1e14", "#c42b2b", "#c8b832"],
  "neon-overload": ["#08080f", "#0d0e1a", "#ff2d7b", "#76ff03"],
  concrete: ["#d4cfc8", "#f2efe8", "#ff5722", "#e91e63"],
};

const FONT_FAMILIES: Record<ThemeId, string> = {
  "iron-ledger": "var(--font-teko), sans-serif",
  warzone: "var(--font-black-ops-one), sans-serif",
  "neon-overload": "var(--font-orbitron), sans-serif",
  concrete: "var(--font-bebas-neue), sans-serif",
};

function isLightTheme(id: ThemeId): boolean {
  return id === "concrete";
}

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "0.75rem",
      }}
    >
      {(Object.entries(THEMES) as [ThemeId, (typeof THEMES)[ThemeId]][]).map(([id, theme]) => {
        const swatches = SWATCH_COLORS[id];
        const selected = active === id;

        return (
          <button
            key={id}
            type="button"
            onClick={() => pick(id)}
            aria-pressed={selected}
            className="card"
            style={{
              padding: "0.9rem",
              cursor: "pointer",
              textAlign: "left",
              display: "grid",
              gap: "0.7rem",
              border: selected ? `2px solid ${swatches[2]}` : "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              background: swatches[1],
              transition: "border-color 180ms var(--ease-standard), transform 180ms var(--ease-standard)",
            }}
          >
            <div
              style={{
                fontFamily: FONT_FAMILIES[id],
                fontSize: "1.2rem",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "0.04em",
                color: isLightTheme(id) ? "#0d0d0d" : "#f4f7fa",
              }}
            >
              {theme.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "0.35rem",
              }}
            >
              {swatches.map((color) => (
                <div
                  key={color}
                  style={{
                    height: "18px",
                    borderRadius: "4px",
                    background: color,
                    border: "1px solid color-mix(in srgb, white, transparent 82%)",
                  }}
                />
              ))}
            </div>
            <p
              className="page-note"
              style={{
                margin: 0,
                fontSize: "0.75rem",
                color: isLightTheme(id) ? "#5a5650" : "#a9b5c3",
              }}
            >
              {theme.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
