export type MembershipTier =
  "member" | "bronze" | "silver" | "gold" | "platinum" | "elite" | "prestige" | "signature";

type TierStyle = { label: string; bg: string; text: string; border?: string };

/** Colors and icons lifted directly from the Figma "Tier" badge components. */
const TIER_STYLE: Record<MembershipTier, TierStyle> = {
  member: { label: "Member", bg: "#FFFFFF", text: "#000000", border: "rgba(0,0,0,0.08)" },
  bronze: { label: "Bronze", bg: "#8C4F34", text: "#FFECE5" },
  silver: { label: "Silver", bg: "#9C9999", text: "#FFFEF9" },
  gold: { label: "Gold", bg: "#B58300", text: "#FFFEF9" },
  platinum: { label: "Platinum", bg: "#713E95", text: "#FFFEF9" },
  elite: { label: "Elite", bg: "#B9775C", text: "#FFFFFF" },
  prestige: { label: "Prestige", bg: "#897C70", text: "#FFFFFF" },
  signature: { label: "Signature", bg: "#252525", text: "#FFFFFF" },
};

/** A single membership tier pill: colored background, tier icon, and label. */
export function TierBadge({ tier, className }: { tier: MembershipTier; className?: string }) {
  const style = TIER_STYLE[tier];
  return (
    <span
      className={`inline-flex w-fit items-center gap-[5px] rounded-full py-0.5 pr-2 pl-1 ${className ?? ""}`}
      style={{
        backgroundColor: style.bg,
        boxShadow: style.border ? `inset 0 0 0 1px ${style.border}` : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 18px SVG tier icon; the image optimizer rejects SVG */}
      <img src={`/icons/tier/tier-${tier}.svg`} alt="" className="size-[18px] shrink-0" />
      {/* `font-bold!`, not `font-bold`: `.type-caption` in
          `@sarunyu/system-one` sets `font-weight` itself and its stylesheet
          loads after `globals.css`, so a plain Tailwind weight ties on
          specificity and loses — the label rendered at 400. */}
      <span className="type-caption leading-none font-bold!" style={{ color: style.text }}>
        {style.label}
      </span>
    </span>
  );
}
