/**
 * The greeting card's sky, as a function of the clock.
 *
 * A handful of keyframes pin what the card looks like at certain times. Between
 * two different ones the card does not average their colours — halfway between
 * apricot and blue that is a pale, muddy grey, and no minute of the day should
 * look like it. Instead the sky is one long gradient of both palettes laid end
 * to end, and the card is a window onto it that slides from the first palette
 * to the second: mid-change you see both skies at once, joined by a soft
 * horizon, each at full strength.
 *
 * Glow position, text and watermark colours do blend — they are small, and a
 * blended glow is just a glow.
 *
 * Output is CSS custom properties rather than a class: `system-one`'s `Card`
 * takes a `className` and nothing else, so the values go on a wrapper and
 * inherit down into it. `globals.css` (`.greeting-card--live`) reads them.
 */

type RGB = readonly [number, number, number];

interface Palette {
  /** Sky gradient in three stops, left-top to right-bottom — the greeting sits
   *  over `from`, so the text colours are checked against that end. */
  from: RGB;
  mid: RGB;
  to: RGB;
  /** The sun / moon glow painted over the sky. */
  glow: RGB;
  glowAlpha: number;
  title: RGB;
  date: RGB;
  /** Watermark colour, and how strongly it shows. */
  accent: RGB;
  mark: number;
}

interface Stop {
  /** Minutes since local midnight. */
  at: number;
  /** Where the glow sits, in % of the card — so the sun travels. */
  gx: number;
  gy: number;
  light: Palette;
  dark: Palette;
}

const hex = (value: string): RGB => [
  parseInt(value.slice(1, 3), 16),
  parseInt(value.slice(3, 5), 16),
  parseInt(value.slice(5, 7), 16),
];

const sky = (
  [from, mid, to]: [string, string, string],
  glow: string,
  glowAlpha: number,
  title: string,
  date: string,
  accent: string,
  mark: number,
): Palette => ({
  from: hex(from),
  mid: hex(mid),
  to: hex(to),
  glow: hex(glow),
  glowAlpha,
  title: hex(title),
  date: hex(date),
  accent: hex(accent),
  mark,
});

/** Night is already dark, so both themes share it. */
const NIGHT = sky(["#0f1640", "#262266", "#4d2f8a"], "#a5b4fc", 0.32, "#eef1ff", "#b9bfe6", "#a5b4fc", 0.16);

/** The half-light either side of night. Blending night straight into morning
 *  (or evening) passes through a flat grey; real skies go via violet and
 *  salmon, so those get their own stop. Shared by both themes — they sit
 *  between a dark palette and a light one, and neither extreme suits them. */
const DAWN = sky(["#43397f", "#b0689f", "#ffb38a"], "#ffd0a0", 0.6, "#fff4ea", "#f3dcec", "#ffe0c0", 0.2);
const DUSK = sky(["#8a4a8f", "#4a3478", "#1c2058"], "#fb923c", 0.35, "#fff0e4", "#f3d9e6", "#ffb27a", 0.18);

const MORNING = {
  light: sky(["#ffe9a8", "#ffc58a", "#ff9c86"], "#fff2b8", 0.7, "#7c2d12", "#9a4a2a", "#ea580c", 0.14),
  dark: sky(["#4d3a14", "#5c3818", "#5c2c24"], "#fbbf24", 0.22, "#fde68a", "#e8c9a0", "#f59e0b", 0.14),
};
const DAY = {
  light: sky(["#c4e3ff", "#8fc6ff", "#5eaaf5"], "#ffffff", 0.85, "#08336e", "#1d4f91", "#0a4aa8", 0.12),
  dark: sky(["#12304f", "#1a4577", "#215c9c"], "#7db8ff", 0.2, "#c3e0ff", "#9cc3e8", "#7db8ff", 0.12),
};
const EVENING = {
  light: sky(["#ffd49c", "#ff9c8c", "#c97fbd"], "#ffb35c", 0.55, "#6b1d3a", "#8a3a55", "#c2410c", 0.16),
  dark: sky(["#4d2c18", "#5c2b30", "#44245a"], "#fb923c", 0.22, "#ffcdae", "#e8b8c4", "#ea580c", 0.16),
};

const hm = (h: number, m = 0) => h * 60 + m;

/**
 * Hold, then change. Between a pair of stops with the same look the card sits
 * still; it drifts 04:30–07:30 (night, dawn, morning), 10:00–12:00,
 * 15:00–17:30 and 19:00–21:00 (evening, dusk, night).
 */
const STOPS: readonly Stop[] = [
  { at: hm(0), gx: 88, gy: 0, light: NIGHT, dark: NIGHT },
  { at: hm(4, 30), gx: 88, gy: 0, light: NIGHT, dark: NIGHT },
  { at: hm(6), gx: 8, gy: 100, light: DAWN, dark: DAWN },
  // Morning — sunrise low on the left.
  { at: hm(7, 30), gx: 8, gy: 100, ...MORNING },
  { at: hm(10), gx: 8, gy: 100, ...MORNING },
  // Day — clear sky, sun overhead.
  { at: hm(12), gx: 50, gy: -30, ...DAY },
  { at: hm(15), gx: 50, gy: -30, ...DAY },
  // Evening — golden hour, sun setting low on the right.
  { at: hm(17, 30), gx: 92, gy: 100, ...EVENING },
  { at: hm(19), gx: 92, gy: 100, ...EVENING },
  { at: hm(19, 45), gx: 92, gy: 100, light: DUSK, dark: DUSK },
  { at: hm(21), gx: 88, gy: 0, light: NIGHT, dark: NIGHT },
  { at: hm(24), gx: 88, gy: 0, light: NIGHT, dark: NIGHT },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Eases both ends so a drift starts and settles gently instead of at a
 *  constant rate — a linear ramp reads as a mechanical slider. */
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

function mixPalette(a: Palette, b: Palette, t: number): Palette {
  return {
    from: mixRgb(a.from, b.from, t),
    mid: mixRgb(a.mid, b.mid, t),
    to: mixRgb(a.to, b.to, t),
    glow: mixRgb(a.glow, b.glow, t),
    glowAlpha: lerp(a.glowAlpha, b.glowAlpha, t),
    title: mixRgb(a.title, b.title, t),
    date: mixRgb(a.date, b.date, t),
    accent: mixRgb(a.accent, b.accent, t),
    mark: lerp(a.mark, b.mark, t),
  };
}

function luminance([r, g, b]: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text colours blended halfway between two keyframes can land on a mid-tone
 * that neither end would have chosen — pale amber on a mid-grey sky, say. Push
 * the colour toward whichever of black or white reads better until it clears
 * `min`, so the greeting stays legible at every minute of the drift, not just
 * at the keyframes.
 */
function legible(fg: RGB, bg: RGB, min: number): RGB {
  if (contrast(fg, bg) >= min) return fg;
  const target: RGB = contrast([255, 255, 255], bg) >= contrast([0, 0, 0], bg) ? [255, 255, 255] : [0, 0, 0];
  for (let t = 0.05; t <= 1; t += 0.05) {
    const next = mixRgb(fg, target, t);
    if (contrast(next, bg) >= min) return next;
  }
  return target;
}

/** Gap, in % of the card width, over which one palette hands over to the next.
 *  Wide enough to read as a horizon rather than a seam. */
const JOIN = 20;

type SkyStop = readonly [position: number, color: RGB];

function sample(stops: readonly SkyStop[], x: number): RGB {
  if (x <= stops[0][0]) return stops[0][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (x <= p1) return mixRgb(c0, c1, (x - p0) / (p1 - p0));
  }
  return stops[stops.length - 1][1];
}

/**
 * The gradient the card shows, plus the colour behind its greeting.
 *
 * `a` laid at 0–100, `b` at 100+JOIN–200+JOIN, and the card is the 100%-wide
 * window starting at `t × (100 + JOIN)`: at 0 it is exactly `a`, at 1 exactly
 * `b`. When both are the same palette (a hold) there is no second half.
 */
function skyGradient(a: Palette, b: Palette, t: number): { css: string; left: RGB } {
  const strip: SkyStop[] = [
    [0, a.from],
    [55, a.mid],
    [100, a.to],
  ];
  let shift = 0;
  if (a !== b) {
    strip.push([100 + JOIN, b.from], [155 + JOIN, b.mid], [200 + JOIN, b.to]);
    shift = t * (100 + JOIN);
  }
  const css = strip
    .map(([pos, c]) => `rgb(${css3(c)}) ${(pos - shift).toFixed(1)}%`)
    .join(", ");
  // The greeting sits over the left quarter or so of the window.
  return { css: `linear-gradient(115deg, ${css})`, left: sample(strip, shift + 25) };
}

const css3 = (c: RGB) => `${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])}`;

function paletteVars(
  prefix: string,
  p: Palette,
  sky: { css: string; left: RGB },
  gx: number,
  gy: number,
): Record<string, string> {
  return {
    [`--${prefix}-sky`]: sky.css,
    [`--${prefix}-glow`]: `rgb(${css3(p.glow)} / ${p.glowAlpha.toFixed(3)})`,
    [`--${prefix}-x`]: `${gx.toFixed(1)}%`,
    [`--${prefix}-y`]: `${gy.toFixed(1)}%`,
    [`--${prefix}-title`]: `rgb(${css3(legible(p.title, sky.left, 4.5))})`,
    [`--${prefix}-date`]: `rgb(${css3(legible(p.date, sky.left, 4.5))})`,
    [`--${prefix}-accent`]: `rgb(${css3(p.accent)})`,
    [`--${prefix}-mark`]: p.mark.toFixed(3),
  };
}

/** The card's custom properties at `minutes` since local midnight — `--g-*`
 *  for the light theme, `--gd-*` for dark; the stylesheet picks by theme. */
export function skyVars(minutes: number): Record<string, string> {
  const m = ((minutes % 1440) + 1440) % 1440;
  let i = STOPS.length - 2;
  for (let k = 0; k < STOPS.length - 1; k++) {
    if (m < STOPS[k + 1].at) {
      i = k;
      break;
    }
  }
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const t = smoothstep((m - a.at) / (b.at - a.at));
  const gx = lerp(a.gx, b.gx, t);
  const gy = lerp(a.gy, b.gy, t);
  return {
    ...paletteVars("g", mixPalette(a.light, b.light, t), skyGradient(a.light, b.light, t), gx, gy),
    ...paletteVars("gd", mixPalette(a.dark, b.dark, t), skyGradient(a.dark, b.dark, t), gx, gy),
  };
}

export type DayPeriod = "morning" | "day" | "evening" | "night";

/** A time to pin the card to, from `?tod=`: a period name (its middle) or
 *  `HH:MM`. `null` for anything else, which leaves the card on the real clock. */
export function parseTimePreview(value: string | null): number | null {
  if (!value) return null;
  const named: Record<DayPeriod, number> = {
    morning: hm(8, 30),
    day: hm(13, 30),
    evening: hm(18),
    night: hm(23),
  };
  if (Object.hasOwn(named, value)) return named[value as DayPeriod];
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const min = Number(match[2]);
  return h < 24 && min < 60 ? hm(h, min) : null;
}
