# system-one — i18n spec (proposed for the release after 4.10.2)

> **Status (2026-11-18): deferred.** We agreed not to change system-one yet and
> not to work around it in the Portal. Only the English pages are affected
> visibly: the `DateInput` calendar and the campaign-card chip still show Thai.
> Pick this up as Step 6 when the package is updated.

The IC Portal is bilingual (`/th/...`, `/en/...`). A few strings inside
`@sarunyu/system-one` are hard-coded, so the Portal can't change them by locale.
This spec lists the props to add. Every new prop is optional, and its default
is today's string, so **nothing changes for existing callers.**

Portal side: once the version is released, pass `locale` and the dictionary
strings at each call site (Step 6 of the i18n plan).

---

## 1. `DateInput`: add `locale`

**Today:** month names, weekday names, the Buddhist year (พ.ศ.) in the caption
and year picker, and the mobile sheet's "เลือกวันที่" / "ยกเลิก" / "ตกลง" are
always Thai.

```ts
export interface DateInputProps {
  // …existing props
  /** UI language. Default: "th" (today's behaviour). */
  locale?: "th" | "en";
  /** Overrides for the sheet/picker text. Each defaults to the locale's built-in text. */
  labels?: {
    sheetTitle?: string; // "เลือกวันที่" / "Select date"
    cancel?: string; // "ยกเลิก" / "Cancel"
    confirm?: string; // "ตกลง" / "Done"
  };
}
```

`locale` controls:

|                                        | `th`                           | `en`             |
| -------------------------------------- | ------------------------------ | ---------------- |
| Month/weekday names                    | ภาษาไทย (`date-fns/locale/th`) | English (`enGB`) |
| Year in caption, year grid, input text | พ.ศ. (Gregorian + 543)         | ค.ศ.             |
| Input text format                      | `18 พ.ย. 2569`                 | `18 Nov 2026`    |

- `value` / `onChange` / `disabledYears` stay **Gregorian** `Date` / numbers in
  both locales. Only the display changes.
- The input format should match the Portal's `formatDate(locale, d, "short")`
  (`th-TH-u-ca-buddhist` / `en-GB`, `day: numeric, month: short, year: numeric`).

**Used in the Portal:** `insights/Research.tsx` (date filter, range),
`notes/NoteAttributeFields.tsx` (reminder date, single).

## 2. `Card` (`variant="event"`): tag label override

**Today:** `tagStatus` renders the fixed labels "ยังไม่ลงทะเบียน" / "ลงทะเบียนแล้ว" / "เต็มแล้ว".

```ts
export interface CardProps {
  // …existing props
  /** Overrides the event tag's text. Colour and icon still come from `tagStatus`. */
  tagLabel?: string;
}
```

**Used in the Portal:** `promotions/CampaignCard.tsx`.

## 3. `Dropdown` / `DropdownMultiple`: empty-result text

**Today:** "No results found" is hard-coded.

```ts
/** Text shown when the option list is empty. Default: "No results found". */
emptyText?: string;
```

## 4. Accessible labels (aria-label)

They aren't visible on screen, but screen readers read them aloud, so they should
match the page language. Add one optional `labels` (or `ariaLabels`) prop per
component. Defaults are today's strings.

| Component            | Hard-coded today                                                                     | Proposed prop key                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Modal`              | "Close dialog"                                                                       | `labels.close`                                                                                               |
| `BottomSheet`        | "Close bottom sheet"                                                                 | `labels.close`                                                                                               |
| `Toast` / `Toaster`  | "Close toast"                                                                        | `labels.close` (Toaster passes it through)                                                                   |
| `SearchInput`        | "Clear search"                                                                       | `labels.clear`                                                                                               |
| `Pagination`         | "Pagination", "Previous page", "Next page", "More pages", "Select page", `Page ${n}` | `labels.nav`, `labels.previous`, `labels.next`, `labels.more`, `labels.select`, `labels.page: (n) => string` |
| `PaginationBanner`   | "Slide indicators", `Slide ${n}`                                                     | `labels.nav`, `labels.slide: (n) => string`                                                                  |
| `PaginationCarousel` | "Carousel pagination", "Previous slide", "Next slide"                                | `labels.nav`, `labels.previous`, `labels.next`                                                               |
| `Card` (news/social) | "Add bookmark" / "Remove bookmark"                                                   | `labels.bookmark`, `labels.unbookmark`                                                                       |
| Range/slider input   | "Start value", "End value"                                                           | `labels.start`, `labels.end`                                                                                 |
| `Breadcrumb`         | "Breadcrumb"                                                                         | `labels.nav`                                                                                                 |
| Notification bell    | "Open notifications", "Notification"                                                 | `labels.open`                                                                                                |

A simpler alternative to per-component `labels`: one
`<SystemOneLocaleProvider locale="th|en" messages={…}>` context that every
component reads. The Portal would then wrap once in `[lang]/layout.tsx` instead of
editing ~100 call sites. **This is the recommended shape** if you're open to a
context in the package.

## 5. Already fine (no change needed)

- `StatusTag`: `text` prop exists; the Portal passes it (done in Step 4).
- `Modal` `primaryLabel` / `secondaryLabel`, `BottomSheet` `title` / `actionLabel`,
  `SearchInput` / `Dropdown` `placeholder`, `Toast` `message` / `actionLabel`:
  already props, already translated by the Portal.

## Portal call-site counts (for sizing Step 6)

| Component                       | Files |
| ------------------------------- | ----- |
| `Toaster`                       | 19    |
| `BottomSheet`                   | 21    |
| `SearchInput`                   | 17    |
| `Modal`                         | 16    |
| `Table`                         | 13    |
| `Pagination`                    | 11    |
| `Dropdown` / `DropdownMultiple` | 3 / 2 |
| `PaginationBanner`              | 2     |
| `DateInput`                     | 2     |
| `Card` event                    | 1     |
