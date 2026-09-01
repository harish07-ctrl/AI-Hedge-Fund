"use client";

import { useEffect, useState } from "react";
import { getAnalyses, type AnalysisResult } from "@/lib/api";
import { DECISION_COLORS, formatDate, formatPercent } from "@/lib/utils";
import AnalysisCard from "@/components/AnalysisCard";
import DecisionCard from "@/components/DecisionCard";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyses(20)
      .then(setAnalyses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analysis History</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          View past analyses and agent reports
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
          <p className="text-sm text-[var(--muted)]">
            No analyses yet. Go to the dashboard to analyze a stock.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((a) => {
            const isExpanded = expandedId === a.analysis_id;
            return (
              <div
                key={a.analysis_id}
                className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : a.analysis_id)
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">{a.ticker}</span>
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
                    <span className="text-sm text-[var(--muted)]">
                      {formatPercent(a.confidence)} confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Clock className="h-3 w-3" />
                      {formatDate(a.created_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[var(--muted)]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="space-y-4 border-t border-[var(--card-border)] p-5">
                    <DecisionCard
                      decision={{
                        decision: a.decision,
                        confidence: a.confidence,
                        target_price: a.target_price,
                        stop_loss: a.stop_loss,
                        position_size_pct: a.position_size_pct,
                        time_horizon: a.time_horizon,
                        reasoning: a.reasoning,
                        ticker: a.ticker,
                      }}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AnalysisCard
                        agent="fundamentals"
                        report={a.fundamentals_report}
                      />
                      <AnalysisCard
                        agent="sentiment"
                        report={a.sentiment_report}
                      />
                      <AnalysisCard
                        agent="technical"
                        report={a.technical_report}
                      />
                      <AnalysisCard
                        agent="risk_manager"
                        report={a.risk_report}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
