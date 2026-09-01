"""Risk Manager Agent — Evaluates risk from all other agent reports."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm

RISK_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are the Chief Risk Officer at a top hedge fund. "
            "Your job is to evaluate the risk of a potential investment "
            "based on reports from the fundamentals, sentiment, and technical teams.\n\n"
            "You must provide:\n"
            "1. Overall risk level (low / moderate / high / very high)\n"
            "2. Key risk factors identified\n"
            "3. Risk/reward ratio assessment\n"
            "4. Position sizing recommendation (as % of portfolio)\n"
            "5. Stop-loss recommendation\n"
            "6. A risk score from 1-10 (1 = very low risk, 10 = very high risk)\n"
            "7. Any conflicting signals between the analysts\n\n"
            "Be conservative. Your job is to protect capital.",
        ),
        (
            "human",
            "Evaluate risk for {ticker}.\n\n"
            "FUNDAMENTALS REPORT:\n{fundamentals}\n\n"
            "SENTIMENT REPORT:\n{sentiment}\n\n"
            "TECHNICAL REPORT:\n{technical}\n\n"
            "Provide your risk assessment.",
        ),
    ]
)


async def run_risk_manager_agent(state: HedgeFundState) -> dict:
    """Execute the risk manager agent."""
    ticker = state.ticker
    messages = []

    messages.append(
        AgentMessage(
            agent="risk_manager",
            content=f"Starting risk evaluation for {ticker}...",
        )
    )

    try:
        fundamentals = state.fundamentals_report.get("analysis", "No report available.")
        sentiment = state.sentiment_report.get("analysis", "No report available.")
        technical = state.technical_report.get("analysis", "No report available.")

        messages.append(
            AgentMessage(
                agent="risk_manager",
                content="Reviewing all analyst reports...",
                data={"step": "reviewing"},
            )
        )

        llm = get_llm()
        chain = RISK_PROMPT | llm

        response = await chain.ainvoke(
            {
                "ticker": ticker,
                "fundamentals": fundamentals,
                "sentiment": sentiment,
                "technical": technical,
            }
        )

        messages.append(
            AgentMessage(
                agent="risk_manager",
                content="Risk evaluation complete",
                data={"step": "complete"},
            )
        )

        return {
            "risk_report": {
                "analysis": response.content,
                "inputs": {
                    "has_fundamentals": "analysis" in state.fundamentals_report,
                    "has_sentiment": "analysis" in state.sentiment_report,
                    "has_technical": "analysis" in state.technical_report,
                },
            },
            "messages": messages,
        }
    except Exception as e:
        messages.append(
            AgentMessage(agent="risk_manager", content=f"Error: {str(e)}")
        )
        return {
            "risk_report": {"error": str(e)},
            "messages": messages,
            "errors": [f"Risk manager error: {str(e)}"],
        }
