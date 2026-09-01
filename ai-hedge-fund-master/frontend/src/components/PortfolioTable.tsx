"use client";

import { DECISION_COLORS, formatCurrency, formatDate } from "@/lib/utils";
import type { PortfolioHolding } from "@/lib/api";

interface Props {
  holdings: PortfolioHolding[];
}

export default function PortfolioTable({ holdings }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">
          No holdings yet. Run an analysis to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--card-border)]">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Ticker
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Shares
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Avg Entry
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Signal
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr
              key={h.ticker}
              className="border-b border-[var(--card-border)] last:border-0 hover:bg-white/[0.02]"
            >
              <td className="px-5 py-3 font-semibold">{h.ticker}</td>
              <td className="px-5 py-3 text-sm">{h.shares}</td>
              <td className="px-5 py-3 text-sm">{formatCurrency(h.avg_entry_price)}</td>
              <td className="px-5 py-3">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    color: DECISION_COLORS[h.current_decision] || "#eab308",
                    backgroundColor:
                      (DECISION_COLORS[h.current_decision] || "#eab308") + "18",
                  }}
                >
                  {h.current_decision}
                </span>
              </td>
              <td className="px-5 py-3 text-sm text-[var(--muted)]">
                {formatDate(h.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
