type StrengthPoint = {
  weight: number;
  reps: number;
};

type StrengthChartCardProps = {
  title: string;
  subtitle: string;
  points: StrengthPoint[];
};

/** Epley e1RM estimate -- same formula as pr-engine, duplicated to avoid circular imports. */
function e1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/** 3-session centered moving average */
function movingAvg(values: number[]): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - 1), i + 2);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

export function StrengthChartCard({ title, subtitle, points }: StrengthChartCardProps) {
  if (points.length === 0) {
    return (
      <article className="card trend-card reveal">
        <p className="subtle-label" style={{ margin: 0 }}>{subtitle}</p>
        <h3 className="section-title" style={{ marginTop: "0.2rem" }}>{title}</h3>
        <p className="page-note" style={{ margin: 0 }}>No data yet.</p>
      </article>
    );
  }

  const weights = points.map((p) => p.weight);
  const e1rms = points.map((p) => e1rm(p.weight, p.reps));
  const mavg = movingAvg(weights);

  const allValues = [...weights, ...e1rms, ...mavg];
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const yMin = rawMin * 0.92;
  const yMax = rawMax * 1.05;
  const yRange = yMax - yMin || 1;

  const W = 600;
  const H = 160;
  const PADDING = { top: 12, right: 16, bottom: 28, left: 36 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const xStep = points.length > 1 ? chartW / (points.length - 1) : chartW / 2;

  const toX = (i: number) =>
    PADDING.left + (points.length === 1 ? chartW / 2 : i * xStep);
  const toY = (v: number) =>
    PADDING.top + chartH - ((v - yMin) / yRange) * chartH;

  const dotPoints = points.map((p, i) => ({ x: toX(i), y: toY(p.weight) }));
  const e1rmPath = e1rms.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const mavgPath = mavg.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");

  // Y-axis labels: 3 evenly spaced
  const yLabels = [yMin, yMin + yRange / 2, yMax].map((v) => ({
    value: Math.round(v),
    y: toY(v),
  }));

  const last = points.at(-1)!;

  return (
    <article className="card trend-card reveal">
      <div>
        <p className="subtle-label" style={{ margin: 0 }}>{subtitle}</p>
        <h3 className="section-title" style={{ marginTop: "0.2rem" }}>{title}</h3>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: "auto", overflow: "visible" }}
        aria-hidden="true"
      >
        {/* Y-axis labels */}
        {yLabels.map((lbl, i) => (
          <text
            key={i}
            x={PADDING.left - 4}
            y={lbl.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="var(--text-2)"
            fontFamily="var(--font-mono)"
          >
            {lbl.value}
          </text>
        ))}

        {/* Moving average line -- behind everything */}
        {points.length > 1 && (
          <path d={mavgPath} fill="none" stroke="var(--text-2)" strokeWidth="1" opacity="0.5" />
        )}

        {/* e1RM trend line -- dashed */}
        {points.length > 1 && (
          <path
            d={e1rmPath}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.4"
          />
        )}

        {/* Data point dots + rep labels */}
        {dotPoints.map((dot, i) => (
          <g key={`dot-${i}`}>
            <circle cx={dot.x} cy={dot.y} r="4" fill="var(--accent-primary)" />
            <text
              x={dot.x}
              y={dot.y + 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text-2)"
              fontFamily="var(--font-mono)"
            >
              ×{points[i].reps}
            </text>
          </g>
        ))}
      </svg>
      <p className="page-note" style={{ margin: 0 }}>
        Last: <span className="mono">{last.weight} lb × {last.reps}</span>
        {" "}
        <span className="mono" style={{ color: "var(--text-2)", fontSize: "0.75em" }}>
          (e1RM ~{Math.round(e1rm(last.weight, last.reps))} lb)
        </span>
      </p>
    </article>
  );
}
