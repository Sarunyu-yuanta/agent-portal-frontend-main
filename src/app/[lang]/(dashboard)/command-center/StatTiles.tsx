"use client";

import { Card } from "@sarunyu/system-one";
import {
  CaretRightIcon,
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
 *
 * In `compact` mode the three tiles share one card beside the greeting — the
 * figure and label left-aligned, icon as a faint watermark on the right, like
 * the Hello card beside them.
 */
export type StatTone = "danger" | "warning" | "brand" | "violet" | "green";

const TONE: Record<
  StatTone,
  { icon: string; watermark: string; glow: string; action: string }
> = {
  danger: {
    icon: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    watermark: "text-[var(--fill-red-600)]",
    glow: "bg-[radial-gradient(circle,var(--fill-red-200)_0%,var(--fill-red-100)_32%,transparent_72%)]",
    action: "bg-[var(--fill-red-600)]",
  },
  warning: {
    icon: "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]",
    watermark: "text-[var(--fill-orange-600)]",
    glow: "bg-[radial-gradient(circle,var(--fill-orange-200)_0%,var(--fill-orange-100)_32%,transparent_72%)]",
    action: "bg-[var(--fill-orange-600)]",
  },
  brand: {
    icon: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
    watermark: "text-[var(--fill-p1-600)]",
    glow: "bg-[radial-gradient(circle,var(--fill-p1-300)_0%,var(--fill-p1-200)_20%,var(--fill-p1-100)_38%,transparent_72%)]",
    action: "bg-[var(--fill-p1-600)]",
  },
  violet: {
    icon: "bg-[var(--fill-violet-100)] text-[var(--fill-violet-600)]",
    watermark: "text-[var(--fill-violet-600)]",
    glow: "bg-[radial-gradient(circle,var(--fill-violet-200)_0%,var(--fill-violet-100)_32%,transparent_72%)]",
    action: "bg-[var(--fill-violet-600)]",
  },
  green: {
    icon: "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]",
    watermark: "text-[var(--fill-green-600)]",
    glow: "bg-[radial-gradient(circle,var(--fill-green-100)_0%,var(--fill-green-100)_28%,transparent_72%)]",
    action: "bg-[var(--fill-green-600)]",
  },
};

const QUIET_GLOW =
  "bg-[radial-gradient(circle,var(--fill-gray-300)_0%,var(--fill-gray-100)_32%,transparent_72%)]";

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

export function StatTiles({
  tiles,
  compact = false,
}: {
  tiles: StatTile[];
  /** Beside the greeting — one segmented strip, three equal columns. */
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Card
        variant="default"
        className="grid h-full min-h-[96px] flex-1 grid-cols-3 divide-x divide-black/[0.05] overflow-hidden p-0"
      >
        {tiles.map((tile) => (
          <CompactStatTile key={tile.id} tile={tile} />
        ))}
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => (
        <StatTileCard key={tile.id} tile={tile} />
      ))}
    </div>
  );
}

function CompactStatTile({ tile }: { tile: StatTile }) {
  const Icon = ICONS[tile.icon];
  const tone = TONE[tile.tone];
  const animated = useCountUp(tile.value);
  const quiet = tile.value === 0;
  const display = tile.formatValue
    ? tile.formatValue(animated)
    : String(Math.round(animated));

  const interactive = Boolean(tile.onClick);

  return (
    <div
      className={`relative isolate flex h-full min-w-0 flex-col justify-center gap-1.5 overflow-hidden px-4 py-3 text-left sm:gap-2 sm:px-5 sm:py-4 ${
        interactive ? "group cursor-pointer" : ""
      } ${tile.active ? "bg-[var(--primary-action-light)]" : ""}`}
      {...(interactive
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
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 -z-10 size-[7rem] translate-x-[32%] translate-y-[32%] sm:size-[8rem] sm:translate-x-[34%] sm:translate-y-[34%]"
      >
        <div
          className={`absolute -inset-3 rounded-full blur-2xl ${quiet ? QUIET_GLOW : tone.glow}`}
        />
        <div className="absolute inset-0 flex items-center justify-center [mask-image:linear-gradient(to_right,transparent_0%,transparent_22%,black_78%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,transparent_22%,black_78%)]">
          <Icon
            size={62}
            weight="fill"
            className={`opacity-[0.16] sm:hidden ${
              quiet ? "text-[var(--fill-gray-400)]" : tone.watermark
            }`}
          />
          <Icon
            size={70}
            weight="fill"
            className={`hidden opacity-[0.16] sm:block ${
              quiet ? "text-[var(--fill-gray-400)]" : tone.watermark
            }`}
          />
        </div>
      </div>

      <p
        className={`relative max-w-full truncate text-[22px] font-bold leading-none tabular-nums sm:text-[26px] ${
          quiet ? "text-[var(--text-default-placeholder)]" : tone.watermark
        }`}
      >
        {display}
      </p>

      <p
        className={`relative max-w-full text-label font-medium leading-snug line-clamp-2 sm:text-body-sm ${
          quiet ? "text-[var(--text-default-placeholder)]" : tone.watermark
        }`}
      >
        {tile.label}
      </p>

      {interactive ? (
        <button
          type="button"
          aria-label={`${tile.label} — ดูรายการทั้งหมด`}
          onClick={(e) => {
            e.stopPropagation();
            tile.onClick?.();
          }}
          className={`absolute right-3 top-4 z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform group-hover:scale-105 active:scale-95 sm:right-3.5 sm:top-5 sm:size-7 ${tone.action}`}
        >
          <CaretRightIcon size={11} weight="bold" className="sm:hidden" />
          <CaretRightIcon size={13} weight="bold" className="hidden sm:block" />
        </button>
      ) : null}
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
        <p className="text-body font-medium text-muted-foreground leading-snug truncate">
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
