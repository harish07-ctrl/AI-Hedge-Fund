const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  fundamentals_report: Record<string, unknown>;
  sentiment_report: Record<string, unknown>;
  technical_report: Record<string, unknown>;
  risk_report: Record<string, unknown>;
  messages: AgentMessage[];
  created_at: string | null;
}

export interface AgentMessage {
  agent: string;
  content: string;
  data: Record<string, unknown>;
}

export interface PortfolioHolding {
  ticker: string;
  shares: number;
  avg_entry_price: number;
  current_decision: string;
  last_analysis_id: string;
  updated_at: string | null;
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

export async function analyzeStock(ticker: string): Promise<AnalysisResult> {
  return fetchAPI<AnalysisResult>(`/api/analyze/${ticker}`, { method: "POST" });
}

export async function getAnalyses(limit = 20): Promise<AnalysisResult[]> {
  return fetchAPI<AnalysisResult[]>(`/api/analyses?limit=${limit}`);
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  return fetchAPI<AnalysisResult>(`/api/analyses/${id}`);
}

export async function getPortfolio(): Promise<PortfolioHolding[]> {
  return fetchAPI<PortfolioHolding[]>("/api/portfolio");
}

export async function healthCheck(): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>("/api/health");
}
