"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Trends — Simple sparkline view of the last 30 days
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { getMetrics } from "@/lib/storage";
import { formatHours, formatWeight } from "@/lib/health/calculations";
import type { DailyMetric } from "@/lib/types";

type TrendField = "sleep_hours" | "steps" | "calories_in" | "weight_kg";

interface TrendConfig {
  key: TrendField;
  label: string;
  icon: string;
  format: (v: number) => string;
  color: string;
  fill: string;
}

const TREND_CONFIGS: TrendConfig[] = [
  {
    key: "sleep_hours",
    label: "Sleep",
    icon: "🌙",
    format: formatHours,
    color: "#BF5AF2",
    fill: "rgba(191,90,242,0.15)",
  },
  {
    key: "steps",
    label: "Steps",
    icon: "🏃",
    format: (v) => `${Math.round(v / 1000 * 10) / 10}k`,
    color: "#0A84FF",
    fill: "rgba(10,132,255,0.15)",
  },
  {
    key: "calories_in",
    label: "Calories",
    icon: "⚡",
    format: (v) => `${Math.round(v)} kcal`,
    color: "#FFD60A",
    fill: "rgba(255,214,10,0.15)",
  },
  {
    key: "weight_kg",
    label: "Weight",
    icon: "⚖️",
    format: formatWeight,
    color: "#30D158",
    fill: "rgba(48,209,88,0.15)",
  },
];

// ── Mini sparkline ────────────────────────────────────────────────────────────

function Sparkline({
  values,
  color,
  fill,
  height = 56,
}: {
  values: number[];
  color: string;
  fill: string;
  height?: number;
}) {
  if (values.length < 2) return null;

  const width = 280;
  const padX = 4;
  const padY = 6;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * innerW;
    const y = padY + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  // Area under the curve
  const first = points[0].split(",");
  const last = points[points.length - 1].split(",");
  const areaD = `${pathD} L ${last[0]},${height} L ${first[0]},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <path d={areaD} fill={fill} />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Latest dot */}
      <circle
        cx={parseFloat(last[0])}
        cy={parseFloat(last[1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// ── Trend Card ────────────────────────────────────────────────────────────────

function TrendCard({
  config,
  metrics,
}: {
  config: TrendConfig;
  metrics: DailyMetric[];
}) {
  const values = metrics
    .map((m) => m[config.key])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{config.icon}</span>
          <span className="text-[14px] font-semibold text-white/70">{config.label}</span>
        </div>
        <p className="text-[12px] text-white/25">No data yet</p>
      </div>
    );
  }

  const latest = values[values.length - 1];
  const prev = values.length >= 7 ? values[values.length - 7] : values[0];
  const change = ((latest - prev) / (prev || 1)) * 100;
  const changeStr = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  const changeColor = change === 0 ? "text-white/30" : config.key === "weight_kg"
    ? (change < 0 ? "text-[#30D158]" : "text-[#FF453A]")
    : (change > 0 ? "text-[#30D158]" : "text-[#FF453A]");

  return (
    <div className="glass-card p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-[13px] font-semibold text-white/60">{config.label}</span>
        </div>
        <span className={`text-[11px] font-semibold ${changeColor}`}>
          {changeStr} <span className="text-white/25 font-normal">7d</span>
        </span>
      </div>

      <div className="text-[24px] font-bold text-white/90 mb-3" style={{ color: config.color }}>
        {config.format(latest)}
      </div>

      <Sparkline values={values} color={config.color} fill={config.fill} />

      <div className="flex justify-between mt-1 text-[10px] text-white/20">
        <span>{metrics[0]?.date?.slice(5).replace("-", "/") ?? ""}</span>
        <span>{metrics[metrics.length - 1]?.date?.slice(5).replace("-", "/") ?? ""}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);

  useEffect(() => {
    setMetrics(getMetrics().slice(-30));
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-[28px] font-bold text-white/95">Trends</h1>
        <p className="text-[13px] text-white/40 mt-1">Last 30 days</p>
      </div>

      {metrics.length === 0 ? (
        <div className="px-5">
          <div className="glass-card p-8 text-center">
            <div className="text-3xl mb-3">📈</div>
            <div className="text-[15px] font-semibold text-white/70 mb-1">
              No data to chart yet
            </div>
            <p className="text-[13px] text-white/35">
              Start logging daily metrics and your trends will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TREND_CONFIGS.map((cfg, i) => (
            <div key={cfg.key} style={{ animationDelay: `${i * 80}ms` }}>
              <TrendCard config={cfg} metrics={metrics} />
            </div>
          ))}
        </div>
      )}

      <Nav />
    </div>
  );
}
