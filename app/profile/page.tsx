"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Profile — View + edit user profile and data management
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getProfile, saveProfile, clearAllData } from "@/lib/storage";
import { calculateBMR, calculateTDEE } from "@/lib/health/calculations";
import type { ActivityLevel, BiologicalSex, UserProfile } from "@/lib/types";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  light: "Lightly active",
  moderate: "Moderately active",
  active: "Very active",
  very_active: "Athlete",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<BiologicalSex>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace("/setup"); return; }
    setProfile(p);
    populateForm(p);
  }, [router]);

  function populateForm(p: UserProfile) {
    setName(p.name);
    setAge(p.age.toString());
    setHeightCm(p.height_cm.toString());
    setWeightKg(p.weight_kg.toString());
    setSex(p.sex);
    setActivityLevel(p.activity_level);
  }

  function handleSave() {
    const updated = saveProfile({
      name,
      age: parseInt(age),
      height_cm: parseFloat(heightCm),
      weight_kg: parseFloat(weightKg),
      sex,
      activity_level: activityLevel,
    });
    setProfile(updated);
    setEditing(false);
  }

  function handleDelete() {
    clearAllData();
    router.replace("/setup");
  }

  if (!profile) return null;

  const bmr = calculateBMR(profile.weight_kg, profile.height_cm, profile.age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activity_level);

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-white/95">Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[13px] font-semibold text-white/50 hover:text-white/80 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {!editing ? (
        // ── View mode ──
        <div className="px-5 flex flex-col gap-4 animate-fade-in">
          {/* Identity */}
          <div className="glass-card p-5">
            <div className="text-center mb-4">
              <div
                className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white/80"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-[20px] font-bold text-white/90">{profile.name}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Age", value: `${profile.age}y` },
                { label: "Height", value: `${profile.height_cm}cm` },
                { label: "Weight", value: `${profile.weight_kg}kg` },
              ].map((item) => (
                <div key={item.label} className="bg-white/[0.04] rounded-xl p-3 text-center">
                  <div className="text-[18px] font-semibold text-white/85">{item.value}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wide mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity + TDEE */}
          <div className="glass-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
              Energy
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[14px] text-white/60">Activity level</div>
              <div className="text-[14px] font-semibold text-white/85">
                {ACTIVITY_LABELS[profile.activity_level]}
              </div>
            </div>
            <div className="h-px bg-white/[0.07] my-3" />
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-white/60">Estimated TDEE</div>
              <div className="text-[22px] font-bold text-white/90">
                {tdee.toLocaleString()}
                <span className="text-[13px] font-normal text-white/35 ml-1">kcal</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-[14px] text-white/60">BMR</div>
              <div className="text-[14px] font-semibold text-white/50">
                {Math.round(bmr).toLocaleString()} kcal
              </div>
            </div>
          </div>

          {/* Data management */}
          <div className="glass-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
              Data
            </div>
            <p className="text-[13px] text-white/40 mb-4">
              All your health data is stored locally on this device. Nothing is sent to any server.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[13px] font-semibold text-[#FF453A]/70 hover:text-[#FF453A] transition-colors"
              >
                Reset all data…
              </button>
            ) : (
              <div className="bg-[#FF453A]/10 border border-[#FF453A]/20 rounded-2xl p-4">
                <p className="text-[13px] text-white/70 mb-3">
                  This will permanently delete all your health data and profile. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-[13px] font-semibold text-white/60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl bg-[#FF453A]/20 border border-[#FF453A]/25 text-[13px] font-semibold text-[#FF453A]"
                  >
                    Delete all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ── Edit mode ──
        <div className="px-5 flex flex-col gap-3 animate-slide-up">
          <div className="glass-card p-4">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30 block mb-2">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="glass-card p-4">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30 block mb-2">Biological Sex</label>
            <div className="flex gap-2">
              {(["male", "female", "other"] as BiologicalSex[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`flex-1 py-2 rounded-xl text-[13px] font-semibold capitalize border transition-all ${sex === s ? "bg-white/10 border-white/25 text-white" : "border-white/[0.07] text-white/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Age", value: age, set: setAge, placeholder: "32", unit: "years", min: 10, max: 120, step: 1 },
            { label: "Height", value: heightCm, set: setHeightCm, placeholder: "180", unit: "cm", min: 100, max: 250, step: 1 },
            { label: "Weight", value: weightKg, set: setWeightKg, placeholder: "80", unit: "kg", min: 30, max: 300, step: 0.1 },
          ].map((f) => (
            <div key={f.label} className="glass-card p-4">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30 block mb-2">{f.label}</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder={f.placeholder}
                  value={f.value}
                  min={f.min} max={f.max} step={f.step}
                  inputMode="decimal"
                  onChange={(e) => f.set(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-white/30">{f.unit}</span>
              </div>
            </div>
          ))}

          <div className="glass-card p-4">
            <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30 block mb-2">Activity Level</label>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setActivityLevel(a)}
                  className={`py-2.5 px-3 rounded-xl text-left text-[13px] font-medium border transition-all ${activityLevel === a ? "bg-white/10 border-white/20 text-white/90" : "border-white/[0.06] text-white/45"}`}
                >
                  {ACTIVITY_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 pb-4">
            <button
              onClick={() => { populateForm(profile); setEditing(false); }}
              className="flex-1 py-4 rounded-2xl bg-white/[0.05] border border-white/10 text-[14px] font-semibold text-white/60"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 rounded-2xl bg-white/[0.10] border border-white/15 text-[15px] font-semibold text-white/90"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <Nav />
    </div>
  );
}
