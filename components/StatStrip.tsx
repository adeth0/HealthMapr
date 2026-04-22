"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StatStrip — Horizontal summary strip of the 4 key daily metrics
// ─────────────────────────────────────────────────────────────────────────────

import type { HealthStats } from "@/lib/types";
import {
  formatCalories,
  formatHours,
  formatSteps,
  formatWeight,
} from "@/lib/health/calculations";

interface StatPillProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function StatPill({ label, value, sub, color = "text-white/90" }: StatPillProps) {
  return (
    <div
      className="
        flex-shrink-0 flex flex-col items-center
        bg-white/[0.04] border border-white/[0.07]
        rounded-2xl px-4 py-3
        min-w-[80px]
      "
    >
      <div className={`text-[18px] font-semibold tabular-nums ${color}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-white/35 font-medium mt-0.5">{sub}</div>
      )}
      <div className="text-[10px] text-white/35 font-medium tracking-wide uppercase mt-1">
        {label}
      </div>
    </div>
  );
}

interface StatStripProps {
  stats: HealthStats;
}

export function StatStrip({ stats }: StatStripProps) {
  const {
    avgSleep7d,
    avgSteps7d,
    avgCaloriesIn7d,
    latestWeight,
    weightChange7d,
    tdee,
    netCalorieBalance7d,
  } = stats;

  const weightColor =
    weightChange7d === null
      ? "text-white/90"
      : weightChange7d < 0
      ? "text-[#30D158]"
      : weightChange7d > 0.3
      ? "text-[#FF453A]"
      : "text-white/90";

  const sleepColor =
    avgSleep7d < 6
      ? "text-[#FF453A]"
      : avgSleep7d < 7
      ? "text-[#FFD60A]"
      : "text-[#30D158]";

  const calColor =
    netCalorieBalance7d < -(tdee * 0.25)
      ? "text-[#FF453A]"
      : netCalorieBalance7d > tdee * 0.15
      ? "text-[#FFD60A]"
      : "text-[#30D158]";

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide px-1">
      <StatPill
        label="Sleep"
        value={avgSleep7d > 0 ? formatHours(avgSleep7d) : "—"}
        sub="7-day avg"
        color={sleepColor}
      />
      <StatPill
        label="Steps"
        value={avgSteps7d > 0 ? formatSteps(Math.round(avgSteps7d)) : "—"}
        sub="7-day avg"
      />
      <StatPill
        label="Calories"
        value={avgCaloriesIn7d > 0 ? formatCalories(avgCaloriesIn7d) : "—"}
        sub={`TDEE ${formatCalories(tdee)}`}
        color={calColor}
      />
      <StatPill
        label="Weight"
        value={latestWeight ? formatWeight(latestWeight) : "—"}
        sub={
          weightChange7d !== null
            ? `${weightChange7d >= 0 ? "+" : ""}${weightChange7d.toFixed(1)} kg wk`
            : "no data"
        }
        color={weightColor}
      />
    </div>
  );
}
