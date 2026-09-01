"use client";

import { CheckCircle2, AlertTriangle, UserCheck, HelpCircle, Shield, Sparkles } from "lucide-react";
import { DECISION_COLORS } from "@/lib/utils";

interface Props {
  whyDecision?: {
    final_decision: string;
    confidence_pct: number;
    positive_factors: string[];
    risk_factors: string[];
    user_profile_effect: string;
    conflicting_signals?: boolean;
    conflict_details?: string;
  };
  ticker?: string;
}

export default function WhyThisDecisionPanel({ whyDecision, ticker }: Props) {
  if (!whyDecision) return null;

  const color = DECISION_COLORS[whyDecision.final_decision] || "#eab308";

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white">Why This Decision?</h3>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-[10px] font-bold text-indigo-300">
                Explainable AI Rationale
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Transparent breakdown of the quantitative catalysts, downside risks, and user profile parameters that governed the final recommendation for {ticker || "this stock"}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="rounded-2xl px-3.5 py-1.5 text-xs font-black text-white shadow-sm font-mono"
            style={{ backgroundColor: color }}
          >
            {whyDecision.final_decision} ({whyDecision.confidence_pct}%)
          </span>
        </div>
      </div>

      {/* Grid: Positive Factors vs Risk Factors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Positive Factors */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2.5 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Key Positive Drivers & Catalysts
          </span>
          <div className="space-y-2">
            {whyDecision.positive_factors && whyDecision.positive_factors.length > 0 ? (
              whyDecision.positive_factors.map((pos, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-2.5 text-xs text-zinc-200 border border-emerald-500/10 leading-relaxed"
                >
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{pos}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted)]">No primary positive catalysts detected.</p>
            )}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2.5 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Key Risk Factors & Volatility Warnings
          </span>
          <div className="space-y-2">
            {whyDecision.risk_factors && whyDecision.risk_factors.length > 0 ? (
              whyDecision.risk_factors.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-2.5 text-xs text-zinc-200 border border-rose-500/10 leading-relaxed"
                >
                  <span className="text-rose-400 font-bold">⚠</span>
                  <span>{risk}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--muted)]">Standard risk parameters within baseline limits.</p>
            )}
          </div>
        </div>
      </div>

      {/* Personalization Effect Section */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[var(--card)] to-transparent p-4 text-xs space-y-1.5 shadow-inner">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <UserCheck className="h-4 w-4 text-indigo-400" />
          <span>Personalization Effect on Final Position:</span>
        </div>
        <p className="text-zinc-200 leading-relaxed pl-6">
          {whyDecision.user_profile_effect}
        </p>
      </div>
    </div>
  );
}
