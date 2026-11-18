"use client";

import type { RefObject } from "react";

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
  return (
    <>
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Title"
        className="type-h5 text-foreground bg-transparent outline-none border-none placeholder:text-muted-foreground/50 w-full"
      />
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Start typing…"
        className="type-body-2 text-foreground bg-transparent outline-none border-none resize-none flex-1 min-h-[200px] placeholder:text-muted-foreground/50 w-full"
      />
    </>
  );
}
