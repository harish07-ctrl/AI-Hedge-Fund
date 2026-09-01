"""Stock market data tools using Alpha Vantage and Finnhub APIs."""

from __future__ import annotations

from typing import Any

import httpx
from langchain_core.tools import tool

from app.config import get_settings


@tool
async def get_stock_price(ticker: str) -> dict[str, Any]:
    """Get current stock price and basic quote data for a given ticker symbol."""
    settings = get_settings()

    # Try Finnhub first (higher rate limit)
    if settings.finnhub_api_key:
        try:
            return await _finnhub_quote(ticker, settings.finnhub_api_key)
        except Exception:
            pass

    # Fallback to Alpha Vantage
    if settings.alpha_vantage_api_key:
        return await _alpha_vantage_quote(ticker, settings.alpha_vantage_api_key)

    return {"error": "No financial data API key configured"}


@tool
async def get_stock_history(ticker: str, period: str = "3mo") -> dict[str, Any]:
    """Get historical daily price data. period: 1mo, 3mo, 6mo, 1y."""
    settings = get_settings()

    # Try Alpha Vantage first
    if settings.alpha_vantage_api_key:
        try:
            result = await _alpha_vantage_daily(ticker, settings.alpha_vantage_api_key, period)
            if result.get("prices"):
                return result
        except Exception:
            pass

    # Try Finnhub second
    if settings.finnhub_api_key:
        try:
            result = await _finnhub_candles(ticker, settings.finnhub_api_key, period)
            if result.get("prices"):
                return result
        except Exception:
            pass

    # Fallback to yfinance (free, no API key needed)
    return await _yfinance_history(ticker, period)


@tool
async def get_company_overview(ticker: str) -> dict[str, Any]:
    """Get company overview including market cap, PE ratio, sector, etc."""
    settings = get_settings()

    # Try Alpha Vantage
    if settings.alpha_vantage_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://www.alphavantage.co/query",
                    params={
                        "function": "OVERVIEW",
                        "symbol": ticker,
                        "apikey": settings.alpha_vantage_api_key,
                    },
                    timeout=15,
                )
                data = resp.json()
                if "Symbol" in data:
                    return {
                        "symbol": data.get("Symbol"),
                        "name": data.get("Name"),
                        "sector": data.get("Sector"),
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
                    }
        except Exception:
            pass

    # Try Finnhub
    if settings.finnhub_api_key:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://finnhub.io/api/v1/stock/profile2",
                    params={"symbol": ticker, "token": settings.finnhub_api_key},
                    timeout=15,
                )
                data = resp.json()
                if data.get("name"):
                    return {
                        "symbol": data.get("ticker"),
                        "name": data.get("name"),
                        "sector": data.get("finnhubIndustry"),
                        "market_cap": data.get("marketCapitalization"),
                        "description": "",
                    }
        except Exception:
            pass

    # Fallback to yfinance (works for stocks, ETFs, and funds)
    return await _yfinance_overview(ticker)


async def _finnhub_quote(ticker: str, api_key: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
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
            "current_price": data["c"],
            "change": data["d"],
            "percent_change": data["dp"],
            "high": data["h"],
            "low": data["l"],
            "open": data["o"],
            "previous_close": data["pc"],
        }


async def _alpha_vantage_quote(ticker: str, api_key: str) -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
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
        }


async def _alpha_vantage_daily(
    ticker: str, api_key: str, period: str
) -> dict[str, Any]:
    size = "compact" if period in ("1mo", "3mo") else "full"
    async with httpx.AsyncClient() as client:
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
        return {"symbol": ticker, "period": period, "prices": prices}


async def _finnhub_candles(
    ticker: str, api_key: str, period: str
) -> dict[str, Any]:
    import time

    period_seconds = {"1mo": 30, "3mo": 90, "6mo": 180, "1y": 365}.get(period, 90)
    now = int(time.time())
    start = now - (period_seconds * 86400)

    async with httpx.AsyncClient() as client:
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
            return {"error": f"No candle data for {ticker}"}

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
        return {"symbol": ticker, "period": period, "prices": prices}


async def _yfinance_overview(ticker: str) -> dict[str, Any]:
    """Free fallback for company/ETF overview using yfinance."""
    import asyncio

    import yfinance as yf

    def _fetch():
        info = yf.Ticker(ticker).info
        if not info or info.get("trailingPegRatio") is None and not info.get("shortName"):
            return {"error": f"No overview data for {ticker}"}

        def _s(v: Any) -> Any:
            """Convert numpy/non-standard types to native Python."""
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

        result: dict[str, Any] = {
            "symbol": ticker.upper(),
            "name": info.get("shortName") or info.get("longName"),
            "sector": info.get("sector") or info.get("category"),
            "industry": info.get("industry"),
            "market_cap": _s(info.get("marketCap")),
            "pe_ratio": _s(info.get("trailingPE")),
            "forward_pe": _s(info.get("forwardPE")),
            "eps": _s(info.get("trailingEps")),
            "dividend_yield": _s(info.get("dividendYield")),
            "52_week_high": _s(info.get("fiftyTwoWeekHigh")),
            "52_week_low": _s(info.get("fiftyTwoWeekLow")),
            "50_day_avg": _s(info.get("fiftyDayAverage")),
            "200_day_avg": _s(info.get("twoHundredDayAverage")),
            "beta": _s(info.get("beta")),
            "profit_margin": _s(info.get("profitMargins")),
            "revenue_ttm": _s(info.get("totalRevenue")),
            "total_assets": _s(info.get("totalAssets")),
            "nav_price": _s(info.get("navPrice")),
            "expense_ratio": _s(info.get("annualReportExpenseRatio") or info.get("expenseRatio")),
            "fund_family": info.get("fundFamily"),
            "ytd_return": _s(info.get("ytdReturn")),
            "three_year_return": _s(info.get("threeYearAverageReturn")),
            "five_year_return": _s(info.get("fiveYearAverageReturn")),
            "avg_volume": _s(info.get("averageVolume")),
            "description": (info.get("longBusinessSummary") or "")[:800],
        }

        # Pull top holdings for ETFs/funds if available
        try:
            fund = yf.Ticker(ticker)
            holdings = getattr(fund, "major_holders", None)
            if holdings is not None and not holdings.empty:
                result["top_holders"] = holdings.to_string()
        except Exception:
            pass

        return result

    return await asyncio.get_event_loop().run_in_executor(None, _fetch)


async def _yfinance_history(ticker: str, period: str) -> dict[str, Any]:
    """Free fallback using yfinance — no API key required."""
    import asyncio

    import yfinance as yf

    def _fetch():
        yf_period = {"1mo": "1mo", "3mo": "3mo", "6mo": "6mo", "1y": "1y"}.get(
            period, "3mo"
        )
        stock = yf.Ticker(ticker)
        df = stock.history(period=yf_period, interval="1d")
        if df.empty:
            return {"symbol": ticker, "period": period, "prices": []}
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
        return {"symbol": ticker, "period": period, "prices": prices}

    return await asyncio.get_event_loop().run_in_executor(None, _fetch)
