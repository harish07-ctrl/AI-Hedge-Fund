"""Shared state schema for the multi-agent LangGraph workflow with full PS-01 metrics and traceable RAG metadata."""

from __future__ import annotations

import operator
from dataclasses import dataclass, field
from typing import Annotated, Any


@dataclass
class AgentMessage:
    """A message from one agent to the shared state."""

    agent: str
    content: str
    data: dict[str, Any] = field(default_factory=dict)


def merge_messages(
    existing: list[AgentMessage], new: list[AgentMessage]
) -> list[AgentMessage]:
    return existing + new


def merge_dicts(existing: dict, new: dict) -> dict:
    merged = {**existing}
    merged.update(new)
    return merged


@dataclass
class HedgeFundState:
    """Shared state across all 6 agents in the hedge fund workflow (4 Analysts + 2 Decision)."""

    # Input parameters
    ticker: str = ""
    analysis_id: str = ""
    user_profile: dict[str, Any] = field(default_factory=dict)
    portfolio_context: list[dict[str, Any]] = field(default_factory=list)

    # Simulation / Degraded data test flags
    simulate_api_failure: bool = False
    simulate_missing_filing: bool = False
    simulate_agent_failure: bool = False

    # 4 Analyst Reports (Parallel Layer)
    fundamentals_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    sentiment_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    technical_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    macro_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # 2 Decision Reports (Sequential Layer)
    risk_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    final_decision: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Signal Classification (4-Dimension Object)
    signal_classification: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Personalization & Decision Breakdown
    personalization_breakdown: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    why_decision: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Traceable Evidence & RAG Chunks
    traceable_evidence: Annotated[list[dict[str, Any]], operator.add] = field(
        default_factory=list
    )

    # Per-Agent & Pipeline Performance Latency Metrics (ms)
    agent_latencies: Annotated[dict[str, float], merge_dicts] = field(
        default_factory=dict
    )
    performance_metrics: dict[str, Any] = field(default_factory=dict)

    # Status tracking
    is_demo_data: bool = False
    data_freshness: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Agent activity log for real-time WebSocket streaming
    messages: Annotated[list[AgentMessage], merge_messages] = field(
        default_factory=list
    )

    # Error tracking
    errors: Annotated[list[str], operator.add] = field(default_factory=list)
