"use client";

// ─────────────────────────────────────────────────────────────────────────────
// InsightCard — The core UI unit of HealthMapr
// Each card answers ONE question with a headline, message, and action.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import type { InsightObject, InsightSeverity, InsightType } from "@/lib/types";

// ── Severity config ───────────────────────────────────────────────────────────

interface SeverityConfig {
  dot: string;
  border: string;
  glow: string;
  badge: string;
  badgeText: string;
  label: string;
}

const SEVERITY_CONFIG: Record<InsightSeverity, SeverityConfig> = {
  critical: {
    dot: "bg-[#FF453A]",
    border: "border-[#FF453A]/20",
    glow: "shadow-[0_0_20px_rgba(255,69,58,0.12)]",
    badge: "bg-[#FF453A]/15",
    badgeText: "text-[#FF453A]",
    label: "Critical",
  },
  warning: {
    dot: "bg-[#FFD60A]",
    border: "border-[#FFD60A]/20",
    glow: "shadow-[0_0_20px_rgba(255,214,10,0.08)]",
    badge: "bg-[#FFD60A]/15",
    badgeText: "text-[#FFD60A]",
    label: "Needs attention",
  },
  info: {
    dot: "bg-[#0A84FF]",
    border: "border-[#0A84FF]/20",
    glow: "shadow-[0_0_20px_rgba(10,132,255,0.08)]",
    badge: "bg-[#0A84FF]/15",
    badgeText: "text-[#0A84FF]",
    label: "Info",
  },
  positive: {
    dot: "bg-[#30D158]",
    border: "border-[#30D158]/20",
    glow: "shadow-[0_0_20px_rgba(48,209,88,0.08)]",
    badge: "bg-[#30D158]/15",
    badgeText: "text-[#30D158]",
    label: "On track",
  },
};

// ── Type icons ────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<InsightType, string> = {
  recovery: "🌙",
  energy_balance: "⚡",
  activity: "🏃",
  weight: "⚖️",
  fatigue_risk: "🔥",
  positive: "✓",
};

// ── Trend indicator ───────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend?: InsightObject["trend"] }) {
  if (!trend) return null;
  const map = {
    improving: { icon: "↑", color: "text-[#30D158]", label: "Improving" },
    declining: { icon: "↓", color: "text-[#FF453A]", label: "Declining" },
    stable: { icon: "→", color: "text-[rgba(255,255,255,0.4)]", label: "Stable" },
  };
  const t = map[trend];
  return (
    <span className={`text-xs font-medium ${t.color} flex items-center gap-1`}>
      <span>{t.icon}</span>
      <span>{t.label}</span>
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: InsightObject;
  /** Animation delay for staggered entrance */
  delay?: number;
}

export function InsightCard({ insight, delay = 0 }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[insight.severity];
  const icon = TYPE_ICON[insight.type];

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className={`
        w-full text-left
        glass-card
        border ${cfg.border} ${cfg.glow}
        p-5
        animate-slide-up
        focus:outline-none focus:ring-2 focus:ring-white/10
        transition-all duration-300
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
      aria-expanded={expanded}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Severity dot */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${cfg.dot}`} />

          {/* Type icon + headline */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">{icon}</span>
              <span
                className={`
                  text-[10px] font-semibold tracking-widest uppercase
                  px-2 py-0.5 rounded-full
                  ${cfg.badge} ${cfg.badgeText}
                `}
              >
                {cfg.label}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-white/90 leading-snug">
              {insight.headline}
            </h3>
          </div>
        </div>

        {/* Expand chevron */}
        <div
          className={`
            flex-shrink-0 w-6 h-6 rounded-full
            bg-white/5 border border-white/10
            flex items-center justify-center
            transition-transform duration-300
            ${expanded ? "rotate-180" : "rotate-0"}
          `}
        >
          <svg
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            className="text-white/40"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* ── Message ── */}
      <p className="text-[13.5px] text-white/60 leading-relaxed pl-5 mb-3">
        {insight.message}
      </p>

      {/* ── Trend + collapsed hint ── */}
      <div className="pl-5 flex items-center justify-between">
        <TrendBadge trend={insight.trend} />
        {!expanded && (
          <span className="text-[11px] text-white/25">Tap for action →</span>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.07] animate-fade-in">
          {/* Recommendation */}
          <div className="pl-5 mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
              Recommended action
            </div>
            <p className="text-[13.5px] text-white/80 leading-relaxed">
              {insight.recommendation}
            </p>
          </div>

          {/* Data points grid */}
          {insight.dataPoints.length > 0 && (
            <div className="pl-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
                Supporting data
              </div>
              <div className="grid grid-cols-2 gap-2">
                {insight.dataPoints.map((dp, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.04] rounded-xl px-3 py-2.5 border border-white/[0.06]"
                  >
                    <div className="text-[10px] text-white/35 mb-0.5">{dp.label}</div>
                    <div className="text-[14px] font-semibold text-white/85">{dp.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function InsightEmptyState() {
  return (
    <div className="glass-card p-8 text-center animate-fade-in">
      <div className="text-3xl mb-3">🎯</div>
      <div className="text-[15px] font-semibold text-white/80 mb-1">
        No insights yet
      </div>
      <p className="text-[13px] text-white/40">
        Log a few days of data and your personal health analysis will appear here.
      </p>
    </div>
  );
}
