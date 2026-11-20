import { useState } from "react";
import type { ToastProps } from "@sarunyu/system-one";

/** A page's local toast queue — the same `useState`+`crypto.randomUUID()` list
 *  every note-editing surface (`NoteEditModal`, `NotesSplitView`, `ClientNotesTab`,
 *  `CalendarView`) built independently, hoisted so they stay in step. */
export function useToasts() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const addToast = (props: Omit<ToastProps, "onClose">) =>
    setToasts((prev) => [...prev, { ...props, id: crypto.randomUUID() }]);

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return { toasts, addToast, removeToast };
}
