"use client";

import { AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  conflicting?: boolean;
  conflictDetails?: string;
  analysts?: {
    fundamentals?: string;
    sentiment?: string;
    technical?: string;
    macro?: string;
  };
}

export default function ConflictDetectionBanner({ conflicting, conflictDetails, analysts }: Props) {
  if (!conflicting) return null;

  return (
    <div className="rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-[#13111c] to-amber-950/20 p-6 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
      {/* Top Banner Warning */}
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-amber-300 text-base tracking-tight">
              ⚠ SIGNAL CONFLICT DETECTED BETWEEN ANALYSTS
            </span>
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
              Risk Manager Intervened
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {conflictDetails || "Analyst agents generated opposing directional signals. The Risk Manager automatically increased risk assessment and downshifted maximum allocation limits to protect capital."}
          </p>
        </div>
      </div>

      {/* Disagreement Breakdown Grid */}
      {analysts && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-3 border-t border-amber-500/20 text-xs">
          <div className="rounded-xl bg-black/40 p-2.5 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Fundamentals</span>
            <span className="font-extrabold text-indigo-400 mt-0.5 block font-mono">{analysts.fundamentals || "HOLD"}</span>
          </div>
          <div className="rounded-xl bg-black/40 p-2.5 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Sentiment</span>
            <span className="font-extrabold text-cyan-400 mt-0.5 block font-mono">{analysts.sentiment || "NEUTRAL"}</span>
          </div>
          <div className="rounded-xl bg-black/40 p-2.5 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Technical</span>
            <span className="font-extrabold text-amber-400 mt-0.5 block font-mono">{analysts.technical || "HOLD"}</span>
          </div>
          <div className="rounded-xl bg-black/40 p-2.5 border border-white/5 text-center">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Macro</span>
            <span className="font-extrabold text-purple-400 mt-0.5 block font-mono">{analysts.macro || "HOLD"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
