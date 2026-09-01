"""Sentiment Agent — Analyzes news and market sentiment for a stock."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm
from app.tools.news_search import search_market_sentiment, search_stock_news

SENTIMENT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a senior sentiment analyst at a top hedge fund. "
            "Analyze the market sentiment for a stock using recent news.\n\n"
            "You must provide:\n"
            "1. Overall sentiment (very bullish / bullish / neutral / bearish / very bearish)\n"
            "2. Key themes from recent news\n"
            "3. Notable catalysts (upcoming events, earnings, product launches)\n"
            "4. Social/media sentiment trends\n"
            "5. A sentiment score from 1-10 (1 = extremely bearish, 10 = extremely bullish)\n"
            "6. Key risks identified from news\n\n"
            "Base your analysis ONLY on the provided news data.",
        ),
        (
            "human",
            "Analyze sentiment for {ticker}.\n\n"
            "RECENT NEWS:\n{news}\n\n"
            "MARKET SENTIMENT DATA:\n{sentiment}\n\n"
            "Provide your sentiment analysis.",
        ),
    ]
)


async def run_sentiment_agent(state: HedgeFundState) -> dict:
    """Execute the sentiment analysis agent."""
    ticker = state.ticker
    messages = []

    messages.append(
        AgentMessage(
            agent="sentiment",
            content=f"Starting sentiment analysis for {ticker}...",
        )
    )

    try:
        news_result = await search_stock_news.ainvoke(
            {"query": f"{ticker} stock news latest", "max_results": 5}
        )
        messages.append(
            AgentMessage(
                agent="sentiment",
                content=f"Found {len(news_result.get('results', []))} news articles",
                data={"step": "news_search"},
            )
        )

        sentiment_result = await search_market_sentiment.ainvoke({"ticker": ticker})
        messages.append(
            AgentMessage(
                agent="sentiment",
                content="Retrieved market sentiment data",
                data={"step": "sentiment_search"},
            )
        )

        news_text = ""
        for i, article in enumerate(news_result.get("results", [])):
            news_text += f"\n[Article {i+1}]: {article.get('title', 'N/A')}\n"
            news_text += f"  {article.get('content', 'No content')}\n"
        news_text = news_text or "No news articles found."

        sentiment_text = sentiment_result.get("answer", "")
        if not sentiment_text:
            sentiment_text = "\n".join(
                r.get("content", "") for r in sentiment_result.get("results", [])
            ) or "No sentiment data available."

        llm = get_llm()
        chain = SENTIMENT_PROMPT | llm

        response = await chain.ainvoke(
            {
                "ticker": ticker,
                "news": news_text,
                "sentiment": sentiment_text,
            }
        )

        messages.append(
            AgentMessage(
                agent="sentiment",
                content="Sentiment analysis complete",
                data={"step": "complete"},
            )
        )

        return {
            "sentiment_report": {
                "analysis": response.content,
                "articles_analyzed": len(news_result.get("results", [])),
                "news_source": news_result.get("source", "unknown"),
            },
            "messages": messages,
        }
    except Exception as e:
        messages.append(
            AgentMessage(agent="sentiment", content=f"Error: {str(e)}")
        )
        return {
            "sentiment_report": {"error": str(e)},
            "messages": messages,
            "errors": [f"Sentiment agent error: {str(e)}"],
        }
