"use client";

import { DECISION_COLORS, formatCurrency, formatPercent } from "@/lib/utils";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

interface Decision {
  decision: string;
  confidence: number;
  target_price?: number | null;
  stop_loss?: number | null;
  position_size_pct?: number;
  time_horizon?: string;
  reasoning?: string;
  ticker?: string;
}

interface Props {
  decision: Decision;
}

const DECISION_ICONS: Record<string, React.ReactNode> = {
  BUY: <ArrowUp className="h-6 w-6" />,
  SELL: <ArrowDown className="h-6 w-6" />,
  HOLD: <ArrowRight className="h-6 w-6" />,
};

export default function DecisionCard({ decision }: Props) {
  const color = DECISION_COLORS[decision.decision] || "#eab308";

  return (
    <div
      className="rounded-xl border-2 p-6"
      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Final Decision
          </p>
          <div className="mt-1 flex items-center gap-3">
            <span style={{ color }}>{DECISION_ICONS[decision.decision]}</span>
            <span
              className="text-3xl font-bold"
              style={{ color }}
            >
              {decision.decision}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
              {formatPercent(decision.confidence)} confidence
            </span>
          </div>
        </div>
        {decision.ticker && (
          <span className="text-2xl font-bold text-[var(--foreground)]/30">
            {decision.ticker}
          </span>
        )}
      </div>

      {decision.reasoning && (
        <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/70">
          {decision.reasoning}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Target Price" value={formatCurrency(decision.target_price)} />
        <Stat label="Stop Loss" value={formatCurrency(decision.stop_loss)} />
        <Stat label="Position Size" value={`${decision.position_size_pct ?? 0}%`} />
        <Stat label="Time Horizon" value={decision.time_horizon || "N/A"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
