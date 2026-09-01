"use client";

import { useState, useEffect } from "react";
import { DECISION_COLORS, formatCurrency, formatDate } from "@/lib/utils";
import { PortfolioHolding, getPortfolio, addPortfolioHolding, deletePortfolioHolding } from "@/lib/api";
import {
  Briefcase,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Zap,
  PieChart,
  DollarSign,
  Layers,
} from "lucide-react";

interface Props {
  holdings?: PortfolioHolding[];
  onSelectTicker?: (ticker: string) => void;
}

export default function PortfolioTable({ holdings: initialHoldings, onSelectTicker }: Props) {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(initialHoldings || []);
  const [loading, setLoading] = useState(!initialHoldings);
  const [searchQuery, setSearchQuery] = useState("");
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  const fetchHoldings = async () => {
    try {
      const data = await getPortfolio();
      setHoldings(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialHoldings) {
      fetchHoldings();
    }
  }, [initialHoldings]);

  const handleAdd = async () => {
    if (!ticker.trim() || !shares || !price) return;
    try {
      await addPortfolioHolding({
        ticker: ticker.trim().toUpperCase(),
        shares: Number(shares),
        avg_entry_price: Number(price),
      });
      setTicker("");
      setShares("");
      setPrice("");
      fetchHoldings();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (t: string) => {
    try {
      await deletePortfolioHolding(t);
      fetchHoldings();
    } catch {
      // ignore
    }
  };

  const filtered = holdings.filter(
    (h) =>
      h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.sector && h.sector.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalValue = holdings.reduce(
    (acc, h) => acc + (h.current_value || h.shares * h.avg_entry_price),
    0
  );
  const totalPnL = holdings.reduce((acc, h) => acc + (h.profit_loss || 0), 0);
  const winCount = holdings.filter((h) => (h.profit_loss || 0) >= 0).length;

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-6 shadow-2xl">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Portfolio Holdings & Valuation</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Live portfolio valuation, risk weighting, and 1-click multi-agent analysis for every holding.
          </p>
        </div>

        {/* Metrics Overview Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Total Portfolio Value</span>
            <strong className="text-base font-black text-white font-mono">{formatCurrency(totalValue)}</strong>
          </div>

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Total Unrealized P&L</span>
            <strong className={`text-base font-black font-mono ${totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
            </strong>
          </div>

          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-2.5 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Holdings Status</span>
            <strong className="text-base font-black text-indigo-300 font-mono">
              {winCount}/{holdings.length} In Profit
            </strong>
          </div>
        </div>
      </div>

      {/* Controls Bar (Add Holding + Search Filter) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[var(--background)] p-3.5 rounded-2xl border border-[var(--card-border)]">
        {/* Add Holding inputs */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (AAPL)"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs font-bold uppercase outline-none focus:border-indigo-500 w-28"
          />
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Shares"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 w-24"
          />
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Buy Price ($)"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 w-28"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="relative w-full md:w-48">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter holdings..."
            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] pl-8 pr-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Holdings Table */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[var(--muted)] animate-pulse">
          Loading user portfolio data...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--muted)]">
          No matching holdings found. Add a stock ticker above to start tracking.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)] uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Ticker</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Avg Buy Price</th>
                <th className="py-3 px-3">Current Price</th>
                <th className="py-3 px-3">Current Value</th>
                <th className="py-3 px-3">Profit / Loss</th>
                <th className="py-3 px-3">AI Signal</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {filtered.map((h) => {
                const val = h.current_value || h.shares * h.avg_entry_price;
                const pnl = h.profit_loss || (h.current_price - h.avg_entry_price) * h.shares;

                return (
                  <tr
                    key={h.ticker}
                    className="hover:bg-[var(--background)]/60 transition-colors group"
                  >
                    <td className="py-3 px-3 font-extrabold text-white text-sm">
                      <div className="flex items-center gap-2">
                        <span>{h.ticker}</span>
                        {h.sector && (
                          <span className="text-[10px] font-normal text-[var(--muted)] bg-white/5 px-2 py-0.5 rounded-md">
                            {h.sector}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold font-mono text-zinc-300">
                      {h.shares}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-300">
                      {formatCurrency(h.avg_entry_price)}
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-300">
                      {formatCurrency(h.current_price || h.avg_entry_price)}
                    </td>
                    <td className="py-3 px-3 font-bold text-white font-mono">
                      {formatCurrency(val)}
                    </td>
                    <td
                      className={`py-3 px-3 font-bold font-mono ${
                        pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {formatCurrency(pnl)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        style={{
                          color: DECISION_COLORS[h.current_decision] || "#eab308",
                          backgroundColor:
                            (DECISION_COLORS[h.current_decision] || "#eab308") + "18",
                        }}
                      >
                        {h.current_decision || "HOLD"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectTicker && (
                          <button
                            onClick={() => onSelectTicker(h.ticker)}
                            className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                            title="Run instant multi-agent analysis"
                          >
                            <Zap className="h-3 w-3" />
                            <span>Analyze</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(h.ticker)}
                          className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                          title="Remove holding"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
