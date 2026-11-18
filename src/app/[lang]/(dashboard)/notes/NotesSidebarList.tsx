"use client";

import { useMemo, useRef, useState } from "react";
import { Button, SearchInput } from "@sarunyu/system-one";
import { BellIcon, NotePencilIcon, XIcon } from "@phosphor-icons/react";
import { ClientAvatarStack } from "@/components/ui/client-avatar-stack";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Note } from "@/types/domain";
import { LOCAL_ID_PREFIX } from "@/contexts/notes-context";
import { useClientNames } from "@/hooks/use-client-names";
import { groupNotesByDate, snippet } from "./notes-grouping";
import { formatListStamp } from "./note-format";
import { useIsoLayoutEffect } from "@/hooks/use-iso-layout-effect";

type Filter = "all" | "clients" | "reminders";

/**
 * Three states a note can be in, not three subjects it can be about.
 *
 * "Clients" earns a segment because it asks a yes/no question — is anyone
 * attached — which is the same shape as "does this have an open reminder". A
 * segment per *particular* client would not: that is one of N answers rather
 * than a state, it is what a client's own Notes tab already shows, and it isn't
 * exclusive with Reminders the way these three are. Narrowing to one person is
 * the search box's job (it matches client names), so the two compose: search a
 * name, then switch to Reminders for just that person's open ones.
 */
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "clients", label: "Clients" },
  { id: "reminders", label: "Reminders" },
];

/** How long a discarded row takes to fade and collapse out. */
const DISCARD_EXIT_MS = 200;

/**
 * When `NotesSplitView` may actually drop the note from state — strictly *after*
 * the collapse has finished, never at the same moment.
 *
 * These were one constant, and that was the shudder at the end of the slide: a
 * CSS transition doesn't begin until the frame after the class flips, so it ends
 * a frame or two past its nominal duration, while `setTimeout` fires on schedule.
 * The row was getting pulled out of the DOM still 2–3px tall, and everything
 * below it snapped up to close that last sliver instantly. The buffer means
 * removal happens while the row has been sitting at exactly 0px for a few
 * frames, so it costs nothing visually.
 */
export const DISCARD_REMOVE_MS = DISCARD_EXIT_MS + 80;

/**
 * Slides rows to their new places instead of letting them jump.
 *
 * Rows reorder for reasons the list itself never initiates — editing a note (or
 * emptying one) bumps its `updatedAt`, and the group re-sorts underneath. A
 * discard already reads as movement because the collapsing row's height carries
 * everything below it along; a re-sort changes no heights at all, so without
 * this the rows simply swap between two frames.
 *
 * FLIP: after the DOM has the new order but before the browser paints it, put
 * each moved row back where it was with a transform, then release it. The
 * browser animates the release, so the row appears to travel from its old
 * position even though it was never actually there.
 *
 * `offsetTop`, not `getBoundingClientRect`: the list scrolls, and a viewport
 * measurement would read a scroll between renders as a move and animate every
 * row at once.
 *
 * Runs on a re-sort and nothing else. Rows also move when one is added or
 * discarded, but those already animate their own height and the rows below ride
 * that for free — FLIPping them too would drag them back to where they started
 * and play the same journey a second time, which is the jiggle this guards
 * against. Three conditions have to hold, and each rules out one way of moving
 * that isn't a re-sort:
 *
 * - the order of ids changed — a collapse or an expand leaves it identical;
 * - the *set* of ids didn't — an add or a removal is not a re-sort;
 * - nothing is mid-discard — a measurement taken while a row is collapsing is a
 *   position that no longer means anything by the time it is compared against.
 *
 * Limit worth knowing: a row moving *between* date groups is clipped on the way
 * by its new group's `overflow-hidden` (which the collapse animation needs), so
 * it slides in from that group's edge rather than all the way from where it was.
 * Within a group — which is where re-sorting almost always happens, since both
 * the edit and the group are "Today" — nothing is clipped.
 */
function useReorderFlip(
  rowRefs: React.RefObject<Map<string, HTMLElement>>,
  /** The rendered ids, in order. Identity of this string is the trigger. */
  orderKey: string,
  /** A row is collapsing, so no measurement taken now can be trusted. */
  suspended: boolean,
) {
  const prevTops = useRef(new Map<string, number>());
  const prevOrder = useRef<string | null>(null);

  // `suspended` is in the deps as well as the guard: entering and leaving a
  // discard are exactly the two moments the baseline has to be re-taken, since
  // the collapse in between moves rows without React rendering at all.
  useIsoLayoutEffect(() => {
    const orderChanged = prevOrder.current !== null && prevOrder.current !== orderKey;
    prevOrder.current = orderKey;

    const nextTops = new Map<string, number>();
    rowRefs.current.forEach((el, id) => nextTops.set(id, el.offsetTop));

    const sameSet =
      nextTops.size === prevTops.current.size &&
      [...nextTops.keys()].every((id) => prevTops.current.has(id));
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!orderChanged || !sameSet || suspended || reduced) {
      prevTops.current = nextTops;
      if (sameSet) return;
      // A row is expanding in or collapsing out, so what was just measured is a
      // position everything is still moving through. Left as the baseline, the
      // next genuine re-sort would invert rows to where they only briefly were
      // and slide them from there. Re-take it once the height animation has run
      // its course — the same wait the discard uses before dropping a row.
      const settle = setTimeout(() => {
        const settled = new Map<string, number>();
        rowRefs.current.forEach((el, id) => settled.set(id, el.offsetTop));
        prevTops.current = settled;
      }, DISCARD_REMOVE_MS);
      return () => clearTimeout(settle);
    }

    const moved: HTMLElement[] = [];
    rowRefs.current.forEach((el, id) => {
      const prev = prevTops.current.get(id);
      const top = nextTops.get(id);
      if (prev === undefined || top === undefined || prev === top) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${prev - top}px)`;
      moved.push(el);
    });
    prevTops.current = nextTops;

    if (moved.length === 0) return;
    // One forced reflow for the whole batch rather than one per row: the
    // inverted transforms have to be committed before the transitions are armed,
    // or the browser coalesces both writes and nothing animates.
    void document.body.offsetHeight;
    for (const el of moved) {
      el.style.transition = `transform ${DISCARD_EXIT_MS}ms ease-out`;
      el.style.transform = "";
    }
  }, [rowRefs, orderKey, suspended]);
}

/**
 * Two-tier selection, the way a native master/detail list behaves: the selected
 * row fills with the accent colour at full strength while the list itself is the
 * active pane, and thins to a 6% wash of that same accent once focus moves to
 * the search box or the note body. The row keeps the same size and shape either
 * way and stays recognisably blue — only the strength drops, so it still reads
 * as "this is the open note" without competing with whatever you're actually
 * typing in.
 *
 * Three levels that don't get confused for each other: neutral hover
 * (`--bg-default-secondary`) < inactive selection (`--primary-action-light`) <
 * active selection (`--primary-action`).
 *
 * Driven entirely by `group-focus-within/list` on the scroll container, so there
 * is no focus bookkeeping in state — and no focusin/focusout flicker when
 * tabbing from one row to the next. Every class here only ever lands on the
 * selected row.
 *
 * Two cascade traps here, both from `@sarunyu/system-one/styles.css` being
 * imported *after* `globals.css` in the root layout:
 *
 * 1. *Both* fills go through `var(...)` rather than the `bg-primary-action` /
 *    `bg-primary-action-light` classes the rest of the app uses. Those are
 *    hand-written in the design system's stylesheet, not Tailwind utilities:
 *    Tailwind can't build a `group-focus-within` variant of one, and using the
 *    other as the base would let it beat the variant on the tie described in
 *    (2) — the faint wash would win and the row would never go solid. The
 *    variables are on `:root` and redefined under `.dark`, so this stays
 *    theme-aware.
 * 2. The text overrides are forced with `!`. The design system also ships plain
 *    `.text-foreground` / `.text-muted-foreground` classes — same 0-1-0
 *    specificity as a Tailwind variant, but later in the cascade, so they win
 *    the tie and the text stays dark-on-accent. `!` is what makes the override
 *    independent of stylesheet order.
 */
const SELECTED_ROW =
  "bg-[var(--primary-action-light)] group-focus-within/list:bg-[var(--primary-action)]";
const SELECTED_TITLE = "group-focus-within/list:text-white!";
/** Secondary tone inside a selected row: the preview line and the meta icons. */
const SELECTED_SECONDARY = "group-focus-within/list:text-white/75!";
const SELECTED_STAMP = "group-focus-within/list:text-white!";

export function NotesSidebarList({
  notes,
  clients,
  selectedId,
  onSelect,
  onAdd,
  addDisabled = false,
  discardingIds = [],
}: {
  notes: Note[];
  /** Resolves each note's `clientIds` into names for its avatar stack. */
  clients: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  /**
   * Locked while an unwritten note is already open — a second blank one beside
   * the first is nothing. See `nothingWritten` in `NotesSplitView` for what
   * counts as unwritten.
   */
  addDisabled?: boolean;
  /** Notes on their way out — rendered collapsing rather than yanked instantly. */
  discardingIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const nameFor = useClientNames(clients);

  const searchActive = search.trim().length > 0;

  const filtered = useMemo(() => {
    let result = notes;
    if (filter === "clients") result = result.filter((n) => n.clientIds.length > 0);
    if (filter === "reminders")
      result = result.filter((n) => n.reminderAt && !n.reminderDone);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          (n.title ?? "").toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          // Client names too. A row already shows whose note it is — the avatars
          // are right there on the title line — so a search that ignores them
          // reads as broken: you type the name you can see and get nothing.
          // Matching them is also what keeps "which client" out of the filter
          // segments, since narrowing to one person is what this box is for.
          n.clientIds.some((id) => nameFor(id).toLowerCase().includes(q)),
      );
    }
    return result;
  }, [notes, filter, search, nameFor]);

  const groups = useMemo(() => groupNotesByDate(filtered), [filtered]);

  /**
   * An empty list has four different causes here and they are not the same news.
   * "No Notes" was only ever true for one of them: under a filter you may have a
   * hundred notes and simply none of this kind, so the flat statement reads as
   * data loss rather than an empty subset — and it says nothing about how to get
   * out of it.
   *
   * Search wins over the filter because typing is the more recent act, and it is
   * the more likely thing to be wrong. The query isn't echoed back: the box
   * holding it is 40px above, so repeating it here only risks wrapping badly in
   * a 280px column.
   *
   * A hint only where the filter names something a note has to be *given* —
   * clients and reminders are both opt-in per note, so an empty list is as
   * likely to mean "you've never used this" as "nothing matches today".
   */
  const empty: { title: string; hint?: string } = searchActive
    ? { title: "No matching notes" }
    : filter === "clients"
      ? { title: "No notes linked to a client", hint: "Attach one from a note's Client field." }
      : filter === "reminders"
        ? { title: "No open reminders", hint: "Set a reminder on a note and it lands here." }
        : { title: "No notes" };

  // Keyed by note id so a row keeps its entry across re-sorts — the whole point
  // is to compare where a given note was with where it now is.
  const rowRefs = useRef(new Map<string, HTMLElement>());
  // Joined into a string so the dep is a value rather than a fresh array each
  // render. Group labels are in it because moving between groups is a re-sort
  // too, even when a note's neighbours happen not to change.
  useReorderFlip(
    rowRefs,
    groups.map((g) => `${g.label}:${g.notes.map((n) => n.id).join(",")}`).join("|"),
    discardingIds.length > 0,
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-col gap-2 p-3 shrink-0">
        {/* Escape clears, from anywhere in the field. The wrapper carries the
            handler because `SearchInput` takes no `onKeyDown` — the event
            bubbles out of the input either way. */}
        <div
          onKeyDown={(e) => {
            if (e.key === "Escape" && search) setSearch("");
          }}
        >
          <SearchInput
            placeholder="Search"
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            size="sm"
            className="w-full"
          />
        </div>
        {/* `xl` is 40px, which lines up with the 38px `SearchInput` above it —
            the default `sm` button is 28px and read as an afterthought under it. */}
        <Button
          variant="primary"
          size="xl"
          onClick={onAdd}
          disabled={addDisabled}
          leftIcon={<NotePencilIcon size={18} weight="bold" />}
          className="w-full justify-center"
        >
          New Note
        </Button>
      </div>

      {/* shadcn `Tabs` used purely as a segmented control — the two filters are
          views of the same list, so there are no `TabsContent` panels; the list
          below reads `filter` directly. `w-full` overrides the list's `w-fit`
          so the segments split the sidebar width evenly. */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as Filter)}
        className="px-3 pb-2 shrink-0"
      >
        <TabsList aria-label="Filter notes" className="w-full">
          {FILTERS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/**
       * The way back out of a search.
       *
       * `SearchInput` renders its own × only while the field has focus, so the
       * moment you click a note the control disappears and the list goes on
       * filtering with nothing on screen to say why or how to stop. That reads as
       * the list having lost your notes. This bar is bound to the *state* rather
       * than to focus, so it is there for exactly as long as the filtering is,
       * and it doubles as the count — "3 of 27" answers "is this all of them?"
       * before you have to wonder.
       */}
      {searchActive && (
        <div className="px-3 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearch("")}
            className="flex w-full items-center gap-1.5 rounded-lg bg-[var(--bg-default-secondary)] px-2.5 py-1.5 type-caption text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--fill-gray-200)]! hover:text-foreground"
          >
            <XIcon size={12} weight="bold" className="shrink-0" />
            <span className="truncate">
              Clear search · {filtered.length} of {notes.length}
            </span>
          </button>
        </div>
      )}

      {/* `group/list` is what the two-tier selection below keys off — see
          SELECTED_*. Named rather than bare `group` so that adding any per-row
          `group-hover:` behaviour later can't accidentally bind to this one.

          `overflow-anchor: none` switches off scroll anchoring, which otherwise
          nudges `scrollTop` every frame to keep its anchor element still —
          helpful for content loading in, but it fights a deliberate height
          animation and reads as a shudder as the rows settle. Costs no layout.

          Deliberately NOT `scrollbar-gutter: stable`, which was here for a
          while: where the platform draws classic scrollbars it reserves their
          width permanently, so the rows' `mx-2` became 8px on the left and 8px
          + ~15px of gutter on the right — a visible, always-on lopsidedness. It
          was only ever guarding a one-off shift when the list crosses its scroll
          threshold, and the jitter that prompted it turned out to be a
          state-ordering bug in `NotesSplitView`. Not worth the trade. */}
      <div className="group/list flex-1 min-h-0 overflow-y-auto [overflow-anchor:none]">
        {groups.length === 0 ? (
          <div className="flex flex-col gap-1 px-6 py-10 text-center">
            <p className="type-body-2 text-muted-foreground">{empty.title}</p>
            {empty.hint && (
              <p className="type-caption text-muted-foreground/70">{empty.hint}</p>
            )}
          </div>
        ) : (
          groups.map((group) => {
            // Discarding the only note in a group would otherwise leave its
            // header hanging for a frame and then pop out, which is a second
            // jump right after the row's. Collapse the whole block instead.
            const groupExiting = group.notes.every((n) =>
              discardingIds.includes(n.id),
            );
            /**
             * The mirror image on the way in: the first note of a new day brings
             * a header with it, and that header should expand in alongside the
             * row rather than pop above it.
             *
             * The header animates itself rather than the whole group doing it,
             * and the difference matters. When the group expanded, its row had to
             * be told *not* to — one `1fr → 0fr` inside another resolves the
             * outer track against content that is itself growing, so the two
             * curves multiply and the motion lands wrong. That suppression then
             * needed to know whether the group was really mounting, which is a
             * fact about the render and not about the data: inferring it from
             * "every note here is locally created" is true forever once Today
             * holds nothing but notes from this session, so every new row after
             * the first had its entrance taken away and simply appeared. Header
             * and row are siblings, so their heights add instead of nesting, and
             * neither has to know about the other.
             *
             * `@starting-style` is what gates this to an actual mount — the class
             * can sit on an existing header harmlessly. The local-id test only
             * keeps page load quiet: notes that arrived from the server shouldn't
             * animate in as though they had just been written.
             */
            const groupEntering = group.notes.some((n) =>
              n.id.startsWith(LOCAL_ID_PREFIX),
            );
            return (
              <div
                key={group.label}
                aria-hidden={groupExiting || undefined}
                style={{ transitionDuration: `${DISCARD_EXIT_MS}ms` }}
                className={`grid transition-[grid-template-rows] ease-out ${
                  groupExiting
                    ? "grid-rows-[0fr] pointer-events-none"
                    : "grid-rows-[1fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col pb-1">
                    <div
                      style={{ transitionDuration: `${DISCARD_EXIT_MS}ms` }}
                      className={`grid grid-rows-[1fr] transition-[grid-template-rows] ease-out ${
                        groupEntering ? "starting:grid-rows-[0fr]" : ""
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          style={{ transitionDuration: `${DISCARD_EXIT_MS}ms` }}
                          className={`type-caption text-muted-foreground px-4 pt-3 pb-1 transition-opacity ease-out ${
                            groupEntering ? "starting:opacity-0" : ""
                          }`}
                        >
                          {group.label}
                        </p>
                      </div>
                    </div>
                    {group.notes.map((note, i) => {
                      const isSelected = note.id === selectedId;
                      const isDiscarding = discardingIds.includes(note.id);
                      // Whether *this row* runs the collapse, as opposed to
                      // being carried out by its group's. Running both at once
                      // nests one `1fr → 0fr` inside another, and the outer
                      // track's `1fr` resolves against content that is itself
                      // shrinking — the height becomes the product of two
                      // falling curves, so it slams shut early and then sits
                      // there. One collapse at a time keeps the motion a single
                      // clean interpolation. Kept separate from `isDiscarding`
                      // because the row still has to go inert either way.
                      const collapseRow = isDiscarding && !groupExiting;
                      // Expands in on mount, unconditionally — nothing above it
                      // animates its own height any more (see `groupEntering`),
                      // so there is no outer interpolation left to nest inside.
                      const expandRow = note.id.startsWith(LOCAL_ID_PREFIX);
                      // The rule the reference screenshot follows: rows are separated
                      // by a hairline, but the selected row is a floating pill — a
                      // divider touching either of its rounded edges reads as a seam,
                      // so the row before it drops its divider too. Last row in a
                      // group never draws one; the next group header is the break.
                      // A row on its way out drops its divider as well, so the line
                      // doesn't hang in the gap while the row collapses under it.
                      const next = group.notes[i + 1];
                      const showDivider =
                        !isSelected &&
                        !isDiscarding &&
                        next !== undefined &&
                        next.id !== selectedId &&
                        !discardingIds.includes(next.id);
                      return (
                        /* Outermost layer exists only for `useReorderFlip` to
                           transform. That hook writes the `transition`
                           shorthand, which on the collapse element below would
                           replace its `transition-[grid-template-rows]` — a row
                           that had ever been re-sorted would then snap shut
                           instead of collapsing when discarded. Separate
                           elements, separate transitions, nothing to
                           reconcile. */
                        <div
                          key={note.id}
                          ref={(el) => {
                            if (el) rowRefs.current.set(note.id, el);
                            else rowRefs.current.delete(note.id);
                          }}
                        >
                          {/* Collapse via `grid-template-rows: 1fr → 0fr`, which
                              starts from the row's *real* height. The earlier
                              `max-height` version had to guess a start value
                              (96px vs a ~54px row), so the first ~40% of the
                              transition moved nothing and the rest snapped — and
                              its `py-2 → py-0` slid the text up while the box was
                              still frozen. Two motions fighting, i.e. the jitter.
                              Here padding never animates: the wrapper clips. */}
                          <div
                            style={{ transitionDuration: `${DISCARD_EXIT_MS}ms` }}
                            className={`grid transition-[grid-template-rows] ease-out ${
                              collapseRow ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
                            } ${expandRow ? "starting:grid-rows-[0fr]" : ""}`}
                          >
                            <div className="overflow-hidden">
                            <div
                              role="button"
                              tabIndex={isDiscarding ? -1 : 0}
                              aria-hidden={isDiscarding || undefined}
                              onClick={() => onSelect(note.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onSelect(note.id);
                              }}
                              style={{
                                transitionDuration: `${DISCARD_EXIT_MS}ms`,
                              }}
                              className={`relative flex items-start mx-2 px-2.5 py-2 rounded-lg transition-[opacity,background-color] ease-out ${
                                isDiscarding
                                  ? "opacity-0 pointer-events-none"
                                  : "cursor-pointer"
                              } ${expandRow ? "starting:opacity-0" : ""} ${
                                isSelected
                                  ? SELECTED_ROW
                                  : "hover:bg-[var(--bg-default-secondary)]"
                              } ${
                                showDivider
                                  ? "after:absolute after:inset-x-2.5 after:bottom-0 after:h-px after:bg-border/60"
                                  : ""
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className={`type-body-2 font-semibold truncate flex-1 text-foreground ${
                                      isSelected ? SELECTED_TITLE : ""
                                    }`}
                                  >
                                    {note.title || "New Note"}
                                  </p>
                                  {/* What's attached to the note, at a glance.
                                      Pinned right on the title line — the title
                                      truncates, these never do.

                                      Faces rather than a person glyph, so the
                                      row says *who* and not just "someone".
                                      `small` (16px) and three slots, because
                                      this shares a 280px row with the title;
                                      the detail pane runs the same component
                                      wider. The stack keeps its own colours —
                                      only the bell takes the white-on-accent
                                      override, since the avatars' pale gradient
                                      already reads against the selected fill.

                                      Bell stays one flat tone rather than
                                      colouring by urgency: on the solid-accent
                                      selected row a red or yellow glyph fights
                                      the fill, and the detail pane already
                                      carries that state on its chip. */}
                                  {(note.clientIds.length > 0 || note.reminderAt) && (
                                    <span className="flex shrink-0 items-center gap-1.5">
                                      <ClientAvatarStack
                                        names={note.clientIds.map(nameFor)}
                                        slots={3}
                                        size="small"
                                      />
                                      {note.reminderAt && (
                                        <BellIcon
                                          size={13}
                                          role="img"
                                          aria-label="Has a reminder"
                                          className={`text-muted-foreground ${
                                            isSelected ? SELECTED_SECONDARY : ""
                                          }`}
                                        />
                                      )}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`type-caption flex items-baseline gap-1.5 text-muted-foreground ${
                                    isSelected ? SELECTED_SECONDARY : ""
                                  }`}
                                >
                                  {/* Stamp holds its width; the snippet is what gives. */}
                                  <span
                                    className={`shrink-0 text-foreground/70 ${
                                      isSelected ? SELECTED_STAMP : ""
                                    }`}
                                  >
                                    {formatListStamp(note.updatedAt)}
                                  </span>
                                  <span className="truncate">
                                    {snippet(note.body)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
