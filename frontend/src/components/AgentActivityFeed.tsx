"use client";

import { AGENT_COLORS, AGENT_LABELS } from "@/lib/utils";
import type { WSMessage } from "@/lib/websocket";

interface Props {
  messages: WSMessage[];
  isRunning: boolean;
}

export default function AgentActivityFeed({ messages, isRunning }: Props) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Agent Activity
        </h2>
        {isRunning && (
          <span className="flex items-center gap-2 text-xs text-[var(--accent-light)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse-dot" />
            Agents working...
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Enter a ticker above to start analysis
          </p>
        )}

        {messages.map((msg, i) => {
          const agent = msg.agent || "system";
          const color = AGENT_COLORS[agent] || "#71717a";
          const label = AGENT_LABELS[agent] || agent;
          const content = msg.content || msg.message || "";

          return (
            <div
              key={i}
              className="animate-slide-in flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02]"
            >
              <div
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0">
                <span
                  className="text-xs font-semibold"
                  style={{ color }}
                >
                  {label}
                </span>
                <p className="text-sm text-[var(--foreground)]/80">
                  {content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
