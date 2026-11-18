import {
  ROBO_RISK_CONFIG,
  ROBO_RISK_EMPTY_SEGMENT_COLOR,
  ROBO_RISK_TRACK_COLOR,
  type RoboRiskTier,
} from "./robo-risk-level";

/** Figma 33787:149969 — label + 5-segment risk bar. */
export function RoboRiskLevel({ tier }: { tier: RoboRiskTier }) {
  const { label, filledSegments, color } = ROBO_RISK_CONFIG[tier];

  return (
    <div className="flex shrink-0 items-center gap-2">
      <p className="whitespace-nowrap text-xs font-bold leading-[20px] text-black/75">{label}</p>
      <div
        className="flex h-2 w-[60px] shrink-0 items-stretch overflow-hidden rounded border border-black/10"
        style={{ backgroundColor: ROBO_RISK_TRACK_COLOR }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`h-full flex-1 ${i < 4 ? "border-r border-black/10" : ""}`}
            style={{
              backgroundColor: i < filledSegments ? color : ROBO_RISK_EMPTY_SEGMENT_COLOR,
            }}
          />
        ))}
      </div>
    </div>
  );
}
