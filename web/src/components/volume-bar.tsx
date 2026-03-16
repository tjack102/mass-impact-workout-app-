"use client";

type VolumeBarProps = {
  current: number;
  mev: number;
  mavLow: number;
  mavHigh: number;
  mrvLow: number;
  mrvHigh: number;
};

export function VolumeBar({ current, mev, mavLow, mavHigh, mrvLow, mrvHigh }: VolumeBarProps) {
  // Calculate percentages based on mrvHigh as the scale max
  const mevPercent = (mev / mrvHigh) * 100;
  const mavLowPercent = (mavLow / mrvHigh) * 100;
  const mavMidPercent = ((mavLow + mavHigh) / 2 / mrvHigh) * 100;
  const mavHighPercent = (mavHigh / mrvHigh) * 100;
  const mrvLowPercent = (mrvLow / mrvHigh) * 100;
  const currentPercent = (current / mrvHigh) * 100;

  // Determine color fill based on where current falls
  let fillColor = "#6b7280"; // gray (below MEV)
  if (current >= mev && current <= (mavLow + mavHigh) / 2) {
    fillColor = "#34d399"; // green (MEV to MAV midpoint)
  } else if (current > (mavLow + mavHigh) / 2 && current <= mavHigh) {
    fillColor = "#fbbf24"; // yellow (MAV midpoint to high)
  } else if (current > mavHigh) {
    fillColor = "#f87171"; // red (above MAV high)
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "12px" }}>
      {/* Background bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "#1a2028",
          borderRadius: "6px",
          border: "1px solid #2a3340",
        }}
      />

      {/* Gray fill (0 to MEV) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: `${mevPercent}%`,
          height: "100%",
          backgroundColor: "#6b7280",
          borderRadius: "6px 0 0 6px",
        }}
      />

      {/* Green fill (MEV to MAV midpoint) */}
      {mevPercent < mavMidPercent && (
        <div
          style={{
            position: "absolute",
            left: `${mevPercent}%`,
            top: 0,
            width: `${mavMidPercent - mevPercent}%`,
            height: "100%",
            backgroundColor: "#34d399",
          }}
        />
      )}

      {/* Yellow fill (MAV midpoint to high) */}
      {mavMidPercent < mavHighPercent && (
        <div
          style={{
            position: "absolute",
            left: `${mavMidPercent}%`,
            top: 0,
            width: `${mavHighPercent - mavMidPercent}%`,
            height: "100%",
            backgroundColor: "#fbbf24",
          }}
        />
      )}

      {/* Red fill (MAV high to visible max) */}
      {mavHighPercent < 100 && (
        <div
          style={{
            position: "absolute",
            left: `${mavHighPercent}%`,
            top: 0,
            width: `${100 - mavHighPercent}%`,
            height: "100%",
            backgroundColor: "#f87171",
            borderRadius: "0 6px 6px 0",
          }}
        />
      )}

      {/* Marker line at MEV */}
      <div
        style={{
          position: "absolute",
          left: `${mevPercent}%`,
          top: 0,
          width: "1px",
          height: "100%",
          backgroundColor: "#8891a4",
          opacity: 0.5,
        }}
      />

      {/* Marker line at MAV low */}
      <div
        style={{
          position: "absolute",
          left: `${mavLowPercent}%`,
          top: 0,
          width: "1px",
          height: "100%",
          backgroundColor: "#8891a4",
          opacity: 0.5,
        }}
      />

      {/* Marker line at MAV high */}
      <div
        style={{
          position: "absolute",
          left: `${mavHighPercent}%`,
          top: 0,
          width: "1px",
          height: "100%",
          backgroundColor: "#8891a4",
          opacity: 0.5,
        }}
      />

      {/* Marker line at MRV low */}
      <div
        style={{
          position: "absolute",
          left: `${mrvLowPercent}%`,
          top: 0,
          width: "1px",
          height: "100%",
          backgroundColor: "#8891a4",
          opacity: 0.5,
        }}
      />

      {/* Current value indicator (bright dot) */}
      <div
        style={{
          position: "absolute",
          left: `calc(${currentPercent}% - 5px)`,
          top: "50%",
          transform: "translateY(-50%)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: fillColor,
          border: "2px solid #f4f7fa",
          boxShadow: `0 0 8px ${fillColor}`,
        }}
      />
    </div>
  );
}
