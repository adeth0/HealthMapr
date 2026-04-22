"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Onboarding — First-run profile capture
// Minimal, friendly, gets just what the insight engine needs.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile } from "@/lib/storage";
import { calculateBMR, calculateTDEE } from "@/lib/health/calculations";
import type { ActivityLevel, BiologicalSex } from "@/lib/types";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: "sedentary", label: "Sedentary", sub: "Desk job, little exercise" },
  { value: "light", label: "Lightly active", sub: "1–3 workouts/week" },
  { value: "moderate", label: "Moderately active", sub: "3–5 workouts/week" },
  { value: "active", label: "Very active", sub: "Hard training 6–7×/week" },
  { value: "very_active", label: "Athlete", sub: "Twice-daily training" },
];

export default function SetupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [step, setStep] = useState(0);

  const STEPS = 3;

  // Derived TDEE preview
  const tdeePreview =
    age && heightCm && weightKg
      ? calculateTDEE(
          calculateBMR(
            parseFloat(weightKg),
            parseFloat(heightCm),
            parseInt(age),
            sex
          ),
          activityLevel
        )
      : null;

  function handleSubmit() {
    if (!name || !age || !heightCm || !weightKg) return;
    saveProfile({
      name,
      age: parseInt(age),
      height_cm: parseFloat(heightCm),
      weight_kg: parseFloat(weightKg),
      sex,
      activity_level: activityLevel,
    });
    router.replace("/dashboard");
  }

  const step0Valid = name.trim().length > 0;
  const step1Valid = age && heightCm && weightKg &&
    parseFloat(weightKg) > 20 && parseFloat(heightCm) > 100 && parseInt(age) > 0;
  const step2Valid = true; // activity always has a default

  const canContinue = [step0Valid, step1Valid, step2Valid][step];

  return (
    <div className="min-h-screen flex flex-col px-5 pt-16 pb-8">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-10">
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={`
              flex-1 h-1 rounded-full transition-all duration-400
              ${i <= step ? "bg-white/70" : "bg-white/10"}
            `}
          />
        ))}
      </div>

      {/* ── Step 0: Name ── */}
      {step === 0 && (
        <div className="flex-1 animate-slide-up">
          <p className="text-[13px] font-medium text-white/40 mb-2 tracking-wide uppercase">
            Let&apos;s get started
          </p>
          <h2 className="text-[32px] font-bold text-white/95 leading-tight mb-8">
            What should we call you?
          </h2>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-[18px] py-4 px-5 rounded-2xl"
            autoFocus
          />
          <p className="text-[12px] text-white/25 mt-3 px-1">
            Used for personalised insights — nothing else.
          </p>
        </div>
      )}

      {/* ── Step 1: Body metrics ── */}
      {step === 1 && (
        <div className="flex-1 animate-slide-up">
          <p className="text-[13px] font-medium text-white/40 mb-2 tracking-wide uppercase">
            Body metrics
          </p>
          <h2 className="text-[32px] font-bold text-white/95 leading-tight mb-2">
            Quick measurements
          </h2>
          <p className="text-[13px] text-white/40 mb-8">
            Used to calculate your calorie needs. No account, no servers — stays on your device.
          </p>

          <div className="flex flex-col gap-3">
            {/* Sex selector */}
            <div className="glass-card p-4">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-white/35 block mb-2">
                Biological sex
              </label>
              <div className="flex gap-2">
                {(["male", "female", "other"] as BiologicalSex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`
                      flex-1 py-2.5 rounded-xl text-[13px] font-semibold capitalize
                      border transition-all
                      ${sex === s
                        ? "bg-white/10 border-white/25 text-white"
                        : "bg-transparent border-white/[0.07] text-white/40 hover:text-white/60"
                      }
                    `}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div className="glass-card p-4">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-white/35 block mb-2">
                Age
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="32"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={10} max={120}
                  inputMode="numeric"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">
                  years
                </span>
              </div>
            </div>

            {/* Height */}
            <div className="glass-card p-4">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-white/35 block mb-2">
                Height
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="180"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  min={100} max={250} step={1}
                  inputMode="numeric"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">
                  cm
                </span>
              </div>
            </div>

            {/* Weight */}
            <div className="glass-card p-4">
              <label className="text-[12px] font-semibold uppercase tracking-widest text-white/35 block mb-2">
                Current weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="80"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  min={30} max={300} step={0.1}
                  inputMode="decimal"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">
                  kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Activity level ── */}
      {step === 2 && (
        <div className="flex-1 animate-slide-up">
          <p className="text-[13px] font-medium text-white/40 mb-2 tracking-wide uppercase">
            Activity level
          </p>
          <h2 className="text-[32px] font-bold text-white/95 leading-tight mb-2">
            How active are you?
          </h2>
          <p className="text-[13px] text-white/40 mb-6">
            Be honest — this determines your calorie target.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActivityLevel(opt.value)}
                className={`
                  glass-card p-4 text-left flex items-center justify-between
                  border transition-all duration-150
                  ${activityLevel === opt.value
                    ? "border-white/25 bg-white/[0.08]"
                    : "border-white/[0.07] hover:border-white/15"
                  }
                `}
              >
                <div>
                  <div className="text-[14px] font-semibold text-white/85">{opt.label}</div>
                  <div className="text-[12px] text-white/35 mt-0.5">{opt.sub}</div>
                </div>
                <div
                  className={`
                    w-4 h-4 rounded-full border-2 flex-shrink-0
                    ${activityLevel === opt.value
                      ? "border-white bg-white"
                      : "border-white/20"
                    }
                  `}
                />
              </button>
            ))}
          </div>

          {/* TDEE preview */}
          {tdeePreview && (
            <div className="glass-card p-4 border border-white/[0.08]">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-1">
                Your estimated daily calorie need
              </div>
              <div className="text-[32px] font-bold text-white/90">
                {tdeePreview.toLocaleString()}
                <span className="text-[16px] font-normal text-white/40 ml-1">kcal</span>
              </div>
              <p className="text-[12px] text-white/30 mt-1">
                Based on Mifflin-St Jeor formula. Adjust through your activity level if results feel off.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="mt-auto pt-8 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="
              px-6 py-4 rounded-2xl
              bg-white/[0.05] border border-white/10
              text-[14px] font-semibold text-white/60
              hover:text-white/80 transition-colors
            "
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < STEPS - 1) {
              setStep((s) => s + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={!canContinue}
          className={`
            flex-1 py-4 rounded-2xl
            font-semibold text-[15px]
            transition-all duration-200
            ${canContinue
              ? "bg-white/[0.10] border border-white/15 text-white/90 hover:bg-white/[0.14] active:scale-[0.98]"
              : "bg-white/[0.04] border border-white/[0.07] text-white/25 cursor-not-allowed"
            }
          `}
        >
          {step < STEPS - 1 ? "Continue →" : "Let's go →"}
        </button>
      </div>
    </div>
  );
}
