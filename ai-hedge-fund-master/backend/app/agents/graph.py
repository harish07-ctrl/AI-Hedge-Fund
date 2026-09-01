"""LangGraph workflow — orchestrates the multi-agent hedge fund analysis."""

from __future__ import annotations

import uuid
from typing import Any

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver  # langgraph-checkpoint-sqlite

from app.agents.state import HedgeFundState
from app.agents.fundamentals import run_fundamentals_agent
from app.agents.sentiment import run_sentiment_agent
from app.agents.technical import run_technical_agent
from app.agents.risk_manager import run_risk_manager_agent
from app.agents.portfolio_manager import run_portfolio_manager_agent


def build_graph() -> StateGraph:
    """Build the hedge fund analysis StateGraph.

    Workflow:
      START
        -> [fundamentals, sentiment, technical] (parallel)
        -> risk_manager (waits for all three)
        -> portfolio_manager
        -> END
    """
    graph = StateGraph(HedgeFundState)

    graph.add_node("fundamentals", run_fundamentals_agent)
    graph.add_node("sentiment", run_sentiment_agent)
    graph.add_node("technical", run_technical_agent)
    graph.add_node("risk_manager", run_risk_manager_agent)
    graph.add_node("portfolio_manager", run_portfolio_manager_agent)

    # Fan-out: run three analysts in parallel
    graph.add_edge(START, "fundamentals")
    graph.add_edge(START, "sentiment")
    graph.add_edge(START, "technical")

    # Fan-in: all three feed into risk manager
    graph.add_edge("fundamentals", "risk_manager")
    graph.add_edge("sentiment", "risk_manager")
    graph.add_edge("technical", "risk_manager")

    # Risk manager -> portfolio manager -> END
    graph.add_edge("risk_manager", "portfolio_manager")
    graph.add_edge("portfolio_manager", END)

    return graph


async def get_checkpointer():
    """Get an async SQLite checkpointer for persistent state."""
    return AsyncSqliteSaver.from_conn_string("hedge_fund_checkpoints.db")


async def run_analysis(
    ticker: str,
    on_message=None,
) -> dict[str, Any]:
    """Run the full multi-agent analysis for a ticker.

    Args:
        ticker: Stock ticker symbol (e.g. "AAPL")
        on_message: Optional async callback for real-time updates.
                    Called with (agent_name, message_content, data_dict).

    Returns:
        The final HedgeFundState as a dict.
    """
    graph = build_graph()
    analysis_id = str(uuid.uuid4())

    async with await get_checkpointer() as checkpointer:
        compiled = graph.compile(checkpointer=checkpointer)

        initial_state = HedgeFundState(ticker=ticker.upper(), analysis_id=analysis_id)

        config = {"configurable": {"thread_id": analysis_id}}

        final_state = None
        seen_messages = 0

        async for event in compiled.astream(initial_state, config=config):
            for node_name, node_output in event.items():
                if node_name == "__end__":
                    continue

                new_messages = node_output.get("messages", [])
                if on_message and new_messages:
                    for msg in new_messages[seen_messages:]:
                        await on_message(msg.agent, msg.content, msg.data)
                    seen_messages = len(new_messages)

                final_state = node_output

        snapshot = await compiled.aget_state(config)
        state_values = snapshot.values

        return {
            "analysis_id": analysis_id,
            "ticker": ticker.upper(),
            "fundamentals_report": state_values.get("fundamentals_report", {}),
            "sentiment_report": state_values.get("sentiment_report", {}),
            "technical_report": state_values.get("technical_report", {}),
            "risk_report": state_values.get("risk_report", {}),
            "final_decision": state_values.get("final_decision", {}),
            "messages": [
                {"agent": m.agent, "content": m.content, "data": m.data}
                for m in state_values.get("messages", [])
            ],
            "errors": state_values.get("errors", []),
        }
