"""FastAPI REST API routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import run_analysis
from app.db.database import get_db
from app.db.models import Analysis, PortfolioHolding
from app.rag.ingestion import ingest_filings_for_ticker

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze/{ticker}")
async def analyze_stock(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Trigger full multi-agent analysis for a stock ticker."""
    ticker = ticker.upper().strip()
    if not ticker or len(ticker) > 10:
        raise HTTPException(status_code=400, detail="Invalid ticker symbol")

    # Ingest SEC filings into RAG (non-blocking, best-effort)
    try:
        await ingest_filings_for_ticker(ticker, filing_type="10-K", count=1)
    except Exception:
        pass  # RAG is optional; analysis continues without it

    result = await run_analysis(ticker=ticker)

    # Persist to database
    analysis = Analysis.from_result(result)
    db.add(analysis)
    await db.commit()

    return result


@router.get("/analyses")
async def list_analyses(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get recent analysis history."""
    stmt = (
        select(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    analyses = result.scalars().all()
    return [a.to_dict() for a in analyses]


@router.get("/analyses/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Get a specific analysis by ID."""
    stmt = select(Analysis).where(Analysis.analysis_id == analysis_id)
    result = await db.execute(stmt)
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis.to_dict()


@router.get("/portfolio")
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get current portfolio holdings."""
    stmt = select(PortfolioHolding).order_by(PortfolioHolding.ticker)
    result = await db.execute(stmt)
    holdings = result.scalars().all()
    return [h.to_dict() for h in holdings]


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "ai-hedge-fund"}
