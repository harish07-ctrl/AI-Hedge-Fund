"use client";

import { useState, useEffect } from "react";
import { UserProfile, getUserProfile, updateUserProfile } from "@/lib/api";
import {
  User,
  Shield,
  DollarSign,
  Target,
  Save,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Tag,
  Sliders,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  onProfileUpdated?: (profile: UserProfile) => void;
}

const AVAILABLE_SECTORS = [
  "Technology",
  "Healthcare",
  "Financials",
  "Consumer Discretionary",
  "Energy",
  "Industrials",
  "Utilities",
  "Real Estate",
  "Materials",
  "Telecommunications",
];

export default function UserProfileModal({ onProfileUpdated }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((p) => {
        setProfile(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      const updated = await updateUserProfile(profile);
      setProfile(updated);
      setSavedSuccess(true);
      if (onProfileUpdated) onProfileUpdated(updated);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  const toggleSector = (sector: string, type: "preferred" | "avoided") => {
    if (!profile) return;
    const pref = [...(profile.preferred_sectors || [])];
    const avoid = [...(profile.avoided_sectors || [])];

    if (type === "preferred") {
      const idx = pref.indexOf(sector);
      if (idx >= 0) pref.splice(idx, 1);
      else {
        pref.push(sector);
        const aIdx = avoid.indexOf(sector);
        if (aIdx >= 0) avoid.splice(aIdx, 1);
      }
    } else {
      const idx = avoid.indexOf(sector);
      if (idx >= 0) avoid.splice(idx, 1);
      else {
        avoid.push(sector);
        const pIdx = pref.indexOf(sector);
        if (pIdx >= 0) pref.splice(pIdx, 1);
      }
    }

    setProfile({
      ...profile,
      preferred_sectors: pref,
      avoided_sectors: avoid,
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center text-sm text-[var(--muted)] animate-pulse">
        Loading user personalization profile...
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-6 sm:p-8 space-y-7 shadow-2xl">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Investor Profile & Personalization Settings
              </h2>
              <span className="text-xs text-[var(--muted)]">
                The multi-agent system uses these constraints to tailor recommendations specifically for your portfolio.
              </span>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/30 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4" />
            Preferences Saved!
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Tolerance */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-amber-400" />
            1. Risk Tolerance Profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["Conservative", "Moderate", "Aggressive"] as const).map((level) => {
              const active = profile.risk_tolerance === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setProfile({ ...profile, risk_tolerance: level })}
                  className={`rounded-2xl border py-3 text-xs font-bold transition-all ${
                    active
                      ? "border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                      : "border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {profile.risk_tolerance === "Conservative" && "Limits high-beta exposure, sets strict stop-loss rules, and mandates high conviction."}
            {profile.risk_tolerance === "Moderate" && "Balances capital growth with calculated risk exposure across diversified sectors."}
            {profile.risk_tolerance === "Aggressive" && "Authorizes higher position sizes to maximize upside on high-conviction growth catalysts."}
          </p>
        </div>

        {/* Investment Horizon */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Target className="h-4 w-4 text-blue-400" />
            2. Target Investment Horizon
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["Short term", "Medium term", "Long term"] as const).map((horizon) => {
              const active = profile.investment_horizon === horizon;
              return (
                <button
                  key={horizon}
                  type="button"
                  onClick={() => setProfile({ ...profile, investment_horizon: horizon })}
                  className={`rounded-2xl border py-3 text-xs font-bold transition-all ${
                    active
                      ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]"
                      : "border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] hover:text-white"
                  }`}
                >
                  {horizon}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            Short (1–30d momentum), Medium (1–6mo cyclical trends), Long (1+ year fundamentals).
          </p>
        </div>

        {/* Available Capital */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              3. Available Investment Capital ($)
            </span>
            <span className="text-emerald-400 font-mono font-bold text-sm">
              {formatCurrency(profile.available_capital)}
            </span>
          </label>
          <input
            type="range"
            min="5000"
            max="1000000"
            step="5000"
            value={profile.available_capital}
            onChange={(e) =>
              setProfile({ ...profile, available_capital: Number(e.target.value) })
            }
            className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-[var(--card-border)]"
          />
        </div>

        {/* Max Concentration Limit */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-400" />
              4. Max Concentration per Stock (%)
            </span>
            <span className="text-rose-400 font-mono font-bold text-sm">
              {profile.max_portfolio_concentration}% Max Cap
            </span>
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={profile.max_portfolio_concentration}
            onChange={(e) =>
              setProfile({
                ...profile,
                max_portfolio_concentration: Number(e.target.value),
              })
            }
            className="w-full h-2 bg-[var(--background)] rounded-lg appearance-none cursor-pointer accent-rose-500 border border-[var(--card-border)]"
          />
        </div>
      </div>

      {/* Sector Preferences Selector */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-indigo-400" />
          5. Sector Preferences & Exclusions (Click to Toggle)
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SECTORS.map((sec) => {
            const isPreferred = (profile.preferred_sectors || []).includes(sec);
            const isAvoided = (profile.avoided_sectors || []).includes(sec);

            return (
              <div key={sec} className="flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--background)] overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => toggleSector(sec, "preferred")}
                  className={`px-3 py-1.5 font-bold transition-all ${
                    isPreferred
                      ? "bg-emerald-500 text-black"
                      : "text-zinc-300 hover:text-white"
                  }`}
                  title="Prefer sector"
                >
                  {isPreferred ? "★ " : ""}{sec}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSector(sec, "avoided")}
                  className={`px-2 py-1.5 font-bold border-l border-[var(--card-border)] transition-all ${
                    isAvoided
                      ? "bg-rose-500 text-white"
                      : "text-zinc-500 hover:text-rose-400"
                  }`}
                  title="Avoid/Exclude sector"
                >
                  {isAvoided ? "Excluded" : "✕"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-3 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 hover:brightness-110 transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving Changes..." : "Save Investor Profile"}</span>
        </button>
      </div>
    </div>
  );
}
