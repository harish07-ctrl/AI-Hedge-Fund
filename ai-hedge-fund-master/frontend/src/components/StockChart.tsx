"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PricePoint {
  date: string;
  close: number;
}

interface Props {
  data: PricePoint[];
  ticker: string;
}

export default function StockChart({ data, ticker }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
        <p className="text-sm text-[var(--muted)]">No price data available</p>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const first = sorted[0].close;
  const last = sorted[sorted.length - 1].close;
  const isPositive = last >= first;
  const strokeColor = isPositive ? "var(--green)" : "var(--red)";
  const fillColor = isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)";

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          {ticker} Price Chart
        </h2>
        <span
          className="text-sm font-semibold"
          style={{ color: isPositive ? "var(--green)" : "var(--red)" }}
        >
          {isPositive ? "+" : ""}
          {(((last - first) / first) * 100).toFixed(2)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={sorted}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            axisLine={{ stroke: "#1e1e2e" }}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            domain={["auto", "auto"]}
            axisLine={{ stroke: "#1e1e2e" }}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0f",
              border: "1px solid #1e1e2e",
              borderRadius: "8px",
              color: "#fafafa",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
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
            strokeWidth={2}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
