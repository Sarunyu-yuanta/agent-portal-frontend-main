"use client";

import { useState } from "react";
import { Button, Chip, Tag, TabGroup, Toaster } from "@sarunyu/system-one";
import { ClockCountdownIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { withQuery } from "@/lib/query-state";
import type { RiskAlert, RiskAlertCategory, RiskSeverity } from "@/types/domain";
import { CardHeader, RowIcon } from "./CardHeader";
import { RiskAlertDetail } from "./RiskAlertDetail";
import {
  deadlineDateLabel,
  deadlineToneClass,
  detectedAgoLabel,
  detectedAtLabel,
  RISK_ALERTS_PAGE,
  RISK_CATEGORY_META,
  RISK_CATEGORY_TABS,
  RISK_CTA_LABEL,
  RISK_SEVERITY_META,
  SEVERITY_ORDER,
} from "./risk-config";
import {
  countRiskByCategory,
  countRiskBySeverity,
  type RiskAlertRow,
} from "./risk-feed";
import { useRiskCta } from "./use-risk-cta";

/** The name this feature goes by, shared so the card heading and the sub page
 *  cannot drift apart. */
export const RISK_ALERTS_TITLE = "Proactive Compliance Alerts";

/**
 * What the book is exposed to right now: margin, suitability and market
 * conduct, in one ranked list.
 *
 * Distinct from the rail's `KycAlertsPanel` on purpose. That card answers
 * "whose paperwork lapses soon" — one subject, one deadline, one shape. This
 * answers "what could go wrong today", across four unrelated rule families, and
 * the findings it carries are things a desk acts on rather than files. No row
 * here is a KYC expiry; `RiskAlertKind` has no member for one, which is what
 * keeps the page from showing the same client twice for two reasons that are
 * really one.
 *
 * Full width in the work column and above the Next Best Actions card: an
 * obligation outranks a suggestion at eight in the morning, and that suggestion
 * card is still held behind a blur — a live, actionable list buried under a
 * placeholder reads as the page hiding its working half.
 *
 * The heading goes through `CardHeader` rather than a local copy of it, so this
 * card opens on the same line — and at the same size — as the Next Best Actions
 * and ภาพรวมสินทรัพย์ cards beside it. A private copy had drifted to `type-h6`
 * and rendered 18px against their 16px.
 */
export function RiskAlertsPanel({
  rows,
  onAcknowledge,
  category,
  onCategoryChange,
  severity,
  onSeverityChange,
}: {
  /** Pre-ranked by `buildRiskAlertRows`: worst first, which is the order the
   *  scrolling list below reads in. */
  rows: RiskAlertRow[];
  onAcknowledge: (alert: RiskAlert) => void;
  /** Which rule family the card is narrowed to — `"all"` is ทั้งหมด. Lives in
   *  the query string beside `severity`, for the same reason. */
  category: RiskAlertCategory | "all";
  onCategoryChange: (next: RiskAlertCategory | "all") => void;
  /** `null` is "ทั้งหมด". Held in the page's query string, not in this
   *  component, for the reason `query-state` gives: the dashboard layout never
   *  remounts, so a narrowed card survives a trip to a client and back. */
  severity: RiskSeverity | null;
  onSeverityChange: (next: RiskSeverity | null) => void;
}) {
  /** The finding whose panel is open. A row opens the alert, not the client —
   *  the row is clipped to a line, and what you wanted when you clicked was the
   *  rest of it plus the figures behind it. The client is a button further on. */
  const [detail, setDetail] = useState<RiskAlertRow | null>(null);

  /** The mocked action behind every CTA on this card — on the rows and in the
   *  sheet they open, from one definition. */
  const { act, toasts, removeToast } = useRiskCta();

  /** The link out carries both filters, so the page opens on the view the
   *  reader was already looking at rather than resetting it. Same param names
   *  the sub page reads — `withQuery` drops the `null`s, so an unnarrowed card
   *  still links to the bare path. */
  const seeAll = {
    href: withQuery(RISK_ALERTS_PAGE, "", {
      category: category === "all" ? null : category,
      severity,
    }),
    label: "ดูทั้งหมด",
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* No link out. The sub page no longer keeps an archive of
            acknowledged findings — it lists the same open rows this card
            does — so with nothing open there is nothing there to reach. */}
        <CardHeader title={RISK_ALERTS_TITLE} />
        <EmptyState
          icon={
            <ShieldCheckIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title="ไม่มีรายการความเสี่ยงค้างอยู่"
          body="ระบบจะแจ้งเตือนทันทีเมื่อพบความเสี่ยงด้านมาร์จิ้น ความเหมาะสมของการลงทุน หรือพฤติกรรมการซื้อขาย"
        />
      </div>
    );
  }

  /** Family counts come off the *whole* list — a tab has to keep saying how
   *  many conduct findings there are while you are reading the margin ones, or
   *  picking one would blank out the other three. */
  const categoryCounts = countRiskByCategory(rows);
  /** Severity counts follow the chosen family, so the chips under the tabs
   *  describe the list the reader is actually looking at. The same arrangement
   *  the sub page uses, and the reason the tabs sit above the chips: family is
   *  the coarser cut, severity refines inside it. */
  const inCategory =
    category === "all"
      ? rows
      : rows.filter((row) => row.alert.category === category);
  const counts = countRiskBySeverity(inCategory);
  const visible = severity
    ? inCategory.filter((row) => row.alert.severity === severity)
    : inCategory;

  return (
    <div className="flex flex-col gap-4">
      {/* No count beside the title. The strip directly under it already opens
          with "ทั้งหมด N" and then breaks that N down by severity, so a badge
          on the heading was the same figure stated twice, an inch apart — and
          the one that said less of the two, since it could only give a total
          where the strip gives the total *and* what it is made of. */}
      <CardHeader title={RISK_ALERTS_TITLE} link={seeAll} />

      {/* Family first, level second — the pair the sub page carries, in the
          same order. The tabs answer "what kind of exposure is this", which is
          the coarser question, and the chips under them then say how bad the
          findings inside that family are. */}
      <RiskCategoryTabs
        counts={categoryCounts}
        total={rows.length}
        value={category}
        onChange={onCategoryChange}
      />

      <RiskSeverityStrip
        counts={counts}
        total={inCategory.length}
        value={severity}
        onChange={onSeverityChange}
      />

      {visible.length === 0 ? (
        /* Reachable by picking a family with nothing open in it, or by
           acknowledging every finding at one severity — either way a result
           worth stating rather than showing an empty box. */
        <EmptyState
          icon={
            <ShieldCheckIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title={
            severity ? "ไม่มีรายการในระดับนี้" : "ไม่มีรายการในหมวดนี้"
          }
          body="เลือก “ทั้งหมด” เพื่อดูรายการความเสี่ยงอื่น"
        />
      ) : (
        /* One surface with rules inside it, matching the Call Log and KYC
           cards: the fill and the radius belong to the list, a row only
           hovers.

           **Every finding, behind a scroll** — no inline cut and no "ดูอีก N
           รายการ" row. The cut was costing the card the thing it is for: with
           five rows shown and twelve hidden, a desk could not tell whether the
           quiet two thirds held anything worth a look without leaving for the
           sub page. A scroll answers that in a flick, and the rows it reveals
           are the same rows with the same button, so nothing is lost by not
           going.

           `max-h`, not a fixed height, so a filter that leaves two rows draws
           a two-row card rather than a box of whitespace. The value is five
           rows plus a sliver: an exactly-5-row window looks like the end of
           the list, and the half row showing under the fold is what says there
           is more. "ดูทั้งหมด" in the header still goes to the page — that is
           where the acknowledged archive lives, which this list never shows. */
        <div className="max-h-[560px] overflow-y-auto rounded-2xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
          {visible.map((row) => (
            <RiskAlertRowItem
              key={row.alert.id}
              row={row}
              onOpen={() => setDetail(row)}
              onAct={act}
            />
          ))}
        </div>
      )}

      {/* Fixed-position, so it does not matter that it is declared inside a
          card halfway down the column — same placement `MiniCalendar` uses. */}
      <Toaster items={toasts} onRemove={removeToast} />

      <RiskAlertDetail
        row={detail}
        onAct={act}
        onClose={() => setDetail(null)}
        onAcknowledge={(alert) => {
          setDetail(null);
          onAcknowledge(alert);
        }}
      />
    </div>
  );
}

/**
 * Which rule family, as a tab strip with per-family counts.
 *
 * Lives here rather than on the sub page that first had it, so the card and
 * the page offer the same five tabs with the same numbers — the argument
 * {@link RiskSeverityStrip} already makes for the row below it.
 *
 * Tabs rather than a second row of chips: family and severity are different
 * questions, and two identical chip rows stacked read as one long filter bar
 * where the reader has to work out which half does what. A tab strip is also
 * what the reader meets on the page this card links into, so the handoff
 * keeps its shape.
 *
 * Three classes, all working around `system-one`'s unlayered stylesheet:
 * `scrollable-tabs` keeps five Thai labels from truncating and lets them swipe
 * on a phone; `transparent-tabs` cancels the `bg-background` the component
 * paints over whatever surface it sits on; `count-tabs` repaints the
 * `notification` badge from the library's always-red to a quiet grey pill —
 * red here would say every category is on fire.
 */
export function RiskCategoryTabs({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Record<RiskAlertCategory, number>;
  /** The "ทั้งหมด" figure. Passed rather than summed, for the same reason the
   *  severity strip takes one: it has to stay the number the surface around it
   *  is counting. */
  total: number;
  value: RiskAlertCategory | "all";
  onChange: (next: RiskAlertCategory | "all") => void;
}) {
  return (
    <div className="scrollable-tabs transparent-tabs count-tabs">
      <TabGroup
        items={RISK_CATEGORY_TABS.map((tab) => ({
          id: tab.id,
          title: tab.title,
          // `|| undefined` so a family with nothing open shows no badge at all
          // rather than a "0" the eye has to read and discard.
          notification:
            (tab.id === "all" ? total : counts[tab.id]) || undefined,
        }))}
        activeId={value}
        size="md"
        onChange={(id) => onChange(id as RiskAlertCategory | "all")}
      />
    </div>
  );
}

/**
 * How many of each severity are open, as a row of clickable counts.
 *
 * Earns its place because the list below it is cut: without this the card can
 * say "there are eleven" and not "two of them are critical", which is the only
 * part of the eleven that changes what happens next. Each count links into the
 * page pre-filtered to that severity, so the strip is a way in rather than a
 * read-out — and being `<Link>`s they keep ⌘-click, the reason
 * `CARD_LINK_CLASS` exists at all.
 *
 * `flex flex-wrap`, never `grid grid-cols-1 sm:grid-cols-3`: `system-one` ships
 * an unlayered `.grid-cols-1` that wins the source-order tie against a
 * responsive Tailwind `grid-cols-*`, which is the whole reason the Command
 * Center injects `DASHBOARD_RAIL_CSS`. Flex has nothing to collide with.
 *
 * Design-system `Chip`s rather than a grid of bordered count-boxes: this card
 * sits one row under `StatTiles`, and three bordered boxes directly below
 * three bordered tiles read as one six-tile block.
 */
export function RiskSeverityStrip({
  counts,
  total,
  value,
  onChange,
}: {
  counts: Record<RiskSeverity, number>;
  /** The "ทั้งหมด" figure. Passed rather than summed, so it stays the same
   *  number the heading beside it is counting. */
  total: number;
  /** `null` is "ทั้งหมด" — the same shape the sub page's filter uses. */
  value: RiskSeverity | null;
  onChange: (next: RiskSeverity | null) => void;
}) {
  const cells: { id: RiskSeverity | null; label: string; n: number }[] = [
    { id: null, label: "ทั้งหมด", n: total },
    ...SEVERITY_ORDER.map((id) => ({
      id,
      label: RISK_SEVERITY_META[id].label,
      n: counts[id],
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {cells.map((cell) => {
        const selected = cell.id === value;

        return (
          <Chip
            key={cell.id ?? "all"}
            type="single"
            size="small"
            label={`${cell.label} ${cell.n}`}
            selected={selected}
            disabled={cell.n === 0 && !selected}
            aria-label={`${cell.label} ${cell.n} รายการ`}
            onClick={() => onChange(selected ? null : cell.id)}
          />
        );
      })}
    </div>
  );
}

/**
 * One finding, as a row.
 *
 * Exported because the sub page draws the same rows rather than a table — the
 * precedent `next-best-actions/page.tsx` set for this folder. One definition
 * means the card and the page cannot disagree about what an alert looks like.
 *
 * The tinted square carries **severity**, not category: in a triage list the
 * loudest mark on the row should say how bad a thing is. Which family it
 * belongs to is carried by the glyph's shape and said in words below.
 *
 * No client avatar. `RowIcon`'s own docstring warns that a circle reads as an
 * avatar, and more to the point `clientId` is nullable — a book-level sanctions
 * row would leave an empty column. The name lives in the muted run, where a
 * missing one degrades into a scope word instead of a gap.
 */
export function RiskAlertRowItem({
  row,
  onOpen,
  onAct,
}: {
  row: RiskAlertRow;
  onOpen: () => void;
  /** Fires the row's one action without opening it — see `useRiskCta`. */
  onAct: (row: RiskAlertRow) => void;
}) {
  const { alert, acknowledged } = row;
  const severity = RISK_SEVERITY_META[alert.severity];
  const category = RISK_CATEGORY_META[alert.category];
  const CategoryIcon = category.Icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-[var(--fill-p1-100)] ${
        acknowledged ? "opacity-60" : ""
      }`}
    >
      <RowIcon tone={severity.pill}>
        <CategoryIcon size={18} weight="duotone" />
      </RowIcon>

      {/* Two lines, each a left half and a right half — so the row reads as a
          small 2×2 rather than as a stack with things hung off it:

              who + how bad          │   since when
              what + where           │   by when

          Both times live on the right, which is where they are looked for, but
          on *fixed lines* rather than stacked in one box. That stacking is what
          made the column unreadable: with no deadline the detection time rode
          up to the first line, with one it sat on the second, so neither figure
          was ever in the same place twice and the eye had to identify each one
          before it could use it. Pinned to a line apiece they can be read
          straight down the card, and a row with no deadline leaves a gap where
          the answer would have been instead of shuffling the other figure into
          its place.

          The deadline takes the lower line even though it outranks the stamp
          above it. Reading a row ends at the bottom-right — it is the last
          thing seen before moving to the next finding, and the one worth
          leaving with. Weight carries the ranking instead of position: bold and
          in the severity's colour, against muted grey. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Line one: **who**, how bad — and, hard right, since when. */}
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <p className="truncate text-body font-bold text-foreground">
            {row.displayName}
          </p>
          {/* `shrink-0` on the `Tag` itself, not on a wrapper. A wrapper
              `<span>` is `display: block`, so the `inline-flex` Tag inside it
              sat on that block's *baseline* rather than being centred — two
              pixels low against the name, which `items-center` on the row could
              not fix, because it was centring the wrapper and the wrapper was
              already centred. As a direct flex item the Tag centres itself. */}
          {acknowledged ? (
            <Tag
              text="รับทราบแล้ว"
              variant="gray"
              size="small"
              className="shrink-0"
            />
          ) : (
            <Tag
              text={severity.label}
              variant={severity.variant}
              size="small"
              className="shrink-0"
            />
          )}
          </div>

          {/* **Since when** — the quiet one, up beside the name where a list
              expects to find a timestamp, and left there on every row whether
              or not a deadline follows below it. */}
          <span
            suppressHydrationWarning
            title={detectedAtLabel(alert.detectedAt, new Date())}
            className="shrink-0 text-label tabular-nums text-muted-foreground"
          >
            {detectedAgoLabel(alert.detectedAt, new Date())}
          </span>
        </div>

        {/* Line two: **what** and where, the full width of the row. The
            finding keeps `text-foreground` rather than dropping to muted —
            demoted from the headline, but still the sentence the row is about,
            where the category and the account behind it are context. One run,
            so `truncate` drops them right-to-left: exactly the order they
            matter least in. */}
        <p className="min-w-0 truncate text-label text-foreground" title={alert.title}>
          {alert.title}
          <span className="text-muted-foreground">
            {` · ${category.label}`}
            {alert.accountLabel && ` · ${alert.accountLabel}`}
          </span>
        </p>

        {/* Line three: what to do about it, and **by when** — one pair, on one
            line.

            Flush left, under the finding it belongs to. Every row's button
            then starts at the same x as the name and the sentence above it, so
            the control is in one place down the whole list rather than
            wherever that row's label length happened to leave it — and the
            eye, having read left-to-right across line two, does not have to
            travel back out to the right margin to act.

            The deadline rides immediately beside the button rather than on the
            line above, because the two are one sentence: *due today →
            therefore ring them*. Split across lines they were two separate
            right-aligned things the reader had to join back up.

            It also buys line two its full width back — the Margin Call row had
            been losing its account number to truncation to make room for a
            deadline it did not need to share a line with.

            Not the tick this row used to carry. That one *disposed* of a
            finding — acknowledging a compliance alert from a list you are
            skimming is exactly the reflex to design against, and it still
            lives behind the detail panel where the figures and the rule are.
            This one *starts* the work the finding is asking for: ring the
            client, or hand it to Compliance. Getting that wrong costs a phone
            call; getting the other one wrong closes a margin call nobody
            looked at.

            `primary`, the same variant the detail panel's footer wears: a list
            whose only filled control is the one that starts the work is a list
            that says what to do with it. The severities keep their own voice —
            tints behind a glyph and inside a small Tag, never solid blue — so
            the two read as different registers rather than competing.

            `stopPropagation` because the row around it is itself a button: a
            click here must not also open the sheet behind the toast. */}
        {/* `mt-2` on top of the column's `gap-1`. The action is a different
            kind of thing from the two lines of reading above it, and at the
            4px the column gives everything it looked like a third line of the
            same sentence. The extra space is what separates "here is the
            finding" from "here is what you do". */}
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            aria-label={`${RISK_CTA_LABEL} — ${row.displayName}`}
            onClick={(e) => {
              e.stopPropagation();
              onAct(row);
            }}
          >
            {RISK_CTA_LABEL}
          </Button>
          {/* The deadline closes the row, wedged into its bottom-right corner
              — the corner being where a row is left, and a filled shape being
              what stops it reading as a third line of text after the finding
              above it.

              `translate-*`, not negative margins, to reach past the row's
              `p-3`. A margin would take those twelve pixels out of the row's
              height, so every row carrying a deadline would come out shorter
              than its neighbours; a transform moves the painted box and leaves
              the layout alone. It also keeps the pill a real flex item, so the
              button can never grow under it the way it could if this were
              positioned absolutely.

              Square but for the top-left: the two edges that meet the row's
              own edges stay flat, which is what makes it read as set into the
              corner rather than floating near it.

              The tint is `deadlineToneClass`'s business and answers *how
              close*, not how bad: red for today, amber for everything else,
              whatever the finding's severity is. The countdown glyph rides
              inside it, marking the figure as a deadline rather than another
              timestamp. */}
          {alert.daysLeft !== null && (
            <span
              /* `h-7` — the `sm` Button's own height to the pixel. Left to
                 its padding the pill came out 30px against the button's 28
                 and quietly made every row with a deadline two pixels deeper
                 than the rest. */
              className={`inline-flex h-7 min-w-0 shrink translate-x-3 translate-y-3 items-center gap-1 truncate rounded-tl-xl px-3 text-label font-bold ${deadlineToneClass(
                alert.daysLeft,
              )}`}
            >
              <ClockCountdownIcon size={13} weight="bold" className="shrink-0" />
              {deadlineDateLabel(alert.daysLeft, alert.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
