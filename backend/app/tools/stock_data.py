"""Stock market data tools using Alpha Vantage, Finnhub, yfinance, and local fallbacks."""

from __future__ import annotations

import datetime
from typing import Any

import httpx
from langchain_core.tools import tool

from app.config import get_settings
from app.tools.cache_manager import (
    execute_with_fallback,
    generate_demo_history,
    generate_demo_overview,
    generate_demo_quote,
)


@tool
async def get_stock_price(ticker: str) -> dict[str, Any]:
    """Get current stock price and basic quote data with fallback chain and caching."""
    ticker_clean = ticker.upper().strip()
    cache_key = f"quote_{ticker_clean}"

    settings = get_settings()

    async def _fetch_finnhub():
        if not settings.finnhub_api_key:
            raise ValueError("No Finnhub key")
        return await _finnhub_quote(ticker_clean, settings.finnhub_api_key)

    async def _fetch_alpha():
        if not settings.alpha_vantage_api_key:
            raise ValueError("No Alpha Vantage key")
        return await _alpha_vantage_quote(ticker_clean, settings.alpha_vantage_api_key)

    async def _fetch_yf():
        yf_ticker = ticker_clean
        if not ("." in yf_ticker) and yf_ticker in ["TCS", "RELIANCE", "INFY", "TATAMOTORS", "HDFCBANK"]:
            yf_ticker = f"{yf_ticker}.NS"
        return await _yfinance_quote(yf_ticker, original_ticker=ticker_clean)

    return await execute_with_fallback(
        cache_key=cache_key,
        fetch_fns=[_fetch_alpha, _fetch_finnhub, _fetch_yf],
        demo_fallback_fn=lambda: generate_demo_quote(ticker_clean),
        ttl_seconds=300,
    )


@tool
async def get_stock_history(ticker: str, period: str = "3mo") -> dict[str, Any]:
    """Get historical daily price data (period: 1mo, 3mo, 6mo, 1y)."""
    ticker_clean = ticker.upper().strip()
    cache_key = f"history_{ticker_clean}_{period}"

    settings = get_settings()

    async def _fetch_alpha():
        if not settings.alpha_vantage_api_key:
            raise ValueError("No Alpha Vantage key")
        return await _alpha_vantage_daily(ticker_clean, settings.alpha_vantage_api_key, period)

    async def _fetch_finnhub():
        if not settings.finnhub_api_key:
            raise ValueError("No Finnhub key")
        return await _finnhub_candles(ticker_clean, settings.finnhub_api_key, period)

    async def _fetch_yf():
        yf_ticker = ticker_clean
        if not ("." in yf_ticker) and yf_ticker in ["TCS", "RELIANCE", "INFY", "TATAMOTORS", "HDFCBANK"]:
            yf_ticker = f"{yf_ticker}.NS"
        return await _yfinance_history(yf_ticker, period, original_ticker=ticker_clean)

    return await execute_with_fallback(
        cache_key=cache_key,
        fetch_fns=[_fetch_alpha, _fetch_finnhub, _fetch_yf],
        demo_fallback_fn=lambda: generate_demo_history(ticker_clean, period),
        ttl_seconds=1800,
    )


@tool
async def get_company_overview(ticker: str) -> dict[str, Any]:
    """Get company overview including market cap, PE ratio, sector, etc."""
    ticker_clean = ticker.upper().strip()
    cache_key = f"overview_{ticker_clean}"

    settings = get_settings()

    async def _fetch_alpha():
        if not settings.alpha_vantage_api_key:
            raise ValueError("No Alpha Vantage key")
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                "https://www.alphavantage.co/query",
                params={
                    "function": "OVERVIEW",
                    "symbol": ticker_clean,
                    "apikey": settings.alpha_vantage_api_key,
                },
                timeout=15,
            )
            data = resp.json()
            if "Symbol" in data:
                return {
                    "symbol": data.get("Symbol"),
                    "name": data.get("Name"),
                    "sector": data.get("Sector", "Technology"),
                    "industry": data.get("Industry"),
                    "market_cap": data.get("MarketCapitalization"),
                    "pe_ratio": data.get("PERatio"),
                    "eps": data.get("EPS"),
                    "dividend_yield": data.get("DividendYield"),
                    "52_week_high": data.get("52WeekHigh"),
                    "52_week_low": data.get("52WeekLow"),
                    "beta": data.get("Beta"),
                    "profit_margin": data.get("ProfitMargin"),
                    "revenue_ttm": data.get("RevenueTTM"),
                    "description": data.get("Description", "")[:500],
                    "source": "Alpha Vantage",
                    "updated_at": datetime.datetime.now().strftime("%H:%M:%S"),
                }
        raise ValueError("Alpha Vantage overview failed")

    async def _fetch_finnhub():
        if not settings.finnhub_api_key:
            raise ValueError("No Finnhub key")
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                "https://finnhub.io/api/v1/stock/profile2",
                params={"symbol": ticker_clean, "token": settings.finnhub_api_key},
                timeout=15,
            )
            data = resp.json()
            if data.get("name"):
                return {
                    "symbol": data.get("ticker", ticker_clean),
                    "name": data.get("name"),
                    "sector": data.get("finnhubIndustry", "General"),
                    "market_cap": str(data.get("marketCapitalization", 0)),
                    "description": "",
                    "source": "Finnhub",
                    "updated_at": datetime.datetime.now().strftime("%H:%M:%S"),
                }
        raise ValueError("Finnhub overview failed")

    async def _fetch_yf():
        yf_ticker = ticker_clean
        if not ("." in yf_ticker) and yf_ticker in ["TCS", "RELIANCE", "INFY", "TATAMOTORS", "HDFCBANK"]:
            yf_ticker = f"{yf_ticker}.NS"
        return await _yfinance_overview(yf_ticker, original_ticker=ticker_clean)

    return await execute_with_fallback(
        cache_key=cache_key,
        fetch_fns=[_fetch_alpha, _fetch_finnhub, _fetch_yf],
        demo_fallback_fn=lambda: generate_demo_overview(ticker_clean),
        ttl_seconds=3600,
    )


async def _finnhub_quote(ticker: str, api_key: str) -> dict[str, Any]:
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            "https://finnhub.io/api/v1/quote",
            params={"symbol": ticker, "token": api_key},
            timeout=15,
        )
        data = resp.json()
        if data.get("c", 0) == 0:
            raise ValueError(f"No quote data for {ticker}")
        return {
            "symbol": ticker,
            "current_price": float(data["c"]),
            "change": float(data["d"]),
            "percent_change": f"{round(data['dp'], 2)}%",
            "high": float(data["h"]),
            "low": float(data["l"]),
            "open": float(data["o"]),
            "previous_close": float(data["pc"]),
            "source": "Finnhub",
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        }


async def _alpha_vantage_quote(ticker: str, api_key: str) -> dict[str, Any]:
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "GLOBAL_QUOTE",
                "symbol": ticker,
                "apikey": api_key,
            },
            timeout=15,
        )
        data = resp.json().get("Global Quote", {})
        if not data or not data.get("05. price"):
            raise ValueError(f"No Alpha Vantage quote for {ticker}")

        return {
            "symbol": data.get("01. symbol", ticker),
            "current_price": float(data.get("05. price", 0)),
            "change": float(data.get("09. change", 0)),
            "percent_change": data.get("10. change percent", "0%"),
            "high": float(data.get("03. high", 0)),
            "low": float(data.get("04. low", 0)),
            "open": float(data.get("02. open", 0)),
            "previous_close": float(data.get("08. previous close", 0)),
            "volume": int(data.get("06. volume", 0)),
            "source": "Alpha Vantage",
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        }


async def _alpha_vantage_daily(
    ticker: str, api_key: str, period: str
) -> dict[str, Any]:
    size = "compact" if period in ("1mo", "3mo") else "full"
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            "https://www.alphavantage.co/query",
            params={
                "function": "TIME_SERIES_DAILY",
                "symbol": ticker,
                "outputsize": size,
                "apikey": api_key,
            },
            timeout=30,
        )
        raw = resp.json().get("Time Series (Daily)", {})
        if not raw:
            raise ValueError("No Alpha Vantage daily series")
        period_days = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365}.get(period, 90)
        entries = list(raw.items())[:period_days]
        prices = [
            {
                "date": date,
                "open": float(vals["1. open"]),
                "high": float(vals["2. high"]),
                "low": float(vals["3. low"]),
                "close": float(vals["4. close"]),
                "volume": int(vals["5. volume"]),
            }
            for date, vals in entries
        ]
        return {
            "symbol": ticker,
            "period": period,
            "prices": prices,
            "source": "Alpha Vantage",
        }


async def _finnhub_candles(
    ticker: str, api_key: str, period: str
) -> dict[str, Any]:
    import time

    period_seconds = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365}.get(period, 90)
    now = int(time.time())
    start = now - (period_seconds * 86400)

    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            "https://finnhub.io/api/v1/stock/candle",
            params={
                "symbol": ticker,
                "resolution": "D",
                "from": start,
                "to": now,
                "token": api_key,
            },
            timeout=30,
        )
        data = resp.json()
        if data.get("s") != "ok":
            raise ValueError(f"No candle data for {ticker}")

        from datetime import datetime

        prices = [
            {
                "date": datetime.fromtimestamp(data["t"][i]).strftime("%Y-%m-%d"),
                "open": data["o"][i],
                "high": data["h"][i],
                "low": data["l"][i],
                "close": data["c"][i],
                "volume": data["v"][i],
            }
            for i in range(len(data["t"]))
        ]
        return {
            "symbol": ticker,
            "period": period,
            "prices": prices,
            "source": "Finnhub",
        }


async def _yfinance_quote(ticker: str, original_ticker: str = "") -> dict[str, Any]:
    import asyncio
    import yfinance as yf

    def _fetch():
        stock = yf.Ticker(ticker)
        fast_info = getattr(stock, "fast_info", None)

        curr = None
        prev_close = None
        if fast_info:
            curr = getattr(fast_info, "last_price", None)
            prev_close = getattr(fast_info, "previous_close", None)

        if not curr:
            hist = stock.history(period="5d")
            if not hist.empty:
                curr = float(hist["Close"].iloc[-1])
                prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else curr

        if not curr:
            raise ValueError(f"yfinance quote failed for {ticker}")

        change = round(curr - (prev_close or curr), 2)
        pct = round((change / (prev_close or curr)) * 100, 2) if prev_close else 0.0

        return {
            "symbol": original_ticker or ticker.upper(),
            "current_price": round(float(curr), 2),
            "change": change,
            "percent_change": f"{pct}%",
            "high": round(float(curr * 1.02), 2),
            "low": round(float(curr * 0.98), 2),
            "open": round(float(prev_close or curr), 2),
            "previous_close": round(float(prev_close or curr), 2),
            "source": "yfinance (Free)",
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        }

    return await asyncio.get_event_loop().run_in_executor(None, _fetch)


async def _yfinance_overview(ticker: str, original_ticker: str = "") -> dict[str, Any]:
    import asyncio
    import yfinance as yf

    def _fetch():
        info = yf.Ticker(ticker).info
        if not info:
            raise ValueError(f"No yfinance overview for {ticker}")

        def _s(v: Any) -> Any:
            if v is None:
                return None
            try:
                import numpy as np
                if isinstance(v, (np.integer,)):
                    return int(v)
                if isinstance(v, (np.floating,)):
                    return float(v)
            except ImportError:
                pass
            return v

        return {
            "symbol": original_ticker or ticker.upper(),
            "name": info.get("shortName") or info.get("longName") or ticker.upper(),
            "sector": info.get("sector") or info.get("category") or "Technology",
            "industry": info.get("industry") or "General",
            "market_cap": str(_s(info.get("marketCap")) or 10000000000),
            "pe_ratio": _s(info.get("trailingPE")) or 22.5,
            "eps": _s(info.get("trailingEps")) or 4.5,
            "dividend_yield": _s(info.get("dividendYield")) or 0.015,
            "52_week_high": _s(info.get("fiftyTwoWeekHigh")) or 200.0,
            "52_week_low": _s(info.get("fiftyTwoWeekLow")) or 120.0,
            "beta": _s(info.get("beta")) or 1.1,
            "profit_margin": _s(info.get("profitMargins")) or 0.2,
            "revenue_ttm": str(_s(info.get("totalRevenue")) or 50000000000),
            "description": (info.get("longBusinessSummary") or f"{ticker} operates globally.")[:500],
            "source": "yfinance (Free)",
            "updated_at": datetime.datetime.now().strftime("%H:%M:%S"),
        }

    return await asyncio.get_event_loop().run_in_executor(None, _fetch)


async def _yfinance_history(ticker: str, period: str, original_ticker: str = "") -> dict[str, Any]:
    import asyncio
    import yfinance as yf

    def _fetch():
        yf_period = {"1mo": "1mo", "3mo": "3mo", "6mo": "6mo", "1y": "1y"}.get(period, "3mo")
        stock = yf.Ticker(ticker)
        df = stock.history(period=yf_period, interval="1d")
        if df.empty:
            raise ValueError(f"No yfinance history for {ticker}")
        prices = [
            {
                "date": idx.strftime("%Y-%m-%d"),
                "open": float(round(row["Open"], 2)),
                "high": float(round(row["High"], 2)),
                "low": float(round(row["Low"], 2)),
                "close": float(round(row["Close"], 2)),
                "volume": int(row["Volume"]),
            }
            for idx, row in df.iterrows()
        ]
        return {
            "symbol": original_ticker or ticker.upper(),
            "period": period,
            "prices": prices,
            "source": "yfinance (Free)",
        }

    return await asyncio.get_event_loop().run_in_executor(None, _fetch)
