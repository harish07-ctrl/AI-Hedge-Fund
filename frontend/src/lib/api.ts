const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserProfile {
  user_id: string;
  risk_tolerance: "Conservative" | "Moderate" | "Aggressive";
  investment_horizon: "Short term" | "Medium term" | "Long term";
  investment_goal: string;
  available_capital: number;
  max_portfolio_concentration: number;
  preferred_sectors: string[];
  avoided_sectors: string[];
  updated_at?: string | null;
}

export interface PortfolioHolding {
  id?: number;
  ticker: string;
  shares: number;
  quantity?: number;
  avg_entry_price: number;
  avg_buy_price?: number;
  current_price: number;
  current_value: number;
  profit_loss: number;
  portfolio_weight: number;
  sector: string;
  current_decision: string;
  ai_signal?: string;
  updated_at?: string | null;
}

export interface WatchlistItem {
  id?: number;
  ticker: string;
  notes: string;
  added_at?: string | null;
  ai_signal?: string;
  confidence?: number;
  last_updated?: string | null;
}

export interface BehavioralEvent {
  id: number;
  event_type: string;
  ticker?: string | null;
  details: Record<string, unknown>;
  created_at?: string | null;
}

export interface PerformanceMetrics {
  total_analyses_tracked: number;
  avg_latency_ms: number;
  avg_agreement_score: number;
  agreement_percentage?: number;
  portfolio_risk_concentration_score_pct?: number;
  top_sector?: string;
  signal_accuracy: string;
  api_failures_total?: number;
  cache_hit_rate_pct?: number;
  agent_latency_averages?: {
    fundamentals_ms: number;
    sentiment_ms: number;
    technical_ms: number;
    macro_ms: number;
    risk_manager_ms: number;
    portfolio_manager_ms: number;
    total_pipeline_ms: number;
  };
  recent_metrics?: Record<string, unknown>[];
}

export interface SignalDimension {
  dimension: string;
  signal: string;
  confidence: number;
  factors: string[];
  sources: { title: string; url: string; doc_type?: string; data_source?: string }[];
  timestamp: string;
}

export interface TraceableEvidenceItem {
  agent: string;
  document_id: string;
  document_name: string;
  chunk_id: string;
  source_url: string;
  retrieval_timestamp: string;
  relevance_score: number;
  excerpt: string;
}

export interface AnalysisResult {
  analysis_id: string;
  ticker: string;
  decision: string;
  confidence: number;
  target_price: number | null;
  stop_loss: number | null;
  position_size_pct: number;
  time_horizon: string;
  reasoning: string;
  decision_factors?: string[];
  user_profile_effect?: string;
  final_decision?: Record<string, unknown>;
  signal_classification?: Record<string, SignalDimension>;
  fundamentals_report: Record<string, unknown>;
  sentiment_report: Record<string, unknown>;
  technical_report: Record<string, unknown>;
  macro_report?: Record<string, unknown>;
  risk_report: Record<string, unknown>;
  why_decision?: {
    final_decision: string;
    confidence_pct: number;
    positive_factors: string[];
    risk_factors: string[];
    user_profile_effect: string;
    conflicting_signals?: boolean;
    conflict_details?: string;
  };
  personalization_breakdown?: {
    base_signal: string;
    base_confidence_pct: number;
    adjustments: { factor: string; delta_pct: number; description: string }[];
    final_decision: string;
    final_confidence_pct: number;
    risk_tolerance: string;
    max_concentration_limit_pct: number;
  };
  traceable_evidence?: TraceableEvidenceItem[];
  performance_metrics?: Record<string, unknown>;
  agent_latencies?: Record<string, number>;
  user_profile?: UserProfile;
  is_demo_data?: boolean;
  messages: AgentMessage[];
  created_at: string | null;
}

export interface AgentMessage {
  agent: string;
  content: string;
  data: Record<string, unknown>;
}

export interface WhatIfComparison {
  ticker: string;
  conservative_result: {
    profile: UserProfile;
    decision: Record<string, unknown>;
    risk_report: Record<string, unknown>;
    personalization_breakdown?: Record<string, unknown>;
  };
  aggressive_result: {
    profile: UserProfile;
    decision: Record<string, unknown>;
    risk_report: Record<string, unknown>;
    personalization_breakdown?: Record<string, unknown>;
  };
  shared_analyst_signals: {
    fundamentals: Record<string, unknown>;
    sentiment: Record<string, unknown>;
    technical: Record<string, unknown>;
    macro?: Record<string, unknown>;
  };
  why_different?: string;
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API request failed");
  }

  return res.json();
}

export async function analyzeStock(
  ticker: string,
  profileOverride?: UserProfile,
  options?: { simulateApiFailure?: boolean; simulateMissingFiling?: boolean; simulateAgentFailure?: boolean }
): Promise<AnalysisResult> {
  const params = new URLSearchParams();
  if (options?.simulateApiFailure) params.append("simulate_api_failure", "true");
  if (options?.simulateMissingFiling) params.append("simulate_missing_filing", "true");
  if (options?.simulateAgentFailure) params.append("simulate_agent_failure", "true");

  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchAPI<AnalysisResult>(`/api/analyze/${ticker}${q}`, {
    method: "POST",
    body: JSON.stringify(profileOverride || {}),
  });
}

export async function logUserDecision(
  action: "accept" | "reject" | "add_portfolio" | "add_watchlist" | "change_profile",
  ticker?: string,
  details: Record<string, unknown> = {}
): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>("/api/user/decision", {
    method: "POST",
    body: JSON.stringify({ action, ticker, ...details }),
  });
}

export async function getAnalyses(limit = 20): Promise<AnalysisResult[]> {
  return fetchAPI<AnalysisResult[]>(`/api/analyses?limit=${limit}`);
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  return fetchAPI<AnalysisResult>(`/api/analyses/${id}`);
}

export async function getUserProfile(): Promise<UserProfile> {
  return fetchAPI<UserProfile>("/api/user/profile");
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  return fetchAPI<UserProfile>("/api/user/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function getPortfolio(): Promise<PortfolioHolding[]> {
  return fetchAPI<PortfolioHolding[]>("/api/portfolio");
}

export async function addPortfolioHolding(holding: Partial<PortfolioHolding>): Promise<PortfolioHolding> {
  return fetchAPI<PortfolioHolding>("/api/portfolio", {
    method: "POST",
    body: JSON.stringify(holding),
  });
}

export async function deletePortfolioHolding(ticker: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/api/portfolio/${ticker}`, { method: "DELETE" });
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return fetchAPI<WatchlistItem[]>("/api/watchlist");
}

export async function addWatchlist(ticker: string, notes = ""): Promise<WatchlistItem> {
  return fetchAPI<WatchlistItem>("/api/watchlist", {
    method: "POST",
    body: JSON.stringify({ ticker, notes }),
  });
}

export async function deleteWatchlist(ticker: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/api/watchlist/${ticker}`, { method: "DELETE" });
}

export async function getUserHistory(limit = 50): Promise<BehavioralEvent[]> {
  return fetchAPI<BehavioralEvent[]>(`/api/user/history?limit=${limit}`);
}

export async function getWhatIfComparison(ticker: string): Promise<WhatIfComparison> {
  return fetchAPI<WhatIfComparison>(`/api/what-if?ticker=${encodeURIComponent(ticker)}`, {
    method: "POST",
  });
}

export async function getPerformanceMetrics(): Promise<PerformanceMetrics> {
  return fetchAPI<PerformanceMetrics>("/api/performance");
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>("/api/health");
}
