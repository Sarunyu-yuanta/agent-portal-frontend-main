"use client";

import { useState } from "react";
import {
  ShieldCheckIcon,
  FileTextIcon,
  SparkleIcon,
  ArrowRightIcon,
  LockSimpleIcon,
  PaperPlaneRightIcon,
} from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

export function AiGuide() {
  const t = useT();
  const [question, setQuestion] = useState("");
  const guide = t.compliance.guide;
  const steps = guide.steps.map((text, i) => ({ n: i + 1, text }));

  return (
    <div
      className="sticky top-6 flex flex-col gap-5 rounded-2xl p-5"
      style={{ background: "#1e2337" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparkleIcon size={14} weight="fill" style={{ color: "var(--text-brand-primary)" }} />
        <p className="text-body-sm font-semibold text-white">{guide.title}</p>
      </div>

      {/* Active alert context */}
      <div
        className="flex flex-col gap-1 rounded-xl px-4 py-3"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
      >
        <p
          className="text-micro font-bold tracking-widest uppercase"
          style={{ color: "var(--text-danger-primary)" }}
        >
          {guide.activeAlert}
        </p>
        <p className="text-label leading-snug font-semibold text-white">{guide.activeAlertTitle}</p>
        <p className="text-meta leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
          Malee Pongpipat · {guide.riskMismatch}
        </p>
      </div>

      {/* Resolution steps */}
      <div
        className="flex flex-col gap-1"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}
      >
        <p className="mb-2 text-meta font-semibold text-white">{guide.resolutionSteps}</p>
        {steps.map((s) => (
          <div
            key={s.n}
            className="flex gap-3 py-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(129,140,248,0.15)",
                border: "1px solid rgba(129,140,248,0.25)",
              }}
            >
              <span className="text-meta font-bold" style={{ color: "var(--text-brand-primary)" }}>
                {s.n}
              </span>
            </div>
            <p
              className="flex-1 text-meta leading-snug"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              {s.text}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-2">
        {[
          { icon: LockSimpleIcon, ...guide.links.sanctions },
          { icon: FileTextIcon, ...guide.links.docs },
          { icon: ShieldCheckIcon, ...guide.links.escalation },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.label}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <Icon size={14} style={{ color: "rgba(255,255,255,0.45)" }} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-meta font-semibold text-white">{l.label}</p>
                <p className="text-meta" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {l.sub}
                </p>
              </div>
              <ArrowRightIcon
                size={11}
                style={{ color: "rgba(255,255,255,0.25)" }}
                className="shrink-0"
              />
            </button>
          );
        })}
      </div>

      {/* Ask AI */}
      <div
        className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <input
          type="text"
          placeholder={guide.askPlaceholder}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 bg-transparent text-label text-white outline-none placeholder:text-white/30"
        />
        <button
          className="shrink-0 cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => setQuestion("")}
        >
          <PaperPlaneRightIcon
            size={14}
            weight="fill"
            style={{ color: question ? "#818cf8" : "rgba(255,255,255,0.25)" }}
          />
        </button>
      </div>
    </div>
  );
}
