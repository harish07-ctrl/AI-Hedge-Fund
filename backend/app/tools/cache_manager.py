"""Cache & Fallback Manager for Free-Tier Market Data and News APIs."""

from __future__ import annotations

import datetime
import json
import random
from typing import Any, Callable, Coroutine

from sqlalchemy import select, delete

from app.config import get_settings
from app.db.database import get_session_factory
from app.db.models import ApiCache


async def get_cached_item(key: str) -> dict[str, Any] | None:
    """Retrieve an item from the SQLite API cache if not expired."""
    try:
        factory = get_session_factory()
        async with factory() as session:
            stmt = select(ApiCache).where(
                ApiCache.cache_key == key,
                ApiCache.expires_at > datetime.datetime.now()
            )
            res = await session.execute(stmt)
            row = res.scalar_one_or_none()
            if row:
                return json.loads(row.value_json)
    except Exception:
        pass
    return None


async def set_cached_item(key: str, value: dict[str, Any], ttl_seconds: int = 1800) -> None:
    """Store an item in the SQLite API cache with expiration."""
    try:
        expires = datetime.datetime.now() + datetime.timedelta(seconds=ttl_seconds)
        val_str = json.dumps(value)

        factory = get_session_factory()
        async with factory() as session:
            # Delete existing
            await session.execute(delete(ApiCache).where(ApiCache.cache_key == key))
            cache_obj = ApiCache(cache_key=key, value_json=val_str, expires_at=expires)
            session.add(cache_obj)
            await session.commit()
    except Exception:
        pass


async def execute_with_fallback(
    cache_key: str,
    fetch_fns: list[Callable[[], Coroutine[Any, Any, dict[str, Any]]]],
    demo_fallback_fn: Callable[[], dict[str, Any]],
    ttl_seconds: int = 1800,
) -> dict[str, Any]:
    """Execute API functions in order of priority, falling back to cache then demo data."""
    settings = get_settings()

    # If DEMO_MODE is forced, return demo data directly
    if settings.demo_mode:
        demo_data = demo_fallback_fn()
        demo_data["is_demo"] = True
        demo_data["source"] = "Synthetic Demo Mode"
        return demo_data

    # Check cache
    cached = await get_cached_item(cache_key)
    if cached:
        cached["is_cached"] = True
        return cached

    # Try primary -> secondary fetch functions
    for fn in fetch_fns:
        try:
            result = await fn()
            if result and not result.get("error"):
                await set_cached_item(cache_key, result, ttl_seconds)
                return result
        except Exception:
            continue

    # Fallback to demo data
    demo_data = demo_fallback_fn()
    demo_data["is_demo"] = True
    demo_data["warning"] = "⚠ DEMO DATA: External market data APIs unavailable or rate-limited."
    return demo_data


def generate_demo_quote(ticker: str) -> dict[str, Any]:
    """Generate realistic synthetic quote data for demo mode / fallback."""
    seed = sum(ord(c) for c in ticker)
    rng = random.Random(seed)
    base_price = round(rng.uniform(50.0, 500.0), 2)
    change = round(rng.uniform(-5.0, 5.0), 2)
    pct_change = round((change / base_price) * 100, 2)

    return {
        "symbol": ticker.upper(),
        "current_price": base_price,
        "change": change,
        "percent_change": f"{pct_change}%",
        "high": round(base_price + rng.uniform(1.0, 10.0), 2),
        "low": round(base_price - rng.uniform(1.0, 10.0), 2),
        "open": round(base_price - change / 2, 2),
        "previous_close": round(base_price - change, 2),
        "volume": rng.randint(1000000, 50000000),
        "source": "Demo Generator (Fallback)",
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "is_demo": True,
    }


def generate_demo_history(ticker: str, period: str = "3mo") -> dict[str, Any]:
    """Generate realistic synthetic OHLCV price history for demo mode."""
    seed = sum(ord(c) for c in ticker)
    rng = random.Random(seed)

    days = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365}.get(period, 90)
    prices = []
    curr = round(rng.uniform(80.0, 300.0), 2)
    now = datetime.datetime.now()

    for i in range(days, 0, -1):
        dt = (now - datetime.timedelta(days=i)).strftime("%Y-%m-%d")
        delta = rng.uniform(-0.03, 0.035) * curr
        open_p = round(curr, 2)
        close_p = round(curr + delta, 2)
        high_p = round(max(open_p, close_p) + rng.uniform(0.5, 3.0), 2)
        low_p = round(min(open_p, close_p) - rng.uniform(0.5, 3.0), 2)
        vol = rng.randint(500000, 20000000)
        curr = close_p

        prices.append({
            "date": dt,
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "volume": vol,
        })

    return {
        "symbol": ticker.upper(),
        "period": period,
        "prices": prices,
        "source": "Demo Generator (Fallback)",
        "is_demo": True,
    }


def generate_demo_overview(ticker: str) -> dict[str, Any]:
    """Generate realistic synthetic company overview for demo mode."""
    seed = sum(ord(c) for c in ticker)
    rng = random.Random(seed)

    sectors = ["Technology", "Healthcare", "Financials", "Consumer Cyclical", "Industrials"]
    sector = rng.choice(sectors)

    return {
        "symbol": ticker.upper(),
        "name": f"{ticker.upper()} Inc / Corp",
        "sector": sector,
        "industry": f"{sector} Solutions",
        "market_cap": str(rng.randint(10, 500) * 1000000000),
        "pe_ratio": round(rng.uniform(12.0, 45.0), 2),
        "eps": round(rng.uniform(2.0, 15.0), 2),
        "dividend_yield": round(rng.uniform(0.0, 0.04), 4),
        "52_week_high": round(rng.uniform(200.0, 400.0), 2),
        "52_week_low": round(rng.uniform(100.0, 199.0), 2),
        "beta": round(rng.uniform(0.8, 1.6), 2),
        "profit_margin": round(rng.uniform(0.1, 0.35), 4),
        "revenue_ttm": str(rng.randint(5, 100) * 1000000000),
        "description": f"{ticker.upper()} is a leading market participant in the {sector} industry, driving innovations in products and global services.",
        "source": "Demo Generator (Fallback)",
        "is_demo": True,
    }


def generate_demo_news(ticker: str) -> dict[str, Any]:
    """Generate realistic synthetic news articles for demo mode."""
    now = datetime.datetime.now().strftime("%Y-%m-%d")
    return {
        "query": f"{ticker} news",
        "answer": f"Overall news sentiment for {ticker} is positive driven by strategic growth and solid financial performance.",
        "results": [
            {
                "title": f"{ticker.upper()} Reports Strong Quarter Results exceeding analyst expectations",
                "url": f"https://finance.demo.news/{ticker.lower()}-earnings",
                "content": f"{ticker.upper()} announced top-line revenue growth and expanded profit margins during its latest quarterly disclosure.",
                "score": 0.92,
                "published": now,
                "source": "Financial Times Demo",
            },
            {
                "title": f"Analysts Upgrade {ticker.upper()} Rating on Strategic AI Innovation",
                "url": f"https://finance.demo.news/{ticker.lower()}-upgrade",
                "content": f"Major investment banks upgraded their target price for {ticker.upper()} citing market share expansion.",
                "score": 0.88,
                "published": now,
                "source": "Wall Street Research",
            },
            {
                "title": f"{ticker.upper()} Expands Global Operations in Key High-Growth Markets",
                "url": f"https://finance.demo.news/{ticker.lower()}-expansion",
                "content": f"The company confirmed new international partnerships to bolster supply chain resilience and reach broader retail customers.",
                "score": 0.81,
                "published": now,
                "source": "Global Market News",
            }
        ],
        "source": "Demo News Feed",
        "is_demo": True,
    }
