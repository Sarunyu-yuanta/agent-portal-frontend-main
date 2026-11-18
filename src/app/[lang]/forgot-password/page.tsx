"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@sarunyu/system-one";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** No auth backend exists yet — submitting just flips to the confirmation state. */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The design system's `Input` `required` prop only draws the red asterisk —
   * it doesn't set the native `required` attribute, so the browser never
   * blocks submission on its own. Validate by hand instead.
   */
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("กรุณากรอกอีเมล");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setError("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    setError(null);
    setSubmitted(true);
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
            <h1 className="type-h4 text-foreground">ส่งอีเมลแล้ว</h1>
            <p className="text-sm text-muted-foreground">
              หากอีเมล <span className="font-semibold text-foreground">{email}</span> มีอยู่ในระบบ
              เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องขาเข้าของคุณ
            </p>
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/login")}>
            เข้าสู่ระบบ
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="type-h4 text-foreground">ลืมรหัสผ่าน</h1>
            <p className="text-sm text-muted-foreground">
              กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <Input
              placeholder="อีเมล"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              forceState={error ? "error" : undefined}
              errorMessage={error ?? undefined}
            />

            <div className="flex flex-col gap-2 mt-6">
              <Button type="submit" variant="primary" size="lg" className="w-full">
                ส่งลิงก์รีเซ็ตรหัสผ่าน
              </Button>
              <Button
                type="button"
                variant="plain"
                size="lg"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                เข้าสู่ระบบ
              </Button>
            </div>
          </form>
        </>
      )}

      <p className="type-description text-center text-muted-foreground">
        ©Copyright 2016 Yuanta Securities (Thailand). All Rights Reserved
      </p>
    </AuthShell>
  );
}
