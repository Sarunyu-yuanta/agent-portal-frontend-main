"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { CurrentIc } from "@/types/session";
import { currentIcEndpoint } from "@/features/auth/api/session.api";

const SIGNED_OUT: CurrentIc = { name: "", role: "", team: "", initials: "" };

/**
 * The signed-in IC. Everything this IC authors (notes, bookings, shares) is
 * credited to `name`, and "my items" filters compare against it.
 */
export function useCurrentIc(): CurrentIc {
  return useEndpoint(currentIcEndpoint, [], { fallback: SIGNED_OUT }).data;
}
