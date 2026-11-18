"use client";

import Link from "next/link";
import { Alert, Button, Tag } from "@sarunyu/system-one";
import { CaretRightIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { ContactChips } from "../calendar/HolderContact";
import type { RiskAlert } from "@/types/domain";
import {
  deadlineLabel,
  detectedAtLabel,
  dueDayLabel,
  RISK_CATEGORY_META,
  RISK_CTA_LABEL,
  RISK_SEVERITY_META,
} from "./risk-config";
import type { RiskAlertRow } from "./risk-feed";

/**
 * The shell every block of *information* in this panel wears — the prose
 * detail and each triggering figure.
 *
 * One constant rather than the same three classes written at each site: the
 * card heading in `RiskAlertsPanel` had already drifted a size away from its
 * neighbours by being hand-rolled instead of shared, and two boxes an inch
 * apart disagreeing about their border is the same mistake at a smaller scale.
 *
 * `border-black/[0.05]`, not `border-border` (0.1): these only need to be told
 * apart from each other, and a hairline is enough for that. 0.05 is also
 * exactly what the row lists rule themselves with (`divide-black/[0.05]`), so
 * the feature carries one hairline weight rather than two.
 */
const INFO_BOX =
  "rounded-xl border border-black/[0.05] bg-[var(--bg-default-secondary)]";

/**
 * One finding, in full: what it is, the figures that triggered it, and what to
 * do about it.
 *
 * Three questions in that order, because that is the order they get asked. The
 * list can only ever carry the first, clipped to a line.
 *
 * A `ResponsiveBottomSheetModal` because every row-click on the Command Center
 * already opens one — the call record, the KYC sheet, a holder's contact card —
 * and a risk row opening a different kind of surface would be the only one that
 * did. `DetailDrawer` is the idiom for a *section* page whose whole job is the
 * list, and a non-modal right-hand drawer opened from a card halfway down a
 * scrolling column reads as a panel belonging to nothing.
 *
 * No two-pane sliding track. `KycAlertsPanel` has one because its sheet is a
 * *list* that drills into a contact — two levels in one surface. This opens on
 * one alert; there is nothing to come back to, so the contact rows go inline,
 * the way the call record does.
 */
export function RiskAlertDetail({
  row,
  onClose,
  onAct,
  onAcknowledge,
}: {
  row: RiskAlertRow | null;
  onClose: () => void;
  /** The finding's one action — mocked, see `useRiskCta`. The same handler the
   *  list rows behind this sheet are wired to, so pressing it here and
   *  pressing it there cannot come to mean different things. */
  onAct: (row: RiskAlertRow) => void;
  onAcknowledge: (alert: RiskAlert) => void;
}) {
  if (!row) return null;

  const { alert } = row;
  /** Whether this panel may tell the reader how to reach the client at all —
   *  see `RiskAlert.contactAllowed`, which is `false` wherever asking would be
   *  tipping-off. */
  const showContact = Boolean(alert.clientId) && alert.contactAllowed;
  /** What the footer can offer. The CTA is always there, so the strip is never
   *  empty; what varies is whether "รับทราบ" sits beside it.
   *
   *  There is no "นำกลับเข้ารายการ" any more. It existed for a finding opened
   *  out of the sub page's acknowledged archive, and that archive is gone — no
   *  surface lists an acknowledged row, so nothing could ever open one to press
   *  it. `useRiskAlertRows` still exports `unacknowledge`, so putting the undo
   *  back (in this footer, or as an action on the confirming toast) is a small
   *  change rather than a rewrite. */
  const canAcknowledge = alert.dismissible && !row.acknowledged;

  const severity = RISK_SEVERITY_META[alert.severity];
  const category = RISK_CATEGORY_META[alert.category];
  const CategoryIcon = category.Icon;
  const SeverityIcon = severity.Icon;

  return (
    <ResponsiveBottomSheetModal
      open
      onClose={onClose}
      title="รายละเอียดความเสี่ยง"
      titleId="risk-alert-detail"
      desktopMaxWidth="max-w-[560px]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {/* The square takes the **severity** tint, the same one the row the
            reader just clicked was wearing.

            It used to take the category's hue, on the argument that a severity
            Tag sits an inch below so the colour was free to mean the other
            thing. In practice that made one finding two colours: a critical
            wash-trade was a red square in the list and an amber one here, so
            the thing changed appearance on the way in — and amber chrome around
            a วิกฤต alert quietly argues it is less than it is. One rule
            instead: colour is severity, everywhere. The family is carried by
            the glyph and said in words by the grey Tag. */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${severity.pill}`}
          >
            <CategoryIcon size={20} weight="duotone" />
          </span>
          {/* Three lines, not four, and **when** pulled out to the right.
              Stacked flush left the header was four runs of decreasing
              importance carrying equal visual weight, and the family was stated
              twice over — once by the glyph in the square, again by a grey Tag
              below it.

              The time goes hard right because that is where this feature
              already keeps it: every row in the list behind this panel carries
              its age in the same corner. The severity stays beside the name,
              for the same reason — the row the reader just clicked had them
              adjacent, and the panel should not rearrange the two facts they
              used to pick it.

              Everything left over is reference rather than reading — family,
              account, which rule — and collapses into one muted run at the
              bottom, rule number last, since that is the thing a reader looks
              *up* rather than reads. */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              {/* `font-bold!`, with the bang: `.type-body-1` sets its own
                  `font-weight` from a stylesheet that loads after
                  `globals.css`, so a plain Tailwind weight ties on specificity
                  and loses — this line rendered at 400 beside a 400 title until
                  it was flagged. Same trap `tier-badge` documents. */}
              {/* The name *is* the way to the client, rather than a button in
                  the footer repeating it. It is the first thing read here, and
                  "click the person to go to the person" needs no label — which
                  leaves the footer for things done *to the alert* rather than
                  navigation away from it.

                  The caret is the affordance. A bold heading gives no hint it
                  can be pressed, and colour alone would not survive a reader
                  who does not see it; this is the same drill-in mark the card's
                  "ดูอีก N รายการ" row wears. */}
              {alert.clientId ? (
                /* A quiet second path, not the advertised one. Clicking a
                   person's name to open them is strong enough convention that
                   it is worth honouring for whoever tries it, but a bold
                   heading announces nothing — so the discoverable control is
                   the labelled link below, and this one carries no caret and no
                   colour of its own. Hover is the whole hint, which is exactly
                   the weight a bonus path should have. */
                <Link
                  href={`/client/${alert.clientId}`}
                  title="ดูโปรไฟล์ลูกค้า"
                  className="type-body-1 min-w-0 truncate font-bold! leading-snug text-foreground no-underline transition-colors hover:text-primary-action"
                >
                  {row.displayName}
                </Link>
              ) : (
                /* No client to go to — the sanctions screen that matched a name
                   before anyone could confirm whose it was. */
                <p className="type-body-1 min-w-0 truncate font-bold! leading-snug text-foreground">
                  {row.displayName}
                </p>
              )}
              {/* `shrink-0` on the Tag itself. A wrapper `<span>` is
                  `display: block`, and the `inline-flex` Tag inside one sits on
                  that block's baseline instead of centring — the two-pixel drop
                  the list rows had to be fixed for. */}
              <Tag
                text={severity.label}
                variant={severity.variant}
                size="small"
                className="shrink-0"
              />
              {/* The spacer `CardHeader` uses, rather than `justify-between`:
                  the name and the Tag belong together on the left, and only the
                  time is pushed away from them. */}
              <span className="flex-1" />
              {/* The stamp, not the elapsed figure the rows carry. A list is
                  read for staleness; a compliance record is read for when, and
                  this panel is the record. */}
              <span className="shrink-0 text-meta tabular-nums text-muted-foreground">
                {detectedAtLabel(alert.detectedAt, new Date())}
              </span>
            </div>

            <p className="type-body-2 leading-snug text-foreground">
              {alert.title}
            </p>

            {/* Raw `text-meta` rather than `.type-caption`, which sets its own
                `font-weight` from a stylesheet loading after `globals.css` — the
                same trap, sidestepped rather than fought with a trailing `!`. */}
            {/* All that is left of the reference line is the way to the client.
                The family, the rule code and the account went with it — the
                family was said three times over already (the glyph, the row
                behind this panel, the filter the reader came through), the rule
                number is a key for looking a rule up rather than something read
                at a glance, and the account is on the row too. Between them
                they turned the one line carrying an action into a run it had to
                be fished out of.

                No `<p>` wrapper now that nothing shares the line: the link
                brings its own size and colour, and a muted 11px paragraph
                around a 12px blue link only existed to style the text beside
                it. `self-start` because a flex column stretches its children,
                and a link as wide as the panel has a click target reaching far
                past its own words.

                The name above links too, but a bold heading gives no sign it
                can be pressed; an affordance only the curious find is not an
                affordance, which is why this one is labelled. */}
            {alert.clientId && (
              <Link
                href={`/client/${alert.clientId}`}
                className="inline-flex w-fit items-center gap-0.5 self-start text-label font-semibold text-primary-action no-underline hover:underline"
              >
                ดูโปรไฟล์ลูกค้า
                <CaretRightIcon size={12} weight="bold" />
              </Link>
            )}
          </div>
        </div>

        {/* The deadline, when the rule carries one. A full-width tinted band
            rather than a pill: this is the sentence that decides whether the
            sheet gets acted on now or filed. */}
        {alert.daysLeft !== null && (
          <div
            /* `w-fit self-start` — a flex column stretches its children, so this
               ran the width of the panel with four words in it and most of a red
               field saying nothing. Sized to its sentence it reads as a stamp on
               the finding rather than a banner across it. */
            className={`flex w-fit items-center gap-2 self-start rounded-xl px-3 py-2.5 ${severity.bar}`}
          >
            <SeverityIcon size={16} weight="fill" className="shrink-0" />
            {/* The countdown leads here and the date trails it, the opposite
                of the row's `deadlineDateLabel`. A list is scanned for dates;
                an opened sheet has already been chosen, and what it owes the
                reader first is the verdict — then the day to write down. */}
            <p className="type-body-2 font-semibold">
              {deadlineLabel(alert.daysLeft)}
              {alert.dueDate && ` · ${dueDayLabel(alert.dueDate)}`}
            </p>
          </div>
        )}

        <Section title="รายละเอียด">
          <div className={`${INFO_BOX} p-4`}>
            <p className="type-body-2 leading-relaxed text-foreground">
              {alert.message}
            </p>
          </div>
        </Section>

        {alert.metrics.length > 0 && (
          <Section title="ตัวเลขที่ทำให้เกิดการแจ้งเตือน">
            {/* Four separate cards, not one block ruled into quarters. Each
                figure is an independent reading taken by the same rule, and
                hairlines between them implied a table — rows and columns that
                meant something, which they never did: "อัตราหลักประกัน" and
                "เกณฑ์รักษา" share a row only because they were authored in that
                order.

                `flex`, not `grid-cols-1 sm:grid-cols-2`: `@sarunyu/system-one`
                ships an unlayered `.grid-cols-1` that loads after `globals.css`
                and takes the source-order tie, so the responsive utility never
                applies. Flex has nothing to collide with.

                `grow` + `basis`, not `flex-1`: `flex-1` is `flex: 1 1 0%` and
                would set the basis itself, leaving two classes fighting over
                `flex-basis` on equal specificity. Two per row from `sm`, and an
                odd last one stretches rather than leaving a half-width stub.
                `0.25rem` is half of `gap-2`. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {alert.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`${INFO_BOX} flex grow flex-col gap-1 px-3 py-2.5 sm:basis-[calc(50%-0.25rem)]`}
                >
                  <p className="text-meta text-muted-foreground">{metric.label}</p>
                  <p
                    className={`tabular-nums font-bold text-foreground ${
                      metric.emphasis ? "text-title-sm" : "text-body"
                    }`}
                  >
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* `recommendedAction` is deliberately *not* drawn. It briefly had a
            "สิ่งที่ควรทำต่อไป" box here and it earned nothing: the panel
            already states the rule, the figures that tripped it and the
            deadline, and the footer's button names the one action in two
            words. A paragraph restating that in prose is a second place for
            the same instruction to be read — and the first to go stale if the
            button's wording and the fixture's sentence ever disagree. The
            field stays on the record for a backend that may want it. */}

        {/* Why the contact button is missing. Said out loud rather than left to
            a disabled control: "ห้ามถาม" is a rule an IC has to know, and an
            absent button teaches nothing.

            Kept at `warning` rather than `critical`: this is a rule about
            handling, not a second opinion on how bad the finding is, and the
            finding's own severity is already stated in red at the top. */}
        {!alert.contactAllowed && alert.contactNote && (
          <Alert
            status="warning"
            title="ข้อจำกัดในการติดต่อ"
            message={alert.contactNote}
            multiline
          />
        )}

        {/* Shown outright, not behind a "ติดต่อลูกค้า" button.
            Three pills on one line cost a fraction of what the stacked
            copy-rows did, which is what made revealing them worth a click in
            the first place; at this size, hiding them only means every reader
            who wants a number pays an extra press to be told what the panel
            already had room to say.

            Still gated on `contactAllowed`. This block and the tipping-off
            warning above it are the two halves of one answer and never both
            appear: either here is how to reach them, or here is why you may
            not. */}
        {showContact && alert.clientId && (
          <Section title="ช่องทางติดต่อ">
            <ContactChips clientId={alert.clientId} />
          </Section>
        )}
      </div>

      {/* Do the thing, or file the row — in that order, left to right.

          The CTA takes `primary` and the right-hand end, and acknowledgement
          drops to `outline` beside it. It used to be the other way round, from
          when clearing the row was the only thing this footer could do; with a
          real action present, making "รับทราบ" the emphasised one would put
          the weight on dismissing a finding rather than on working it.

          "ยกเลิก" is gone. Its job was to stop a lone `primary` from reading as
          the only way out, and a bordered pair already does that — where three
          buttons would make the reader pick between two greys to find the one
          that just closes the sheet, which the X in the header does.

          No icon on acknowledgement, a glyph on the CTA: the two-word Thai
          label says exactly what "รับทราบ" does, while the CTA's icon is the
          thing that distinguishes a phone call from a referral at a glance —
          the same mark the list rows carry. */}
      {/* No rule above it. A divider is what you draw when a footer is pinned
          and the content scrolls *under* it — this sheet is short enough that
          the line mostly landed in open space, boxing off two buttons from the
          panel they belong to. `pt-1` against the content's own `py-4` keeps
          them from crowding the block above without a border to do it. */}
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-4 pb-4 pt-1">
        {/* `xl`, the top of the scale, where the list rows wear `sm`. A row's
            button is one of five on a card and has to sit inside 108px; this
            one is the single thing the sheet was opened to press, with a whole
            footer to itself. Both buttons take the same size — a shorter
            "รับทราบ" beside a tall CTA reads as a disabled control rather than
            the alternative it is. */}
        {canAcknowledge && (
          <Button variant="outline" size="xl" onClick={() => onAcknowledge(alert)}>
            รับทราบ
          </Button>
        )}
        <Button variant="primary" size="xl" onClick={() => onAct(row)}>
          {RISK_CTA_LABEL}
        </Button>
      </div>
    </ResponsiveBottomSheetModal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-meta font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
