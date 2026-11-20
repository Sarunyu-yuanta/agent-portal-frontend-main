/**
 * The single exit for errors the UI recovered from (a failed save that showed
 * a toast, a request that fell back). Wire an error-monitoring service here;
 * call sites stay as they are.
 *
 * Anyone can read the browser console, so production logs only where it
 * happened and what kind of error it was. The error itself can carry a
 * response body, a URL with ids, or form input. Development logs everything.
 *
 * @param context Where it happened, e.g. `"[NotesSplitView] save failed"`.
 */
export function reportError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(context, error);
    return;
  }
  console.warn(context, describe(error));
}

/** A payload-free summary: the error's name, plus the HTTP status if it has one. */
function describe(error: unknown): string {
  if (!(error instanceof Error)) return typeof error;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? `${error.name} (${status})` : error.name;
}
