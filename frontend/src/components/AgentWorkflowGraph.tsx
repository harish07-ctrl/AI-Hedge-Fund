"use client";

import { useState } from "react";
import { Activity, Database, ShieldAlert, Briefcase, Cpu, Globe, Info, Zap, CheckCircle2, ArrowRight, Layers } from "lucide-react";
import { AGENT_COLORS } from "@/lib/utils";

interface Props {
  activeAgent?: string;
}

interface AgentDetails {
  id: string;
  name: string;
  layer: "Analyst Layer (Parallel)" | "Decision Layer (Sequential)" | "Data Layer";
  role: string;
  tools: string;
  outputContract: string;
  color: string;
  icon: any;
}

const AGENTS: AgentDetails[] = [
  {
    id: "fundamentals",
    name: "Fundamentals Agent",
    layer: "Analyst Layer (Parallel)",
    role: "Deep-dives into balance sheets, P/E, revenue trends, and queries SEC 10-K regulatory filings via ChromaDB RAG.",
    tools: "Alpha Vantage Overview, SEC EDGAR 10-K, ChromaDB Vector Retriever",
    outputContract: "BUY/HOLD/SELL signal, quantitative factors, filing excerpts with traceable chunk IDs",
    color: AGENT_COLORS.fundamentals || "#6366f1",
    icon: Cpu,
  },
  {
    id: "sentiment",
    name: "Sentiment Agent",
    layer: "Analyst Layer (Parallel)",
    role: "Scrapes breaking financial news, catalysts, and media sentiment across the web using Tavily Search.",
    tools: "Tavily Search API, Market News Aggregator",
    outputContract: "POSITIVE/NEUTRAL/NEGATIVE sentiment, news articles, catalyst citations",
    color: AGENT_COLORS.sentiment || "#06b6d4",
    icon: Globe,
  },
  {
    id: "technical",
    name: "Technical Agent",
    layer: "Analyst Layer (Parallel)",
    role: "Computes 14-day RSI, MACD histogram, and Bollinger Bands locally over historical candle data.",
    tools: "Yahoo Finance / Alpha Vantage Daily Candles, ta library",
    outputContract: "BUY/HOLD/SELL signal, momentum indicators, support/resistance levels",
    color: AGENT_COLORS.technical || "#f59e0b",
    icon: Activity,
  },
  {
    id: "macro",
    name: "Macro Agent",
    layer: "Analyst Layer (Parallel)",
    role: "Evaluates global index momentum (S&P 500, NIFTY 50, USD/INR) to set the macro economic backdrop.",
    tools: "Global Index feeds, Currency exchange rates",
    outputContract: "BULLISH/NEUTRAL/BEARISH Macro Regime, directional bias",
    color: AGENT_COLORS.macro || "#a855f7",
    icon: Globe,
  },
  {
    id: "risk_manager",
    name: "Risk Manager",
    layer: "Decision Layer (Sequential)",
    role: "Identifies conflicting analyst signals, calculates portfolio concentration risk, and sets stop-loss rules.",
    tools: "Conflict Detection Engine, User Risk Tolerance Profile",
    outputContract: "LOW/MODERATE/HIGH Risk Level, conflict flags, position size ceiling %",
    color: AGENT_COLORS.risk_manager || "#f43f5e",
    icon: ShieldAlert,
  },
  {
    id: "portfolio_manager",
    name: "Portfolio Manager",
    layer: "Decision Layer (Sequential)",
    role: "Synthesizes all signals with user risk preferences to produce final actionable BUY/HOLD/SELL recommendations.",
    tools: "Multi-Agent Synthesis Engine, User Profile Constraints",
    outputContract: "Final BUY/HOLD/SELL, AI confidence %, target price, stop-loss price",
    color: AGENT_COLORS.portfolio_manager || "#ec4899",
    icon: Briefcase,
  },
];

export default function AgentWorkflowGraph({ activeAgent }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<AgentDetails | null>(null);

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
              Requirement #1
            </span>
            <h3 className="text-lg font-extrabold text-white">
              6-Agent LangGraph Architecture (4 Parallel Analysts + 2 Decision Agents)
            </h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            The 4 analyst agents execute concurrently in parallel, feeding their outputs into the sequential Risk & Portfolio synthesis layer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            LangGraph Fan-Out Active
          </span>
        </div>
      </div>

      {/* Layer Demarcation Labels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
        {/* Step 1: Input Data Layer */}
        <div
          onClick={() =>
            setSelectedAgent({
              id: "data",
              name: "Market Data & SEC EDGAR Ingestion Layer",
              layer: "Data Layer",
              role: "Pulls real-time price feeds, historical candles, SEC EDGAR 10-K filings, and web news concurrently.",
              tools: "Alpha Vantage, Finnhub, SEC EDGAR, Tavily Search, Yahoo Finance",
              outputContract: "Normalized raw context payloads passed to the 4 parallel analyst agents",
              color: "#3b82f6",
              icon: Database,
            })
          }
          className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-2 group-hover:scale-110 transition-transform">
            <Database className="h-5 w-5" />
          </div>
          <span className="text-xs font-extrabold text-white">1. Data Ingestion Layer</span>
          <span className="text-[10px] text-[var(--muted)] mt-0.5">SEC 10-K + Live Feeds</span>
          <span className="mt-2 text-[10px] text-blue-400 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100">
            <Info className="h-3 w-3" /> Inspect Ingestion
          </span>
        </div>

        {/* Step 2: 4 Parallel Analysts (ANALYST LAYER) */}
        <div className="flex flex-col gap-1.5 justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">
            2. Analyst Layer (Parallel)
          </span>
          {AGENTS.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeAgent === item.id;
            const isSelected = selectedAgent?.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedAgent(item)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                  isActive
                    ? "border-amber-400 bg-amber-400/20 text-white shadow-lg shadow-amber-400/20 scale-[1.02] animate-pulse"
                    : isSelected
                    ? "border-indigo-500 bg-indigo-500/10 text-white"
                    : "border-[var(--card-border)] bg-[var(--background)] text-zinc-300 hover:border-white/20 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <Icon className="h-3.5 w-3.5 text-[var(--muted)]" />
                  <span className="truncate">{item.name.replace(" Agent", "")}</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Parallel
                </span>
              </button>
            );
          })}
        </div>

        {/* Step 3: Risk Manager (DECISION LAYER) */}
        {(() => {
          const item = AGENTS[4];
          const Icon = item.icon;
          const isActive = activeAgent === item.id;
          const isSelected = selectedAgent?.id === item.id;

          return (
            <div
              onClick={() => setSelectedAgent(item)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all group shadow-md ${
                isActive
                  ? "border-rose-400 bg-rose-400/20 text-white shadow-lg shadow-rose-400/20 scale-[1.02] animate-pulse"
                  : isSelected
                  ? "border-rose-500 bg-rose-500/10"
                  : "border-[var(--card-border)] bg-[var(--background)] hover:border-rose-500/50 hover:bg-rose-500/5"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                3. Decision Layer (Fan-In)
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-2 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-extrabold text-white">Risk Manager</span>
              <span className="text-[10px] text-[var(--muted)] mt-0.5">Detects Signal Conflicts</span>
              <span className="mt-2 text-[10px] text-rose-400 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <Info className="h-3 w-3" /> Inspect Rules
              </span>
            </div>
          );
        })()}

        {/* Step 4: Portfolio Manager (DECISION LAYER) */}
        {(() => {
          const item = AGENTS[5];
          const Icon = item.icon;
          const isActive = activeAgent === item.id;
          const isSelected = selectedAgent?.id === item.id;

          return (
            <div
              onClick={() => setSelectedAgent(item)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all group shadow-md ${
                isActive
                  ? "border-pink-400 bg-pink-400/20 text-white shadow-lg shadow-pink-400/20 scale-[1.02] animate-pulse"
                  : isSelected
                  ? "border-pink-500 bg-pink-500/10"
                  : "border-pink-500/30 bg-pink-500/5 hover:border-pink-500 hover:bg-pink-500/10"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400 mb-1">
                4. Personalization Layer
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 mb-2 group-hover:scale-110 transition-transform">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-extrabold text-white">Portfolio Manager</span>
              <span className="text-[10px] text-pink-300 mt-0.5">Personalized Decision</span>
              <span className="mt-2 text-[10px] text-pink-400 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <Info className="h-3 w-3" /> Inspect Output
              </span>
            </div>
          );
        })()}
      </div>

      {/* Interactive Inspector Drawer for Selected Node */}
      {selectedAgent && (
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[var(--card)] to-transparent p-5 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedAgent.color }} />
              <span className="font-extrabold text-white text-sm">{selectedAgent.name}</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                {selectedAgent.layer}
              </span>
            </div>
            <button
              onClick={() => setSelectedAgent(null)}
              className="text-[11px] font-bold text-[var(--muted)] hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-zinc-300 leading-relaxed">{selectedAgent.role}</p>

          <div className="grid gap-2 sm:grid-cols-2 pt-2 border-t border-white/5 text-[11px]">
            <div>
              <span className="text-[var(--muted)] font-bold uppercase tracking-wider block">Tools & Feeds</span>
              <span className="text-indigo-300 font-semibold">{selectedAgent.tools}</span>
            </div>
            <div>
              <span className="text-[var(--muted)] font-bold uppercase tracking-wider block">Structured Output Contract</span>
              <span className="text-emerald-300 font-semibold">{selectedAgent.outputContract}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
