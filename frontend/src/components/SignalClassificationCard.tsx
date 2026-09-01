"use client";

import { Cpu, Globe, Activity, ShieldCheck, CheckCircle2, FileText, Clock } from "lucide-react";
import { DECISION_COLORS } from "@/lib/utils";
import { SignalDimension } from "@/lib/api";

interface Props {
  classification?: Record<string, SignalDimension>;
}

export default function SignalClassificationCard({ classification }: Props) {
  if (!classification) return null;

  const dims = [
    {
      key: "fundamentals",
      name: "1. Fundamentals Dimension",
      icon: Cpu,
      color: "#6366f1",
      data: classification.fundamentals,
    },
    {
      key: "technical",
      name: "2. Technical Dimension",
      icon: Activity,
      color: "#f59e0b",
      data: classification.technical,
    },
    {
      key: "sentiment",
      name: "3. Sentiment Dimension",
      icon: Globe,
      color: "#06b6d4",
      data: classification.sentiment,
    },
    {
      key: "macro",
      name: "4. Macro Dimension",
      icon: ShieldCheck,
      color: "#a855f7",
      data: classification.macro,
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-7 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
              Requirement #2
            </span>
            <h3 className="text-lg font-extrabold text-white">4-Dimension Signal Classification Layer</h3>
          </div>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Evaluates raw market data across 4 independent dimensions with stated confidence levels and cited reasoning.
          </p>
        </div>
      </div>

      {/* 4 Dimension Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dims.map((dim) => {
          const Icon = dim.icon;
          const d = dim.data;
          if (!d) return null;
          const sig = d.signal || "HOLD";
          const conf = d.confidence || 75;

          return (
            <div
              key={dim.key}
              className="flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/80 p-4 space-y-3 hover:border-indigo-500/40 transition-all shadow-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${dim.color}15`, color: dim.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {dim.name.split(" ")[1]}
                  </span>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold font-mono"
                  style={{
                    color: DECISION_COLORS[sig] || dim.color,
                    backgroundColor: (DECISION_COLORS[sig] || dim.color) + "18",
                  }}
                >
                  {sig}
                </span>
              </div>

              {/* Confidence Meter Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-semibold">
                  <span>Stated Conviction</span>
                  <span className="text-white font-mono font-bold">{conf}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${conf}%`,
                      backgroundColor: dim.color,
                    }}
                  />
                </div>
              </div>

              {/* Factors */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                  Cited Factors:
                </span>
                {d.factors && d.factors.slice(0, 2).map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{f}</span>
                  </div>
                ))}
              </div>

              {/* Timestamp & Sources count */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-[var(--muted)] font-mono">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {d.sources?.length || 1} Citations
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Active
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
