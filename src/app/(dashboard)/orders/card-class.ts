/**
 * The shell every Order Management card wears, hover included.
 *
 * ## Why the `!`s
 *
 * The design system ships an **unlayered** stylesheet, so its base utilities
 * sit at the same specificity as ours and win on source order — including over
 * `hover:` variants, which is counter-intuitive enough to have bitten this
 * project before (see `StockTab`, which solves it the same way). The card used
 * to carry `border-border … hover:border-[#0a6ee7]` and the hover did
 * *nothing*: measured over CDP, the border stayed `rgba(0,0,0,0.1)` and the
 * caret stayed grey at rest and on hover alike.
 *
 * A trailing `!` on each hovered property is what makes the variant stick.
 * Anything changed here has to be re-measured with `getComputedStyle` rather
 * than read off the class list — the class list is exactly what lied.
 *
 * ## Why three properties
 *
 * Border alone, at this card's size, is a change the eye can miss across a
 * three-up grid. Background, border and a shadow lifting the card together say
 * "this one" at a glance, which is the house pattern for a clickable card.
 */
export const CARD_CLASS = [
  "flex flex-col gap-3 rounded-[8px] border border-border bg-card p-4",
  "transition-[background-color,border-color,box-shadow]",
  "hover:bg-[#fafafa]! hover:border-[#0a6ee7]/25! hover:shadow-[0px_2px_8px_rgba(0,0,0,0.08)]!",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7]",
].join(" ");
