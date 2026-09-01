"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { AGENT_COLORS, AGENT_LABELS, DECISION_COLORS } from "@/lib/utils";
import { ExternalLink, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Globe, Activity, FileText } from "lucide-react";

const TABS = ["fundamentals", "sentiment", "technical", "macro", "risk_manager"] as const;

const TAB_ICONS: Record<string, any> = {
  fundamentals: Cpu,
  sentiment: Globe,
  technical: Activity,
  macro: Globe,
  risk_manager: ShieldAlert,
};

interface Props {
  reports: Record<string, Record<string, unknown>>;
}

export default function ReportTabs({ reports }: Props) {
  const [active, setActive] = useState<string>(TABS[0]);

  const report = reports[active] || {};
  const analysis = (report.analysis as string) || "";
  const summary = (report.summary as string) || "";
  const signal = (report.signal as string) || (report.risk_level as string) || "";
  const confidence = report.confidence as number | undefined;
  const factors = (report.factors as string[]) || [];
  const sources = (report.sources as { title: string; url: string }[]) || [];
  const warnings = (report.warnings as string[]) || [];

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl overflow-hidden flex flex-col justify-between">
      {/* Top Interactive Tabs Header */}
      <div className="grid grid-cols-5 border-b border-[var(--card-border)] bg-[var(--background)]/80 text-center text-xs">
        {TABS.map((tab) => {
          const r = reports[tab] || {};
          const sig = (r.signal as string) || (r.risk_level as string) || "N/A";
          const conf = r.confidence as number | undefined;
          const isActive = active === tab;
          const color = AGENT_COLORS[tab] || "#71717a";
          const Icon = TAB_ICONS[tab] || Activity;

          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`p-3 border-r border-[var(--card-border)] last:border-r-0 transition-all flex flex-col items-center justify-center gap-1 relative ${
                isActive
                  ? "bg-[var(--card)] font-bold text-white shadow-inner"
                  : "hover:bg-[var(--card)]/40 text-[var(--muted)]"
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: color }}
                />
              )}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate hidden sm:inline">{AGENT_LABELS[tab].replace(" Agent", "")}</span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold block"
                style={{
                  color: DECISION_COLORS[sig] || color,
                  backgroundColor: (DECISION_COLORS[sig] || color) + "18",
                }}
              >
                {sig} {conf ? `(${conf}%)` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Report Details */}
      <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto">
        {/* Executive Summary */}
        {summary && (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/80 p-4 text-xs sm:text-sm text-zinc-200 leading-relaxed">
            <strong className="text-white block mb-1 font-bold text-xs uppercase tracking-wider">
              {AGENT_LABELS[active]} Summary:
            </strong>
            {summary}
          </div>
        )}

        {/* Factors Breakdown */}
        {factors.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Underlying Analytical Factors
            </span>
            <div className="grid gap-2">
              {factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-[var(--card-border)] bg-white/[0.02] p-3 text-xs text-zinc-200"
                >
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Attribution & Citations */}
        {sources.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              Verified Citations & Regulatory Grounding
            </span>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url.startsWith("http") ? s.url : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition-all shadow-sm"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[280px]">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Warnings & Headwinds */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Full Markdown Text */}
        {analysis && (
          <div className="prose prose-invert prose-xs max-w-none text-zinc-300 pt-2 border-t border-[var(--card-border)]">
            <Markdown>{analysis}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
