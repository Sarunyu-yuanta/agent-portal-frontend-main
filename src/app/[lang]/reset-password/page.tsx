"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/i18n/navigation";
import { Alert, Button, Input } from "@sarunyu/system-one";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, LinkBreakIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";
import { useT } from "@/i18n/I18nProvider";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Stands in for setting the new password, which has no backend yet. The real
 * one verifies `token` and rejects with a {@link ResetLinkError} when the link
 * is expired or already used.
 */
function resetPassword(_token: string, _password: string): Promise<void> {
  return Promise.resolve();
}

/** The link can't be used — expired, already used, or not a real token. */
class ResetLinkError extends Error {
  constructor() {
    super("reset link invalid");
    this.name = "ResetLinkError";
  }
}

/**
 * Reached via the reset link emailed from `/forgot-password`, which carries a
 * `?token=`. `useSearchParams` needs a Suspense boundary above it.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useLocalizedRouter();
  const t = useT();
  const token = useSearchParams().get("token");
  // The link was refused by the server (as opposed to a field being wrong).
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !token) return;

    let hasError = false;
    if (!password) {
      setPasswordError(t.auth.reset.passwordRequired);
      hasError = true;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(t.auth.reset.passwordTooShort(MIN_PASSWORD_LENGTH));
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmError(t.auth.reset.confirmRequired);
      hasError = true;
    } else if (confirmPassword !== password) {
      setConfirmError(t.auth.reset.mismatch);
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;
    setRequestError(null);
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSubmitted(true);
    } catch (err) {
      console.warn("[reset-password]", err);
      if (err instanceof ResetLinkError) setLinkInvalid(true);
      else setRequestError(t.auth.reset.requestFailed);
    } finally {
      setSubmitting(false);
    }
  }

  // No token in the link, or the server refused it: nothing on this page can
  // succeed, so say so and point at the one thing that will work.
  if (!token || linkInvalid) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <LinkBreakIcon size={48} weight="duotone" className="text-[var(--text-danger-primary)]" />
          <h1 className="type-h4 text-foreground">{t.auth.reset.invalidTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.reset.invalidBody}</p>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => router.push("/forgot-password")}
        >
          {t.auth.reset.requestNew}
        </Button>
        <p className="type-description text-center text-muted-foreground">{t.auth.copyright}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      {submitted ? (
        <>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircleIcon size={48} className="text-success" weight="fill" />
            <h1 className="type-h4 text-foreground">{t.auth.reset.doneTitle}</h1>
            <p className="text-sm text-muted-foreground">{t.auth.reset.doneBody}</p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push("/login")}
          >
            {t.auth.login}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="type-h4 text-foreground">{t.auth.reset.title}</h1>
            <p className="text-sm text-muted-foreground">{t.auth.reset.body}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            {requestError && <Alert status="critical" message={requestError} multiline />}
            <Input
              placeholder={t.auth.reset.newPassword}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(null);
              }}
              required
              forceState={passwordError ? "error" : undefined}
              errorMessage={passwordError ?? undefined}
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

            <Input
              placeholder={t.auth.reset.confirmPassword}
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (confirmError) setConfirmError(null);
              }}
              required
              forceState={confirmError ? "error" : undefined}
              errorMessage={confirmError ?? undefined}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  aria-label={showConfirmPassword ? t.auth.hidePassword : t.auth.showPassword}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              disabled={submitting}
            >
              {submitting ? t.common.saving : t.auth.reset.submit}
            </Button>
          </form>
        </>
      )}

      <p className="type-description text-center text-muted-foreground">{t.auth.copyright}</p>
    </AuthShell>
  );
}
