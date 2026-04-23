// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Next Best Action Engine
//
// Derives a SINGLE, achievable-today action from the user's current insight
// stack and goal.  Deterministic — no API call required.
//
// Output shape: { action, reason, expected_benefit, icon }
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyMetric, InsightObject, UserProfile } from '@/lib/types'

export interface NextAction {
  action: string
  reason: string
  expected_benefit: string
  icon: string
}

// ── Per-insight-id action map ─────────────────────────────────────────────────

const ACTION_MAP: Record<string, NextAction> = {
  // Fatigue
  fatigue_risk: {
    action: 'Prioritise 8 hours of sleep tonight — set a bedtime alarm right now',
    reason: 'Compounding fatigue detected across sleep and activity data',
    expected_benefit: 'One full-sleep night breaks the fatigue cycle and restores baseline energy',
    icon: '😴',
  },

  // Sleep
  sleep_critical: {
    action: 'Go to bed 1 hour earlier tonight',
    reason: 'Your sleep is critically short — below 5 hours recently',
    expected_benefit: 'Even one recovery night measurably improves focus and reaction time',
    icon: '🌙',
  },
  sleep_warning: {
    action: 'Go to bed 45 minutes earlier tonight',
    reason: "You're carrying a growing sleep debt",
    expected_benefit: 'Faster recovery, better mood and sharper cognitive function tomorrow',
    icon: '🌙',
  },

  // Calories
  calories_deep_deficit: {
    action: 'Eat a protein + carb meal before 8 pm tonight',
    reason: "You've been significantly under-fuelling — risking lean muscle loss",
    expected_benefit: 'Protects muscle mass and keeps metabolism from downregulating',
    icon: '🥚',
  },
  calories_deficit: {
    action: 'Add a high-protein snack today (Greek yoghurt, eggs, or a shake)',
    reason: 'Calorie intake has been below target most days this week',
    expected_benefit: 'Closes the energy gap and supports recovery and focus',
    icon: '🥩',
  },
  calories_surplus: {
    action: 'Take a 20-minute brisk walk after your next meal',
    reason: "You've been over your calorie target recently",
    expected_benefit: 'Burns ~100 kcal and blunts the post-meal glucose spike',
    icon: '🚶',
  },
  calories_maintenance: {
    action: 'Log every meal today — even small snacks — to keep the streak accurate',
    reason: 'Complete logging is what makes calorie insights reliable',
    expected_benefit: 'Awareness alone typically reduces intake by ~15%',
    icon: '📝',
  },

  // Activity
  activity_low: {
    action: 'Take a 20-minute brisk walk today',
    reason: "You've been below your step target this week",
    expected_benefit: 'Closes the activity gap, improves cardiovascular health and lifts mood',
    icon: '👟',
  },
  activity_drop: {
    action: 'Block 20 minutes for a walk or light workout today',
    reason: 'Activity has dropped compared to your recent average',
    expected_benefit: 'Prevents the slump from becoming a longer gap in your routine',
    icon: '🏃',
  },
  activity_rise: {
    action: 'Keep the momentum — aim for your step target again today',
    reason: "You're on an upward trend with activity",
    expected_benefit: 'Consistency over 7 days compounds into lasting fitness gains',
    icon: '📈',
  },
  activity_positive: {
    action: 'Add one 5-minute stretching session today to support recovery',
    reason: "You've been hitting your activity goals consistently",
    expected_benefit: 'Mobility work prevents injury as training volume increases',
    icon: '🧘',
  },

  // Weight
  weight_gain: {
    action: 'Log every meal today to restore visibility on intake',
    reason: 'Weight has been trending upward recently',
    expected_benefit: 'Consistent tracking is the #1 predictor of weight-loss success',
    icon: '📊',
  },
  weight_rapid_loss: {
    action: 'Eat a calorie-dense, nutritious meal today — nuts, avocado, oily fish',
    reason: "You're losing weight faster than is healthy — likely losing muscle",
    expected_benefit: 'Slows the rate to the safe 0.5–1 kg/week zone',
    icon: '⚠️',
  },
  weight_stagnation_deficit: {
    action: 'Track meals accurately today — weigh portions if possible',
    reason: "You're in a deficit but weight isn't moving — hidden calories likely",
    expected_benefit: 'Precise logging usually reveals where the gap is within 3 days',
    icon: '🔍',
  },
  weight_trend_loss: {
    action: 'Stay on track — log today to maintain your deficit streak',
    reason: "You're losing weight at a healthy rate",
    expected_benefit: 'Consistency at this rate reaches goal weight with minimal muscle loss',
    icon: '✅',
  },

  // Workouts
  workout_underrecovery: {
    action: 'Replace training with a 15-minute mobility or stretch session today',
    reason: 'Two hard sessions back-to-back on poor sleep = overtraining risk',
    expected_benefit: 'Prevents injury, reduces DOMS and accelerates recovery for tomorrow',
    icon: '🧘',
  },
  workout_fuelling_deficit: {
    action: 'Eat a protein + carb meal within 2 hours of your next workout',
    reason: 'You trained with a significant calorie deficit — recovery is compromised',
    expected_benefit: 'Better muscle repair and sustained energy for today',
    icon: '🍌',
  },
  workout_streak: {
    action: 'Do a 10-minute foam-roll or recovery session to protect the streak',
    reason: "You've trained hard this week — active recovery matters now",
    expected_benefit: 'Reduces soreness and primes muscles for the next session',
    icon: '🔄',
  },
  workout_returning: {
    action: "Schedule your next session for tomorrow — add it to your calendar now",
    reason: "You're building back momentum after time away",
    expected_benefit: 'A committed second session is the tipping point for habit formation',
    icon: '📅',
  },
}

// ── Goal-specific fallbacks (when no insight fires) ───────────────────────────

const GOAL_FALLBACK: Record<string, NextAction> = {
  lose_weight: {
    action: 'Log all meals today — including drinks and snacks',
    reason: 'Consistent tracking is the #1 predictor of weight-loss success',
    expected_benefit: 'Builds daily accountability and surfaces hidden calories',
    icon: '📝',
  },
  sleep_better: {
    action: 'Set a consistent bedtime alarm for tonight',
    reason: 'Sleep timing consistency matters as much as total duration',
    expected_benefit: 'Steadier energy and mood within one week',
    icon: '⏰',
  },
  move_more: {
    action: 'Take a 20-minute brisk walk today',
    reason: 'Daily movement is the single highest-leverage health habit',
    expected_benefit: 'Improves cardiovascular fitness, burns ~100 kcal, lifts mood',
    icon: '🚶',
  },
  track_everything: {
    action: "Log today's data — meals, sleep and steps",
    reason: 'Complete data makes all insights more accurate and personal',
    expected_benefit: 'Better recommendations from tomorrow onwards',
    icon: '📊',
  },
}

const DEFAULT_ACTION: NextAction = {
  action: 'Take a 20-minute brisk walk today',
  reason: 'Movement is the highest-leverage daily health habit',
  expected_benefit: 'Cardiovascular benefit, mood lift and ~100 kcal burned',
  icon: '👟',
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getNextAction(
  insights: InsightObject[],
  _metrics: DailyMetric[],
  profile: UserProfile
): NextAction {
  // Walk the severity-sorted insight list and return the first mapped action
  for (const insight of insights) {
    const direct = ACTION_MAP[insight.id]
    if (direct) return direct
  }

  // Goal-based fallback
  if (profile.goal && GOAL_FALLBACK[profile.goal]) {
    return GOAL_FALLBACK[profile.goal]
  }

  return DEFAULT_ACTION
}
