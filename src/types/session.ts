/** The signed-in IC, as the session reports them. */
export type CurrentIc = {
  /** Display name; also what notes, bookings and shares are credited to. */
  name: string;
  /** Shown under the name in the sidebar's account menu. */
  role: string;
  /** The branch and desk code a booking is placed under. */
  team: string;
  /** Avatar initials. */
  initials: string;
};
