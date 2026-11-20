/**
 * Single source of truth for the customer table's columns. Both the header and
 * the body iterate this array, so a column is declared exactly once (label,
 * width, sort key, and cell renderer) instead of being hand-written twice.
 */

import { Avatar } from "@sarunyu/system-one";
import { maskName } from "@/lib/mask-name";
import {
  getInitials,
  formatThbAmount,
  formatPlYtdPct,
  LIABILITIES_MULTIPLIER,
  ASSET_CLASS,
} from "@/lib/client-utils";
import { getClientSliceAmount } from "./client-hub-data";
import type { ColumnId, SortKey } from "./types";
import type { Client } from "@/types/domain";

export type CustomerColumn = {
  id: ColumnId;
  label: string;
  width: number;
  sortKey: SortKey;
  /** If true, the column is always visible and cannot be hidden. */
  required?: boolean;
  /** Extra class on the header cell (most columns keep their label on one line). */
  headerClassName?: string;
  /** Cell body for a client; wrapped in <TableCell> by the table. */
  render: (client: Client, ctx: { isPrivate: boolean }) => React.ReactNode;
};

const NOWRAP = "whitespace-nowrap";

/** Standard right-aligned-value money cell. */
const money = (n: number) => (
  <p className="text-body font-semibold text-foreground">{formatThbAmount(n)}</p>
);

/** A column whose value is a client's amount in one allocation slice. */
const sliceColumn = (
  id: ColumnId,
  sortKey: SortKey,
  label: string,
  sliceLabel: string,
  width: number,
): CustomerColumn => ({
  id,
  label,
  width,
  sortKey,
  headerClassName: NOWRAP,
  render: (client) => money(getClientSliceAmount(client, sliceLabel)),
});

export const CUSTOMER_COLUMNS: CustomerColumn[] = [
  {
    id: "clientId",
    label: "Client ID",
    width: 100,
    sortKey: "id",
    required: true,
    headerClassName: NOWRAP,
    render: (client) => <p className="font-mono text-body-sm text-muted-foreground">{client.id}</p>,
  },
  {
    id: "client",
    label: "Client",
    width: 180,
    sortKey: "name",
    required: true,
    render: (client, { isPrivate }) => (
      <div className="flex items-center gap-3">
        <Avatar type="text" initials={getInitials(maskName(client.name, isPrivate))} size="s" />
        <p className="truncate text-body leading-tight font-semibold text-foreground">
          {maskName(client.name, isPrivate)}
        </p>
      </div>
    ),
  },
  {
    id: "aum",
    label: "AUM (THB)",
    width: 150,
    sortKey: "aum",
    render: (client) => money(client.aum),
  },
  sliceColumn("thaiStock", "thaiStock", "หุ้นไทย (บาท)", ASSET_CLASS.thaiStock, 150),
  sliceColumn("foreignStock", "foreignStock", "หุ้นต่างประเทศ (บาท)", ASSET_CLASS.foreignStock, 170),
  sliceColumn("derivatives", "derivatives", "TFEX (บาท)", ASSET_CLASS.derivatives, 140),
  sliceColumn("mutualFund", "mutualFund", "กองทุนรวม (บาท)", ASSET_CLASS.mutualFund, 150),
  sliceColumn("bond", "bond", "ตราสารหนี้ (บาท)", ASSET_CLASS.bond, 150),
  sliceColumn(
    "foreignBond",
    "foreignBond",
    "ตราสารหนี้ต่างประเทศ (บาท)",
    ASSET_CLASS.foreignBond,
    200,
  ),
  sliceColumn(
    "structuredBond",
    "structuredBond",
    "หุ้นกู้ที่มีอนุพันธ์แฝง (บาท)",
    ASSET_CLASS.structuredBond,
    210,
  ),
  {
    id: "cashIdle",
    label: "เงินสด (บาท)",
    width: 140,
    sortKey: "cashIdle",
    headerClassName: NOWRAP,
    render: (client) => money(client.aum * (client.cashIdlePct / 100)),
  },
  {
    id: "plYtd",
    label: "กำไร/ขาดทุน (บาท)",
    width: 150,
    sortKey: "plYtd",
    headerClassName: NOWRAP,
    render: (client) => (
      <p
        className={`text-body leading-tight font-semibold ${client.plYtdPct >= 0 ? "text-success" : "text-destructive"}`}
      >
        {formatPlYtdPct(client.plYtdPct)}
      </p>
    ),
  },
  {
    id: "liabilities",
    label: "Liabilities",
    width: 140,
    sortKey: "liabilities",
    headerClassName: NOWRAP,
    render: (client) => money(client.aum * LIABILITIES_MULTIPLIER),
  },
  // Nine Box column is parked for now. To bring it back, restore this entry and
  // re-import NineBoxCellPill from "./NineBoxTab":
  // {
  //   id: "nineBox",
  //   label: "Nine Box",
  //   width: 110,
  //   sortKey: "nineBox",
  //   headerClassName: NOWRAP,
  //   render: (client) => <NineBoxCellPill client={client} />,
  // },
];
