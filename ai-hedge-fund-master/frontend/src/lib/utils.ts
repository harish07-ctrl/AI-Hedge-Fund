import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AGENT_COLORS: Record<string, string> = {
  fundamentals: "#6366f1",
  sentiment: "#22c55e",
  technical: "#3b82f6",
  risk_manager: "#eab308",
  portfolio_manager: "#ec4899",
};

export const AGENT_LABELS: Record<string, string> = {
  fundamentals: "Fundamentals",
  sentiment: "Sentiment",
  technical: "Technical",
  risk_manager: "Risk Manager",
  portfolio_manager: "Portfolio Manager",
};

export const DECISION_COLORS: Record<string, string> = {
  BUY: "#22c55e",
  SELL: "#ef4444",
  HOLD: "#eab308",
};
