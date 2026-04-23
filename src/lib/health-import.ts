// ─────────────────────────────────────────────────────────────────────────────
// HealthMapr — Apple Health Export Parser
//
// Accepts the ZIP (export.zip) or raw XML (export.xml) from:
//   Health app → Profile photo → Export All Health Data
//
// Extracts up to 90 days of:
//   • Steps          (HKQuantityTypeIdentifierStepCount — sum per day)
//   • Sleep          (HKCategoryTypeIdentifierSleepAnalysis — Asleep minutes, sum per day)
//   • Weight         (HKQuantityTypeIdentifierBodyMass — latest per day, converted to kg)
//   • Calories in    (HKQuantityTypeIdentifierDietaryEnergyConsumed — sum per day)
// ─────────────────────────────────────────────────────────────────────────────

import JSZip from 'jszip'
import type { DailyMetric, WorkoutEntry } from '@/lib/types'

export interface ImportResult {
  metrics: DailyMetric[]
  daysImported: number
  warnings: string[]
}

// ── Internal accumulator per date ─────────────────────────────────────────────

// Maps Apple Watch HKWorkoutActivityType values to human-readable strings
const WORKOUT_TYPE_MAP: Record<string, string> = {
  HKWorkoutActivityTypeRunning: 'Run',
  HKWorkoutActivityTypeCycling: 'Cycling',
  HKWorkoutActivityTypeSwimming: 'Swimming',
  HKWorkoutActivityTypeWalking: 'Walk',
  HKWorkoutActivityTypeHiking: 'Hike',
  HKWorkoutActivityTypeTraditionalStrengthTraining: 'Strength',
  HKWorkoutActivityTypeFunctionalStrengthTraining: 'Strength',
  HKWorkoutActivityTypeHighIntensityIntervalTraining: 'HIIT',
  HKWorkoutActivityTypeYoga: 'Yoga',
  HKWorkoutActivityTypePilates: 'Pilates',
  HKWorkoutActivityTypeElliptical: 'Elliptical',
  HKWorkoutActivityTypeRowing: 'Rowing',
  HKWorkoutActivityTypeSoccer: 'Football',
  HKWorkoutActivityTypeBasketball: 'Basketball',
  HKWorkoutActivityTypeTennis: 'Tennis',
  HKWorkoutActivityTypeMixedCardio: 'Cardio',
  HKWorkoutActivityTypeOther: 'Workout',
}

function normaliseWorkoutType(hkType: string): string {
  return WORKOUT_TYPE_MAP[hkType] ?? hkType.replace('HKWorkoutActivityType', '')
}

interface DayAccumulator {
  steps: number
  sleepMinutes: number
  calories: number
  activeCalories: number
  weights: number[]
  workouts: WorkoutEntry[]
}

function freshDay(): DayAccumulator {
  return { steps: 0, sleepMinutes: 0, calories: 0, activeCalories: 0, weights: [], workouts: [] }
}

// ── Attribute extraction from a single <Record .../> or <Record ...> tag ──────

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}="([^"]*)"`)
  const m = tag.match(re)
  return m ? m[1] : null
}

// ── Date string → YYYY-MM-DD in local time ────────────────────────────────────

function toDateStr(appleDate: string): string {
  // Apple Health dates: "2024-01-15 09:00:00 +0000"
  // Parse as UTC then shift to local date for the log entry
  const d = new Date(appleDate.replace(' ', 'T').replace(' +', '+').replace(' -', '-'))
  return d.toISOString().split('T')[0]
}

// ── Duration between two date strings in minutes ──────────────────────────────

function durationMinutes(start: string, end: string): number {
  const s = new Date(start.replace(' ', 'T'))
  const e = new Date(end.replace(' ', 'T'))
  return Math.max(0, (e.getTime() - s.getTime()) / 60000)
}

// ── Main parser — streaming regex over raw XML text ──────────────────────────
// Does NOT use DOMParser to avoid loading hundreds of MB into the DOM.

function parseXML(xmlText: string): ImportResult {
  const warnings: string[] = []
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 89)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  const days = new Map<string, DayAccumulator>()

  // ── Parse <Record .../> elements ─────────────────────────────────────────────
  const recordRe = /<Record\s[^>]+\/>/g
  let match: RegExpExecArray | null
  let count = 0

  while ((match = recordRe.exec(xmlText)) !== null) {
    count++
    const tag = match[0]
    const type = attr(tag, 'type')
    const startDate = attr(tag, 'startDate')
    const endDate = attr(tag, 'endDate')
    if (!type || !startDate) continue

    const dateStr = toDateStr(startDate)
    if (dateStr < cutoffStr) continue

    if (!days.has(dateStr)) days.set(dateStr, freshDay())
    const day = days.get(dateStr)!

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      const v = parseFloat(attr(tag, 'value') ?? '0')
      if (!isNaN(v)) day.steps += v
    }

    else if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const value = attr(tag, 'value')
      const isSleep = value && (
        value.includes('Asleep') ||
        value === 'HKCategoryValueSleepAnalysisInBed'
      )
      if (isSleep && endDate) {
        day.sleepMinutes += durationMinutes(startDate, endDate)
      }
    }

    else if (type === 'HKQuantityTypeIdentifierBodyMass') {
      const unit = attr(tag, 'unit') ?? 'kg'
      let v = parseFloat(attr(tag, 'value') ?? '0')
      if (isNaN(v) || v === 0) continue
      if (unit === 'lb') v = v * 0.453592
      else if (unit === 'st') v = v * 6.35029
      day.weights.push(v)
    }

    else if (type === 'HKQuantityTypeIdentifierDietaryEnergyConsumed') {
      const unit = attr(tag, 'unit') ?? 'kcal'
      let v = parseFloat(attr(tag, 'value') ?? '0')
      if (isNaN(v) || v === 0) continue
      if (unit === 'kJ') v = v / 4.184
      day.calories += v
    }

    else if (type === 'HKQuantityTypeIdentifierActiveEnergyBurned') {
      const unit = attr(tag, 'unit') ?? 'Cal'
      let v = parseFloat(attr(tag, 'value') ?? '0')
      if (isNaN(v) || v === 0) continue
      if (unit === 'kJ') v = v / 4.184
      day.activeCalories += v
    }
  }

  // ── Parse <Workout .../> elements ─────────────────────────────────────────────
  // Format: <Workout workoutActivityType="..." duration="32.5" durationUnit="min"
  //                  totalEnergyBurned="320" totalEnergyBurnedUnit="Cal"
  //                  startDate="..." endDate="..."/>
  const workoutRe = /<Workout\s[^>]+\/>/g
  while ((match = workoutRe.exec(xmlText)) !== null) {
    const tag = match[0]
    const activityType = attr(tag, 'workoutActivityType')
    const startDate = attr(tag, 'startDate')
    const endDate = attr(tag, 'endDate')
    if (!activityType || !startDate) continue

    const dateStr = toDateStr(startDate)
    if (dateStr < cutoffStr) continue

    if (!days.has(dateStr)) days.set(dateStr, freshDay())
    const day = days.get(dateStr)!

    // Duration — prefer explicit duration attribute; fall back to start/end diff
    let durationMin = 0
    const durationAttr = parseFloat(attr(tag, 'duration') ?? '0')
    const durationUnit = attr(tag, 'durationUnit') ?? 'min'
    if (!isNaN(durationAttr) && durationAttr > 0) {
      durationMin = durationUnit === 'min' ? durationAttr : durationAttr / 60
    } else if (endDate) {
      durationMin = durationMinutes(startDate, endDate)
    }
    if (durationMin < 1) continue // skip sub-minute entries

    // Calories burned
    let calories: number | undefined
    const energyVal = parseFloat(attr(tag, 'totalEnergyBurned') ?? '0')
    const energyUnit = attr(tag, 'totalEnergyBurnedUnit') ?? 'Cal'
    if (!isNaN(energyVal) && energyVal > 0) {
      calories = energyUnit === 'kJ' ? Math.round(energyVal / 4.184) : Math.round(energyVal)
    }

    const workout: WorkoutEntry = {
      type: normaliseWorkoutType(activityType),
      duration_min: Math.round(durationMin),
      source: 'apple_health',
    }
    if (calories !== undefined) workout.calories = calories

    day.workouts.push(workout)
    count++
  }

  if (count === 0) {
    warnings.push('No health records found — check the file is export.xml from the Apple Health app.')
  }

  // ── Convert accumulators → DailyMetric[] ─────────────────────────────────────
  const metrics: DailyMetric[] = []

  for (const [date, d] of days.entries()) {
    const m: DailyMetric = { date }
    if (d.steps > 0) m.steps = Math.round(d.steps)
    if (d.sleepMinutes > 0) m.sleep_hours = Math.round((d.sleepMinutes / 60) * 10) / 10
    if (d.weights.length > 0) m.weight_kg = Math.round((d.weights[d.weights.length - 1]) * 10) / 10
    if (d.calories > 0) m.calories_in = Math.round(d.calories)
    if (d.activeCalories > 0) m.calories_out = Math.round(d.activeCalories)
    if (d.workouts.length > 0) m.workouts = d.workouts
    const hasData = d.steps > 0 || d.sleepMinutes > 0 || d.weights.length > 0 || d.calories > 0 || d.workouts.length > 0
    if (hasData) metrics.push(m)
  }

  metrics.sort((a, b) => a.date.localeCompare(b.date))

  return { metrics, daysImported: metrics.length, warnings }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function importFromZip(file: File): Promise<ImportResult> {
  const zip = await JSZip.loadAsync(file)

  // Find the export.xml — it's at apple_health_export/export.xml
  let xmlFile = zip.file('apple_health_export/export.xml')
  if (!xmlFile) {
    // Fallback: search for any .xml file
    const xmlFiles = Object.values(zip.files).filter(
      (f) => f.name.endsWith('export.xml') && !f.dir
    )
    if (xmlFiles.length === 0) {
      return {
        metrics: [],
        daysImported: 0,
        warnings: ['Could not find export.xml inside the ZIP. Make sure you uploaded the file directly from "Export All Health Data" in the Health app.'],
      }
    }
    xmlFile = xmlFiles[0]
  }

  const text = await xmlFile.async('text')
  return parseXML(text)
}

export async function importFromXML(file: File): Promise<ImportResult> {
  const text = await file.text()
  return parseXML(text)
}

export async function importHealthFile(file: File): Promise<ImportResult> {
  if (file.name.endsWith('.zip')) {
    return importFromZip(file)
  }
  if (file.name.endsWith('.xml')) {
    return importFromXML(file)
  }
  return {
    metrics: [],
    daysImported: 0,
    warnings: ['Unsupported file type. Please upload the .zip or .xml from Apple Health export.'],
  }
}
