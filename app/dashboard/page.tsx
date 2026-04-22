"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — Insight-first view
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { InsightCard, InsightEmptyState } from "@/components/InsightCard";
import { StatStrip } from "@/components/StatStrip";
import { generateInsights, computeHealthStats } from "@/lib/engine";
import { getMetrics, getProfile, hasProfile, seedMockData } from "@/lib/storage";
import type { InsightObject, HealthStats } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightObject[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed mock data on first load (no-ops if data already exists)
    seedMockData();

    if (!hasProfile()) {
      router.replace("/setup");
      return;
    }

    const profile = getProfile()!;
    const metrics = getMetrics();

    setProfileName(profile.name);
    setInsights(generateInsights(metrics, profile));
    setStats(computeHealthStats(metrics, profile));
    setLoading(false);
  }, [router]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const positiveCount = insights.filter((i) => i.severity === "positive").length;

  return (
    <div className="min-h-screen pb-24">
      {/* ── Page header ── */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-white/40 font-medium mb-0.5">{today}</p>
            <h1 className="text-[28px] font-bold text-white/95 leading-tight">
              {greeting}
              {profileName ? `, ${profileName.split(" ")[0]}` : ""}
            </h1>
          </div>
          <Link
            href="/log"
            className="
              bg-white/[0.08] border border-white/10
              rounded-2xl px-4 py-2.5
              text-[13px] font-semibold text-white/80
              hover:bg-white/[0.12] transition-colors
              flex items-center gap-2
            "
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Log
          </Link>
        </div>

        {/* Summary line */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {criticalCount > 0 && (
            <span className="text-[11px] font-semibold text-[#FF453A] bg-[#FF453A]/12 rounded-full px-2.5 py-1">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[11px] font-semibold text-[#FFD60A] bg-[#FFD60A]/12 rounded-full px-2.5 py-1">
              {warningCount} needs attention
            </span>
          )}
          {positiveCount > 0 && criticalCount === 0 && warningCount === 0 && (
            <span className="text-[11px] font-semibold text-[#30D158] bg-[#30D158]/12 rounded-full px-2.5 py-1">
              All looking good
            </span>
          )}
          {insights.length === 0 && (
            <span className="text-[12px] text-white/30">
              Log a few days of data to see insights
            </span>
          )}
        </div>
      </div>

      {/* ── Stat Strip ── */}
      {stats && (
        <div className="px-5 mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/25 mb-3">
            This Week
          </div>
          <StatStrip stats={stats} />
        </div>
      )}

      {/* ── Insights Section ── */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
            Your Insights
          </div>
          {insights.length > 0 && (
            <span className="text-[11px] text-white/25">
              {insights.length} active
            </span>
          )}
        </div>

        {insights.length === 0 ? (
          <InsightEmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {insights.map((insight, i) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                delay={i * 80}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      <div className="px-5 mt-8 text-center">
        <p className="text-[11px] text-white/20">
          Tap any insight to see your recommended action
        </p>
      </div>

      <Nav />
    </div>
  );
}
