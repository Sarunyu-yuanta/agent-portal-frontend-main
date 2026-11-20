"use client";

/**
 * The grey panel every read-only value sits on.
 *
 * This is what separates the two kinds of field at a glance: **white with a
 * border means you can type in it** (the customer dropdown, the notional
 * amount), **filled grey means the system is telling you something**. The
 * statuses had an input's shape once, which invited a click none of them takes;
 * a filled panel with the label inside it reads as a card rather than a field,
 * so the invitation goes away without the information going with it.
 *
 * No border, deliberately — an outline is the other half of what made these
 * read as inputs, and the fill alone is enough to bound a card. That is also
 * why the grey is `#f3f4f6` rather than the `#f9fafb` used elsewhere in this
 * app: with an outline to define the edge, the lighter grey is plenty; without
 * one it is close enough to the modal's white that the cards stop reading as
 * separate surfaces at all.
 */
export function FieldCard({
  label,
  trailing,
  variant = "fact",
  className = "",
  children,
}: {
  label: string;
  /**
   * Which of the two things this card is — they differ in more than one way, so
   * they are one choice rather than a handful of booleans that always move
   * together.
   *
   * **status** — one of the four checks. Sits on a grey panel, because the four
   * of them are a group being scanned, and leads with its label: the verdict
   * has moved to the icon on the right, so what is left on the left is the name
   * of the thing being judged.
   *
   * **fact** — an account number, an IC, a cash balance. No panel: there is
   * nothing to scan and nothing to decide, and giving it the same surface as a
   * check made the grid read as eight equal things when only four of them are
   * the point. The value leads and the label captions it.
   */
  variant?: "status" | "fact";
  /**
   * Pinned to the card's right edge and centred against its full height — the
   * status icon. Separate from `children` so it stays beside the label *and*
   * the value rather than below one of them.
   */
  trailing?: React.ReactNode;
  /** `self-start` where the card must not stretch to its grid row's height. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    /* The card is a flex container and its row fills it, so `items-center`
       centres against the card rather than against the row's own content.
       Without that, a card whose content is shorter than its grid row-mate's
       keeps its natural height and sits at the top: the risk card's text
       trailing is 20px where the others' icons are 28px, which left it — and
       its label — 4px above where every neighbouring card put theirs. */
    <div
      className={`flex ${
        // A fact has no padding at all. It had the status card's `py-3` back
        // when the two shared a grid row and had to sit level; they no longer
        // do, and with no panel to pad the padding only showed up as 36px of
        // dead space between two rows of plain text. The grid's own row gap is
        // the spacing now.
        variant === "status" ? "rounded-xl bg-neutral-100 px-4 py-3" : ""
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-h-5 items-center">
            {/* Both labels are 12px — the design system's caption size. A
                status label carries its card, so it takes the bold cut and the
                dark ink; a fact label captions a value below it, so it stays
                regular and grey. Size is what the two have in common; weight
                and colour are what tell them apart. */}
            <span
              className={
                variant === "status"
                  ? "type-caption-bold text-foreground"
                  : "type-caption text-muted-foreground"
              }
            >
              {label}
            </span>
          </div>
          {children}
        </div>
        {trailing}
      </div>
    </div>
  );
}

/** A quiet blue link, greyed when the thing it opens would do nothing. */
export function ActionLink({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer text-xs leading-[20px] font-medium text-brand-600 hover:underline disabled:cursor-default disabled:text-muted-foreground/50 disabled:no-underline"
    >
      {label}
    </button>
  );
}

/**
 * A plain fact — account number, IC, team — on the same grey card.
 *
 * Same surface as a status, no icon and no colour: there is no state to report.
 * These are always present and never block anything, so giving them a tone
 * would spend attention on rows that never need it, and the four that do carry
 * a verdict would stop standing out for carrying one.
 */
export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldCard label={label}>
      <span className="type-body-2 truncate !font-semibold text-foreground">{value}</span>
    </FieldCard>
  );
}
