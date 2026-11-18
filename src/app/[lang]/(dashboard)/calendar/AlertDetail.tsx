"use client";

import { Avatar } from "@sarunyu/system-one";
import { useState } from "react";
import { CaretRightIcon, LightningIcon, XIcon } from "@phosphor-icons/react";
import { SlideSteps } from "@/components/ui/slide-steps";
import { usePrivacy } from "@/contexts/privacy-context";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { dayLabel, weekdayLabel } from "./calendar-grid";
import type { DayItem } from "./day-items";
import { HolderContact } from "./HolderContact";
import { itemBadge } from "./source-badge";

/**
 * What a desk event opens into.
 *
 * Read-only, because nothing here is the user's to edit — the desk scheduled
 * the seminar, but its date and its invitee list arrive with the event rather
 * than being written on this screen. What it offers that a note doesn't is the
 * part that matters for an event: the people, spelled out. In the day list they
 * are an avatar stack, which answers "roughly who" in the space of three
 * circles; the point of opening one is to get from "roughly who" to a list you
 * can work down.
 *
 * **Corporate actions no longer come here.** They open the exchange's record
 * sheet instead — see `AlertOverlay`, which routes — because an XD is a fact
 * about a company and a list of the people who happen to hold it is not part of
 * that record.
 *
 * Two states, not two surfaces: the list, and one person's contact details
 * (`HolderContact`). Both live in whatever shell the caller opened — a modal on
 * a pointer device, a sheet on a phone — so Back returns to the event rather
 * than to the page.
 *
 * Names go through `maskName`, the way every other client name in the app does
 * when privacy mode is on. A list of full names is a much louder leak than the
 * initials on an avatar, so this is the one place in the Calendar where the
 * setting has to be honoured.
 */
export function AlertDetail({
  item,
  day,
  clients,
  onClose,
  variant = "modal",
  showHolders = true,
}: {
  item: DayItem;
  day: Date;
  clients: { id: string; name: string }[];
  onClose: () => void;
  /** `sheet` drops the close button — the sheet has its own handle and backdrop. */
  variant?: "modal" | "sheet";
  /**
   * Off when the panel is opened from inside one client's own profile.
   *
   * The list is the reason this panel exists on the Calendar — an alert there is
   * a fact about a security, and "who does this land on" is the question you
   * open it to answer. On a client's page that question is already answered by
   * the page, and re-answering it with a list you're standing in the middle of
   * is a way of asking which of these three people you meant. With it gone the
   * panel says the one thing the row didn't: what the event actually is.
   */
  showHolders?: boolean;
}) {
  const { isPrivate } = usePrivacy();
  const isSheet = variant === "sheet";
  const badge = itemBadge(item);

  const holders = item.clientIds.map((id) => ({
    id,
    name: maskName(clients.find((c) => c.id === id)?.name ?? id, isPrivate),
  }));

  /**
   * Which holder's contact details are open, if any — the panel's second state.
   *
   * A state inside this component rather than another entry in `CalendarView`'s
   * modal bookkeeping: it is a drill-in, not a different surface, and Back has
   * to land you exactly where you were. Held here, that is one `setState`.
   *
   * `shown` is the holder the contact pane is *rendering*, which is not the same
   * question. Both panes stay mounted so the two can slide past each other, so
   * on the way back the pane still needs someone to be about for the ~200ms it
   * takes to leave — `contactId` goes null immediately, `shown` doesn't.
   */
  const [contactId, setContactId] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  const contact = holders.find((h) => h.id === shown);
  const atContact = contactId !== null;

  const listPane = (
    <div className="flex w-full flex-col">
      {/* First thing in the panel, said in words rather than left to the
          coloured circle to imply. Everything else the Calendar opens is the
          user's own writing, so the default reading of a panel here is
          "something I made" — and that framing has to be corrected before the
          content is read, not after.

          Two provenances now, not one. "The system raised this" was true when
          the only non-note row was a dividend alert; a seminar is something a
          human on the desk put up, and calling that automatic would be the same
          mistake pointing the other way.

          The band takes the row's own tint rather than a fixed orange, for the
          reason `source-badge` gives: the palette is resolved from a taxonomy
          code the frontend doesn't own, so it cannot be a class. No bottom rule
          — a tinted band is already its own edge. */}
      <p
        style={badge.style}
        className={`flex shrink-0 items-center gap-1.5 px-4 py-2 type-caption ${badge.className}`}
      >
        <LightningIcon size={13} weight="fill" className="shrink-0" />
        {item.source === "corporate-action"
          ? "Published by the exchange"
          : "Added by the desk"}
      </p>

      {/* No rule between this and the detail line below: the two are one
          statement — what the event is, then what it amounts to — and a divider
          across them reads as a change of subject. The rule stays above the
          holders, which genuinely is one. Padding closes up to match, so the
          block hangs together on spacing instead. */}
      <header
        className={`flex shrink-0 items-start gap-3 px-4 ${isSheet ? "pt-3" : "pt-4"} ${
          item.detail ? "pb-2" : "pb-4"
        }`}
      >
        {/* The row's own circle, read from the shared lookup rather than
            restated here — the copy that used to live in this file is how the
            panel stayed green after the list turned orange. */}
        <span
          role="img"
          aria-label={badge.label}
          style={badge.style}
          className={`flex size-9 shrink-0 items-center justify-center rounded-full ${badge.className}`}
        >
          {badge.icon}
        </span>
        <div className="min-w-0 flex-1">
          {/* `font-bold!`, not `font-bold`: `.type-body-1` in
              `@sarunyu/system-one` sets `font-weight` itself, and its stylesheet
              loads after `globals.css` — a plain Tailwind weight ties on
              specificity and loses, so the title rendered at 400 no matter what
              was asked for. Same cascade trap as `SELECTED_ROW` in
              `NotesSidebarList`. */}
          <p className="type-body-1 font-bold! text-foreground">{item.title}</p>
          <p className="type-caption text-muted-foreground">
            {weekdayLabel(day)}, {dayLabel(day)}
          </p>
        </div>
        {!isSheet && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
          >
            <XIcon size={16} />
          </button>
        )}
      </header>

      {item.detail && (
        // Indented to the header's text column, not to the panel edge — it
        // continues the title rather than starting a new block. `pt-2` on top of
        // the header's own `pb-2`: enough air to read as its own sentence, still
        // closer to the date above it than to the rule below.
        <p className="shrink-0 pb-4 pl-16 pr-4 pt-2 type-body-2 text-foreground">
          {item.detail}
        </p>
      )}

      {/* The row's own extras — a speaker, a seat count, a closing time. Laid
          out label-left / value-right like the corporate-action record sheet,
          because a reader moving between the two shouldn't have to re-learn
          where the number is. Full-bleed and ruled off rather than indented
          under the detail line: this is a table, not a continuation of the
          sentence above it.

          Groups are ruled off from each other and never from within, the same
          rule the record sheet follows — see `MarketFact` groups in
          `market-feed`. Most events send one group and never see a second
          rule. */}
      {item.facts.length > 0 && (
        <dl className="flex shrink-0 flex-col border-t border-border/60 px-4 py-3">
          {item.facts.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className={`flex flex-col gap-2 ${
                groupIndex > 0 ? "mt-2 border-t border-border/60 pt-2" : ""
              }`}
            >
              {group.map((fact) => (
                <div key={fact.label} className="flex items-baseline gap-4">
                  <dt className="min-w-0 flex-1 type-body-2 text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className="shrink-0 text-right type-body-2 font-semibold text-foreground">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </div>
          ))}
        </dl>
      )}

      {showHolders && (
        <>
      <p className="shrink-0 border-t border-border/60 px-4 pb-1 pt-3 type-caption font-medium uppercase tracking-wide text-muted-foreground">
        Holders · {holders.length}
      </p>

      {/* `max-h` rather than `flex-1`, for the reason `HolderContact` gives: a
          pane in the sliding track needs a height of its own to be measured. */}
      <ul className="flex max-h-[calc(var(--vh)*40)] flex-col overflow-y-auto pb-2">
        {holders.map((holder) => (
          <li key={holder.id}>
            {/* Into this panel's contact view, not out to the client's page. An
                alert like "notify holders" is answered by a phone number, and
                leaving for a full profile to find one costs the alert you were
                working from. The profile is still one button further in. */}
            <button
              type="button"
              onClick={() => {
                setShown(holder.id);
                setContactId(holder.id);
              }}
              className={`group flex w-full items-center gap-2.5 px-4 text-left transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! ${
                isSheet ? "py-3" : "py-2"
              }`}
            >
              <Avatar type="text" initials={getInitial(holder.name)} size="s" />
              <span className="min-w-0 flex-1 truncate type-body-2 text-foreground">
                {holder.name}
              </span>
              <CaretRightIcon
                size={14}
                className={`shrink-0 text-muted-foreground transition-opacity ${
                  isSheet ? "opacity-40" : "opacity-0 group-hover:opacity-100"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
        </>
      )}
    </div>
  );

  return (
    // The list and a holder's contact slide past each other; the box resizes
    // to whichever is showing (measured — neither has a fixed height).
    <SlideSteps
      index={atContact ? 1 : 0}
      className={`relative ${isSheet ? "w-full" : "w-full max-w-md"}`}
    >
      {listPane}
      {contact && (
        <HolderContact
          clientId={contact.id}
          name={contact.name}
          variant={variant}
          onBack={() => setContactId(null)}
          onClose={onClose}
        />
      )}
    </SlideSteps>
  );
}
