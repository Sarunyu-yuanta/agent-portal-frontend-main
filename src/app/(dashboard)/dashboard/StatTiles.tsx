"use client";

import { Card } from "@sarunyu/system-one";
import {
  CoinsIcon,
  IdentificationCardIcon,
  SparkleIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCountUp } from "@/hooks/use-count-up";

/**
 * The three numbers the top of the work column is for.
 *
 * Counts of *work*, not of money — laid out as a clean strip of small cards:
 * the figure and what it counts on the left, a tinted circle icon on the
 * right, nothing else. The qualifier each number needs lives in the label.
 */
export type StatTone = "danger" | "warning" | "brand" | "violet";

const TONE: Record<StatTone, { icon: string }> = {
  danger: {
    icon: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
  },
  warning: {
    icon: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]",
  },
  brand: {
    icon: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
  },
  violet: {
    icon: "bg-[var(--fill-violet-100)] text-[var(--fill-violet-600)]",
  },
};

const QUIET_ICON = "bg-[var(--fill-gray-100)] text-[var(--fill-gray-400)]";

export type StatTile = {
  id: string;
  /** Descriptive line under the figure — "เลยกำหนด", "ครบกำหนดวันนี้". */
  label: string;
  value: number;
  tone: StatTone;
  icon: "warning" | "coins" | "kyc" | "sparkle" | "users";
  /** Formats the animated raw value — e.g. THB AUM → "฿ 2.4B". */
  formatValue?: (value: number) => string;
  /** Present when the tile narrows the page to what it counts. */
  onClick?: () => void;
  active?: boolean;
};

const ICONS = {
  warning: WarningCircleIcon,
  coins: CoinsIcon,
  kyc: IdentificationCardIcon,
  sparkle: SparkleIcon,
  users: UsersIcon,
};

export function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <StatTileCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function StatTileCard({ tile }: { tile: StatTile }) {
  const Icon = ICONS[tile.icon];
  const tone = TONE[tile.tone];
  const animated = useCountUp(tile.value);
  const quiet = tile.value === 0;
  const display = tile.formatValue
    ? tile.formatValue(animated)
    : String(Math.round(animated));

  return (
    <Card
      variant="default"
      className={`min-h-[96px] flex-row items-center justify-between gap-3 px-5 py-5 transition-colors ${
        tile.onClick ? "cursor-pointer" : ""
      } ${
        tile.active
          ? "border-primary-action!"
          : tile.onClick
            ? "hover:border-primary-action/40"
            : ""
      }`}
      {...(tile.onClick
        ? {
            role: "button",
            tabIndex: 0,
            "aria-pressed": tile.active,
            onClick: tile.onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                tile.onClick?.();
              }
            },
          }
        : {})}
    >
      <div className="min-w-0 flex flex-col gap-2">
        <p
          className={`text-[28px] font-bold leading-none tabular-nums truncate ${
            quiet ? "text-[var(--text-default-placeholder)]" : "text-foreground"
          }`}
        >
          {display}
        </p>
        <p className="text-[14px] font-medium text-muted-foreground leading-snug truncate">
          {tile.label}
        </p>
      </div>

      <span
        aria-hidden
        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
          quiet ? QUIET_ICON : tone.icon
        }`}
      >
        <Icon size={22} weight="fill" />
      </span>
    </Card>
  );
}
