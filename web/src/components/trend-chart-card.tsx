type WeekPoint = {
  label: string;
  value: number;
};

type TrendChartCardProps = {
  title: string;
  subtitle: string;
  points: WeekPoint[];
};

export function TrendChartCard({ title, subtitle, points }: TrendChartCardProps) {
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const last = points.at(-1);

  // SVG trend line: connect midpoint-top of each bar
  // viewBox width = 100 * points.length (so each bar = 100 units wide)
  const svgWidth = Math.max(points.length * 100, 100);
  const trendPoints = values
    .map((v, i) => {
      const x = i * 100 + 50; // midpoint of each bar slot
      const y = 100 - Math.round((v / max) * 100); // 0=top, 100=bottom
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="card trend-card reveal">
      <div>
        <p className="subtle-label" style={{ margin: 0 }}>
          {subtitle}
        </p>
        <h3 className="section-title" style={{ marginTop: "0.2rem" }}>
          {title}
        </h3>
      </div>
      <div className="trend-bars" aria-hidden="true" style={{ position: "relative" }}>
        {points.map((point, idx) => (
          <div
            key={`${title}-${idx}`}
            className="trend-bar"
            style={{ height: `${Math.max(8, Math.round((point.value / max) * 100))}%` }}
          />
        ))}
        {points.length > 1 && (
          <svg
            viewBox={`0 0 ${svgWidth} 100`}
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <polyline
              points={trendPoints}
              fill="none"
              stroke="var(--accent-primary)"
              strokeOpacity="0.6"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <p className="page-note" style={{ margin: 0 }}>
        Last: <span className="mono">{last ? `${last.value} (${last.label})` : "—"}</span>
      </p>
    </article>
  );
}
