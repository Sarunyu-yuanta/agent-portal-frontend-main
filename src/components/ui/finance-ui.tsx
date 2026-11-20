"use client";

export function ProfitLossBadge({
  changeAmount,
  changePercent,
  changePositive,
}: {
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
}) {
  const prefix = changePositive ? "+" : "-";

  return (
    <div
      className={`flex shrink-0 items-center justify-end gap-1 ${
        changePositive ? "text-[var(--text-success-primary)]" : "text-destructive"
      }`}
    >
      <p className="type-caption leading-4 whitespace-nowrap">{changeAmount}</p>
      <div
        className={`type-caption flex items-center rounded px-1.5 py-0.5 leading-4 ${
          changePositive
            ? "bg-[var(--bg-success-soft)] text-[var(--text-success-primary)]"
            : "bg-[var(--bg-danger-light)] text-destructive"
        }`}
      >
        <span>{prefix}</span>
        <span>{changePercent}%</span>
      </div>
    </div>
  );
}

type StatCard = {
  label: string;
  value: React.ReactNode;
};

export function StatCardRow({ stats }: { stats: StatCard[] }) {
  return (
    <div className="flex gap-3 border-b border-[var(--border-default)] bg-[var(--bg-default-secondary)] px-4 py-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[var(--border-default)] bg-white px-4 py-3"
        >
          <p className="type-caption text-muted-foreground">{stat.label}</p>
          <div className="type-subtitle-2 font-bold text-foreground">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

export function DashedDivider() {
  return (
    <div className="relative h-px w-full shrink-0">
      <svg
        className="absolute inset-0 block h-px w-full max-w-none"
        viewBox="0 0 319 1"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <line y1="0.5" x2="319" y2="0.5" stroke="black" strokeOpacity="0.1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}
