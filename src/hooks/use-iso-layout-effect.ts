"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` on the client, `useEffect` on the server.
 *
 * React warns when `useLayoutEffect` runs during server rendering, and there is
 * no layout to measure there anyway — so anything that measures before paint
 * needs this swap. Six files had written it out for themselves before it was
 * given a home; they were byte-identical, which is six places to fix if the
 * shim ever needs to change and five chances to miss one.
 */
export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
