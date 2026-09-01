"""News and sentiment search tools using Tavily and DuckDuckGo."""

from __future__ import annotations

from typing import Any

from langchain_core.tools import tool

from app.config import get_settings


@tool
async def search_stock_news(query: str, max_results: int = 5) -> dict[str, Any]:
    """Search for recent news about a stock or company.

    Args:
        query: Search query, e.g. 'AAPL earnings report' or 'Apple stock news'
        max_results: Number of results to return (default 5)
    """
    settings = get_settings()

    if settings.tavily_api_key:
        try:
            return await _tavily_search(query, max_results, settings.tavily_api_key)
        except Exception:
            pass

    return await _duckduckgo_search(query, max_results)


@tool
async def search_market_sentiment(ticker: str) -> dict[str, Any]:
    """Get overall market sentiment for a stock ticker from recent news."""
    settings = get_settings()

    query = f"{ticker} stock market sentiment analysis recent news"
    if settings.tavily_api_key:
        try:
            return await _tavily_search(query, 8, settings.tavily_api_key)
        except Exception:
            pass

    return await _duckduckgo_search(query, 8)


async def _tavily_search(
    query: str, max_results: int, api_key: str
) -> dict[str, Any]:
    from tavily import AsyncTavilyClient

    client = AsyncTavilyClient(api_key=api_key)
    response = await client.search(
        query=query,
        search_depth="advanced",
        max_results=max_results,
        include_answer=True,
        topic="news",
    )
    results = [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "content": r.get("content", "")[:500],
            "score": r.get("score", 0),
        }
        for r in response.get("results", [])
    ]
    return {
        "query": query,
        "answer": response.get("answer", ""),
        "results": results,
        "source": "tavily",
    }


async def _duckduckgo_search(
    query: str, max_results: int
) -> dict[str, Any]:
    """Fallback search using DuckDuckGo (no API key required)."""
    try:
        from langchain_community.tools import DuckDuckGoSearchResults

        search = DuckDuckGoSearchResults(max_results=max_results)
        raw = await search.ainvoke(query)
        return {
            "query": query,
            "answer": "",
            "results": [{"content": raw}],
            "source": "duckduckgo",
        }
    except Exception as e:
        return {"query": query, "error": str(e), "results": []}
