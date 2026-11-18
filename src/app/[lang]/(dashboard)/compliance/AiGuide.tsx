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

const GUIDE_STEPS = [
  { n: 1, text: "Review client transaction history for anomalies" },
  { n: 2, text: "Cross-reference sanctions & adverse media databases" },
  { n: 3, text: "Prepare & upload documentation checklist" },
  { n: 4, text: "Escalate to compliance officer with full report" },
];

export function AiGuide() {
  const [question, setQuestion] = useState("");

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-5 sticky top-6" style={{ background: "#1e2337" }}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparkleIcon size={14} weight="fill" style={{ color: "var(--text-brand-primary)" }} />
        <p className="text-body-sm font-semibold text-white">AI Compliance Guide</p>
      </div>

      {/* Active alert context */}
      <div
        className="rounded-xl px-4 py-3 flex flex-col gap-1"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
      >
        <p className="text-micro font-bold uppercase tracking-widest" style={{ color: "var(--text-danger-primary)" }}>Active Alert</p>
        <p className="text-label font-semibold text-white leading-snug">Unsuitable Trade Blocked</p>
        <p className="text-meta leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>Malee Pongpipat · Risk mismatch</p>
      </div>

      {/* Resolution steps */}
      <div className="flex flex-col gap-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
        <p className="text-meta font-semibold text-white mb-2">Resolution Steps</p>
        {GUIDE_STEPS.map((s) => (
          <div key={s.n} className="flex gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.25)" }}
            >
              <span className="text-meta font-bold" style={{ color: "var(--text-brand-primary)" }}>{s.n}</span>
            </div>
            <p className="text-meta leading-snug flex-1" style={{ color: "rgba(255,255,255,0.65)" }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex flex-col gap-2">
        {[
          { icon: LockSimpleIcon, label: "Sanctions Database", sub: "Search adverse media" },
          { icon: FileTextIcon,   label: "Doc Checklist",      sub: "KYC requirements" },
          { icon: ShieldCheckIcon, label: "Escalation Form",   sub: "Compliance officer" },
        ].map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.label}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-left transition-colors cursor-pointer"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <Icon size={14} style={{ color: "rgba(255,255,255,0.45)" }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-meta font-semibold text-white">{l.label}</p>
                <p className="text-meta" style={{ color: "rgba(255,255,255,0.35)" }}>{l.sub}</p>
              </div>
              <ArrowRightIcon size={11} style={{ color: "rgba(255,255,255,0.25)" }} className="shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Ask AI */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5 mt-auto"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <input
          type="text"
          placeholder="Ask compliance AI…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 bg-transparent text-label text-white placeholder:text-white/30 outline-none"
        />
        <button
          className="shrink-0 cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => setQuestion("")}
        >
          <PaperPlaneRightIcon size={14} weight="fill" style={{ color: question ? "#818cf8" : "rgba(255,255,255,0.25)" }} />
        </button>
      </div>
    </div>
  );
}
