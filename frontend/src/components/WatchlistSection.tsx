"use client";

import { useState, useEffect } from "react";
import { WatchlistItem, getWatchlist, addWatchlist, deleteWatchlist } from "@/lib/api";
import { Bookmark, Plus, Trash2, Zap, TrendingUp, Sparkles } from "lucide-react";
import { DECISION_COLORS, formatDate } from "@/lib/utils";

interface Props {
  onSelectTicker?: (ticker: string) => void;
}

const POPULAR_SUGGESTIONS = ["NVDA", "AAPL", "TCS", "MSFT", "TSLA", "RELIANCE"];

export default function WatchlistSection({ onSelectTicker }: Props) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newTicker, setNewTicker] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const items = await getWatchlist();
      setWatchlist(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAdd = async (tickerToAdd?: string) => {
    const t = (tickerToAdd || newTicker).trim().toUpperCase();
    if (!t) return;
    try {
      await addWatchlist(t);
      if (!tickerToAdd) setNewTicker("");
      fetchWatchlist();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (ticker: string) => {
    try {
      await deleteWatchlist(ticker);
      fetchWatchlist();
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-xl">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Bookmark className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-extrabold text-white">Stock Watchlist & Signal Monitor</h2>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Monitored tickers with cached AI consensus signals and 1-click full research analysis.
          </p>
        </div>

        {/* Add Input Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add Ticker..."
            className="w-32 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-xs font-bold uppercase outline-none focus:border-amber-400"
          />
          <button
            onClick={() => handleAdd()}
            disabled={!newTicker.trim()}
            className="flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Quick Add Suggestions Chips */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--muted)]">
        <span className="text-[11px] font-bold uppercase tracking-wider">Quick Add:</span>
        {POPULAR_SUGGESTIONS.map((symbol) => (
          <button
            key={symbol}
            onClick={() => handleAdd(symbol)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-2.5 py-1 text-[11px] font-bold hover:border-amber-400 hover:text-amber-300 transition-all"
          >
            +{symbol}
          </button>
        ))}
      </div>

      {/* Watchlist Table */}
      {loading ? (
        <div className="py-6 text-center text-xs text-[var(--muted)] animate-pulse">
          Loading watchlist tickers...
        </div>
      ) : watchlist.length === 0 ? (
        <div className="py-6 text-center text-xs text-[var(--muted)]">
          No watchlist tickers added. Type a symbol above or click a quick suggestion.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--card-border)] text-[var(--muted)] uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Latest AI Signal</th>
                <th className="py-2.5 px-3">Conviction</th>
                <th className="py-2.5 px-3">Last Analyzed</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {watchlist.map((item) => (
                <tr
                  key={item.ticker}
                  className="hover:bg-[var(--background)]/50 transition-colors group"
                >
                  <td className="py-3 px-3 font-extrabold text-white text-sm">
                    <button
                      onClick={() => onSelectTicker && onSelectTicker(item.ticker)}
                      className="hover:underline hover:text-amber-400 text-left font-mono"
                    >
                      {item.ticker}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{
                        color: DECISION_COLORS[item.ai_signal || "HOLD"] || "#eab308",
                        backgroundColor: (DECISION_COLORS[item.ai_signal || "HOLD"] || "#eab308") + "18",
                      }}
                    >
                      {item.ai_signal || "HOLD"}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-zinc-300 font-mono">
                    {item.confidence ? `${item.confidence}%` : "75%"}
                  </td>
                  <td className="py-3 px-3 text-[var(--muted)] font-mono text-[11px]">
                    {formatDate(item.last_updated)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {onSelectTicker && (
                        <button
                          onClick={() => onSelectTicker(item.ticker)}
                          className="flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
                        >
                          <Zap className="h-3 w-3" />
                          <span>Analyze</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.ticker)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
