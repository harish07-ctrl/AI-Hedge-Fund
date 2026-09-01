"""Technical Agent — Analyzes price action and technical indicators."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm
from app.tools.stock_data import get_stock_history, get_stock_price
from app.tools.technical_indicators import calculate_technical_indicators

TECHNICAL_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a senior technical analyst at a top hedge fund. "
            "Analyze the stock's price action and technical indicators.\n\n"
            "You must provide:\n"
            "1. Trend analysis (uptrend / downtrend / sideways)\n"
            "2. Key support and resistance levels\n"
            "3. Momentum analysis (RSI, MACD interpretation)\n"
            "4. Volume analysis\n"
            "5. A technical score from 1-10 (1 = strong sell, 10 = strong buy)\n"
            "6. Short-term outlook (1-4 weeks)\n\n"
            "Be specific. Reference the actual indicator values provided.",
        ),
        (
            "human",
            "Analyze {ticker} technical indicators.\n\n"
            "CURRENT PRICE DATA:\n{price_data}\n\n"
            "TECHNICAL INDICATORS:\n{indicators}\n\n"
            "Provide your technical analysis.",
        ),
    ]
)


async def run_technical_agent(state: HedgeFundState) -> dict:
    """Execute the technical analysis agent."""
    ticker = state.ticker
    messages = []

    messages.append(
        AgentMessage(
            agent="technical",
            content=f"Starting technical analysis for {ticker}...",
        )
    )

    try:
        price = await get_stock_price.ainvoke({"ticker": ticker})
        messages.append(
            AgentMessage(
                agent="technical",
                content=f"Current price: ${price.get('current_price', 'N/A')}",
                data={"step": "price_fetch"},
            )
        )

        history = await get_stock_history.ainvoke(
            {"ticker": ticker, "period": "3mo"}
        )
        messages.append(
            AgentMessage(
                agent="technical",
                content=f"Retrieved {len(history.get('prices', []))} days of price history",
                data={"step": "history_fetch"},
            )
        )

        indicators = {}
        price_list = history.get("prices", [])
        if price_list:
            indicators = await calculate_technical_indicators.ainvoke(
                {"price_data": price_list}
            )
            messages.append(
                AgentMessage(
                    agent="technical",
                    content="Calculated technical indicators (RSI, MACD, Bollinger Bands, etc.)",
                    data={"step": "indicators"},
                )
            )

        price_text = "\n".join(
            f"  {k}: {v}" for k, v in price.items() if k != "error"
        ) or "No price data available."

        indicator_text = "\n".join(
            f"  {k}: {v}" for k, v in indicators.items() if k != "error"
        ) or "No indicators calculated."

        llm = get_llm()
        chain = TECHNICAL_PROMPT | llm

        response = await chain.ainvoke(
            {
                "ticker": ticker,
                "price_data": price_text,
                "indicators": indicator_text,
            }
        )

        messages.append(
            AgentMessage(
                agent="technical",
                content="Technical analysis complete",
                data={"step": "complete"},
            )
        )

        return {
            "technical_report": {
                "analysis": response.content,
                "current_price": price,
                "indicators": indicators,
                "prices": price_list,
            },
            "messages": messages,
        }
    except Exception as e:
        messages.append(
            AgentMessage(agent="technical", content=f"Error: {str(e)}")
        )
        return {
            "technical_report": {"error": str(e)},
            "messages": messages,
            "errors": [f"Technical agent error: {str(e)}"],
        }
