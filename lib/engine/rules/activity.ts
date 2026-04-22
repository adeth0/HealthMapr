// ─────────────────────────────────────────────────────────────────────────────
// Insight Rule — Activity Trend (Steps week-over-week)
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, InsightObject } from "@/lib/types";
import {
  formatSteps,
  last7Average,
  pctChange,
  prev7Average,
} from "@/lib/health/calculations";

export function evaluateActivity(metrics: DailyMetric[]): InsightObject | null {
  const avg7 = last7Average(metrics, "steps");
  const avgPrev = prev7Average(metrics, "steps");

  if (avg7 === null) return null;

  const change = pctChange(avg7, avgPrev);
  const formattedNow = formatSteps(Math.round(avg7));
  const formattedPrev = avgPrev !== null ? formatSteps(Math.round(avgPrev)) : null;

  // Significant drop: > 20% week-over-week
  if (change !== null && change < -20) {
    const dropPct = Math.abs(change).toFixed(0);
    return {
      id: "activity_drop",
      type: "activity",
      severity: "warning",
      headline: `Activity dropped ${dropPct}% this week`,
      message: `Your average daily steps fell from ${formattedPrev} to ${formattedNow} — a ${dropPct}% reduction. Lower activity means lower calorie burn, which may stall progress.`,
      recommendation: "Add one 20-minute walk per day to recover ~1,500–2,000 steps. Small habits compound.",
      trend: "declining",
      dataPoints: [
        { label: "This week avg", value: `${formattedNow} steps` },
        ...(formattedPrev ? [{ label: "Last week avg", value: `${formattedPrev} steps` }] : []),
        { label: "Change", value: `−${dropPct}%` },
        { label: "Est. calorie impact", value: `~${Math.round(Math.abs(avg7 - (avgPrev ?? avg7)) * 0.04)} kcal/day` },
      ],
    };
  }

  // Significant rise: > 20% week-over-week
  if (change !== null && change > 20) {
    const risePct = Math.abs(change).toFixed(0);
    return {
      id: "activity_rise",
      type: "activity",
      severity: "positive",
      headline: `Activity up ${risePct}% this week`,
      message: `Your daily steps increased from ${formattedPrev} to ${formattedNow} — a ${risePct}% improvement. Your calorie burn has increased meaningfully.`,
      recommendation: "Great momentum. Sustain this for 2–3 more weeks to build a lasting habit.",
      trend: "improving",
      dataPoints: [
        { label: "This week avg", value: `${formattedNow} steps` },
        ...(formattedPrev ? [{ label: "Last week avg", value: `${formattedPrev} steps` }] : []),
        { label: "Change", value: `+${risePct}%` },
      ],
    };
  }

  // Low absolute steps: < 5000/day
  if (avg7 < 5000) {
    return {
      id: "activity_low",
      type: "activity",
      severity: "warning",
      headline: "Daily movement is very low",
      message: `You're averaging ${formattedNow} steps/day. Below 5,000 steps is considered sedentary and is associated with reduced metabolic health.`,
      recommendation: "Set a daily step target of 7,500. This is achievable with two 15-minute walks.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg steps", value: `${formattedNow} steps` },
        { label: "Target", value: "7,500 steps" },
        { label: "Gap", value: `${formatSteps(Math.round(7500 - avg7))} steps/day` },
      ],
    };
  }

  // Good activity: 8000+ steps
  if (avg7 >= 8000) {
    return {
      id: "activity_positive",
      type: "positive",
      severity: "positive",
      headline: "Activity level is healthy",
      message: `You're averaging ${formattedNow} steps/day — consistently above the 7,500-step threshold associated with reduced all-cause mortality.`,
      recommendation: "Keep it up. Consider adding one resistance training session to complement cardio.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg steps", value: `${formattedNow} steps` },
        { label: "Status", value: "Active" },
      ],
    };
  }

  return null;
}
