"""Technical analysis indicators computed from price data."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from langchain_core.tools import tool


def _py(val: Any) -> Any:
    """Convert numpy scalars to native Python types for msgpack serialization."""
    if val is None or isinstance(val, (str, bool)):
        return val
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, (np.ndarray,)):
        return val.tolist()
    return val


@tool
async def calculate_technical_indicators(price_data: list[dict]) -> dict[str, Any]:
    """Calculate key technical indicators from historical price data.

    Args:
        price_data: List of dicts with keys: date, open, high, low, close, volume
    """
    if not price_data:
        return {"error": "No price data provided"}

    try:
        df = pd.DataFrame(price_data)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)

        close = df["close"].astype(float)
        high = df["high"].astype(float)
        low = df["low"].astype(float)
        volume = df["volume"].astype(float)

        indicators: dict[str, Any] = {}

        # Moving Averages
        indicators["sma_20"] = _py(round(close.rolling(20).mean().iloc[-1], 2)) if len(close) >= 20 else None
        indicators["sma_50"] = _py(round(close.rolling(50).mean().iloc[-1], 2)) if len(close) >= 50 else None
        indicators["ema_12"] = _py(round(close.ewm(span=12).mean().iloc[-1], 2))
        indicators["ema_26"] = _py(round(close.ewm(span=26).mean().iloc[-1], 2))

        # MACD
        macd_line = close.ewm(span=12).mean() - close.ewm(span=26).mean()
        signal_line = macd_line.ewm(span=9).mean()
        indicators["macd"] = _py(round(macd_line.iloc[-1], 4))
        indicators["macd_signal"] = _py(round(signal_line.iloc[-1], 4))
        indicators["macd_histogram"] = _py(round(
            (macd_line - signal_line).iloc[-1], 4
        ))

        # RSI (14-period)
        delta = close.diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / loss.replace(0, float("nan"))
        rsi = 100 - (100 / (1 + rs))
        indicators["rsi_14"] = _py(round(rsi.iloc[-1], 2)) if not pd.isna(rsi.iloc[-1]) else None

        # Bollinger Bands (20-period)
        if len(close) >= 20:
            sma20 = close.rolling(20).mean()
            std20 = close.rolling(20).std()
            indicators["bb_upper"] = _py(round((sma20 + 2 * std20).iloc[-1], 2))
            indicators["bb_middle"] = _py(round(sma20.iloc[-1], 2))
            indicators["bb_lower"] = _py(round((sma20 - 2 * std20).iloc[-1], 2))

        # Average True Range (14-period)
        tr = pd.concat(
            [
                high - low,
                (high - close.shift()).abs(),
                (low - close.shift()).abs(),
            ],
            axis=1,
        ).max(axis=1)
        indicators["atr_14"] = _py(round(tr.rolling(14).mean().iloc[-1], 2)) if len(tr) >= 14 else None

        # Volume analysis
        indicators["avg_volume_20"] = _py(int(volume.rolling(20).mean().iloc[-1])) if len(volume) >= 20 else None
        indicators["current_volume"] = _py(int(volume.iloc[-1]))
        if indicators["avg_volume_20"]:
            indicators["volume_ratio"] = _py(round(
                indicators["current_volume"] / indicators["avg_volume_20"], 2
            ))

        # Current price context
        current = float(close.iloc[-1])
        indicators["current_price"] = current
        indicators["price_change_1d"] = _py(round(
            ((current - float(close.iloc[-2])) / float(close.iloc[-2])) * 100, 2
        )) if len(close) >= 2 else None

        # Trend signals
        signals = []
        if indicators.get("rsi_14"):
            if indicators["rsi_14"] > 70:
                signals.append("RSI overbought (>70)")
            elif indicators["rsi_14"] < 30:
                signals.append("RSI oversold (<30)")

        if indicators.get("macd") and indicators.get("macd_signal"):
            if indicators["macd"] > indicators["macd_signal"]:
                signals.append("MACD bullish crossover")
            else:
                signals.append("MACD bearish crossover")

        if indicators.get("sma_20") and indicators.get("sma_50"):
            if indicators["sma_20"] > indicators["sma_50"]:
                signals.append("Golden cross (SMA20 > SMA50)")
            else:
                signals.append("Death cross (SMA20 < SMA50)")

        if indicators.get("bb_upper") and indicators.get("bb_lower"):
            if current > indicators["bb_upper"]:
                signals.append("Price above upper Bollinger Band")
            elif current < indicators["bb_lower"]:
                signals.append("Price below lower Bollinger Band")

        indicators["signals"] = signals

        return indicators
    except Exception as e:
        return {"error": f"Failed to calculate indicators: {str(e)}"}
