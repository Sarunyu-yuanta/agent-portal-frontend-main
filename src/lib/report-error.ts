/**
 * The single exit for errors the UI recovered from (a failed save that showed
 * a toast, a request that fell back). Wire an error-monitoring service here;
 * call sites stay as they are.
 *
 * @param context Where it happened, e.g. `"[NotesSplitView] save failed"`.
 */
export function reportError(context: string, error: unknown): void {
  console.warn(context, error);
}
