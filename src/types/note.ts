/** A note an IC/RM writes — about any number of clients, or none (a general note). */
export type Note = {
  id: string;
  /**
   * Client ids this note is filed under. Empty means a general note.
   *
   * A list rather than a single nullable id: one conversation often covers
   * several clients, and duplicating the note per client would mean editing it
   * in several places.
   */
  clientIds: string[];
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  reminderAt: string | null;
  reminderDone: boolean;
};
