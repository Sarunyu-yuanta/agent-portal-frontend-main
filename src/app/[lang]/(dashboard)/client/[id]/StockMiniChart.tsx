import { useId } from "react";
import type { Trend } from "./stock-data";

const TREND_STROKE: Record<Trend, string> = {
  up: "#00c951",
  down: "#fb2c36",
  flat: "#99a1af",
};

/** Top-of-area gradient stop opacity per trend — matches the alpha the Figma
 *  "Line Chart" assets (`imgTrendPositiveSizeLarge` etc.) fade from before
 *  going fully transparent at the sparkline's baseline. */
const TREND_FILL_OPACITY: Record<Trend, number> = { up: 0.16, down: 0.16, flat: 0.14 };

/**
 * Inline 30-day trend sparkline (Figma "Line Chart" component, node
 * 23077:35185 family) — drawn as a plain SVG polyline instead of pulling in a
 * charting lib, since this is a small fixed-size decoration repeated dozens
 * of times per page (market boards, stock rows, cross-sell rows). The fill
 * under the line is a top→bottom gradient fading to transparent, matching
 * the Figma asset rather than a flat tinted rectangle.
 */
export function StockMiniChart({
  series,
  trend,
  width = 48,
  height = 30,
  className,
}: {
  series: number[];
  trend: Trend;
  width?: number;
  height?: number;
  className?: string;
}) {
  const gradientId = `stock-chart-fill-${useId()}`;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const points = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TREND_STROKE[trend]} stopOpacity={TREND_FILL_OPACITY[trend]} />
          <stop offset="100%" stopColor={TREND_STROKE[trend]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={areaPoints} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke={TREND_STROKE[trend]}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
