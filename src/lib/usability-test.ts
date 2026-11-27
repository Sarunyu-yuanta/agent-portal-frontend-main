"use client";

import { useEffect, useRef } from "react";

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
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function updateUrl(edit: (params: URLSearchParams) => void): void {
  const url = new URL(window.location.href);
  edit(url.searchParams);
  if (url.href === window.location.href) return;
  // Native History API, as `setQueryState` does: Next patches it into its
  // router, so `useSearchParams` stays in sync.
  window.history.replaceState(window.history.state, "", url.href);
}

/**
 * Sets (or, with `null`, clears) `?ut_step=` on the current URL. No-op outside test mode.
 *
 * While a modal is open, `ut_open=<key>` is set too — however it was opened —
 * so an open modal always has the same URL as the link that opens it. It goes
 * once the modal is done (sent/booked, or closed), so a reload doesn't pop it
 * open again.
 */
export function markUtStep(step: string | null): void {
  if (typeof window === "undefined" || !isUsabilityTest()) return;
  const finished = step !== null && (step.endsWith("-sent") || step.endsWith("-booked"));
  const openKey = step?.startsWith("proposal-") ? "proposal" : "booking";
  updateUrl((params) => {
    if (step === null) params.delete(STEP_PARAM);
    else params.set(STEP_PARAM, step);
    if (step === null || finished) params.delete(OPEN_PARAM);
    else params.set(OPEN_PARAM, openKey);
  });
}

/**
 * Opens a modal on load when the URL says `?ut_open=<key>` (test mode only), so
 * a test tool that only captures the loaded page can see the modal open.
 * Checks once per mount, as soon as `ready` (e.g. the product can be booked) —
 * a `ut_open` written later by a modal the user opened is not a request.
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
    if (new URLSearchParams(window.location.search).get(OPEN_PARAM) !== key) return;
    latest.current();
  }, [key, ready]);
}
