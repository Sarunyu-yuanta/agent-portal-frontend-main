"use client";

import { useEffect, useRef } from "react";
import { utBasePath, utSegmentOf } from "./usability-test-path";

/**
 * USABILITY-TEST ONLY — temporary; revert this commit once testing is done.
 *
 * Test tools judge a task by the URL the participant reaches, and a modal
 * leaves the URL alone. With test mode on, flows call `markUtStep` so the URL
 * carries `?ut_step=<step>` the tool can match.
 *
 * Test mode is switched on by opening any page with `?ut=1` (and off with
 * `?ut=0`). It is remembered in sessionStorage because in-app links drop the
 * query string.
 */

const FLAG_PARAM = "ut";
const STEP_PARAM = "ut_step";
const STORAGE_KEY = "usability-test";
const OPEN_PARAM = "ut_open";

/** Reads `?ut=1` / `?ut=0` from the current URL into sessionStorage. */
export function initUsabilityTest(): void {
  const flag = new URLSearchParams(window.location.search).get(FLAG_PARAM);
  try {
    if (flag === "1") window.sessionStorage.setItem(STORAGE_KEY, "1");
    else if (flag === "0") window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: test mode then lasts only while `?ut=1` is in the URL.
  }
}

function isUsabilityTest(): boolean {
  initUsabilityTest();
  if (new URLSearchParams(window.location.search).get(FLAG_PARAM) === "1") return true;
  // A `/ut-*` path is a test link in itself — a tester may land on it fresh.
  if (utSegmentOf(window.location.pathname)) return true;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function updateUrl(edit: (url: URL) => void, mode: "push" | "replace" = "replace"): void {
  const url = new URL(window.location.href);
  edit(url);
  if (url.href === window.location.href) return;
  // The URL changes *around* the router, not through it. Next patches the
  // History API and treats a changed pathname as a history traversal — it
  // re-renders the page, which unmounted the modal and undid the URL. Passing
  // Next's own entry state (it carries `__NA`) makes its patch step aside, so
  // the page stays as it is and only the address bar moves.
  const state: unknown = window.history.state;
  if (mode === "push") window.history.pushState(state, "", url.href);
  else window.history.replaceState(state, "", url.href);
}

/** Whether the path says a modal is open (`/ut-proposal`, `/ut-booking`). */
function modalOpenInPath(pathname: string): boolean {
  const segment = utSegmentOf(pathname);
  return segment === "proposal" || segment === "booking";
}

/**
 * Mirrors a modal's step into the URL. No-op outside test mode.
 *
 * Useberry tells screens apart by pathname alone, so the modal lives in the
 * path: opening it *pushes* `/…/ut-proposal` (or `/ut-booking`), its steps
 * ride along as `?ut_step=`, success pushes `/…/ut-proposal-sent` (or
 * `/ut-order-booked`), and closing replaces the path back. The proxy rewrites
 * `/ut-*` paths to the page underneath, so a reload still lands on it, and
 * `useAppPathname` strips the segment so the breadcrumb and nav never see it.
 */
export function markUtStep(step: string | null): void {
  if (typeof window === "undefined" || !isUsabilityTest()) return;
  const finished = step !== null && (step.endsWith("-sent") || step.endsWith("-booked"));
  const openKey = step?.startsWith("proposal-") ? "proposal" : "booking";
  const opening = step !== null && !finished && !modalOpenInPath(window.location.pathname);
  updateUrl(
    (url) => {
      const base = utBasePath(url.pathname);
      const params = url.searchParams;
      params.delete(OPEN_PARAM);
      if (url.hash.startsWith("#ut-")) url.hash = "";
      if (step === null) {
        params.delete(STEP_PARAM);
        url.pathname = base;
      } else if (finished) {
        params.delete(STEP_PARAM);
        url.pathname = `${base}/ut-${step}`;
      } else {
        params.set(STEP_PARAM, step);
        url.pathname = `${base}/ut-${openKey}`;
      }
    },
    opening || finished ? "push" : "replace",
  );
}

/**
 * Closes an open modal when the browser's Back leaves its pushed URL (test mode
 * only) — otherwise Back would change the URL and leave the modal up.
 */
export function useUtCloseOnBack(open: boolean, close: () => void): void {
  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  });
  useEffect(() => {
    if (!open || !isUsabilityTest()) return;
    const onPop = () => {
      if (!modalOpenInPath(window.location.pathname)) latest.current();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);
}

/**
 * Opens a modal on load when the URL says so — a `/ut-<key>` path, or the older
 * `?ut_open=<key>` (test mode only) — so a test tool that only captures the
 * loaded page can see the modal open. Checks once per mount, as soon as
 * `ready` (e.g. the product can be booked): a path written later by a modal
 * the user opened is not a request.
 */
export function useUtAutoOpen(key: "booking" | "proposal", open: () => void, ready = true): void {
  const checked = useRef(false);
  const latest = useRef(open);
  useEffect(() => {
    latest.current = open;
  });
  useEffect(() => {
    if (checked.current || !ready) return;
    checked.current = true;
    if (!isUsabilityTest()) return;
    const asked =
      utSegmentOf(window.location.pathname) === key ||
      new URLSearchParams(window.location.search).get(OPEN_PARAM) === key;
    if (asked) latest.current();
  }, [key, ready]);
}
