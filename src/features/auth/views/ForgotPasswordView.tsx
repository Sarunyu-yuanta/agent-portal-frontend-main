"use client";

import { useState, type FormEvent } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { Alert, Button, Input } from "@sarunyu/system-one";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { useT } from "@/i18n/I18nProvider";
import { requestPasswordReset } from "@/features/auth/api/auth.api";
import { reportError } from "@/lib/report-error";
import { ROUTES } from "@/lib/routes";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** No auth backend exists yet — submitting just flips to the confirmation state. */
export function ForgotPasswordView() {
  const router = useLocalizedRouter();
  const t = useT();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The request failed (not "no such email" — that is never revealed).
  const [requestError, setRequestError] = useState<string | null>(null);

  /**
   * The design system's `Input` `required` prop only draws the red asterisk —
   * it doesn't set the native `required` attribute, so the browser never
   * blocks submission on its own. Validate by hand instead.
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t.auth.forgot.emailRequired);
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError(t.auth.forgot.emailInvalid);
      return;
    }
    setError(null);
    setRequestError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(trimmed);
      setSubmitted(true);
    } catch (err) {
      reportError("[forgot-password]", err);
      setRequestError(t.auth.forgot.requestFailed);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (error) setError(null);
  }

  return (
    <AuthShell>
      {submitted ? (
        <>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircleIcon size={48} className="text-success" weight="fill" />
            <h1 className="type-h4 text-foreground">{t.auth.forgot.sentTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {t.auth.forgot.sentBodyBefore}{" "}
              <span className="font-semibold text-foreground">{email}</span>{" "}
              {t.auth.forgot.sentBodyAfter}
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push(ROUTES.login)}
          >
            {t.auth.login}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="type-h4 text-foreground">{t.auth.forgot.title}</h1>
            <p className="text-sm text-muted-foreground">{t.auth.forgot.body}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            {requestError && <Alert status="critical" message={requestError} multiline />}
            <Input
              placeholder={t.auth.forgot.email}
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              forceState={error ? "error" : undefined}
              errorMessage={error ?? undefined}
            />

            <div className="mt-6 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? t.common.sending : t.auth.forgot.submit}
              </Button>
              <Button
                type="button"
                variant="plain"
                size="lg"
                className="w-full"
                onClick={() => router.push(ROUTES.login)}
              >
                {t.auth.login}
              </Button>
            </div>
          </form>
        </>
      )}

      <p className="type-description text-center text-muted-foreground">{t.auth.copyright}</p>
    </AuthShell>
  );
}
