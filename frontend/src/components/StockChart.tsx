"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Layers, BarChart2 } from "lucide-react";

interface PricePoint {
  date: string;
  close: number;
}

interface Props {
  data: PricePoint[];
  ticker: string;
}

export default function StockChart({ data, ticker }: Props) {
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "ALL">("3M");
  const [showSMA, setShowSMA] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 text-center">
        <BarChart2 className="h-10 w-10 text-[var(--muted)] mb-2 opacity-50" />
        <p className="text-sm font-semibold text-white">No Price Chart Data</p>
        <p className="text-xs text-[var(--muted)] mt-1">
          Historical candles will appear once a stock is analyzed.
        </p>
      </div>
    );
  }

  // Sort chronologically
  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Compute Simple Moving Average (SMA-10) for overlay
  const pricesWithSMA = sorted.map((pt, idx, arr) => {
    let sma = null;
    if (idx >= 9) {
      const slice = arr.slice(idx - 9, idx + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      sma = Number((sum / 10).toFixed(2));
    }
    return {
      ...pt,
      sma,
    };
  });

  // Filter based on time range
  let filtered = pricesWithSMA;
  if (timeRange === "1W") {
    filtered = pricesWithSMA.slice(-5);
  } else if (timeRange === "1M") {
    filtered = pricesWithSMA.slice(-22);
  } else if (timeRange === "3M") {
    filtered = pricesWithSMA.slice(-66);
  }

  if (filtered.length === 0) filtered = pricesWithSMA;

  const first = filtered[0]?.close || 1;
  const last = filtered[filtered.length - 1]?.close || 1;
  const highest = Math.max(...filtered.map((d) => d.close));
  const lowest = Math.min(...filtered.map((d) => d.close));
  const isPositive = last >= first;
  const pctChange = (((last - first) / first) * 100).toFixed(2);

  const strokeColor = isPositive ? "var(--green)" : "var(--red)";
  const gradientId = `chartGrad_${ticker}`;

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 space-y-4 shadow-xl flex flex-col justify-between">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--card-border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-white">{ticker}</span>
            <span className="text-xs text-[var(--muted)]">Price Action & Momentum</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {formatCurrency(last)}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isPositive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{pctChange}%
            </span>
          </div>
        </div>

        {/* Interactive Filters & Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SMA Toggle */}
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border transition-all ${
              showSMA
                ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                : "border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] hover:text-white"
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>SMA-10</span>
          </button>

          {/* Time Range Pills */}
          <div className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-0.5">
            {(["1W", "1M", "3M", "ALL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  timeRange === r
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-2">
          <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Period High</span>
          <p className="font-mono font-bold text-white mt-0.5">{formatCurrency(highest)}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-2">
          <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Period Low</span>
          <p className="font-mono font-bold text-white mt-0.5">{formatCurrency(lowest)}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)]/60 p-2">
          <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">Data Points</span>
          <p className="font-mono font-bold text-indigo-300 mt-0.5">{filtered.length} Candles</p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#171926" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 10 }}
              tickFormatter={(d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
              axisLine={{ stroke: "#1f2438" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 10 }}
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d0f1a",
                borderColor: "#252a42",
                borderRadius: "16px",
                color: "#f8fafc",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
              }}
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name === "sma" ? "10-day SMA" : "Close Price",
              ]}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              }
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
            />
            {showSMA && (
              <Line
                type="monotone"
                dataKey="sma"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
