"""Portfolio Manager Agent — Makes the final buy/hold/sell decision."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm

PORTFOLIO_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are the Portfolio Manager at a top hedge fund. "
            "You make the final investment decision based on all analyst reports "
            "and the risk assessment.\n\n"
            "You MUST return a JSON object with exactly these keys:\n"
            '{{\n'
            '  "decision": "BUY" | "HOLD" | "SELL",\n'
            '  "confidence": 0.0-1.0,\n'
            '  "target_price": number or null,\n'
            '  "stop_loss": number or null,\n'
            '  "position_size_pct": 0-100 (recommended % of portfolio),\n'
            '  "time_horizon": "short" | "medium" | "long",\n'
            '  "reasoning": "2-3 sentence summary of your decision"\n'
            '}}\n\n'
            "Consider all reports carefully. When analysts disagree, weigh "
            "the risk assessment more heavily. Capital preservation is paramount.",
        ),
        (
            "human",
            "Make investment decision for {ticker}.\n\n"
            "FUNDAMENTALS REPORT:\n{fundamentals}\n\n"
            "SENTIMENT REPORT:\n{sentiment}\n\n"
            "TECHNICAL REPORT:\n{technical}\n\n"
            "RISK ASSESSMENT:\n{risk}\n\n"
            "Return your decision as JSON.",
        ),
    ]
)


async def run_portfolio_manager_agent(state: HedgeFundState) -> dict:
    """Execute the portfolio manager agent — produces the final decision."""
    ticker = state.ticker
    messages = []

    messages.append(
        AgentMessage(
            agent="portfolio_manager",
            content=f"Making final investment decision for {ticker}...",
        )
    )

    try:
        fundamentals = state.fundamentals_report.get("analysis", "No report available.")
        sentiment = state.sentiment_report.get("analysis", "No report available.")
        technical = state.technical_report.get("analysis", "No report available.")
        risk = state.risk_report.get("analysis", "No report available.")

        messages.append(
            AgentMessage(
                agent="portfolio_manager",
                content="Weighing all analyst reports and risk assessment...",
                data={"step": "deliberating"},
            )
        )

        llm = get_llm()
        chain = PORTFOLIO_PROMPT | llm | JsonOutputParser()

        decision = await chain.ainvoke(
            {
                "ticker": ticker,
                "fundamentals": fundamentals,
                "sentiment": sentiment,
                "technical": technical,
                "risk": risk,
            }
        )

        decision["ticker"] = ticker

        emoji_map = {"BUY": "BULLISH", "SELL": "BEARISH", "HOLD": "NEUTRAL"}
        signal = emoji_map.get(decision.get("decision", ""), "UNKNOWN")

        messages.append(
            AgentMessage(
                agent="portfolio_manager",
                content=(
                    f"Decision: {decision.get('decision', 'N/A')} ({signal}) | "
                    f"Confidence: {decision.get('confidence', 0):.0%} | "
                    f"Position: {decision.get('position_size_pct', 0)}%"
                ),
                data={"step": "complete", "decision": decision},
            )
        )

        return {
            "final_decision": decision,
            "messages": messages,
        }
    except Exception as e:
        messages.append(
            AgentMessage(agent="portfolio_manager", content=f"Error: {str(e)}")
        )
        return {
            "final_decision": {
                "decision": "HOLD",
                "confidence": 0.0,
                "reasoning": f"Decision failed due to error: {str(e)}",
                "ticker": ticker,
            },
            "messages": messages,
            "errors": [f"Portfolio manager error: {str(e)}"],
        }
