"use client";

import { SparkleIcon, TargetIcon } from "@phosphor-icons/react";
import { GAP_ITEMS, AI_STEPS } from "@/features/performance/lib/performance-data";
import { useT } from "@/i18n/I18nProvider";

function GapAnalysisSidebar() {
  const t = useT();
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TargetIcon size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
          <p className="text-body-sm font-semibold text-white">{t.performance.gap.title}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-meta font-semibold"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
        >
          Q2 2025
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-1.5">
        {GAP_ITEMS.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-label font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
                {t.performance.gap.items[g.id].label}
              </p>
              <p className="text-meta" style={{ color: "rgba(255,255,255,0.45)" }}>
                {t.performance.gap.items[g.id].sub}
              </p>
            </div>
            <p
              className="shrink-0 text-[22px] leading-none font-semibold"
              style={{ color: g.color }}
            >
              {g.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiActionPlan() {
  const t = useT();
  return (
    <div
      className="flex flex-col gap-4 pt-4"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div>
        <div className="flex items-center gap-2">
          <SparkleIcon size={13} weight="fill" style={{ color: "var(--text-brand-primary)" }} />
          <p className="text-body-sm font-semibold text-white">{t.performance.actionPlan.title}</p>
        </div>
        <p className="mt-0.5 text-meta" style={{ color: "rgba(255,255,255,0.4)" }}>
          {t.performance.actionPlan.subtitle("฿5.8M")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {AI_STEPS.map((s) => (
          <div key={s.n} className="flex gap-3">
            {/* Number bubble */}
            <div
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(129,140,248,0.2)",
                border: "1px solid rgba(129,140,248,0.3)",
              }}
            >
              <span className="text-meta font-bold" style={{ color: "var(--text-brand-primary)" }}>
                {s.n}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-label leading-snug font-semibold text-white">{s.title}</p>
              <p className="text-meta leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
                {s.detail}
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-meta font-semibold transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.13)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                  }
                >
                  {s.cta}
                </button>
                <span
                  className="text-meta font-semibold"
                  style={{ color: "var(--text-success-primary)" }}
                >
                  {s.impact}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dark navy sidebar: gap analysis + AI action plan. */
export function DarkSidebar() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 lg:sticky lg:top-6"
      style={{ background: "#1e2337" }}
    >
      <GapAnalysisSidebar />
      <AiActionPlan />
    </div>
  );
}
