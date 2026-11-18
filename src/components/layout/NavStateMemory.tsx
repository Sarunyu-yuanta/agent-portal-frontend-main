"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { recordVisit } from "@/lib/nav-memory";
import { useScrollMemory } from "@/hooks/use-scroll-memory";

/**
 * Renderless: records every navigation (section memory + breadcrumb trail) and
 * keeps per-URL scroll offsets. Lives in the dashboard layout so every page
 * gets it, and so the trail is built from one place rather than per page.
 *
 * Must be rendered *after* `children` in the layout tree — its effects have to
 * run after the page's own mount effects, some of which reset `main.scrollTop`.
 */
export function NavStateMemory() {
  const pathname = useAppPathname();
  const search = useSearchParams().toString();
  const url = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    recordVisit(pathname, url);
  }, [pathname, url]);

  useScrollMemory(url, pathname);

  return null;
}
