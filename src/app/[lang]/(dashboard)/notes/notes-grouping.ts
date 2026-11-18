import type { Note } from "@/types/domain";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type NoteGroup = { label: string; notes: Note[] };

/**
 * Buckets notes into Apple-Notes-style date groups (Today / Yesterday /
 * Previous 7 Days / Previous 30 Days / month-year), sorted by most recently
 * edited first — editing a note bumps it back to the top of "Today".
 */
export function groupNotesByDate(notes: Note[]): NoteGroup[] {
  const sorted = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const today = startOfDay(new Date());
  const buckets = new Map<string, Note[]>();
  const order: string[] = [];

  for (const note of sorted) {
    const day = startOfDay(new Date(note.updatedAt));
    const diffDays = Math.round((today.getTime() - day.getTime()) / DAY_MS);

    let label: string;
    if (diffDays <= 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays <= 7) label = "Previous 7 Days";
    else if (diffDays <= 30) label = "Previous 30 Days";
    else label = day.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(note);
  }

  return order.map((label) => ({ label, notes: buckets.get(label) ?? [] }));
}

/** First non-blank line of the body, truncated — the grey preview line under a note's title. */
export function snippet(body: string, max = 60): string {
  const firstLine = body.split("\n").find((line) => line.trim().length > 0) ?? "";
  const trimmed = firstLine.trim();
  if (!trimmed) return "No additional text";
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}
