"use client";

import { AGENT_COLORS, AGENT_LABELS } from "@/lib/utils";

interface Props {
  agent: string;
  report: Record<string, unknown>;
}

export default function AnalysisCard({ agent, report }: Props) {
  const color = AGENT_COLORS[agent] || "#71717a";
  const label = AGENT_LABELS[agent] || agent;
  const analysis = (report.analysis as string) || "";
  const error = report.error as string | undefined;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label} Report
        </h3>
      </div>

      {error ? (
        <p className="text-sm text-[var(--red)]">Error: {error}</p>
      ) : analysis ? (
        <div className="prose prose-invert prose-sm max-w-none">
          {analysis.split("\n").map((line, i) => (
            <p
              key={i}
              className="text-sm leading-relaxed text-[var(--foreground)]/75"
            >
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">No report available</p>
      )}

      {report.grounding != null && typeof report.grounding === "object" && (
        <div className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2">
          <span className="text-xs text-[var(--muted)]">
            Grounding confidence:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {(((report.grounding as Record<string, number>).confidence ?? 0) * 100).toFixed(0)}%
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
