// ─────────────────────────────────────────────────────────────────────────────
// Insight Rule — Weight Trend
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, InsightObject, UserProfile } from "@/lib/types";
import {
  formatWeight,
  getTDEEFromProfile,
  last7Average,
  prev7Average,
} from "@/lib/health/calculations";

export function evaluateWeight(
  metrics: DailyMetric[],
  profile: UserProfile
): InsightObject | null {
  const avg7 = last7Average(metrics, "weight_kg");
  const avgPrev = prev7Average(metrics, "weight_kg");

  // Need at least current week data
  if (avg7 === null) return null;

  const change7d = avgPrev !== null ? avg7 - avgPrev : null;
  const calAvg7 = last7Average(metrics, "calories_in");
  const tdee = getTDEEFromProfile(profile);

  // Stagnation with a calorie deficit: possible intake underestimation
  if (
    change7d !== null &&
    Math.abs(change7d) < 0.2 &&
    calAvg7 !== null &&
    calAvg7 < tdee * 0.9
  ) {
    return {
      id: "weight_stagnation_deficit",
      type: "weight",
      severity: "warning",
      headline: "Weight is flat despite a calorie deficit",
      message: `Your 7-day weight average is unchanged (${formatWeight(avg7)}) while you appear to be in a ${Math.round(tdee - calAvg7)} kcal/day deficit. Possible causes: intake underestimation, water retention, or inaccurate TDEE.`,
      recommendation: "Track every meal precisely for 5 days. Also check for hidden calories in drinks, sauces, and snacks.",
      trend: "stable",
      dataPoints: [
        { label: "7-day weight avg", value: formatWeight(avg7) },
        { label: "Prev 7-day avg", value: avgPrev !== null ? formatWeight(avgPrev) : "N/A" },
        { label: "Weight change", value: `${change7d >= 0 ? "+" : ""}${change7d.toFixed(2)} kg` },
        { label: "Logged deficit", value: `${Math.round(tdee - calAvg7)} kcal/day` },
      ],
    };
  }

  // Rapid weight loss: > 0.8 kg/week (may be too aggressive)
  if (change7d !== null && change7d < -0.8) {
    return {
      id: "weight_rapid_loss",
      type: "weight",
      severity: "warning",
      headline: "Weight is dropping rapidly",
      message: `You've lost ${Math.abs(change7d).toFixed(1)} kg in the last 7 days. More than 0.5–0.7 kg/week risks losing muscle mass alongside fat.`,
      recommendation: "Consider adding 200–300 kcal/day to slow the rate of loss while preserving muscle. Prioritise protein.",
      trend: "declining",
      dataPoints: [
        { label: "Current avg", value: formatWeight(avg7) },
        { label: "Previous avg", value: formatWeight(avgPrev ?? avg7) },
        { label: "7-day change", value: `${change7d.toFixed(2)} kg` },
        { label: "Safe range", value: "0.25–0.7 kg/wk" },
      ],
    };
  }

  // Gradual loss: 0.2–0.8 kg/week — ideal
  if (change7d !== null && change7d < -0.2 && change7d >= -0.8) {
    return {
      id: "weight_trend_loss",
      type: "positive",
      severity: "positive",
      headline: "Weight is trending down at a healthy rate",
      message: `You've lost ${Math.abs(change7d).toFixed(1)} kg over the last 7 days — within the ideal 0.25–0.7 kg/week range. At this pace you're preserving muscle while losing fat.`,
      recommendation: "Stay the course. Don't change what's working. Check in again in 2 weeks.",
      trend: "improving",
      dataPoints: [
        { label: "Current avg", value: formatWeight(avg7) },
        { label: "Previous avg", value: formatWeight(avgPrev ?? avg7) },
        { label: "7-day change", value: `${change7d.toFixed(2)} kg` },
        { label: "Rate", value: "Healthy" },
      ],
    };
  }

  // Rapid weight gain: > 0.5 kg/week
  if (change7d !== null && change7d > 0.5) {
    return {
      id: "weight_gain",
      type: "weight",
      severity: "info",
      headline: "Weight has increased this week",
      message: `Your 7-day weight average rose by ${change7d.toFixed(1)} kg. This could be water retention, dietary changes, or a genuine surplus. Monitor for 1–2 more weeks before acting.`,
      recommendation: "Don't panic — single-week weight swings are often water. Check your sodium and carbohydrate intake.",
      trend: "declining",
      dataPoints: [
        { label: "Current avg", value: formatWeight(avg7) },
        { label: "Previous avg", value: formatWeight(avgPrev ?? avg7) },
        { label: "7-day change", value: `+${change7d.toFixed(2)} kg` },
      ],
    };
  }

  return null;
}
