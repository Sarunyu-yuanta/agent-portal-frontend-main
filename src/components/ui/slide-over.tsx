"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

const CLOSE_MS = 300;

/**
 * Drives a slide-in overlay that carries a payload: `open(payload)` mounts it
 * and animates in on the next frame; `close()` animates out, then unmounts
 * after the transition. Keep `CLOSE_MS` in sync with the panel's duration.
 */
export function useSlideOver<T>() {
  const [data, setData] = useState<T | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const open = useCallback((payload: T) => {
    setData(payload);
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setMounted(false);
      setData(null);
    }, CLOSE_MS);
  }, []);

  /** Immediate teardown with no exit animation (e.g. parent drawer closing). */
  const reset = useCallback(() => {
    setVisible(false);
    setMounted(false);
    setData(null);
  }, []);

  return { data, mounted, visible, open, close, reset };
}

/** Absolutely-positioned panel that slides in from the right within its parent. */
export function SlideOverPanel({
  visible,
  className,
  children,
}: {
  visible: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col bg-white transition-transform duration-300 ease-out",
        visible ? "translate-x-0" : "translate-x-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
