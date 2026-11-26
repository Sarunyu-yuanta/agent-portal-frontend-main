"use client";

import { useEffect } from "react";
import { initUsabilityTest } from "@/lib/usability-test";

/** USABILITY-TEST ONLY — temporary; revert after testing. Picks up `?ut=1` on first load. */
export function UsabilityTestFlag() {
  useEffect(() => {
    initUsabilityTest();
  }, []);
  return null;
}
