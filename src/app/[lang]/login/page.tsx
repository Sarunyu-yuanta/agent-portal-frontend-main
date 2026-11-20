"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { LocaleLink as Link } from "@/i18n/navigation";
import { Alert, Button, Input } from "@sarunyu/system-one";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";
import { AuthPendingScreen } from "@/components/AuthPendingScreen";
import { useT } from "@/i18n/I18nProvider";

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
 * Why a sign-in was refused. The real `signIn` should reject with one of these
 * so the form can say something useful; anything else is treated as the
 * connection failing.
 */
class SignInError extends Error {
  constructor(readonly reason: "credentials" | "locked") {
    super(reason);
    this.name = "SignInError";
  }
}

/**
 * No auth backend exists yet, so submitting goes straight to the home page
 * `/` (`src/app/[lang]/page.tsx`, which decides where home is) rather than
 * pretending to validate credentials against nothing.
 *
 * The push runs inside a transition so the pending splash also covers however
 * long the destination itself takes to resolve, on top of the sign-in wait.
 */
export default function LoginPage() {
  const router = useLocalizedRouter();
  const t = useT();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Why the last attempt failed. Cleared as soon as either field changes, so
  // the message never sits under credentials it no longer describes.
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
          router.push("/");
        });
      })
      // Back to the form, saying why — a silent return to an untouched form
      // reads as the click not having registered, so people just press again.
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof SignInError ? t.auth.errors[err.reason] : t.auth.errors.network);
        setIsAuthenticating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticating, router, t]);

  return (
    <AuthShell>
      <h1 className="type-h4 text-foreground">{t.auth.loginTitle}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && <Alert status="critical" message={error} multiline />}
        <Input
          placeholder={t.auth.employeeId}
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            setError(null);
          }}
          required
        />

        <div className="flex flex-col gap-3">
          <Input
            placeholder={t.auth.password}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError(null);
            }}
            required
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            }
          />
          <Link
            href="/forgot-password"
            className="text-primary-action self-end text-sm font-semibold hover:underline"
          >
            {t.auth.forgotPassword}
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          disabled={isAuthenticating || isPending}
        >
          {t.auth.login}
        </Button>
      </form>

      <p className="type-description text-center text-muted-foreground">{t.auth.copyright}</p>

      {(isAuthenticating || isPending) && <AuthPendingScreen label={t.auth.signingIn} />}
    </AuthShell>
  );
}
