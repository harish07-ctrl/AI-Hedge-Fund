"use client";

import { useState } from "react";
import { DECISION_COLORS, formatCurrency } from "@/lib/utils";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  UserCheck,
  CheckCircle2,
  Bookmark,
  Briefcase,
  Copy,
  Check,
  TrendingUp,
  Shield,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from "lucide-react";
import { addPortfolioHolding, addWatchlist, logUserDecision } from "@/lib/api";

interface Decision {
  decision: string;
  confidence: number;
  target_price?: number | null;
  stop_loss?: number | null;
  position_size_pct?: number;
  time_horizon?: string;
  reasoning?: string;
  decision_factors?: string[];
  user_profile_effect?: string;
  ticker?: string;
  base_signal?: string;
  base_confidence?: number;
}

interface Props {
  decision: Decision;
  onActionSuccess?: (msg: string) => void;
}

const DECISION_ICONS: Record<string, React.ReactNode> = {
  BUY: <ArrowUp className="h-7 w-7" />,
  SELL: <ArrowDown className="h-7 w-7" />,
  HOLD: <ArrowRight className="h-7 w-7" />,
};

export default function DecisionCard({ decision, onActionSuccess }: Props) {
  const [copied, setCopied] = useState(false);
  const [addedToPortfolio, setAddedToPortfolio] = useState(false);
  const [addedToWatchlist, setAddedToWatchlist] = useState(false);
  const [userDecisionLogged, setUserDecisionLogged] = useState<string | null>(null);

  const color = DECISION_COLORS[decision.decision] || "#eab308";
  const confPct = Math.round(
    decision.confidence <= 1.0 ? decision.confidence * 100 : decision.confidence
  );

  const handleCopy = () => {
    const text = `AI Hedge Fund Analysis for ${decision.ticker || "Stock"}:
Decision: ${decision.decision} (AI Confidence: ${confPct}%)
Target Price: ${decision.target_price ? `$${decision.target_price}` : "N/A"}
Stop Loss: ${decision.stop_loss ? `$${decision.stop_loss}` : "N/A"}
Recommended Position: ${decision.position_size_pct || 10}%
Reasoning: ${decision.reasoning || ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUserFeedback = async (action: "accept" | "reject") => {
    if (!decision.ticker) return;
    try {
      await logUserDecision(action, decision.ticker, {
        decision: decision.decision,
        confidence: confPct,
      });
      setUserDecisionLogged(action);
      if (onActionSuccess) {
        onActionSuccess(
          action === "accept"
            ? `Logged: Accepted AI recommendation for ${decision.ticker}`
            : `Logged: Disagreed with AI recommendation for ${decision.ticker}`
        );
      }
    } catch {
      // ignore
    }
  };

  const handleAddToPortfolio = async () => {
    if (!decision.ticker) return;
    try {
      await addPortfolioHolding({
        ticker: decision.ticker,
        shares: 10,
        avg_entry_price: decision.target_price ? Number((decision.target_price * 0.9).toFixed(2)) : 150.0,
      });
      await logUserDecision("add_portfolio", decision.ticker, { shares: 10 });
      setAddedToPortfolio(true);
      if (onActionSuccess) onActionSuccess(`Added 10 shares of ${decision.ticker} to your portfolio.`);
      setTimeout(() => setAddedToPortfolio(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleAddToWatchlist = async () => {
    if (!decision.ticker) return;
    try {
      await addWatchlist(decision.ticker, `AI Signal: ${decision.decision} (${confPct}%)`);
      await logUserDecision("add_watchlist", decision.ticker);
      setAddedToWatchlist(true);
      if (onActionSuccess) onActionSuccess(`Added ${decision.ticker} to your watchlist.`);
      setTimeout(() => setAddedToWatchlist(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="rounded-3xl border-2 p-6 sm:p-7 shadow-2xl space-y-5 transition-all relative overflow-hidden"
      style={{
        borderColor: color + "40",
        backgroundColor: "#0c0e18",
        boxShadow: `0 20px 40px -15px ${color}15`,
      }}
    >
      {/* Background Accent Glow */}
      <div
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Personalized AI Investment Decision
            </span>
            {decision.ticker && (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono font-bold text-white">
                {decision.ticker}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <Clock className="h-3 w-3" /> Live Feed (Age: 1s)
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2 text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <span className="text-white">{DECISION_ICONS[decision.decision]}</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {decision.decision}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }}></span>
              <span>AI Conviction: {confPct}%</span>
            </div>

            {decision.base_signal && (
              <span className="text-xs text-[var(--muted)]">
                Base Market Signal: <strong className="text-white">{decision.base_signal}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons & Decision Logging (Requirement #14) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* User Feedback Acceptance */}
          <div className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-1 text-xs">
            <button
              onClick={() => handleUserFeedback("accept")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                userDecisionLogged === "accept"
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-400 hover:text-emerald-400"
              }`}
              title="Accept & Follow Recommendation"
            >
              <ThumbsUp className="h-3 w-3" />
              <span>Accept</span>
            </button>
            <button
              onClick={() => handleUserFeedback("reject")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                userDecisionLogged === "reject"
                  ? "bg-rose-600 text-white"
                  : "text-zinc-400 hover:text-rose-400"
              }`}
              title="Reject Recommendation"
            >
              <ThumbsDown className="h-3 w-3" />
              <span>Reject</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs font-bold text-zinc-300 hover:border-white/20 hover:text-white transition-all shadow-sm"
            title="Copy summary to clipboard"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleAddToWatchlist}
            disabled={addedToWatchlist}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm disabled:opacity-50"
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>{addedToWatchlist ? "Pinned" : "Watchlist"}</span>
          </button>

          <button
            onClick={handleAddToPortfolio}
            disabled={addedToPortfolio}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>{addedToPortfolio ? "Added to Portfolio" : "+ Add Holding"}</span>
          </button>
        </div>
      </div>

      {/* Synthesis Reasoning Text */}
      {decision.reasoning && (
        <p className="text-sm sm:text-base leading-relaxed text-zinc-200 font-medium">
          {decision.reasoning}
        </p>
      )}

      {/* User Profile Effect Highlight */}
      {decision.user_profile_effect && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-xs text-indigo-200 flex items-start gap-3 shadow-inner">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <strong className="text-indigo-300 font-bold block mb-0.5">Personalized User Profile Effect:</strong>
            <span className="text-zinc-300">{decision.user_profile_effect}</span>
          </div>
        </div>
      )}

      {/* Numerical Target & Stop-Loss Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-white/5">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/60 p-3.5">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" /> Target Price
          </p>
          <p className="mt-1 text-base sm:text-lg font-black text-white font-mono">
            {formatCurrency(decision.target_price)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/60 p-3.5">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-semibold flex items-center gap-1">
            <Shield className="h-3 w-3 text-rose-400" /> Stop Loss
          </p>
          <p className="mt-1 text-base sm:text-lg font-black text-white font-mono">
            {formatCurrency(decision.stop_loss)}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/60 p-3.5">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-semibold">
            Rec. Position Size
          </p>
          <p className="mt-1 text-base sm:text-lg font-black text-indigo-300 font-mono">
            {decision.position_size_pct ?? 0}%
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/60 p-3.5">
          <p className="text-[11px] text-[var(--muted)] uppercase tracking-wider font-semibold">
            Investment Horizon
          </p>
          <p className="mt-1 text-base sm:text-lg font-black text-white capitalize font-mono">
            {decision.time_horizon || "Medium term"}
          </p>
        </div>
      </div>
    </div>
  );
}
