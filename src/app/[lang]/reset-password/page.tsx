"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@sarunyu/system-one";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/AuthShell";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Reached via the reset link emailed from `/forgot-password`. No auth backend
 * exists yet (nor a way to verify the link's token) — submitting just flips to
 * the confirmation state like the rest of this mocked auth flow.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    let hasError = false;
    if (!password) {
      setPasswordError("กรุณากรอกรหัสผ่าน");
      hasError = true;
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร`);
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmError("กรุณายืนยันรหัสผ่าน");
      hasError = true;
    } else if (confirmPassword !== password) {
      setConfirmError("รหัสผ่านไม่ตรงกัน");
      hasError = true;
    } else {
      setConfirmError(null);
    }

    if (hasError) return;
    setSubmitted(true);
  }

  return (
    <AuthShell>
      {submitted ? (
        <>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircleIcon size={48} className="text-success" weight="fill" />
            <h1 className="type-h4 text-foreground">เปลี่ยนรหัสผ่านสำเร็จ</h1>
            <p className="text-sm text-muted-foreground">
              คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที
            </p>
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={() => router.push("/login")}>
            เข้าสู่ระบบ
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="type-h4 text-foreground">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-sm text-muted-foreground">กรุณาตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <Input
              placeholder="รหัสผ่านใหม่"
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
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              }
            />

            <Input
              placeholder="ยืนยันรหัสผ่านใหม่"
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
                  aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeSlashIcon size={20} /> : <EyeIcon size={20} />}
                </button>
              }
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-6">
              บันทึกรหัสผ่านใหม่
            </Button>
          </form>
        </>
      )}

      <p className="type-description text-center text-muted-foreground">
        ©Copyright 2016 Yuanta Securities (Thailand). All Rights Reserved
      </p>
    </AuthShell>
  );
}
