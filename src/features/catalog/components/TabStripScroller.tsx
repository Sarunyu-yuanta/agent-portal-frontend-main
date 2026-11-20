"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@sarunyu/system-one";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

/**
 * The desktop tab strip outgrows the 1280px column once every category is
 * shown, and a mouse has no horizontal axis to scroll it with — so, like
 * `ChipScroller`, it gets caret buttons on whichever side still has tabs
 * hidden. The fade matches the strip's own background (the bottom of the
 * header's white→#f7f7f7 gradient) and stops above the tabs' underline.
 */
export function TabStripScroller({
  className = "",
  activeKey,
  children,
}: {
  className?: string;
  /** Changes when the selected tab changes — the strip then scrolls it fully into view. */
  activeKey?: string;
  children: ReactNode;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  // A wrapper that outlives its children: the strip swaps from skeleton bars to
  // the real tabs, which changes its width without resizing the viewport.
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const update = () =>
      setOverflow({
        left: el.scrollLeft > 1,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(content);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // Bring the selected tab clear of the edge fades when it's clipped. Done by
  // hand rather than `scrollIntoView`, which would also scroll the page
  // vertically to reach it.
  useEffect(() => {
    const el = scrollRef.current;
    const tab = el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!el || !tab) return;
    const FADE = 48;
    const view = el.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    let delta = 0;
    if (box.right > view.right - FADE) delta = box.right - (view.right - FADE);
    else if (box.left < view.left + FADE) delta = box.left - (view.left + FADE);
    if (delta !== 0) el.scrollBy({ left: delta, behavior: "smooth" });
  }, [activeKey]);

  const step = (direction: 1 | -1) =>
    scrollRef.current?.scrollBy({
      left: direction * Math.round(scrollRef.current.clientWidth * 0.6),
      behavior: "smooth",
    });

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto pl-4 [--bg-default-primary:transparent] lg:pl-6"
          style={{ scrollbarWidth: "none" }}
        >
          <div ref={contentRef} className="w-max">
            {children}
          </div>
        </div>
        {(["left", "right"] as const).map((side) => {
          if (!overflow[side]) return null;
          const isLeft = side === "left";
          return (
            <div
              key={side}
              className={`pointer-events-none absolute top-0 bottom-[2px] flex items-center ${
                isLeft
                  ? "left-0 bg-gradient-to-r from-[#f7f7f7] via-[#f7f7f7] to-transparent pr-8 pl-1.5"
                  : "right-0 bg-gradient-to-l from-[#f7f7f7] via-[#f7f7f7] to-transparent pr-1.5 pl-8"
              }`}
            >
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => step(isLeft ? -1 : 1)}
                aria-label={
                  isLeft ? t.products.common.scrollTabsLeft : t.products.common.scrollTabsRight
                }
                className="pointer-events-auto"
              >
                {isLeft ? <CaretLeftIcon size={16} /> : <CaretRightIcon size={16} />}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
