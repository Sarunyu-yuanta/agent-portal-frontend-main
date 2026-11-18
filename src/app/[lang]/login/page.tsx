"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "@sarunyu/system-one";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";
import { AuthPendingScreen } from "@/components/AuthPendingScreen";

/** How long the stand-in credential check below pretends to take. */
const MOCK_AUTH_DELAY_MS = 2000;

/**
 * Stands in for the credential check that has no backend yet, so the pending
 * splash gets a realistic dwell instead of flashing past.
 *
 * Deliberately shaped as a promise rather than a bare `setTimeout`, so the
 * delay is how long *this* mock happens to take and not a deadline the splash
 * is tied to: swap the body for the real request and a slow backend simply
 * keeps the splash up for as long as it needs, no other change required.
 */
function signIn(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_AUTH_DELAY_MS));
}

/**
 * No auth backend exists yet (see `src/app/page.tsx`, which just redirects
 * `/` straight to `/client-hub`) — submitting takes the same shortcut rather
 * than pretending to validate credentials against nothing.
 *
 * The push runs inside a transition so the pending splash also covers however
 * long the destination itself takes to resolve, on top of the sign-in wait.
 */
export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsAuthenticating(true);
  }

  // Awaited in an effect rather than in the handler so an unmount mid-request
  // cancels the pending navigation instead of firing it into a dead component.
  // Nothing here races the wait: the splash stays up until `signIn` settles,
  // however long that takes.
  useEffect(() => {
    if (!isAuthenticating) return;
    let cancelled = false;

    signIn()
      .then(() => {
        if (cancelled) return;
        startTransition(() => {
          router.push("/client-hub");
        });
      })
      // Drop back to the form on failure so a rejected request can't strand
      // the user on the splash forever. There's no error copy in the design
      // yet; surface the reason here once there is.
      .catch(() => {
        if (!cancelled) setIsAuthenticating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticating, router]);

  return (
    <AuthShell>
      <h1 className="type-h4 text-foreground">เข้าสู่ระบบ IC Portal</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          placeholder="รหัสพนักงาน"
          value={identifier}
          onChange={setIdentifier}
          required
        />

        <div className="flex flex-col gap-3">
          <Input
            placeholder="รหัสผ่าน"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon size={20} />
                ) : (
                  <EyeIcon size={20} />
                )}
              </button>
            }
          />
          <Link
            href="/forgot-password"
            className="self-end text-sm font-semibold text-primary-action hover:underline"
          >
            ลืมรหัสผ่าน
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-6"
          disabled={isAuthenticating || isPending}
        >
          เข้าสู่ระบบ
        </Button>
      </form>

      <p className="type-description text-center text-muted-foreground">
        ©Copyright 2016 Yuanta Securities (Thailand). All Rights Reserved
      </p>

      {(isAuthenticating || isPending) && <AuthPendingScreen />}
    </AuthShell>
  );
}
