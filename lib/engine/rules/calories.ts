// ─────────────────────────────────────────────────────────────────────────────
// Insight Rule — Energy Balance (Calories vs TDEE)
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, InsightObject, UserProfile } from "@/lib/types";
import {
  formatCalories,
  getTDEEFromProfile,
  last7Average,
} from "@/lib/health/calculations";

export function evaluateCalories(
  metrics: DailyMetric[],
  profile: UserProfile
): InsightObject | null {
  const avgCalIn = last7Average(metrics, "calories_in");
  if (avgCalIn === null) return null;

  const tdee = getTDEEFromProfile(profile);
  const net = Math.round(avgCalIn - tdee);
  const absPct = Math.abs(net / tdee) * 100;

  // Large surplus (> 15% above TDEE)
  if (net > tdee * 0.15) {
    return {
      id: "calories_surplus",
      type: "energy_balance",
      severity: "warning",
      headline: "Consistent calorie surplus detected",
      message: `You're averaging ${formatCalories(avgCalIn)} vs. an estimated TDEE of ${formatCalories(tdee)} — a surplus of +${Math.abs(net)} kcal/day. This will result in slow weight gain over time.`,
      recommendation: "Reduce by ~200–300 kcal/day through smaller portions or one fewer snack. No need for drastic cuts.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg intake", value: formatCalories(avgCalIn) },
        { label: "Estimated TDEE", value: formatCalories(tdee) },
        { label: "Daily surplus", value: `+${Math.abs(net)} kcal` },
        { label: "Weekly total", value: `+${Math.abs(net) * 7} kcal` },
      ],
    };
  }

  // Deep deficit (> 25% below TDEE) — fatigue/muscle loss risk
  if (net < -(tdee * 0.25)) {
    return {
      id: "calories_deep_deficit",
      type: "energy_balance",
      severity: "critical",
      headline: "Calorie intake is critically low",
      message: `You're averaging ${formatCalories(avgCalIn)}/day — ${Math.abs(net)} kcal below your estimated TDEE of ${formatCalories(tdee)}. At this deficit, muscle loss and fatigue become serious risks.`,
      recommendation: "Increase daily intake by at least 400–500 kcal. Focus on protein-rich foods to preserve lean mass.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg intake", value: formatCalories(avgCalIn) },
        { label: "Estimated TDEE", value: formatCalories(tdee) },
        { label: "Daily deficit", value: `${net} kcal` },
        { label: "Risk", value: "Muscle loss + fatigue" },
      ],
    };
  }

  // Moderate deficit (10–25% below TDEE) — healthy fat loss zone
  if (net < -(tdee * 0.1)) {
    return {
      id: "calories_deficit",
      type: "energy_balance",
      severity: "info",
      headline: "You're in a calorie deficit",
      message: `Averaging ${formatCalories(avgCalIn)}/day — about ${Math.abs(net)} kcal below your estimated TDEE of ${formatCalories(tdee)}. This is a ${absPct.toFixed(0)}% deficit, which should drive gradual fat loss.`,
      recommendation: "This is a sustainable deficit. Monitor weight trend weekly. If energy levels drop, add 100–150 kcal.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg intake", value: formatCalories(avgCalIn) },
        { label: "Estimated TDEE", value: formatCalories(tdee) },
        { label: "Daily deficit", value: `${net} kcal` },
        { label: "Est. weekly loss", value: `~${((Math.abs(net) * 7) / 7700).toFixed(2)} kg` },
      ],
    };
  }

  // Maintenance zone (within 10% of TDEE)
  if (Math.abs(net) <= tdee * 0.1) {
    return {
      id: "calories_maintenance",
      type: "energy_balance",
      severity: "positive",
      headline: "Energy intake is balanced",
      message: `You're averaging ${formatCalories(avgCalIn)}/day — within ${Math.abs(net)} kcal of your estimated TDEE of ${formatCalories(tdee)}. Good for maintaining current weight and performance.`,
      recommendation: "Maintain this balance. Slight day-to-day variation is completely normal.",
      trend: "stable",
      dataPoints: [
        { label: "7-day avg intake", value: formatCalories(avgCalIn) },
        { label: "Estimated TDEE", value: formatCalories(tdee) },
        { label: "Net", value: net >= 0 ? `+${net} kcal` : `${net} kcal` },
      ],
    };
  }

  return null;
}
