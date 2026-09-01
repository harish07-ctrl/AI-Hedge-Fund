"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2, TrendingUp } from "lucide-react";
import DecisionCard from "@/components/DecisionCard";
import StockChart from "@/components/StockChart";
import ReportTabs from "@/components/ReportTabs";
import { AnalysisWebSocket, type WSMessage } from "@/lib/websocket";
import { getAnalyses, type AnalysisResult } from "@/lib/api";
import { AGENT_COLORS, DECISION_COLORS, formatDate } from "@/lib/utils";

export default function Dashboard() {
  const [ticker, setTicker] = useState("");
  const [messages, setMessages] = useState<WSMessage[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const wsRef = useRef<AnalysisWebSocket | null>(null);

  useEffect(() => {
    getAnalyses(5).then(setRecentAnalyses).catch(() => {});
  }, []);

  useEffect(() => {
    const ws = new AnalysisWebSocket();
    wsRef.current = ws;
    ws.connect();

    const unsub = ws.onMessage((msg) => {
      if (msg.type === "agent_message" || msg.type === "status") {
        setMessages((prev) => [...prev, msg]);
      } else if (msg.type === "result") {
        setResult(msg.data || null);
        setIsRunning(false);
        getAnalyses(5).then(setRecentAnalyses).catch(() => {});
      } else if (msg.type === "error") {
        setMessages((prev) => [...prev, msg]);
        setIsRunning(false);
      }
    });

    return () => {
      unsub();
      ws.disconnect();
    };
  }, []);

  const handleAnalyze = useCallback(() => {
    const t = ticker.trim().toUpperCase();
    if (!t || isRunning) return;
    setMessages([]);
    setResult(null);
    setIsRunning(true);
    wsRef.current?.analyze(t);
  }, [ticker, isRunning]);

  const decision = result?.final_decision;
  const rawPrices = (result?.technical_report as Record<string, unknown>)?.prices;
  const priceData: { date: string; close: number }[] = Array.isArray(rawPrices)
    ? rawPrices.map((p: Record<string, unknown>) => ({
        date: String(p.date),
        close: Number(p.close),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Multi-agent investment analysis powered by AI
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="Enter stock ticker (e.g. AAPL, MSFT, TSLA)"
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-3 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isRunning || !ticker.trim()}
          className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-light)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          {isRunning ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Compact agent status strip — visible only during analysis */}
      {isRunning && messages.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          <div className="flex items-center gap-2 overflow-hidden">
            {(() => {
              const last = messages[messages.length - 1];
              const agent = last.agent || "system";
              const color = AGENT_COLORS[agent] || "#71717a";
              return (
                <>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-sm text-[var(--foreground)]/70">
                    {last.content}
                  </span>
                </>
              );
            })()}
          </div>
          <span className="ml-auto shrink-0 text-xs text-[var(--muted)]">
            {messages.length} steps
          </span>
        </div>
      )}

      {/* Decision */}
      {decision && decision.decision && (
        <DecisionCard decision={decision} />
      )}

      {/* Chart + Reports — full width */}
      <div className="grid gap-6 lg:grid-cols-2">
        {priceData.length > 0 && (
          <StockChart data={priceData} ticker={ticker} />
        )}

        {result && (
          <ReportTabs
            reports={{
              fundamentals: (result.fundamentals_report as Record<string, unknown>) || {},
              sentiment: (result.sentiment_report as Record<string, unknown>) || {},
              technical: (result.technical_report as Record<string, unknown>) || {},
              risk_manager: (result.risk_report as Record<string, unknown>) || {},
            }}
          />
        )}
      </div>

      {/* Recent analyses */}
      {recentAnalyses.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Recent Analyses
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentAnalyses.map((a) => (
              <div
                key={a.analysis_id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{a.ticker}</span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      color: DECISION_COLORS[a.decision] || "#eab308",
                      backgroundColor:
                        (DECISION_COLORS[a.decision] || "#eab308") + "18",
                    }}
                  >
                    {a.decision}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">
                  {a.reasoning}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {formatDate(a.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
