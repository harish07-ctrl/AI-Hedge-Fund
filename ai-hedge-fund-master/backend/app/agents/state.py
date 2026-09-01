"""Shared state schema for the multi-agent LangGraph workflow."""

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
    """Shared state across all agents in the hedge fund workflow.

    Uses LangGraph's Annotated reducers to handle concurrent updates.
    """

    # Input
    ticker: str = ""
    analysis_id: str = ""

    # Agent reports (each agent writes its own key)
    fundamentals_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    sentiment_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    technical_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )
    risk_report: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Final output
    final_decision: Annotated[dict[str, Any], merge_dicts] = field(
        default_factory=dict
    )

    # Agent activity log for real-time streaming
    messages: Annotated[list[AgentMessage], merge_messages] = field(
        default_factory=list
    )

    # Error tracking
    errors: Annotated[list[str], operator.add] = field(default_factory=list)
