import type { ReactNode } from "react";

function valueColor(value: string): string {
  if (value.startsWith("+")) return "#008236";
  if (value.startsWith("-") && value !== "-") return "#c10007";
  return "#101828";
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-base leading-[28px] font-bold text-neutral-900 ${className}`}>
      {children}
    </h2>
  );
}

export function DataTableHeader({
  columns,
}: {
  columns: { label: string; align?: "left" | "center" | "right" }[];
}) {
  return (
    <div className="flex w-full border-b border-black/10">
      {columns.map((col) => (
        <div
          key={col.label}
          className={`flex flex-1 items-center px-4 py-3 ${
            col.align === "center"
              ? "justify-center text-center"
              : col.align === "right"
                ? "justify-end text-right"
                : ""
          }`}
        >
          <span className="text-xs leading-[20px] text-neutral-500">{col.label}</span>
        </div>
      ))}
    </div>
  );
}

export function DataTableCell({
  value,
  align = "left",
  striped,
}: {
  value: string;
  align?: "left" | "center" | "right";
  striped?: boolean;
}) {
  return (
    <div
      className={`flex h-[38px] flex-1 items-center border-b border-black/10 px-4 py-3.5 last:border-b-0 ${
        striped ? "bg-neutral-50" : "bg-white"
      } ${align === "center" ? "justify-center text-center" : align === "right" ? "justify-end text-right" : ""}`}
    >
      <span className="text-sm leading-[24px]" style={{ color: valueColor(value) }}>
        {value}
      </span>
    </div>
  );
}

export function KeyValueBox({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-black/10 p-3">
      {rows.map((row) => (
        <div key={row.label} className="flex w-full items-end gap-2">
          <span className="flex-1 text-sm leading-[24px] text-neutral-600">{row.label}</span>
          <span className="shrink-0 text-sm leading-[24px] whitespace-nowrap text-neutral-900">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
