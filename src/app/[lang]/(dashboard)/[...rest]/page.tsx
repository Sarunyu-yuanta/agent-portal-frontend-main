import { notFound } from "next/navigation";

/**
 * Any path under a language that matches no route. Calling `notFound()` here
 * renders `(dashboard)/not-found.tsx` — in the right language, with the sidebar
 * still there — rather than Next's bare default 404. Lives inside the dashboard
 * group for exactly that reason; the real routes beside it always win over a
 * catch-all.
 */
export default function CatchAll() {
  notFound();
}
