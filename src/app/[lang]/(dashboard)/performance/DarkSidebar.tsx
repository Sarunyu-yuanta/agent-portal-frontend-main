"use client";

import { SparkleIcon, TargetIcon } from "@phosphor-icons/react";
import { GAP_ITEMS, AI_STEPS } from "./performance-data";

function GapAnalysisSidebar() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TargetIcon size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
          <p className="text-body-sm font-semibold text-white">Gap Analysis</p>
        </div>
        <span
          className="text-meta font-semibold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.45)" }}
        >
          Q2 2025
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-1.5">
        {GAP_ITEMS.map((g) => (
          <div
            key={g.label}
            className="rounded-xl px-4 py-3.5 flex items-center justify-between gap-4"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex flex-col gap-0.5">
              <p className="text-label font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
                {g.label}
              </p>
              <p className="text-meta" style={{ color: "rgba(255,255,255,0.45)" }}>
                {g.sub}
              </p>
            </div>
            <p className="text-[22px] font-semibold leading-none shrink-0" style={{ color: g.color }}>
              {g.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiActionPlan() {
  return (
    <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <div className="flex items-center gap-2">
          <SparkleIcon size={13} weight="fill" style={{ color: "var(--text-brand-primary)" }} />
          <p className="text-body-sm font-semibold text-white">AI Action Plan</p>
        </div>
        <p className="text-meta mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Prioritised steps to close ฿5.8M revenue gap.</p>
      </div>

      <div className="flex flex-col gap-4">
        {AI_STEPS.map((s) => (
          <div key={s.n} className="flex gap-3">
            {/* Number bubble */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)" }}
            >
              <span className="text-meta font-bold" style={{ color: "var(--text-brand-primary)" }}>{s.n}</span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-label font-semibold text-white leading-snug">{s.title}</p>
              <p className="text-meta leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>{s.detail}</p>
              <div className="flex items-center gap-2">
                <button
                  className="text-meta font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.12)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                >
                  {s.cta}
                </button>
                <span className="text-meta font-semibold" style={{ color: "var(--text-success-primary)" }}>{s.impact}</span>
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
    <div className="rounded-2xl p-5 flex flex-col gap-4 lg:sticky lg:top-6" style={{ background: "#1e2337" }}>
      <GapAnalysisSidebar />
      <AiActionPlan />
    </div>
  );
}
