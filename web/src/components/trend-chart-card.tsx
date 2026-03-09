type TrendChartCardProps = {
  title: string;
  subtitle: string;
  points: number[];
};

export function TrendChartCard({ title, subtitle, points }: TrendChartCardProps) {
  const max = Math.max(...points, 1);

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
      <div className="trend-bars" aria-hidden="true">
        {points.map((point, idx) => (
          <div
            key={`${title}-${idx}`}
            className="trend-bar"
            style={{ height: `${Math.max(8, Math.round((point / max) * 100))}%` }}
          />
        ))}
      </div>
      <p className="page-note" style={{ margin: 0 }}>
        Last: <span className="mono">{points.at(-1)}</span>
      </p>
    </article>
  );
}
