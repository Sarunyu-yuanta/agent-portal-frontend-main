import type { ReactNode } from "react";

/**
 * Steps that come before the client list, in the same modal — Order
 * Management's "สร้าง Order" asks for the asset and the product first. They are
 * leading panes of the booking's own track, so the whole flow slides as one
 * instead of one modal closing and another opening.
 */
export type BookingLead = {
  /** One pane per step, in order. */
  panes: ReactNode[];
  /** The lead step showing, or `null` once a product is chosen. */
  index: number | null;
  /** The modal's title while a lead step is showing. */
  title: string;
  /** Back from the lead step showing, when there is a step before it. */
  onBack?: () => void;
};
