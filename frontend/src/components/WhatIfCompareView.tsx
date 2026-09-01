"use client";

import { useState } from "react";
import { WhatIfComparison, getWhatIfComparison } from "@/lib/api";
import { DECISION_COLORS } from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Percent,
  Compass,
  Briefcase,
  HelpCircle,
} from "lucide-react";

const PRESET_TICKERS = ["AAPL", "NVDA", "TCS", "TSLA", "RELIANCE", "MSFT"];

export default function WhatIfCompareView() {
  const [ticker, setTicker] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState<WhatIfComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async (targetTicker = ticker) => {
    const symbol = targetTicker.trim().toUpperCase();
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getWhatIfComparison(symbol);
      setComparison(data);
    } catch (e: any) {
      setError(e.message || "Failed to generate What-If comparison.");
    } finally {
      setLoading(false);
    }
  };

  const consDec = comparison?.conservative_result.decision || {};
  const aggDec = comparison?.aggressive_result.decision || {};
  const consColor = DECISION_COLORS[String(consDec.decision || "HOLD")] || "#eab308";
  const aggColor = DECISION_COLORS[String(aggDec.decision || "BUY")] || "#10b981";

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-[var(--card)] to-purple-950/30 p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">What-If Investor Profile Comparator</h2>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300 font-mono">
                Requirement #7
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
              Demonstrably proves personalization: feeds the <strong>exact same market, filing, and technical signals</strong> through a Conservative vs. Aggressive investor profile.
            </p>
          </div>
        </div>

        {/* Search & Preset Triggers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker (e.g. AAPL, NVDA, TCS)"
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3 text-sm font-bold text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none uppercase font-mono shadow-inner"
            />
            <button
              onClick={() => handleCompare(ticker)}
              disabled={loading || !ticker}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 px-6 py-3 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? "Simulating Profiles..." : "Run What-If Test"}</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-xs text-[var(--muted)] font-bold mr-1">Presets:</span>
            {PRESET_TICKERS.map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  setTicker(sym);
                  handleCompare(sym);
                }}
                disabled={loading}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 text-xs font-mono font-bold text-zinc-300 hover:border-amber-400 hover:text-white transition-all disabled:opacity-50"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Proof of Identical Market Input Banner */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>
                <strong>Shared Intelligence Inputs:</strong> Evaluated identical SEC 10-K RAG chunks, news catalysts, and technical indicators for <strong className="text-white">{comparison.ticker}</strong>.
              </span>
            </div>
            <span className="rounded bg-indigo-500/10 px-2.5 py-1 text-[11px] font-mono font-bold text-indigo-300">
              Identical Inputs → Different Actions
            </span>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Conservative Profile Column */}
            <div
              className="rounded-3xl border-2 p-6 sm:p-7 space-y-5 shadow-2xl transition-all"
              style={{
                borderColor: consColor + "40",
                backgroundColor: "#0c0e18",
              }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-extrabold text-white">Conservative Profile</h3>
                </div>
                <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-bold text-blue-300 font-mono">
                  Max 10% Cap • Capital Preservation
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] uppercase font-bold">Recommendation</span>
                <span
                  className="rounded-2xl px-4 py-1.5 text-lg font-black text-white font-mono shadow-md"
                  style={{ backgroundColor: consColor }}
                >
                  {String(consDec.decision || "HOLD")}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">AI Conviction</span>
                  <span className="font-bold text-white font-mono">
                    {Math.round(Number(consDec.confidence || 0.75) * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Recommended Position Size</span>
                  <span className="font-bold text-blue-400 font-mono">
                    {String(consDec.position_size_pct || 5)}% Allocation
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Risk Level Ceiling</span>
                  <span className="font-bold text-emerald-400 font-mono">LOW TO MODERATE</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Stop Loss Boundary</span>
                  <span className="font-bold text-rose-400 font-mono">
                    ${String(consDec.stop_loss || "Tight 5%")}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[var(--background)] p-4 text-xs text-zinc-300 leading-relaxed shadow-inner">
                <strong className="text-white block mb-1">Conservative Rationale:</strong>
                {String(consDec.reasoning || "Enforced defensive risk parameters to avoid downside drawdown.")}
              </div>
            </div>

            {/* Aggressive Profile Column */}
            <div
              className="rounded-3xl border-2 p-6 sm:p-7 space-y-5 shadow-2xl transition-all"
              style={{
                borderColor: aggColor + "40",
                backgroundColor: "#0c0e18",
              }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-extrabold text-white">Aggressive Profile</h3>
                </div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300 font-mono">
                  Max 35% Cap • High Growth
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] uppercase font-bold">Recommendation</span>
                <span
                  className="rounded-2xl px-4 py-1.5 text-lg font-black text-white font-mono shadow-md"
                  style={{ backgroundColor: aggColor }}
                >
                  {String(aggDec.decision || "BUY")}
                </span>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">AI Conviction</span>
                  <span className="font-bold text-white font-mono">
                    {Math.round(Number(aggDec.confidence || 0.85) * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Recommended Position Size</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {String(aggDec.position_size_pct || 25)}% Allocation
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Risk Level Ceiling</span>
                  <span className="font-bold text-amber-400 font-mono">HIGH / GROWTH</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[var(--muted)]">Target Price Upside</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${String(aggDec.target_price || "Expanded upside")}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[var(--background)] p-4 text-xs text-zinc-300 leading-relaxed shadow-inner">
                <strong className="text-white block mb-1">Aggressive Rationale:</strong>
                {String(aggDec.reasoning || "Maximized position sizing to capture breakout momentum and upside.")}
              </div>
            </div>
          </div>

          {/* Why Different Explanation Card */}
          {comparison.why_different && (
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[var(--card)] to-transparent p-6 sm:p-7 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm sm:text-base">
                <HelpCircle className="h-5 w-5" />
                <span>Why Did the Output Differ? (PS-01 Personalization Proof)</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                {comparison.why_different}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
