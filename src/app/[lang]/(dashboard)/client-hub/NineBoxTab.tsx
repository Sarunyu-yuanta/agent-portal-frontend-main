"use client";

import { useState } from "react";
import { AvatarStack } from "@sarunyu/system-one";
import { getInitial } from "@/lib/client-utils";
import { mockClients } from "@/lib/mock-data";

type Client = (typeof mockClients)[number];

function formatTotalAum(clients: Client[]): string | null {
  if (clients.length === 0) return null;
  const total = clients.reduce((sum, c) => sum + c.aum, 0);
  if (total >= 1_000_000_000) return `฿${(total / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (total >= 1_000_000) return `฿${Math.round(total / 1_000_000)}M`;
  return `฿${Math.round(total / 1000)}K`;
}

function getAumTier(aumThb: number): 0 | 1 | 2 {
  const m = aumThb / 1_000_000;
  if (m > 500) return 0;
  if (m >= 150) return 1;
  return 2;
}

function getAiTier(score: number): 0 | 1 | 2 {
  if (score > 87) return 2;
  if (score >= 75) return 1;
  return 0;
}

const CELLS: { label: string; heat: 1 | 2 | 3 | 4 | 5 }[][] = [
  [
    { label: "Protect",    heat: 3 },
    { label: "Nurture",    heat: 4 },
    { label: "Prioritize", heat: 5 },
  ],
  [
    { label: "Re-engage",  heat: 2 },
    { label: "Develop",    heat: 3 },
    { label: "Grow",       heat: 4 },
  ],
  [
    { label: "Monitor",      heat: 1 },
    { label: "Activate",     heat: 2 },
    { label: "Rising Stars", heat: 3 },
  ],
];

export const NINE_BOX_HEAT_STYLES: Record<number, { bg: string; chipBg: string; dot: string; count: string }> = {
  5: { bg: "bg-emerald-100 hover:bg-emerald-200/60", chipBg: "bg-emerald-100", dot: "bg-emerald-500", count: "text-emerald-700" },
  4: { bg: "bg-blue-100 hover:bg-blue-200/60",       chipBg: "bg-blue-100",    dot: "bg-blue-500",    count: "text-blue-700"    },
  3: { bg: "bg-sky-50 hover:bg-sky-100/70",          chipBg: "bg-sky-50",      dot: "bg-sky-400",     count: "text-sky-700"     },
  2: { bg: "bg-amber-50 hover:bg-amber-100/60",      chipBg: "bg-amber-50",    dot: "bg-amber-400",   count: "text-amber-600"   },
  1: { bg: "bg-gray-100 hover:bg-gray-200/60",       chipBg: "bg-gray-100",    dot: "bg-gray-400",    count: "text-gray-500"    },
};

const AUM_ROWS = [
  { label: "High",   sub: "> ฿500M",    color: "var(--fill-p1-800)", activeColor: "var(--fill-p1-900)" },
  { label: "Medium", sub: "฿150M–500M", color: "var(--fill-p1-600)", activeColor: "var(--fill-p1-700)" },
  { label: "Low",    sub: "< ฿150M",    color: "var(--fill-p1-400)", activeColor: "var(--fill-p1-600)" },
];

const AI_COLS = [
  { label: "Low",    sub: "< 75",   color: "var(--fill-p1-400)", activeColor: "var(--fill-p1-600)" },
  { label: "Medium", sub: "75–87",  color: "var(--fill-p1-600)", activeColor: "var(--fill-p1-700)" },
  { label: "High",   sub: "> 87",   color: "var(--fill-p1-800)", activeColor: "var(--fill-p1-900)" },
];

export function getNineBoxCell(client: Client): { label: string; heat: 1 | 2 | 3 | 4 | 5; aumLabel: string; aiLabel: string } {
  const row = getAumTier(client.aum);
  const col = getAiTier(client.aiScore);
  const cell = CELLS[row][col];
  return { label: cell.label, heat: cell.heat, aumLabel: AUM_ROWS[row].label, aiLabel: AI_COLS[col].label };
}

export function NineBoxCellPill({ client }: { client: Parameters<typeof getNineBoxCell>[0] }) {
  const cell = getNineBoxCell(client);
  const style = NINE_BOX_HEAT_STYLES[cell.heat];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 w-fit ${style.chipBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span className="type-caption text-foreground">{cell.label}</span>
    </div>
  );
}

export type NineBoxCellInfo = {
  label: string;
  heat: 1 | 2 | 3 | 4 | 5;
  aumLabel: string;
  aiLabel: string;
  clients: Client[];
};

function ClientAvatarStack({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return null;
  return (
    <AvatarStack
      items={clients.map((c) => ({ type: "text" as const, initials: getInitial(c.name) }))}
      size="medium"
      max={4}
    />
  );
}

const CELL_H = 130;

export function NineBoxTab({
  clients,
  onCellOpen,
}: {
  clients: Client[];
  onCellOpen: (info: NineBoxCellInfo) => void;
}) {
  const grid: Client[][][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [] as Client[])
  );
  clients.forEach((c) => {
    grid[getAumTier(c.aum)][getAiTier(c.aiScore)].push(c);
  });

  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  return (
    <div className="flex gap-3 max-w-2xl mx-auto w-full">

      {/* ── Y-axis ──────────────────────────────────── */}
      <div className="flex items-stretch gap-1.5 shrink-0 self-start">
        {/* "AUM" rotated title */}
        <div className="flex items-center justify-center">
          <span
            className="text-meta font-bold text-slate-500 select-none tracking-wider"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            AUM
          </span>
        </div>

        {/* Vertical chips — one per tier, same gaps as grid */}
        <div className="flex flex-col gap-[1px] rounded-xl overflow-hidden shrink-0 w-7">
          {AUM_ROWS.map((r, i) => (
            <div
              key={r.label}
              className="flex-1 flex items-center justify-center transition-all duration-150"
              style={{
                minHeight: CELL_H,
                background: hoveredCell?.row === i ? r.activeColor : r.color,
                opacity: hoveredCell && hoveredCell.row !== i ? 0.15 : 1,
              }}
            >
              <span
                className="text-micro font-black text-white tracking-[0.15em] uppercase select-none leading-none"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {r.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Grid + X-axis ───────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">

        {/* 3×3 grid */}
        <div
          className="grid grid-cols-3 grid-rows-3 gap-[1px] rounded-xl overflow-hidden border border-[rgba(0,0,0,0.08)]"
          style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
        >
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const cell = CELLS[row][col];
              const style = NINE_BOX_HEAT_STYLES[cell.heat];
              const cellClients = grid[row][col];
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() =>
                    onCellOpen({
                      label: cell.label,
                      heat: cell.heat,
                      aumLabel: AUM_ROWS[row].label,
                      aiLabel: AI_COLS[col].label,
                      clients: cellClients,
                    })
                  }
                  onMouseEnter={() => setHoveredCell({ row, col })}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`flex flex-col justify-between p-3.5 transition-all duration-150 cursor-pointer text-left ${style.bg}`}
                  style={{
                    minHeight: CELL_H,
                    opacity: hoveredCell && (hoveredCell.row !== row || hoveredCell.col !== col) ? 0.25 : 1,
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`size-2 rounded-full shrink-0 ${style.dot}`} />
                    <p className="text-label font-semibold text-foreground leading-[20px] truncate">{cell.label}</p>
                  </div>
                  <div>
                    <p className={`text-3xl font-bold leading-none tracking-tight ${style.count}`}>
                      {cellClients.length}
                    </p>
                    {(() => {
                      const totalAum = formatTotalAum(cellClients);
                      return totalAum ? (
                        <p className="text-body-sm text-muted-foreground mt-1 leading-none">
                          {totalAum}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="h-7 flex items-center">
                    <ClientAvatarStack clients={cellClients} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Horizontal chips — one per AI tier, same gaps as grid */}
        <div className="flex gap-[1px] rounded-xl overflow-hidden h-7">
          {AI_COLS.map(({ label, color, activeColor }, i) => (
            <div
              key={label}
              className="flex-1 flex items-center justify-center transition-all duration-150"
              style={{
                background: hoveredCell?.col === i ? activeColor : color,
                opacity: hoveredCell && hoveredCell.col !== i ? 0.15 : 1,
              }}
            >
              <span className="text-micro font-black text-white tracking-[0.15em] uppercase select-none leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* "AI Score" title */}
        <div className="flex justify-center">
          <span className="text-meta font-bold text-slate-500 tracking-wider select-none">
            AI Score
          </span>
        </div>

      </div>
    </div>
  );
}
