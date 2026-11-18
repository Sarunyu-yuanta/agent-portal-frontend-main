"use client";

import { Button } from "@sarunyu/system-one";
import { HouseIcon } from "@phosphor-icons/react";
import { useLocale, useT } from "@/i18n/I18nProvider";

export default function NotFound() {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-[var(--bg-default-secondary)] px-4">
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-ic-portal-blue.svg"
        alt="Yuanta"
        className="w-auto h-9 opacity-70"
      />

      {/* Content */}
      <div className="flex flex-col items-center gap-5 max-w-xs text-center">
        <span
          className="text-[120px] font-bold leading-none select-none"
          style={{ color: "var(--primary-action)", opacity: 0.22 }}
        >
          404
        </span>

        <div className="flex flex-col gap-2">
          <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">
            {t.states.notFoundPage}
          </p>
          <p className="type-body-2 text-[var(--text-default-tertiary)]">
            {t.states.notFoundPageBody}
          </p>
        </div>

        <div className="flex items-center justify-center mt-1">
          <Button
            variant="outline"
            size="lg"
            leftIcon={<HouseIcon size={20} />}
            onClick={() => { window.location.href = `/${locale}`; }}
          >
            {t.common.backHome}
          </Button>
        </div>
      </div>
    </div>
  );
}
