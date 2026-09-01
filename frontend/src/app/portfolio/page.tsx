"use client";

import { useEffect, useState } from "react";
import { getPortfolio, type PortfolioHolding } from "@/lib/api";
import PortfolioTable from "@/components/PortfolioTable";
import { Briefcase } from "lucide-react";

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfolio()
      .then(setHoldings)
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
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Track your holdings and AI recommendations
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Holdings"
          value={holdings.length.toString()}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <SummaryCard
          label="Buy Signals"
          value={holdings.filter((h) => h.current_decision === "BUY").length.toString()}
          color="var(--green)"
        />
        <SummaryCard
          label="Sell Signals"
          value={holdings.filter((h) => h.current_decision === "SELL").length.toString()}
          color="var(--red)"
        />
      </div>

      <PortfolioTable holdings={holdings} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[var(--muted)]">{icon}</span>}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </p>
      </div>
      <p
        className="mt-2 text-3xl font-bold"
        style={{ color: color || "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}
