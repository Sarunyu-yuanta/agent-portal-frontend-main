import { Button } from "@sarunyu/system-one";
import { ArrowSquareOutIcon, FileTextIcon } from "@phosphor-icons/react";
import type { FixedIncomeStatus } from "@/features/catalog/fixed-income/lib/fixed-income-data";
import { useT } from "@/i18n/I18nProvider";

// ─── Design tokens ────────────────────────────────────────────────────────────

export const BORDER_COLOR = "rgba(0,0,0,0.1)";
export const HEADER_TEXT_CLS = "text-sm leading-[24px] text-[#6a7282]";

/**
 * The "rows per page" choices every paginated catalog table offers.
 *
 * Shared rather than per table: the Fixed Income, Global Bond and Thai
 * Structured tables each declared the same four numbers, which is three places
 * to edit and two to forget. Despite this module's name the Thai Structured
 * table already imports from here — it is the catalog's table module in
 * practice, whatever the filename says.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/** Card/table drop-shadow used across GlobalBond tables. */
export const TABLE_SHADOW =
  "0px 0px 2px rgba(102,102,102,0.16), 0px 4px 8px rgba(102,102,102,0.12)";

/** Smaller drop-shadow variant used by the FixedIncome table card. */
export const TABLE_SHADOW_SM =
  "0px 0px 1px rgba(102,102,102,0.16),0px 4px 4px rgba(102,102,102,0.12)";

/** Wrapper style for a data-table card — border + small shadow + clipped
 *  corners. Paired with a sticky sync-scroll header (see
 *  `useSyncedTableScroll`) and a `SCROLLABLE_TABLE_BODY_CLS` body. */
export const TABLE_CARD_STYLE = {
  border: `1px solid ${BORDER_COLOR}`,
  boxShadow: TABLE_SHADOW_SM,
  overflow: "clip",
} as const;

/** Custom horizontal scrollbar for the table body — thin, dark-on-hover. */
export const SCROLLABLE_TABLE_BODY_CLS =
  "overflow-x-scroll [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/25";

// ─── Border style helpers ─────────────────────────────────────────────────────

export const headerBorderStyle = (opts?: {
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
}) => ({
  borderBottom: opts?.bottom === false ? undefined : `1px solid ${BORDER_COLOR}`,
  borderRight: opts?.right === false ? undefined : `1px solid ${BORDER_COLOR}`,
  borderLeft: opts?.left ? `1px solid ${BORDER_COLOR}` : undefined,
});

export const cellBorderStyle = (opts?: { bottom?: boolean }) => ({
  borderBottom: opts?.bottom === false ? undefined : `1px solid ${BORDER_COLOR}`,
});

// ─── Shared components ────────────────────────────────────────────────────────

export function StatusTag({ status, label }: { status: FixedIncomeStatus; label: string }) {
  const isOpen = status === "open";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded px-2 py-1 text-xs leading-[20px] font-bold whitespace-nowrap"
      style={{
        backgroundColor: isOpen ? "#dbfce7" : "#f3f4f6",
        color: isOpen ? "#008236" : "#6a7282",
      }}
    >
      {label}
    </span>
  );
}

/**
 * Renders a bond/issuer logo with optional crop positioning.
 * Pass a `className` to control container size and border-radius,
 * e.g. "size-5 rounded" (default), "size-8 rounded", "size-12 rounded-md".
 */
const LOGO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='%239ca3af'%3E%F0%9F%8F%A2%3C/text%3E%3C/svg%3E";

function handleLogoError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = LOGO_PLACEHOLDER;
}

export function BondLogo({
  src,
  logoCrop,
  className = "size-5 rounded",
}: {
  /** Missing (an unknown `logoIdx`) draws the placeholder rather than nothing. */
  src: string | undefined;
  logoCrop?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {/* Both stay plain <img>: `handleLogoError` swaps in a placeholder by
          reassigning `currentTarget.src`, an attribute `next/image` owns. The
          cropped variant additionally sits at percentage offsets against its
          own intrinsic size, which `fill` (inset-0 + 100%/100%) cannot express. */}
      {logoCrop ? (
        // eslint-disable-next-line @next/next/no-img-element -- see above
        <img
          alt=""
          className="absolute top-[-24.81%] left-[-92.5%] h-[149.62%] w-[285%] max-w-none"
          src={src || LOGO_PLACEHOLDER}
          onError={handleLogoError}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- see above
        <img
          alt=""
          className="pointer-events-none absolute inset-0 size-full rounded object-cover"
          src={src || LOGO_PLACEHOLDER}
          onError={handleLogoError}
        />
      )}
    </div>
  );
}

// ─── Shared bond-list primitives (used by GlobalBondTab + GlobalBondAllPage) ─

export function TopPickTag({ small }: { small?: boolean }) {
  const t = useT();
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded bg-[#fff7ed] whitespace-nowrap text-[#f54a00] ${
        small ? "px-1 py-0.5 text-micro leading-[18px]" : "px-1 py-0.5 text-xs leading-[20px]"
      }`}
    >
      {t.products.common.topPick}
    </span>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-start gap-3 text-sm leading-[24px]">
      <span className="flex-1 text-[#4a5565]">{label}</span>
      <span className="shrink-0 text-right whitespace-nowrap text-[#101828]">{value}</span>
    </div>
  );
}

export function FactsheetButton() {
  const t = useT();
  return (
    <Button
      variant="outline"
      size="xs"
      leftIcon={<FileTextIcon size={16} />}
      className="whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      {t.products.common.factsheet}
    </Button>
  );
}

/**
 * "สร้างคำสั่งซื้อ" — primary CTA. Behavior varies by call site:
 * - `fullWidth`: renders large button (accordion detail).
 * - `href`: opens URL in new tab and shows external-link icon.
 * - neither: compact table-row button that just stops propagation.
 */
export function InvestButton({ fullWidth, href }: { fullWidth?: boolean; href?: string }) {
  const t = useT();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (href) window.open(href, "_blank", "noopener,noreferrer");
  };
  if (fullWidth) {
    return (
      <Button variant="primary" size="xl" className="w-full max-w-[343px]" onClick={handleClick}>
        {t.products.common.createOrder}
      </Button>
    );
  }
  return (
    <Button
      variant="primary"
      size="xs"
      rightIcon={href ? <ArrowSquareOutIcon size={16} /> : undefined}
      className="whitespace-nowrap"
      onClick={handleClick}
    >
      {t.products.common.createOrder}
    </Button>
  );
}
