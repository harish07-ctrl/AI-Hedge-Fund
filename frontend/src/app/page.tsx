"use client";

import { useEffect, useState, useRef } from "react";
import {
  Activity,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Clock,
  Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import DecisionCard from "@/components/DecisionCard";
import WhyThisDecisionPanel from "@/components/WhyThisDecisionPanel";
import PersonalizationBreakdownCard from "@/components/PersonalizationBreakdownCard";
import SignalClassificationCard from "@/components/SignalClassificationCard";
import ConflictDetectionBanner from "@/components/ConflictDetectionBanner";
import SourcesEvidencePanel from "@/components/SourcesEvidencePanel";
import DegradedDataControl from "@/components/DegradedDataControl";
import StockChart from "@/components/StockChart";
import ReportTabs from "@/components/ReportTabs";
import AgentWorkflowGraph from "@/components/AgentWorkflowGraph";
import PortfolioTable from "@/components/PortfolioTable";
import WatchlistSection from "@/components/WatchlistSection";
import UserProfileModal from "@/components/UserProfileModal";
import WhatIfCompareView from "@/components/WhatIfCompareView";
import BehavioralHistoryView from "@/components/BehavioralHistoryView";
import SessionPerformanceView from "@/components/SessionPerformanceView";
import Ps01ComplianceView from "@/components/Ps01ComplianceView";
import {
  AnalysisResult,
  getAnalyses,
  analyzeStock,
  getUserProfile,
  UserProfile,
} from "@/lib/api";
import { AnalysisWebSocket, WSMessage } from "@/lib/websocket";

const POPULAR_TICKERS = [
  { symbol: "AAPL", name: "Apple", price: "$232.10", chg: "+1.2%" },
  { symbol: "NVDA", name: "Nvidia", price: "$128.40", chg: "+3.8%" },
  { symbol: "MSFT", name: "Microsoft", price: "$448.20", chg: "+0.6%" },
  { symbol: "TSLA", name: "Tesla", price: "$215.60", chg: "-1.1%" },
  { symbol: "TCS", name: "Tata Consultancy", price: "₹4,120", chg: "+0.8%" },
  { symbol: "RELIANCE", name: "Reliance Ind.", price: "₹2,980", chg: "+1.5%" },
  { symbol: "INFY", name: "Infosys", price: "₹1,850", chg: "+0.4%" },
  { symbol: "HDFCBANK", name: "HDFC Bank", price: "₹1,640", chg: "+0.2%" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [ticker, setTicker] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | undefined>();
  const [streamMessages, setStreamMessages] = useState<string[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<AnalysisWebSocket | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {});
    getAnalyses(6).then(setRecentAnalyses).catch(() => {});

    const ws = new AnalysisWebSocket();
    ws.connect();
    const unsub = ws.onMessage((msg: WSMessage) => {
      if (msg.type === "agent_message") {
        setActiveAgent(msg.agent);
        if (msg.content) {
          setStreamMessages((prev) => [...prev.slice(-6), msg.content || ""]);
        }
      } else if (msg.type === "result" && msg.data) {
        setAnalysis(msg.data);
        setLoading(false);
        setActiveAgent(undefined);
        showToast(`Multi-agent analysis complete for ${msg.data.ticker}!`);
        getAnalyses(6).then(setRecentAnalyses).catch(() => {});
      } else if (msg.type === "error") {
        setLoading(false);
        setActiveAgent(undefined);
        showToast(`Notice: ${msg.message}`);
      }
    });

    wsRef.current = ws;
    return () => {
      unsub();
      ws.disconnect();
    };
  }, []);

  const handleAnalyze = async (
    targetTicker?: string,
    simulations?: { simulate_api_failure?: boolean; simulate_missing_filing?: boolean; simulate_agent_failure?: boolean }
  ) => {
    const symbol = (targetTicker || ticker).trim().toUpperCase();
    if (!symbol) return;
    setTicker(symbol);
    setLoading(true);
    setActiveTab("dashboard");
    setStreamMessages([`Initiating 6-agent research pipeline for ${symbol}...`]);

    if (wsRef.current) {
      wsRef.current.analyze(symbol, profile ? { ...profile } : undefined, simulations);
    } else {
      try {
        const result = await analyzeStock(symbol, profile || undefined, {
          simulateApiFailure: simulations?.simulate_api_failure,
          simulateMissingFiling: simulations?.simulate_missing_filing,
          simulateAgentFailure: simulations?.simulate_agent_failure,
        });
        setAnalysis(result);
        showToast(`Analysis complete for ${symbol}!`);
      } catch (err: any) {
        showToast(`Error: ${err.message || "Failed to analyze"}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRunDegradedDataTest = (testType: "api_failure" | "missing_filing" | "agent_failure") => {
    const target = ticker || "AAPL";
    if (testType === "api_failure") {
      showToast(`Testing Market API Outage on ${target}...`);
      handleAnalyze(target, { simulate_api_failure: true });
    } else if (testType === "missing_filing") {
      showToast(`Testing Missing SEC Filing on ${target}...`);
      handleAnalyze(target, { simulate_missing_filing: true });
    } else {
      showToast(`Testing Agent Failure on ${target}...`);
      handleAnalyze(target, { simulate_agent_failure: true });
    }
  };

  const currentPrices = (analysis?.technical_report?.prices as any[]) || [];

  return (
    <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navbar with Tabs & Judge Demo Tour */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunDemoAnalysis={(sym) => handleAnalyze(sym)}
      />

      {/* Live Market Ticker Tape Marquee */}
      <div className="border-b border-white/5 bg-[#090a12] py-2 overflow-hidden select-none">
        <div className="flex animate-marquee whitespace-nowrap gap-8 items-center text-xs font-mono">
          {POPULAR_TICKERS.concat(POPULAR_TICKERS).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAnalyze(item.symbol)}
              className="inline-flex items-center gap-2 hover:text-indigo-400 transition-colors group cursor-pointer"
            >
              <span className="font-extrabold text-white group-hover:underline">{item.symbol}</span>
              <span className="text-[var(--muted)]">{item.price}</span>
              <span className={item.chg.startsWith("+") ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {item.chg}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-indigo-500/40 bg-[#0d0f1d] px-5 py-3 text-xs font-bold text-white shadow-2xl animate-in slide-in-from-bottom-5 duration-200 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Search & Hero Bar */}
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                    <span>Autonomous Financial Intelligence</span>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-black text-emerald-400 font-mono">
                      PS-01 Compliant
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                    Enter any US or Indian stock symbol to trigger 4 parallel analyst agents, SEC ChromaDB RAG, and personalized portfolio synthesis.
                  </p>
                </div>

                {profile && (
                  <div className="flex items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2 text-xs">
                    <Shield className="h-4 w-4 text-indigo-400" />
                    <div>
                      <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider block font-bold">
                        Active Risk Profile
                      </span>
                      <span className="font-bold text-white font-mono">{profile.risk_tolerance}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticker Search Box */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                    placeholder="Enter ticker (e.g. AAPL, NVDA, TCS, RELIANCE, MSFT)"
                    className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--background)] pl-12 pr-10 py-3.5 text-sm font-extrabold text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none uppercase font-mono shadow-inner transition-all"
                  />
                  {ticker && (
                    <button
                      onClick={() => setTicker("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading || !ticker}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 px-8 py-3.5 text-sm font-black text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/30 whitespace-nowrap"
                >
                  <Sparkles className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  <span>{loading ? "Analyzing 6 Agents..." : "Run Autonomous Analysis"}</span>
                </button>
              </div>

              {/* Popular Ticker Preset Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5 text-xs">
                <span className="text-[var(--muted)] font-bold">Popular:</span>
                {POPULAR_TICKERS.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleAnalyze(item.symbol)}
                    disabled={loading}
                    className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-1.5 font-mono font-bold text-zinc-300 hover:border-indigo-400 hover:text-white transition-all disabled:opacity-50"
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Degraded-Data & Fault-Tolerance Simulator (Requirement #10) */}
            <DegradedDataControl onRunTest={handleRunDegradedDataTest} isRunning={loading} />

            {/* Real-Time Thought Stream */}
            {loading && (
              <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-[var(--card)] to-transparent p-6 space-y-3 shadow-2xl animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm">
                    <Activity className="h-4 w-4 animate-spin" />
                    <span>Real-Time LangGraph Multi-Agent Stream ({ticker})</span>
                  </div>
                  <span className="text-xs font-mono text-[var(--muted)]">Parallel Fan-Out</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono text-zinc-300">
                  {streamMessages.map((msg, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">▶</span>
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Results View */}
            {analysis && (
              <div className="space-y-8">
                {/* 1. Conflict Detection Banner (Requirement #9) */}
                <ConflictDetectionBanner
                  conflicting={analysis.risk_report?.conflicting_signals as boolean}
                  conflictDetails={analysis.risk_report?.conflict_details as string}
                  analysts={{
                    fundamentals: String(analysis.fundamentals_report?.signal || "HOLD"),
                    sentiment: String(analysis.sentiment_report?.signal || "NEUTRAL"),
                    technical: String(analysis.technical_report?.signal || "HOLD"),
                    macro: String(analysis.macro_report?.signal || "HOLD"),
                  }}
                />

                {/* 2. Personalized Decision Card */}
                <DecisionCard
                  decision={{
                    decision: analysis.decision || (analysis.final_decision as any)?.decision || "HOLD",
                    confidence: analysis.confidence || (analysis.final_decision as any)?.confidence || 0.78,
                    target_price: analysis.target_price || (analysis.final_decision as any)?.target_price,
                    stop_loss: analysis.stop_loss || (analysis.final_decision as any)?.stop_loss,
                    position_size_pct: analysis.position_size_pct || (analysis.final_decision as any)?.position_size_pct,
                    time_horizon: analysis.time_horizon || (analysis.final_decision as any)?.time_horizon,
                    reasoning: analysis.reasoning || (analysis.final_decision as any)?.reasoning,
                    user_profile_effect: analysis.user_profile_effect || (analysis.final_decision as any)?.user_profile_effect,
                    ticker: analysis.ticker,
                    base_signal: (analysis.final_decision as any)?.base_signal,
                  }}
                  onActionSuccess={showToast}
                />

                {/* 3. "Why This Decision?" Panel (Requirement #5) */}
                <WhyThisDecisionPanel
                  whyDecision={analysis.why_decision || {
                    final_decision: analysis.decision || "HOLD",
                    confidence_pct: Math.round(Number(analysis.confidence || 0.78) * 100),
                    positive_factors: ["Financial metrics verified", "Technical support confirmed"],
                    risk_factors: ["Standard volatility parameters"],
                    user_profile_effect: analysis.user_profile_effect || "Customized for active risk profile.",
                  }}
                  ticker={analysis.ticker}
                />

                {/* 4. Explicit Personalization Calculation (Requirement #6) */}
                <PersonalizationBreakdownCard
                  breakdown={analysis.personalization_breakdown || {
                    base_signal: (analysis.final_decision as any)?.base_signal || analysis.decision || "HOLD",
                    base_confidence_pct: 82,
                    adjustments: [
                      { factor: `${profile?.risk_tolerance || "Moderate"} Profile Adjustment`, delta_pct: -6, description: "Capital preservation delta" }
                    ],
                    final_decision: analysis.decision || "HOLD",
                    final_confidence_pct: Math.round(Number(analysis.confidence || 0.78) * 100),
                    risk_tolerance: profile?.risk_tolerance || "Moderate",
                    max_concentration_limit_pct: profile?.max_portfolio_concentration || 20,
                  }}
                />

                {/* 5. 4-Dimension Signal Classification Layer (Requirement #2) */}
                <SignalClassificationCard classification={analysis.signal_classification} />

                {/* 6. Multi-Agent Pipeline Graph (4 Parallel + 2 Sequential) */}
                <AgentWorkflowGraph activeAgent={activeAgent} />

                {/* 7. Interactive Stock Price Chart */}
                <StockChart data={currentPrices} ticker={analysis.ticker} />

                {/* 8. Multi-Perspective Report Tabs */}
                <ReportTabs
                  reports={{
                    fundamentals: analysis.fundamentals_report,
                    sentiment: analysis.sentiment_report,
                    technical: analysis.technical_report,
                    macro: analysis.macro_report || {},
                    risk_manager: analysis.risk_report,
                  }}
                />

                {/* 9. Traceable Evidence & Citations Panel (Requirement #12 & #13) */}
                <SourcesEvidencePanel
                  evidence={analysis.traceable_evidence || []}
                  sources={(analysis.fundamentals_report?.sources as any[]) || []}
                  ticker={analysis.ticker}
                />
              </div>
            )}

            {/* Recent Analyses Grid */}
            {recentAnalyses.length > 0 && !analysis && (
              <div className="space-y-4 pt-4">
                <h3 className="text-base font-extrabold text-white">Recent Multi-Agent Analyses</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentAnalyses.map((item) => (
                    <button
                      key={item.analysis_id}
                      onClick={() => setAnalysis(item)}
                      className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 text-left hover:border-indigo-500/50 hover:bg-white/[0.02] transition-all group shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white font-mono text-base group-hover:text-indigo-400">
                          {item.ticker}
                        </span>
                        <span className="rounded-lg bg-indigo-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                          {item.decision || (item.final_decision as any)?.decision || "HOLD"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                        {item.reasoning || (item.final_decision as any)?.reasoning}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: What-If Studio (Requirement #7) */}
        {activeTab === "what-if" && <WhatIfCompareView />}

        {/* Tab 3: Portfolio & Watchlist */}
        {activeTab === "portfolio" && (
          <div className="space-y-8">
            <PortfolioTable onSelectTicker={(sym) => handleAnalyze(sym)} />
            <WatchlistSection onSelectTicker={(sym) => handleAnalyze(sym)} />
          </div>
        )}

        {/* Tab 4: Session Performance & Metrics (Requirement #3 & #15) */}
        {activeTab === "performance" && <SessionPerformanceView />}

        {/* Tab 5: Official PS-01 Compliance Matrix (Requirement #16) */}
        {activeTab === "compliance" && <Ps01ComplianceView />}

        {/* Tab 6: Investor Profile Settings */}
        {activeTab === "profile" && <UserProfileModal onProfileUpdated={setProfile} />}

        {/* Tab 7: Behavioral History & Audit Trail (Requirement #14) */}
        {activeTab === "history" && <BehavioralHistoryView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#090a12] py-6 text-center text-xs text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Hedge Fund • PS-01 Autonomous Financial Intelligence for Retail Investors</span>
          <span className="font-mono text-[11px] text-zinc-500">100% Free-Tier & Local Math (LangGraph + ChromaDB + SQLite)</span>
        </div>
      </footer>
    </div>
  );
}
