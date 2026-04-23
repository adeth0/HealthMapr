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
import type { DailyMetric } from '@/lib/types'

export interface ImportResult {
  metrics: DailyMetric[]
  daysImported: number
  warnings: string[]
}

// ── Internal accumulator per date ─────────────────────────────────────────────

interface DayAccumulator {
  steps: number
  sleepMinutes: number
  calories: number
  weights: number[]
}

function freshDay(): DayAccumulator {
  return { steps: 0, sleepMinutes: 0, calories: 0, weights: [] }
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

  // Match self-closing <Record ... /> tags (Apple Health format)
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
    if (dateStr < cutoffStr) continue // outside 90-day window

    if (!days.has(dateStr)) days.set(dateStr, freshDay())
    const day = days.get(dateStr)!

    if (type === 'HKQuantityTypeIdentifierStepCount') {
      const v = parseFloat(attr(tag, 'value') ?? '0')
      if (!isNaN(v)) day.steps += v
    }

    else if (type === 'HKCategoryTypeIdentifierSleepAnalysis') {
      const value = attr(tag, 'value')
      // Count both InBed and Asleep (Apple Watch uses AsleepCore/AsleepREM/AsleepDeep in newer iOS)
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
      if (unit === 'kJ') v = v / 4.184 // kilojoules → kcal
      day.calories += v
    }
  }

  if (count === 0) {
    warnings.push('No <Record> elements found — check the file is export.xml from the Apple Health app.')
  }

  // Convert accumulators to DailyMetric[]
  const metrics: DailyMetric[] = []

  for (const [date, d] of days.entries()) {
    const m: DailyMetric = { date }
    if (d.steps > 0) m.steps = Math.round(d.steps)
    if (d.sleepMinutes > 0) m.sleep_hours = Math.round((d.sleepMinutes / 60) * 10) / 10
    if (d.weights.length > 0) m.weight_kg = Math.round((d.weights[d.weights.length - 1]) * 10) / 10
    if (d.calories > 0) m.calories_in = Math.round(d.calories)
    const hasData = d.steps > 0 || d.sleepMinutes > 0 || d.weights.length > 0 || d.calories > 0
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
