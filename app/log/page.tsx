"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Quick Log — Minimal daily data entry
// Philosophy: get data in as fast as possible. No friction.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getMetricByDate, saveMetric } from "@/lib/storage";
import type { DailyMetric } from "@/lib/types";

// ── Field config ──────────────────────────────────────────────────────────────

interface FieldConfig {
  key: keyof Pick<DailyMetric, "weight_kg" | "sleep_hours" | "steps" | "calories_in">;
  label: string;
  placeholder: string;
  unit: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: "weight_kg",
    label: "Weight",
    placeholder: "84.5",
    unit: "kg",
    icon: "⚖️",
    min: 30,
    max: 300,
    step: 0.1,
    hint: "Morning weight, after bathroom",
  },
  {
    key: "sleep_hours",
    label: "Sleep",
    placeholder: "7.5",
    unit: "hours",
    icon: "🌙",
    min: 0,
    max: 24,
    step: 0.25,
    hint: "Total sleep time last night",
  },
  {
    key: "steps",
    label: "Steps",
    placeholder: "8500",
    unit: "steps",
    icon: "🏃",
    min: 0,
    max: 100000,
    step: 100,
    hint: "Total steps today",
  },
  {
    key: "calories_in",
    label: "Calories",
    placeholder: "2200",
    unit: "kcal",
    icon: "⚡",
    min: 0,
    max: 10000,
    step: 50,
    hint: "Total calories consumed",
  },
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogPage() {
  const router = useRouter();
  const [dateStr, setDateStr] = useState(getTodayStr());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing data for selected date
  useEffect(() => {
    const existing = getMetricByDate(dateStr);
    if (existing) {
      setValues({
        weight_kg: existing.weight_kg?.toString() ?? "",
        sleep_hours: existing.sleep_hours?.toString() ?? "",
        steps: existing.steps?.toString() ?? "",
        calories_in: existing.calories_in?.toString() ?? "",
        note: existing.note ?? "",
      });
    } else {
      setValues({ weight_kg: "", sleep_hours: "", steps: "", calories_in: "", note: "" });
    }
    setSaved(false);
  }, [dateStr]);

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);

    const metric: DailyMetric = { date: dateStr };

    const w = parseFloat(values.weight_kg ?? "");
    const s = parseFloat(values.sleep_hours ?? "");
    const st = parseInt(values.steps ?? "");
    const c = parseInt(values.calories_in ?? "");

    if (!isNaN(w) && w > 0) metric.weight_kg = w;
    if (!isNaN(s) && s > 0) metric.sleep_hours = s;
    if (!isNaN(st) && st > 0) metric.steps = st;
    if (!isNaN(c) && c > 0) metric.calories_in = c;

    const note = (values.note ?? "").trim();
    if (note) metric.note = note;

    saveMetric(metric);

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      // Navigate back to dashboard after brief confirmation
      setTimeout(() => router.push("/dashboard"), 800);
    }, 300);
  }

  const hasAnyValue = Object.values(values).some((v) => v.trim() !== "");
  const isToday = dateStr === getTodayStr();

  return (
    <div className="min-h-screen pb-24">
      {/* ── Header ── */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard"
            className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/10 flex items-center justify-center"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7l6 6" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" strokeLinecap="round" />
            </svg>
          </Link>
          <h1 className="text-[22px] font-bold text-white/95">Quick Log</h1>
        </div>
        <p className="text-[13px] text-white/40 pl-11">
          {isToday ? "Today — " : ""}{formatDateLabel(dateStr)}
        </p>
      </div>

      {/* ── Date picker row ── */}
      <div className="px-5 mb-6 flex items-center gap-2">
        <button
          onClick={() => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() - 1);
            setDateStr(d.toISOString().split("T")[0]);
          }}
          className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
        >
          ‹
        </button>
        <input
          type="date"
          value={dateStr}
          max={getTodayStr()}
          onChange={(e) => setDateStr(e.target.value)}
          className="flex-1 text-center text-[13px] text-white/70"
          style={{ colorScheme: "dark" }}
        />
        <button
          onClick={() => {
            const d = new Date(dateStr);
            d.setDate(d.getDate() + 1);
            const next = d.toISOString().split("T")[0];
            if (next <= getTodayStr()) setDateStr(next);
          }}
          className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
          disabled={dateStr >= getTodayStr()}
          style={{ opacity: dateStr >= getTodayStr() ? 0.3 : 1 }}
        >
          ›
        </button>
      </div>

      {/* ── Fields ── */}
      <div className="px-5 flex flex-col gap-3">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className="text-2xl w-8 text-center flex-shrink-0">{field.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[13px] font-semibold text-white/80">
                  {field.label}
                </label>
                <span className="text-[11px] text-white/30">{field.unit}</span>
              </div>
              <input
                type="number"
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="text-[15px] font-medium"
                inputMode="decimal"
              />
              <div className="text-[11px] text-white/25 mt-1">{field.hint}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Note field ── */}
      <div className="px-5 mt-3">
        <div className="glass-card p-4">
          <label className="text-[13px] font-semibold text-white/60 block mb-2">
            Note (optional)
          </label>
          <textarea
            placeholder="How did you feel today? Anything unusual?"
            className="resize-none text-[13px] min-h-[70px]"
            value={values.note ?? ""}
            onChange={(e) => handleChange("note", e.target.value)}
          />
        </div>
      </div>

      {/* ── Save button ── */}
      <div className="px-5 mt-6">
        <button
          onClick={handleSave}
          disabled={!hasAnyValue || saving || saved}
          className={`
            w-full py-4 rounded-2xl
            font-semibold text-[15px]
            transition-all duration-200
            ${saved
              ? "bg-[#30D158]/20 border border-[#30D158]/30 text-[#30D158]"
              : saving
              ? "bg-white/[0.06] border border-white/10 text-white/40"
              : hasAnyValue
              ? "bg-white/[0.10] border border-white/15 text-white/90 hover:bg-white/[0.14] active:scale-[0.98]"
              : "bg-white/[0.04] border border-white/[0.07] text-white/25 cursor-not-allowed"
            }
          `}
        >
          {saved ? "✓  Saved" : saving ? "Saving…" : "Save Entry"}
        </button>

        {saved && (
          <p className="text-center text-[12px] text-white/30 mt-2 animate-fade-in">
            Insights will update on the dashboard
          </p>
        )}
      </div>

      <Nav />
    </div>
  );
}
