"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Briefcase,
  User,
  Sparkles,
  History,
  HelpCircle,
  ShieldCheck,
  Zap,
  Gauge,
  Award,
  Play,
} from "lucide-react";
import ArchitectureGuideModal from "./ArchitectureGuideModal";
import JudgeDemoModal from "./JudgeDemoModal";

interface NavbarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onRunDemoAnalysis?: (ticker: string) => void;
}

export default function Navbar({ activeTab = "dashboard", setActiveTab, onRunDemoAnalysis }: NavbarProps) {
  const pathname = usePathname();
  const [guideOpen, setGuideOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const handleNav = (tabKey: string) => {
    if (setActiveTab) {
      setActiveTab(tabKey);
    }
  };

  const handleRunAnalysisFromDemo = (ticker: string) => {
    if (onRunDemoAnalysis) {
      onRunDemoAnalysis(ticker);
    }
  };

  return (
    <>
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]/90 backdrop-blur-xl sticky top-0 z-40 shadow-lg">
        <div className="flex h-16 items-center justify-between px-6 lg:px-10 max-w-7xl mx-auto">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNav("dashboard")}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BarChart3 className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    AI Hedge Fund
                  </span>
                  <span className="hidden sm:inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                    6 Agents (4+2)
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)] hidden sm:block">
                  Autonomous Multi-Agent Financial Intelligence
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[var(--background)]/80 p-1 rounded-2xl border border-[var(--card-border)] overflow-x-auto max-w-xl">
            <button
              onClick={() => handleNav("dashboard")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleNav("what-if")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "what-if"
                  ? "bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md shadow-amber-500/20"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>What-If Studio</span>
            </button>

            <button
              onClick={() => handleNav("portfolio")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "portfolio"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Portfolio</span>
            </button>

            <button
              onClick={() => handleNav("performance")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "performance"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Gauge className="h-3.5 w-3.5" />
              <span>Performance</span>
            </button>

            <button
              onClick={() => handleNav("compliance")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "compliance"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>PS-01 Checklist</span>
            </button>

            <button
              onClick={() => handleNav("profile")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "profile"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <User className="h-3.5 w-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => handleNav("history")}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap",
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
              )}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
          </div>

          {/* Action buttons (Judge Demo & Architecture Guide) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDemoOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:brightness-110 transition-all shadow-md shadow-amber-500/20"
              title="Start guided hackathon judge demo tour"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span className="hidden sm:inline">🎬 Judge Demo</span>
            </button>

            <button
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-sm"
              title="View system architecture and PS-01 checklist"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Architecture</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Interactive Guide & Judge Demo Modals */}
      <ArchitectureGuideModal isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <JudgeDemoModal
        isOpen={demoOpen}
        onClose={() => setDemoOpen(false)}
        onRunAnalysis={handleRunAnalysisFromDemo}
      />
    </>
  );
}
