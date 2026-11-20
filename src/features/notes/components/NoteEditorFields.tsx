"use client";

import type { RefObject } from "react";
import { useT } from "@/i18n/I18nProvider";

/**
 * The writing surface of a note: an untitled-looking Title line and the body
 * under it. No labels, no boxes — a note should look like a piece of paper, not
 * a form.
 *
 * Shared so the detail pane and the quick-note dialog are the same editor rather
 * than two that were styled to match and can drift apart. Callers own the state
 * and decide what saving means: the pane debounces onto an existing note, the
 * dialog holds a draft until it's submitted.
 *
 * The body is `flex-1`, so the caller's container has to be a flex column.
 */
export function NoteEditorFields({
  title,
  body,
  onTitleChange,
  onBodyChange,
  titleRef,
}: {
  title: string;
  body: string;
  onTitleChange: (next: string) => void;
  onBodyChange: (next: string) => void;
  /** Lets the caller place the caret here on open. */
  titleRef?: RefObject<HTMLInputElement | null>;
}) {
  const t = useT();
  return (
    <>
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t.planner.notes.fields.title}
        className="type-h5 w-full border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder={t.planner.notes.fields.body}
        className="type-body-2 min-h-[200px] w-full flex-1 resize-none border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
      />
    </>
  );
}
