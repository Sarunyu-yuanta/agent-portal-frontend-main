"use client";

import { useRef, useState } from "react";
import { useIsoLayoutEffect } from "./use-iso-layout-effect";
import { pageZoom } from "@/lib/page-zoom";

/**
 * Where a sticky side rail should pin, measured rather than guessed.
 *
 * A sticky box holds in one direction only, and `top` is the one that keeps a
 * column in place while the content beside it scrolls on. But a fixed `top`
 * pins the rail the instant you scroll, and a rail taller than the viewport
 * then has its last card parked below the fold for good.
 *
 * Everything below is in one coordinate space: the offsets Blink resolves a
 * sticky `top` against are insets from the scroll container's *content* box,
 * not from the visible edge under the app's top bar — the Calendar's sticky tab
 * strip had to learn the same thing, and pays for it with `xl:-top-6`. So `0`
 * is where a rail already stands in normal flow, one page-padding below the top
 * bar, and `contentHeight − rail` is where its last card lands on the line the
 * work column ends on.
 *
 * `contentHeight − rail` is the right offset only while the rail is the taller
 * of the two — negative, so the rail scrolls along until that card arrives.
 *
 * Positive is where it goes wrong. A sticky box holds itself *down* to its
 * `top` as much as up, so a rail shorter than the content area gets pushed that
 * far down the column, opening a gutter above its first card on exactly the
 * screens with the most room to show it — tall and wide, nothing scrolled yet.
 * Hence the clamp, and the two cases meet continuously: at the height where the
 * rail exactly fills the content area, both terms are equal.
 *
 * It has to be measured because CSS has no term for "this element's own height"
 * inside `top` — `100%` there resolves against the containing block.
 *
 * The clamp is the rail's *own* offset in that content box rather than a flat
 * `0`, which is what lets one hook serve two different pages. On the Dashboard
 * the rail starts at the content box's top, so the clamp works out to `0` and
 * it pins where it stands. On a client's profile a sticky identity bar sits
 * above it, so the rail starts further down — and the clamp lands it back in
 * exactly that spot, under the bar rather than behind it, with no nudge as it
 * goes from flowing to pinned. Measured through `offsetTop`, which reports the
 * laid-out position and so is not itself moved by the sticky offset it feeds.
 *
 * `undefined` until the first measurement, so the attribute is simply absent
 * rather than briefly wrong; the rail is in normal flow for that one frame.
 *
 * @typeParam T the rail's own element type. Defaults to `HTMLElement`, which
 * suits an `<aside>`; a caller putting the ref on a `<div>` names it so that
 * `railRef` lands on `ref` without a cast.
 */
export function useStickyRailTop<T extends HTMLElement = HTMLElement>() {
  const railRef = useRef<T>(null);
  const [railTop, setRailTop] = useState<number | undefined>(undefined);

  useIsoLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    // The scrollport is `<main>`, not the window — the app header sits above it
    // and never scrolls, so `innerHeight` would overstate the room by its
    // height and pin the rail that much too late.
    const main = rail.closest("main");

    /**
     * The rail's flowed top, as an inset from the scrollport's content box —
     * measured with its own sticky offset switched off.
     *
     * That last part is the whole trick. Blink folds the sticky shift *into*
     * `offsetTop` and `getBoundingClientRect`, so measuring a pinned rail and
     * feeding the result back into its `top` is a loop that walks the rail down
     * the page a little further on every pass (176 → 199 → 312 here). Blanking
     * `top` first drops the rail to where layout actually put it; the value is
     * read, and the next render restores the offset.
     *
     * `+ scrollTop` converts the viewport-relative reading into a scroll
     * independent one, so the same number comes back at any scroll position.
     */
    const naturalTop = (padTop: number) => {
      const restore = rail.style.top;
      rail.style.top = "auto";
      // The rects are screen pixels; `scrollTop`, the paddings and the `top`
      // this feeds are the page's own (see `pageZoom`).
      const y =
        (rail.getBoundingClientRect().top - (main?.getBoundingClientRect().top ?? 0)) / pageZoom() +
        (main?.scrollTop ?? 0) -
        padTop;
      rail.style.top = restore;
      return y;
    };

    const measure = () => {
      const port = main?.clientHeight ?? window.innerHeight / pageZoom();
      // `clientHeight` is the padding box, so both paddings come off it to get
      // the content box the offsets are insets from.
      const style = main ? getComputedStyle(main) : null;
      const padTop = style ? parseFloat(style.paddingTop) || 0 : 0;
      const padBottom = style ? parseFloat(style.paddingBottom) || 0 : 0;
      const contentH = port - padTop - padBottom;
      // Bottom-alignment is for a rail that genuinely cannot fit — it goes
      // negative, letting the rail scroll along until its last card lands.
      //
      // Not a `Math.min` of the two. That reads as "whichever is higher" and is
      // the same for a rail whose natural top is `0`, but a rail sitting below a
      // sticky identity bar starts at ~199 — and a bottom-aligned value of 176
      // then won the comparison while still being *positive*, pinning the rail
      // 96px below the bar with dead space above it instead of letting it
      // scroll. Only a negative offset means "cannot fit".
      const bottomAligned = contentH - rail.offsetHeight;
      setRailTop(bottomAligned < 0 ? bottomAligned : naturalTop(padTop));
    };

    // No call here: `ResizeObserver` fires once on `observe`, which does the
    // first measurement without setting state from inside the effect body.
    const observer = new ResizeObserver(measure);
    observer.observe(rail);

    /**
     * Every box between the rail and the scrollport, because the rail's natural
     * top is only as current as they are.
     *
     * Observing `main` alone is not enough and looks like it should be: a
     * client profile's identity bar compacts as you scroll — 191px down to
     * 104px — which moves the rail's natural top by 87px, but leaves `main` the
     * same size, so nothing fired and the rail stayed pinned at its
     * uncompacted offset with 96px of dead space above it. The wrappers in
     * between *do* change height when that happens.
     */
    for (let el = rail.parentElement; el; el = el.parentElement) {
      observer.observe(el);
      if (el === main) break;
    }

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { railRef, railTop };
}
