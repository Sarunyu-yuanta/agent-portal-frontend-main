/**
 * Authentication commands. All three are stand-ins until the auth backend
 * exists; add an `http` implementation to each to connect it.
 */

import { defineMutation } from "@/lib/api/mutation";

/** Why a sign-in was refused. Anything else is treated as the connection failing. */
export class SignInError extends Error {
  constructor(readonly reason: "credentials" | "locked") {
    super(reason);
    this.name = "SignInError";
  }
}

/** The reset link can't be used — expired, already used, or not a real token. */
export class ResetLinkError extends Error {
  constructor() {
    super("reset link invalid");
    this.name = "ResetLinkError";
  }
}

export type Credentials = { identifier: string; password: string };

/**
 * How long the stand-in credential check takes, so the pending splash gets a
 * realistic dwell. A slow real backend keeps the splash up as long as it needs.
 */
const MOCK_AUTH_DELAY_MS = 2000;

/** Rejects with {@link SignInError} when the credentials are refused. */
export const signIn = defineMutation({
  mock: (_credentials: Credentials) =>
    new Promise<void>((resolve) => setTimeout(resolve, MOCK_AUTH_DELAY_MS)),
});

/**
 * Requests a reset link. Must answer the same whether or not the email is on
 * file (the confirmation copy is worded for that); rejects only on failure.
 */
export const requestPasswordReset = defineMutation({
  mock: (_email: string) => Promise.resolve(),
});

/** Sets the new password. Rejects with {@link ResetLinkError} for a bad `token`. */
export const resetPassword = defineMutation({
  mock: (_token: string, _password: string) => Promise.resolve(),
});
