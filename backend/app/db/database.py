"""Database setup with async SQLAlchemy and default seeding."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(settings.database_url, echo=False)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _session_factory


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session."""
    factory = get_session_factory()
    async with factory() as session:
        yield session


async def init_db():
    """Create all tables and seed initial defaults if empty."""
    from app.db.models import UserProfile, PortfolioHolding, Watchlist

    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = get_session_factory()
    async with factory() as session:
        # Seed default profile if missing
        res = await session.execute(select(UserProfile).where(UserProfile.user_id == "default"))
        if not res.scalar_one_or_none():
            profile = UserProfile(
                user_id="default",
                risk_tolerance="Moderate",
                investment_horizon="Medium term",
                investment_goal="Wealth Accumulation & Capital Growth",
                available_capital=100000.0,
                max_portfolio_concentration=20.0,
                preferred_sectors_json='["Technology", "Healthcare", "Financials"]',
                avoided_sectors_json='["Energy"]',
            )
            session.add(profile)

        # Seed sample portfolio holdings if empty
        holdings_res = await session.execute(select(PortfolioHolding))
        if not holdings_res.scalars().all():
            sample_holdings = [
                PortfolioHolding(
                    ticker="AAPL",
                    shares=25.0,
                    avg_entry_price=180.0,
                    current_price=225.5,
                    current_value=5637.5,
                    profit_loss=1137.5,
                    portfolio_weight=15.0,
                    sector="Technology",
                    current_decision="BUY",
                ),
                PortfolioHolding(
                    ticker="NVDA",
                    shares=10.0,
                    avg_entry_price=110.0,
                    current_price=130.0,
                    current_value=1300.0,
                    profit_loss=200.0,
                    portfolio_weight=10.0,
                    sector="Technology",
                    current_decision="BUY",
                ),
                PortfolioHolding(
                    ticker="TCS",
                    shares=50.0,
                    avg_entry_price=4100.0,
                    current_price=4300.0,
                    current_value=215000.0,
                    profit_loss=10000.0,
                    portfolio_weight=20.0,
                    sector="Technology",
                    current_decision="HOLD",
                )
            ]
            session.add_all(sample_holdings)

        # Seed watchlist if empty
        wl_res = await session.execute(select(Watchlist))
        if not wl_res.scalars().all():
            sample_watchlist = [
                Watchlist(ticker="MSFT", notes="Cloud & AI leader"),
                Watchlist(ticker="TSLA", notes="EV & Energy storage catalyst"),
                Watchlist(ticker="RELIANCE", notes="Indian retail & energy giant"),
            ]
            session.add_all(sample_watchlist)

        await session.commit()
