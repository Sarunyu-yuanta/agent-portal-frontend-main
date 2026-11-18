import type { ReactNode } from "react";
import {
  ChalkboardTeacherIcon,
  CoinsIcon,
  IslandIcon,
  MegaphoneIcon,
  StarIcon,
} from "@phosphor-icons/react";

/**
 * How the Calendar draws a taxonomy code it was handed.
 *
 * Every lookup in this file is total: give it a code nobody has ever seen and
 * it still returns a palette, a label and an icon. That is the point. The
 * corporate-action codes come from SET and the event categories from whatever
 * the desk's backend defines, and neither list is the frontend's to close — see
 * the header of `market-feed`. A `Record` keyed by a union would turn every new
 * code into a release; a resolver with a deterministic fallback turns it into
 * nothing at all.
 *
 * Deterministic matters as much as total: the fallback hue is derived from the
 * code's own characters, so a kind the frontend has never heard of still wears
 * one colour for the whole session, on every surface, and on both the server
 * render and the client one.
 */

export type MarketPalette = {
  /** Saturated — a group card's left bar, a legend swatch. */
  accent: string;
  /** Pale — a chip's fill, a grid pill's fill. */
  tint: string;
  /** Readable on `tint`. */
  text: string;
};

/** Every palette is one hue of the design system's ramp at three fixed steps,
 *  so a kind nobody designed still sits in the same visual family as the ones
 *  that were. */
function ramp(hue: string): MarketPalette {
  return {
    accent: `var(--fill-${hue}-500)`,
    tint: `var(--fill-${hue}-100)`,
    text: `var(--fill-${hue}-700)`,
  };
}

/**
 * Which hue each SET code wears, and the names the exchange gives them.
 *
 * The order of this list decides two things, and neither of them is *whether* a
 * code renders: how a day's cards sort (so the same day comes out the same way
 * every time) and what the filter checklist offers before the feed has sent
 * anything. A code missing from here still draws — it sorts after these,
 * alphabetically, and takes a hue from {@link FALLBACK_HUES}.
 *
 * Hues are assigned by hand rather than by position. Three of these codes have
 * a fill the product already shipped (see {@link ACTION_PALETTE_OVERRIDES}), and
 * handing the rest out by index put a ramp cyan next to XW's shipped cyan — two
 * codes a reader has to tell apart inside a 14px pill, in the same colour. XM
 * blue and XN violet also match the day card this was drawn from.
 */
export const ACTION_KINDS: { kind: string; name: string; hue: string }[] = [
  { kind: "XD", name: "Excluding Dividend", hue: "green" },
  { kind: "XR", name: "Excluding Right", hue: "rose" },
  { kind: "XW", name: "Excluding Warrant", hue: "cyan" },
  { kind: "XI", name: "Excluding Interest", hue: "teal" },
  { kind: "XP", name: "Excluding Principal", hue: "amber" },
  { kind: "XA", name: "Excluding All Benefits", hue: "fuchsia" },
  { kind: "XB", name: "Excluding Other Benefits", hue: "stone" },
  { kind: "XE", name: "Excluding Exercise", hue: "lime" },
  { kind: "XM", name: "Excluding Meeting", hue: "blue" },
  { kind: "XN", name: "Excluding Capital Return", hue: "violet" },
  { kind: "XT", name: "Excluding Transferable Subscription Right", hue: "orange" },
];

/**
 * Hues held back for codes and categories nobody has designed for —
 * deliberately disjoint from the eleven above, so an unrecognised code can never
 * turn up wearing XD's green.
 *
 * Red is not among them. It is the app's risk colour, and a corporate action the
 * frontend merely hasn't heard of is not a risk.
 */
const FALLBACK_HUES = ["sky", "emerald", "pink", "indigo", "purple", "yellow", "slate", "camel"];

const ACTION_KIND_ORDER = new Map(ACTION_KINDS.map((entry, i) => [entry.kind, i]));
const ACTION_KIND_NAME = new Map(ACTION_KINDS.map((entry) => [entry.kind, entry.name]));
const ACTION_KIND_HUE = new Map(ACTION_KINDS.map((entry) => [entry.kind, entry.hue]));

/**
 * Codes already drawn somewhere in the product, held to the exact values that
 * were drawn.
 *
 * XT and XW are Figma's own (node 21204:80781, via the Company Events grid on a
 * stock) and XD's tint is the one that grid has shipped with; keeping the hexes
 * verbatim is what lets that screen move onto this shared resolver without a
 * pixel changing. Every other code comes off `ramp` at the hue its entry above
 * names.
 */
const ACTION_PALETTE_OVERRIDES: Record<string, MarketPalette> = {
  XD: { accent: "#22a447", tint: "#daebdd", text: "#3b7448" },
  XW: { accent: "#00a2d9", tint: "#ccecf7", text: "#006182" },
  XT: { accent: "#eb6101", tint: "#fee6c9", text: "#8d3a01" },
};

/**
 * The hue an unrecognised code gets, from its own characters.
 *
 * Stable across renders, processes and machines — a plain character sum, never
 * `Math.random` or the clock. That matters twice over: a hue that differed
 * between the server pass and the client one is a hydration mismatch, and one
 * that differed between two surfaces would make the same code two colours in
 * the same session.
 */
function hueFor(code: string): string {
  let sum = 0;
  for (let i = 0; i < code.length; i += 1) sum += code.charCodeAt(i);
  return FALLBACK_HUES[sum % FALLBACK_HUES.length];
}

/** The fill a corporate action wears, for any code at all. */
export function actionPalette(kind: string): MarketPalette {
  const override = ACTION_PALETTE_OVERRIDES[kind];
  if (override) return override;
  return ramp(ACTION_KIND_HUE.get(kind) ?? hueFor(kind));
}

/** "Excluding Dividend" for a code the exchange has named, the code itself
 *  otherwise — a tooltip that repeats the pill is still better than an empty
 *  one, and inventing an expansion for an unknown code would be worse than
 *  both. */
export function actionKindName(kind: string): string {
  return ACTION_KIND_NAME.get(kind) ?? kind;
}

/**
 * The same name with "Excluding " taken off the front, for a list where every
 * row would otherwise start with it — "Dividend", "Right", "Warrant".
 *
 * Not a second column in {@link ACTION_KINDS}: the word is genuinely part of
 * each name, and dropping it is a presentation decision belonging to the one
 * surface that shows all eleven at once. That surface is a dropdown, and eleven
 * repetitions of the same word is what was pushing it past the width where
 * "Excluding Transferable Subscription Right" still fit on its line.
 *
 * Returns `null` where there is nothing to add — an unnamed code, whose "name"
 * is the code itself and would print twice.
 */
export function actionKindShortName(kind: string): string | null {
  const name = ACTION_KIND_NAME.get(kind);
  if (!name) return null;
  return name.startsWith("Excluding ") ? name.slice("Excluding ".length) : name;
}

/** Sort position: the exchange's own order first, then anything new,
 *  alphabetically, so an unrecognised code has a fixed place rather than
 *  drifting with whatever order the feed happened to send. */
export function actionKindRank(kind: string): number {
  return ACTION_KIND_ORDER.get(kind) ?? ACTION_KINDS.length;
}

// ── Market events ───────────────────────────────────────────────────────────

export type EventCategoryMeta = MarketPalette & {
  /** Title case, for a badge or a filter row. */
  label: string;
  icon: ReactNode;
};

/**
 * The event categories the desk has asked for, plus the bucket everything else
 * falls into.
 *
 * Same contract as the corporate-action codes: a category the backend invents
 * next quarter still renders — titled from its own slug, coloured from
 * {@link FALLBACK_HUES} — and giving it a face of its own is one entry here.
 *
 * These hues overlap the corporate-action ones (seminar shares violet with XN,
 * deadline shares amber with XP) and that is allowed. The design system has
 * twenty-odd usable hues and the two taxonomies together want more than that,
 * so something had to repeat; what must not repeat is a colour *inside* one
 * taxonomy, since that is the comparison a reader actually makes. An event pill
 * carries a glyph and a sentence, an action pill a two-letter code and an accent
 * bar — they are never mistaken for each other on shape alone.
 */
const EVENT_CATEGORIES: Record<string, EventCategoryMeta> = {
  seminar: {
    ...ramp("violet"),
    label: "Seminar",
    icon: <ChalkboardTeacherIcon size={15} />,
  },
  promotion: {
    ...ramp("pink"),
    label: "Promotion",
    icon: <MegaphoneIcon size={15} />,
  },
  /** The desk's own dated obligations that aren't an exchange fact — a fund's
   *  subscription window closing, an IPO book opening. */
  deadline: {
    ...ramp("amber"),
    label: "Deadline",
    icon: <CoinsIcon size={15} />,
  },
  other: {
    ...ramp("slate"),
    label: "Other",
    icon: <StarIcon size={15} />,
  },
};

export function eventCategory(category: string): EventCategoryMeta {
  return EVENT_CATEGORIES[category] ?? {
    ...ramp(hueFor(category)),
    // Title-cased rather than passed through raw: the feed sends a slug and a
    // badge reading "quarterly_briefing" is a leak of the wire format.
    label: category
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || EVENT_CATEGORIES.other.label,
    icon: EVENT_CATEGORIES.other.icon,
  };
}

// ── Holidays ────────────────────────────────────────────────────────────────

/**
 * One fill for every holiday, because there is only one thing to say: the
 * market is shut.
 *
 * Rose rather than the red the app reserves for risk — a closed exchange is not
 * a problem to fix, and a day cell wearing the same colour as an expired KYC
 * would read as one.
 *
 * It shares the hue with XR, under the same reasoning as the event categories
 * above: the shapes are what tell them apart. A closure is a strip with an
 * island glyph and the day's own date turned rose; an XR is a pill printing two
 * letters behind an accent bar. Nothing else in the design system's usable
 * hues was left.
 */
export const HOLIDAY_PALETTE: MarketPalette = ramp("rose");


export const HolidayIcon = IslandIcon;
