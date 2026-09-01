"""SQLAlchemy models for storing analysis results and portfolio state."""

from __future__ import annotations

import datetime
import json
from typing import Any

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


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
    messages_json: Mapped[str] = mapped_column(Text, default="[]")

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
            messages_json=json.dumps(result.get("messages", [])),
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
            "fundamentals_report": json.loads(self.fundamentals_json),
            "sentiment_report": json.loads(self.sentiment_json),
            "technical_report": json.loads(self.technical_json),
            "risk_report": json.loads(self.risk_json),
            "messages": json.loads(self.messages_json),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PortfolioHolding(Base):
    """Tracks current portfolio holdings."""

    __tablename__ = "portfolio_holdings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    shares: Mapped[float] = mapped_column(Float, default=0.0)
    avg_entry_price: Mapped[float] = mapped_column(Float, default=0.0)
    current_decision: Mapped[str] = mapped_column(String(10), default="HOLD")
    last_analysis_id: Mapped[str] = mapped_column(String(36), default="")
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "ticker": self.ticker,
            "shares": self.shares,
            "avg_entry_price": self.avg_entry_price,
            "current_decision": self.current_decision,
            "last_analysis_id": self.last_analysis_id,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
