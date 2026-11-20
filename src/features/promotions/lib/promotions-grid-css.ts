/**
 * The card grid's desktop columns, which can't be a Tailwind class, and the
 * style tag both the page and its skeleton render.
 *
 * `@sarunyu/system-one` ships its own unlayered `.grid-cols-*` utilities and
 * loads after `globals.css`, so it takes the source-order tie against any
 * responsive `grid-cols-*` on the same element and ours never takes — the same
 * problem the Dashboard's `.dashboard-split` already answers this way.
 *
 * Worth spelling out, because it fails in a way that looks like the class was
 * never written: the filter row used to carry
 * `xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]`, that class *was*
 * generated and *was* on the element, and the row still rendered two-up at
 * 1440px. The KPI ribbon survives on plain `sm:grid-cols-4` only because
 * system-one happens to ship that utility too — luck, not a rule to build on.
 *
 * Its own module so the skeleton gets the same columns as the page it stands
 * in for. The skeleton is also a Suspense fallback, which renders before the
 * page component exists to emit a style tag of its own.
 */
export const PROMOTIONS_GRID_CSS = `
@media (min-width: 80rem) {
  /* Three across, now that the page is a single full-width column rather than
     a work column beside a rail. Not four: each card carries two side-by-side
     actions, and a quarter of 1280px leaves them too narrow to read. */
  .promotions-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
}
`;
