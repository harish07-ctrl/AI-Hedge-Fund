"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, Zap, ShieldAlert, FileQuestion, ServerCrash, CheckCircle2 } from "lucide-react";

interface Props {
  onRunTest: (testType: "api_failure" | "missing_filing" | "agent_failure") => void;
  isRunning?: boolean;
}

export default function DegradedDataControl({ onRunTest, isRunning }: Props) {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const handleTest = (type: "api_failure" | "missing_filing" | "agent_failure") => {
    setActiveTest(type);
    onRunTest(type);
  };

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[var(--card)] to-transparent p-6 sm:p-7 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
              Requirement #10
            </span>
            <h3 className="text-base font-extrabold text-white">Degraded-Data & Fault-Tolerance Simulator</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Test and verify how the multi-agent pipeline handles outages, 404 missing SEC filings, and agent failures safely.
          </p>
        </div>
      </div>

      {/* 3 Test Scenarios */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Scenario 1: Market API Outage */}
        <button
          onClick={() => handleTest("api_failure")}
          disabled={isRunning}
          className="flex flex-col items-start p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-amber-400/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
            <ServerCrash className="h-4 w-4" />
            <span>1. Market API Outage</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Simulates primary API rate limit; verifies failover to cached candles and local technical indicators.
          </p>
          <span className="mt-2 text-[10px] text-amber-300 font-bold group-hover:underline">
            ▶ Test API Failover
          </span>
        </button>

        {/* Scenario 2: Missing SEC Filing */}
        <button
          onClick={() => handleTest("missing_filing")}
          disabled={isRunning}
          className="flex flex-col items-start p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-blue-400/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
            <FileQuestion className="h-4 w-4" />
            <span>2. Missing SEC Filing</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Simulates 404 missing 10-K report; verifies pipeline alerts user without fabricating missing text.
          </p>
          <span className="mt-2 text-[10px] text-blue-300 font-bold group-hover:underline">
            ▶ Test 404 Filing RAG
          </span>
        </button>

        {/* Scenario 3: Individual Agent Failure */}
        <button
          onClick={() => handleTest("agent_failure")}
          disabled={isRunning}
          className="flex flex-col items-start p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-rose-400/50 transition-all text-left group disabled:opacity-50"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1">
            <ShieldAlert className="h-4 w-4" />
            <span>3. Single Agent Failure</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            Simulates 1 analyst offline; verifies remaining 3 agents proceed and Risk Manager flags reduced confidence.
          </p>
          <span className="mt-2 text-[10px] text-rose-300 font-bold group-hover:underline">
            ▶ Test Agent Resilience
          </span>
        </button>
      </div>
    </div>
  );
}
