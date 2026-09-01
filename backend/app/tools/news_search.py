"""News and sentiment search tools using Tavily, DuckDuckGo, and fallbacks."""

from __future__ import annotations

import datetime
from typing import Any

from langchain_core.tools import tool

from app.config import get_settings
from app.tools.cache_manager import (
    execute_with_fallback,
    generate_demo_news,
)


@tool
async def search_stock_news(query: str, max_results: int = 5) -> dict[str, Any]:
    """Search for recent news about a stock or company."""
    cache_key = f"news_{query.lower().replace(' ', '_')}_{max_results}"

    settings = get_settings()

    async def _fetch_tavily():
        if not settings.tavily_api_key:
            raise ValueError("No Tavily API key")
        return await _tavily_search(query, max_results, settings.tavily_api_key)

    async def _fetch_ddg():
        res = await _duckduckgo_search(query, max_results)
        if not res.get("results"):
            raise ValueError("DuckDuckGo failed")
        return res

    # Derive ticker from query if possible
    ticker = query.split()[0].upper() if query else "STOCK"

    return await execute_with_fallback(
        cache_key=cache_key,
        fetch_fns=[_fetch_tavily, _fetch_ddg],
        demo_fallback_fn=lambda: generate_demo_news(ticker),
        ttl_seconds=1800,  # 30 min TTL
    )


@tool
async def search_market_sentiment(ticker: str) -> dict[str, Any]:
    """Get overall market sentiment for a stock ticker from recent news."""
    ticker_clean = ticker.upper().strip()
    query = f"{ticker_clean} stock news market sentiment"
    cache_key = f"sentiment_{ticker_clean}"

    settings = get_settings()

    async def _fetch_tavily():
        if not settings.tavily_api_key:
            raise ValueError("No Tavily API key")
        return await _tavily_search(query, 6, settings.tavily_api_key)

    async def _fetch_ddg():
        res = await _duckduckgo_search(query, 6)
        if not res.get("results"):
            raise ValueError("DuckDuckGo sentiment failed")
        return res

    return await execute_with_fallback(
        cache_key=cache_key,
        fetch_fns=[_fetch_tavily, _fetch_ddg],
        demo_fallback_fn=lambda: generate_demo_news(ticker_clean),
        ttl_seconds=1800,
    )


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
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    results = [
        {
            "title": r.get("title", "News Article"),
            "url": r.get("url", "#"),
            "content": r.get("content", "")[:500],
            "score": r.get("score", 0.8),
            "published": r.get("published_date") or now,
            "source": "Tavily News API",
        }
        for r in response.get("results", [])
    ]
    return {
        "query": query,
        "answer": response.get("answer", ""),
        "results": results,
        "source": "Tavily News API",
    }


async def _duckduckgo_search(
    query: str, max_results: int
) -> dict[str, Any]:
    """Fallback search using DuckDuckGo (100% free, no API key)."""
    try:
        from langchain_community.tools import DuckDuckGoSearchResults

        search = DuckDuckGoSearchResults(max_results=max_results)
        raw = await search.ainvoke(query)

        now = datetime.datetime.now().strftime("%Y-%m-%d")
        return {
            "query": query,
            "answer": f"DuckDuckGo search results for {query}",
            "results": [
                {
                    "title": f"DuckDuckGo Article {i+1}",
                    "url": "https://duckduckgo.com",
                    "content": line[:400],
                    "score": 0.75,
                    "published": now,
                    "source": "DuckDuckGo Free Search",
                }
                for i, line in enumerate(str(raw).split("] [")[:max_results])
            ],
            "source": "DuckDuckGo Free Search",
        }
    except Exception as e:
        return {"query": query, "error": str(e), "results": []}
