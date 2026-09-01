"use client";

import { Sliders, User, ArrowRight, TrendingUp, ShieldAlert, Sparkles, Percent } from "lucide-react";
import { DECISION_COLORS } from "@/lib/utils";

interface Props {
  breakdown?: {
    base_signal: string;
    base_confidence_pct: number;
    adjustments: { factor: string; delta_pct: number; description: string }[];
    final_decision: string;
    final_confidence_pct: number;
    risk_tolerance: string;
    max_concentration_limit_pct: number;
  };
}

export default function PersonalizationBreakdownCard({ breakdown }: Props) {
  if (!breakdown) return null;

  const baseColor = DECISION_COLORS[breakdown.base_signal] || "#6366f1";
  const finalColor = DECISION_COLORS[breakdown.final_decision] || "#eab308";

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
              Requirement #6
            </span>
            <h3 className="text-lg font-extrabold text-white">Explicit AI Personalization Calculation</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Transparent scoring showing how raw market signals are adjusted by your risk tolerance and portfolio constraints.
          </p>
        </div>
      </div>

      {/* 3-Step Mathematical Flow */}
      <div className="grid gap-4 md:grid-cols-3 items-center">
        {/* Step 1: Base AI Signal */}
        <div className="rounded-2xl border border-white/10 bg-[var(--background)] p-4 space-y-2 shadow-inner text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
            1. Pure Market AI Signal (Pre-Profile)
          </span>
          <div
            className="text-2xl font-black font-mono tracking-tight"
            style={{ color: baseColor }}
          >
            {breakdown.base_signal} ({breakdown.base_confidence_pct}%)
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-tight">
            Raw consensus generated solely from financial statements, news, indicators, and macro data.
          </p>
        </div>

        {/* Step 2: Personalization Adjustments */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-2 shadow-inner">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block text-center">
            2. Personalization Adjustments
          </span>
          <div className="space-y-1.5">
            {breakdown.adjustments && breakdown.adjustments.map((adj, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs rounded-xl bg-white/[0.04] p-2 border border-white/5"
              >
                <span className="text-zinc-300 truncate max-w-[170px]">{adj.factor}</span>
                <span
                  className={`font-mono font-bold ${
                    adj.delta_pct > 0
                      ? "text-emerald-400"
                      : adj.delta_pct < 0
                      ? "text-rose-400"
                      : "text-zinc-400"
                  }`}
                >
                  {adj.delta_pct > 0 ? `+${adj.delta_pct}%` : `${adj.delta_pct}%`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Final Personalized Recommendation */}
        <div className="rounded-2xl border-2 p-4 space-y-2 text-center shadow-lg" style={{ borderColor: `${finalColor}40`, backgroundColor: `${finalColor}08` }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
            3. Final Personalized Conviction
          </span>
          <div
            className="text-2xl font-black font-mono tracking-tight"
            style={{ color: finalColor }}
          >
            {breakdown.final_decision} ({breakdown.final_confidence_pct}%)
          </div>
          <p className="text-[11px] text-zinc-300 leading-tight">
            Actionable recommendation customized for your {breakdown.risk_tolerance} profile and {breakdown.max_concentration_limit_pct}% max cap.
          </p>
        </div>
      </div>
    </div>
  );
}
