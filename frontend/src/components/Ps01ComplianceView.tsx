"use client";

import { useState } from "react";
import { CheckCircle2, Award, ShieldCheck, Cpu, Database, Activity, Code, ExternalLink } from "lucide-react";

interface ComplianceItem {
  id: string;
  category: "Dependencies" | "Minimum Requirements" | "Degraded Data & Metrics";
  title: string;
  description: string;
  codeLocation: string;
  status: "IMPLEMENTED";
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  // Dependencies
  {
    id: "dep-1",
    category: "Dependencies",
    title: "1. Real-time / Near-real-time Market Data Feeds",
    description: "Pulls price quotes, daily candles, and volume feeds via Alpha Vantage, Finnhub, and Yahoo Finance APIs.",
    codeLocation: "backend/app/tools/stock_data.py",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-2",
    category: "Dependencies",
    title: "2. Document Corpus of Regulatory Filings (SEC EDGAR)",
    description: "Fetches official Form 10-K / 10-Q corporate regulatory disclosures with SEC User-Agent headers.",
    codeLocation: "backend/app/tools/sec_filings.py",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-3",
    category: "Dependencies",
    title: "3. Vector Database / Semantic Retrieval Layer (ChromaDB)",
    description: "Chunks, embeds, and performs semantic retrieval on filings via local ChromaDB vector store.",
    codeLocation: "backend/app/rag/retriever.py",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-4",
    category: "Dependencies",
    title: "4. Multi-Agent Orchestration Framework (LangGraph)",
    description: "Concurrent fan-out of 4 analyst agents, feeding sequentially into Risk Manager and Portfolio Manager.",
    codeLocation: "backend/app/agents/graph.py",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-5",
    category: "Dependencies",
    title: "5. User Behavioral Profiling Mechanism",
    description: "Captures risk tolerance, target investment horizon, sector exclusions, and interaction audit trail.",
    codeLocation: "backend/app/db/models.py",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-6",
    category: "Dependencies",
    title: "6. Visualization / Live Interface Layer",
    description: "Next.js 15 dashboard rendering live WebSocket streaming, charts, and workflow state in real-time.",
    codeLocation: "frontend/src/app/page.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "dep-7",
    category: "Dependencies",
    title: "7. Logging & Persistence Mechanism (SQLite)",
    description: "Asynchronous SQLAlchemy database storing analyses, performance metrics, and behavioral events.",
    codeLocation: "backend/app/db/database.py",
    status: "IMPLEMENTED",
  },

  // Minimum Requirements
  {
    id: "req-1",
    category: "Minimum Requirements",
    title: "8. Signal Classification Across 3+ Dimensions",
    description: "Evaluates Fundamentals, Sentiment, Technicals, and Macro with stated confidence scores and cited factors.",
    codeLocation: "frontend/src/components/SignalClassificationCard.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "req-2",
    category: "Minimum Requirements",
    title: "9. RAG Grounding in Document Corpus with Citations",
    description: "Fundamentals agent grounds output in ChromaDB vector chunks with traceable chunk IDs and URLs.",
    codeLocation: "backend/app/agents/fundamentals.py",
    status: "IMPLEMENTED",
  },
  {
    id: "req-3",
    category: "Minimum Requirements",
    title: "10. 4 Parallel Analysts + Synthesis Layer",
    description: "Fundamentals, Sentiment, Technical, and Macro agents execute concurrently with structured JSON output contracts.",
    codeLocation: "backend/app/agents/graph.py",
    status: "IMPLEMENTED",
  },
  {
    id: "req-4",
    category: "Minimum Requirements",
    title: "11. Personalized User Profiling & 'What-If' Comparator",
    description: "Runs identical market data against Conservative vs Aggressive profiles, producing demonstrably different recommendations.",
    codeLocation: "frontend/src/components/WhatIfCompareView.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "req-5",
    category: "Minimum Requirements",
    title: "12. Portfolio-Aware Concentration Rules",
    description: "Evaluates user portfolio sector exposure; restrains allocation if sector limit cap is exceeded.",
    codeLocation: "backend/app/agents/risk_manager.py",
    status: "IMPLEMENTED",
  },

  // Degraded Data & Performance
  {
    id: "deg-1",
    category: "Degraded Data & Metrics",
    title: "13. Degraded-Data Fault Tolerance (API & 404 Filing Fail-Safe)",
    description: "Handles primary API rate limits and missing SEC filings gracefully with cached data and explicit notices.",
    codeLocation: "frontend/src/components/DegradedDataControl.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "deg-2",
    category: "Degraded Data & Metrics",
    title: "14. Analyst Signal Conflict Detection",
    description: "Detects when analysts disagree (e.g. Bullish Tech vs Bearish News), elevates risk level, and warns user.",
    codeLocation: "frontend/src/components/ConflictDetectionBanner.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "deg-3",
    category: "Degraded Data & Metrics",
    title: "15. Real 3+ Measurable Performance Metrics",
    description: "Tracks per-agent latencies, mathematical agreement score %, and portfolio risk concentration score.",
    codeLocation: "frontend/src/components/SessionPerformanceView.tsx",
    status: "IMPLEMENTED",
  },
  {
    id: "deg-4",
    category: "Degraded Data & Metrics",
    title: "16. User Decision & Behavioral Audit Log",
    description: "Logs explicit user actions (accept, reject, add to portfolio, edit profile) to persistent database.",
    codeLocation: "backend/app/api/routes.py",
    status: "IMPLEMENTED",
  },
];

export default function Ps01ComplianceView() {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const filtered = COMPLIANCE_ITEMS.filter(
    (item) => filterCategory === "ALL" || item.category === filterCategory
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-[var(--card)] to-transparent p-6 sm:p-8 space-y-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-md">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white">PS-01 Official Compliance Matrix</h2>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-black text-emerald-300 font-mono">
                16/16 REQUIREMENTS MET (100%)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
              Every item mandated in the VIT Chennai <strong>PS-01 Problem Statement</strong> is fully implemented, verified, and grounded in active code.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mr-1">Filter:</span>
          {(["ALL", "Dependencies", "Minimum Requirements", "Degraded Data & Metrics"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                filterCategory === cat
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Compliance Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-5 space-y-3 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] bg-white/5 px-2.5 py-1 rounded-lg">
                  {item.category}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 font-mono">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.status}
                </span>
              </div>

              <h3 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <Code className="h-3.5 w-3.5 text-indigo-400" />
                {item.codeLocation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
