"use client";

import { X, Cpu, Database, ShieldAlert, Briefcase, Globe, Sparkles, CheckCircle2, Award, Zap } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchitectureGuideModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--card-border-glow)] bg-[#0a0b12] p-8 shadow-2xl space-y-6 text-zinc-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 shadow-lg shadow-indigo-500/20">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">System Architecture & PS-01 Compliance</h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400">
                100% Free Stack
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Multi-Agent Autonomous Financial Intelligence System for Retail Investors
            </p>
          </div>
        </div>

        {/* Overview banner */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent p-5 text-xs leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <Sparkles className="h-4 w-4" />
            <span>How This Bridges the Retail Investor Asymmetry Gap</span>
          </div>
          <p>
            Unlike typical single-metric screeners or raw price charts, our platform deploys an orchestrated team of 5 specialized LangGraph AI agents. In under 20 seconds, it ingests live market data, queries SEC EDGAR filings via local ChromaDB RAG, cross-references news sentiment, and weighs the synthesis against your personalized risk profile to deliver cited, actionable recommendations.
          </p>
        </div>

        {/* The 5 Agents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            The Multi-Agent Workflow
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Agent 1 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Cpu className="h-4 w-4" />
                <span>1. Fundamentals Agent</span>
              </div>
              <p className="text-xs text-zinc-400">
                Parses balance sheets, P/E ratios, revenue growth, and queries SEC 10-K/10-Q filings with local ChromaDB RAG.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Visible source citations
              </div>
            </div>

            {/* Agent 2 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Globe className="h-4 w-4" />
                <span>2. Sentiment Agent</span>
              </div>
              <p className="text-xs text-zinc-400">
                Scrapes breaking news headlines and catalyst themes via Tavily Search, scoring market sentiment from -1.0 to +1.0.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Real-time news attribution
              </div>
            </div>

            {/* Agent 3 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Zap className="h-4 w-4" />
                <span>3. Technical Agent</span>
              </div>
              <p className="text-xs text-zinc-400">
                Locally computes RSI(14), MACD histogram, and Bollinger Bands over 90-day price candle history.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Quantitative indicator math
              </div>
            </div>

            {/* Agent 4 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Globe className="h-4 w-4" />
                <span>4. Macro Agent</span>
              </div>
              <p className="text-xs text-zinc-400">
                Tracks global market indices (S&P 500, NIFTY 50, USD/INR) to establish the macro risk regime.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Regime classification
              </div>
            </div>

            {/* Agent 5 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <ShieldAlert className="h-4 w-4" />
                <span>5. Risk Manager</span>
              </div>
              <p className="text-xs text-zinc-400">
                Detects conflicting signals (e.g. Bullish Tech vs Bearish News), elevates risk level, and caps allocation limit.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Conflict detection engine
              </div>
            </div>

            {/* Agent 6 */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 space-y-2">
              <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
                <Briefcase className="h-4 w-4" />
                <span>6. Portfolio Manager</span>
              </div>
              <p className="text-xs text-zinc-400">
                Synthesizes all reports against the user's risk tolerance, producing target price, stop-loss, and personalized BUY/HOLD/SELL.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fully personalized output
              </div>
            </div>
          </div>
        </div>

        {/* PS-01 Checklist */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            PS-01 Minimum Requirements Summary
          </h4>
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            {[
              "3+ Dimensional Signal Classification (Fundamentals, Sentiment, Technicals, Macro)",
              "RAG Grounding in Regulatory SEC 10-K Filings with Citations",
              "Parallel Multi-Agent Fan-Out & Sequential Synthesis in LangGraph",
              "Personalized User Profiling & Demonstrable 'What-If' Comparator",
              "Real-time WebSocket Streaming with Step-by-Step Thought Trace",
              "Session Metrics: Latency (ms), Agent Agreement Score, Risk Concentration",
              "Graceful Degraded-Data & Conflicting Signal Fault Tolerance",
              "100% Free-Tier APIs (Google Gemini, Alpha Vantage, Finnhub, Tavily)",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold text-white hover:brightness-110 transition-all shadow-lg"
          >
            Got It, Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
