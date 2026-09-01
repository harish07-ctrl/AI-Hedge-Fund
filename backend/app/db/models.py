"""SQLAlchemy models for storing user profile, portfolio state, watchlist, analyses, behavioral events, metrics, and API cache."""

from __future__ import annotations

import datetime
import json
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class UserProfile(Base):
    """Stores user investment preferences and portfolio constraints."""

    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(50), default="default", unique=True, index=True)
    risk_tolerance: Mapped[str] = mapped_column(String(20), default="Moderate")  # Conservative, Moderate, Aggressive
    investment_horizon: Mapped[str] = mapped_column(String(20), default="Medium term")  # Short term, Medium term, Long term
    investment_goal: Mapped[str] = mapped_column(String(100), default="Growth & Capital Appreciation")
    available_capital: Mapped[float] = mapped_column(Float, default=100000.0)
    max_portfolio_concentration: Mapped[float] = mapped_column(Float, default=20.0)  # Max % in single stock
    preferred_sectors_json: Mapped[str] = mapped_column(Text, default='["Technology", "Healthcare"]')
    avoided_sectors_json: Mapped[str] = mapped_column(Text, default='[]')
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "risk_tolerance": self.risk_tolerance,
            "investment_horizon": self.investment_horizon,
            "investment_goal": self.investment_goal,
            "available_capital": self.available_capital,
            "max_portfolio_concentration": self.max_portfolio_concentration,
            "preferred_sectors": json.loads(self.preferred_sectors_json or "[]"),
            "avoided_sectors": json.loads(self.avoided_sectors_json or "[]"),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class PortfolioHolding(Base):
    """Tracks current portfolio holdings with price and profit metrics."""

    __tablename__ = "portfolio_holdings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    shares: Mapped[float] = mapped_column(Float, default=0.0)
    avg_entry_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    profit_loss: Mapped[float] = mapped_column(Float, default=0.0)
    portfolio_weight: Mapped[float] = mapped_column(Float, default=0.0)
    sector: Mapped[str] = mapped_column(String(50), default="Technology")
    current_decision: Mapped[str] = mapped_column(String(10), default="HOLD")
    last_analysis_id: Mapped[str] = mapped_column(String(36), default="")
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        val = self.shares * self.current_price if self.current_price else self.shares * self.avg_entry_price
        pnl = (self.current_price - self.avg_entry_price) * self.shares if self.current_price else 0.0
        return {
            "id": self.id,
            "ticker": self.ticker,
            "shares": self.shares,
            "quantity": self.shares,
            "avg_entry_price": self.avg_entry_price,
            "avg_buy_price": self.avg_entry_price,
            "current_price": self.current_price or self.avg_entry_price,
            "current_value": self.current_value or val,
            "profit_loss": self.profit_loss or pnl,
            "portfolio_weight": self.portfolio_weight,
            "sector": self.sector,
            "current_decision": self.current_decision,
            "ai_signal": self.current_decision,
            "last_analysis_id": self.last_analysis_id,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Watchlist(Base):
    """Stores watchlist stock tickers with notes."""

    __tablename__ = "watchlist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    added_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "ticker": self.ticker,
            "notes": self.notes,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }


class Analysis(Base):
    """Stores the result of each multi-agent analysis run."""

    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    ticker: Mapped[str] = mapped_column(String(10), index=True)
    decision: Mapped[str] = mapped_column(String(10))  # BUY / HOLD / SELL
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    target_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    stop_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    position_size_pct: Mapped[float] = mapped_column(Float, default=0.0)
    time_horizon: Mapped[str] = mapped_column(String(20), default="medium")
    reasoning: Mapped[str] = mapped_column(Text, default="")

    fundamentals_json: Mapped[str] = mapped_column(Text, default="{}")
    sentiment_json: Mapped[str] = mapped_column(Text, default="{}")
    technical_json: Mapped[str] = mapped_column(Text, default="{}")
    risk_json: Mapped[str] = mapped_column(Text, default="{}")
    macro_json: Mapped[str] = mapped_column(Text, default="{}")
    profile_json: Mapped[str] = mapped_column(Text, default="{}")
    messages_json: Mapped[str] = mapped_column(Text, default="[]")
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    @classmethod
    def from_result(cls, result: dict[str, Any]) -> "Analysis":
        decision = result.get("final_decision", {})
        return cls(
            analysis_id=result.get("analysis_id", ""),
            ticker=result.get("ticker", ""),
            decision=decision.get("decision", "HOLD"),
            confidence=decision.get("confidence", 0.0),
            target_price=decision.get("target_price"),
            stop_loss=decision.get("stop_loss"),
            position_size_pct=decision.get("position_size_pct", 0.0),
            time_horizon=decision.get("time_horizon", "medium"),
            reasoning=decision.get("reasoning", ""),
            fundamentals_json=json.dumps(result.get("fundamentals_report", {})),
            sentiment_json=json.dumps(result.get("sentiment_report", {})),
            technical_json=json.dumps(result.get("technical_report", {})),
            risk_json=json.dumps(result.get("risk_report", {})),
            macro_json=json.dumps(result.get("macro_report", {})),
            profile_json=json.dumps(result.get("user_profile", {})),
            messages_json=json.dumps(result.get("messages", [])),
            is_demo_data=result.get("is_demo_data", False),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "ticker": self.ticker,
            "decision": self.decision,
            "confidence": self.confidence,
            "target_price": self.target_price,
            "stop_loss": self.stop_loss,
            "position_size_pct": self.position_size_pct,
            "time_horizon": self.time_horizon,
            "reasoning": self.reasoning,
            "fundamentals_report": json.loads(self.fundamentals_json or "{}"),
            "sentiment_report": json.loads(self.sentiment_json or "{}"),
            "technical_report": json.loads(self.technical_json or "{}"),
            "risk_report": json.loads(self.risk_json or "{}"),
            "macro_report": json.loads(self.macro_json or "{}"),
            "user_profile": json.loads(self.profile_json or "{}"),
            "messages": json.loads(self.messages_json or "[]"),
            "is_demo_data": self.is_demo_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class BehaviorEvent(Base):
    """Tracks user interactions and application behavioral history."""

    __tablename__ = "behavior_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    ticker: Mapped[str | None] = mapped_column(String(10), nullable=True)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "event_type": self.event_type,
            "ticker": self.ticker,
            "details": json.loads(self.details_json or "{}"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PerformanceMetric(Base):
    """Tracks system latency, API cache hits, agent agreement, and failure rates."""

    __tablename__ = "performance_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    analysis_id: Mapped[str] = mapped_column(String(36), index=True)
    ticker: Mapped[str] = mapped_column(String(10))
    total_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)
    agreement_score: Mapped[float] = mapped_column(Float, default=1.0)
    api_failures_count: Mapped[int] = mapped_column(Integer, default=0)
    cache_hit: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "analysis_id": self.analysis_id,
            "ticker": self.ticker,
            "total_latency_ms": self.total_latency_ms,
            "agreement_score": self.agreement_score,
            "api_failures_count": self.api_failures_count,
            "cache_hit": self.cache_hit,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ApiCache(Base):
    """Key-value TTL cache table for external market data and news."""

    __tablename__ = "api_cache"

    cache_key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value_json: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime.datetime] = mapped_column(DateTime, index=True)
