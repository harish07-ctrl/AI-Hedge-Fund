"""FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.api.websocket import ws_router
from app.config import get_settings, setup_langsmith
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_langsmith()
    await init_db()
    yield


app = FastAPI(
    title="AI Hedge Fund",
    description="Multi-agent investment analysis system powered by LangGraph",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(ws_router)
