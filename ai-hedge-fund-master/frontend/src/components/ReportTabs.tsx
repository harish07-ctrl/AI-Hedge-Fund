"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { AGENT_COLORS, AGENT_LABELS } from "@/lib/utils";

const TABS = ["fundamentals", "sentiment", "technical", "risk_manager"] as const;

interface Props {
  reports: Record<string, Record<string, unknown>>;
}

export default function ReportTabs({ reports }: Props) {
  const [active, setActive] = useState<string>(TABS[0]);

  const report = reports[active] || {};
  const analysis = (report.analysis as string) || "";
  const error = report.error as string | undefined;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--card-border)]">
        {TABS.map((tab) => {
          const isActive = tab === active;
          const color = AGENT_COLORS[tab] || "#71717a";
          return (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`relative flex-1 px-3 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                isActive
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]/70"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {AGENT_LABELS[tab] || tab}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 h-0.5 w-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Report content */}
      <div className="max-h-[300px] overflow-y-auto p-5">
        {error ? (
          <p className="text-sm text-[var(--red)]">Error: {error}</p>
        ) : analysis ? (
          <div className="prose prose-invert prose-sm max-w-none text-[var(--foreground)]/75 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-[var(--foreground)] [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-[var(--foreground)] [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[var(--foreground)] [&_strong]:text-[var(--foreground)] [&_li]:text-sm [&_li]:leading-relaxed [&_p]:text-sm [&_p]:leading-relaxed">
            <Markdown>{analysis}</Markdown>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">No report available</p>
        )}

        {report.grounding != null && typeof report.grounding === "object" && (
          <div className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2">
            <span className="text-xs text-[var(--muted)]">
              Grounding confidence:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {(
                  ((report.grounding as Record<string, number>).confidence ??
                    0) * 100
                ).toFixed(0)}
                %
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
