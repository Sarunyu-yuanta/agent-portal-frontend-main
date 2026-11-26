"use client";

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

/** Sets (or, with `null`, clears) `?ut_step=` on the current URL. No-op outside test mode. */
export function markUtStep(step: string | null): void {
  if (typeof window === "undefined" || !isUsabilityTest()) return;
  const url = new URL(window.location.href);
  if (step === null) url.searchParams.delete(STEP_PARAM);
  else url.searchParams.set(STEP_PARAM, step);
  if (url.href === window.location.href) return;
  // Native History API, as `setQueryState` does: Next patches it into its
  // router, so `useSearchParams` stays in sync.
  window.history.replaceState(window.history.state, "", url.href);
}
