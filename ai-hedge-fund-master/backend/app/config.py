from __future__ import annotations

import os
from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM
    llm_provider: Literal["gemini", "openai", "groq"] = "gemini"
    google_api_key: str = ""
    openai_api_key: str = ""
    groq_api_key: str = ""

    # Financial data
    alpha_vantage_api_key: str = ""
    finnhub_api_key: str = ""

    # Search
    tavily_api_key: str = ""

    # SEC EDGAR
    sec_edgar_user_agent: str = "ai-hedge-fund research@example.com"

    # LangSmith
    langsmith_enabled: bool = False
    langsmith_api_key: str = ""
    langchain_project: str = "ai-hedge-fund"

    # Database
    database_url: str = "sqlite+aiosqlite:///./hedge_fund.db"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_llm():
    """Return the configured LangChain LLM based on provider setting."""
    settings = get_settings()

    if settings.llm_provider == "gemini":
        os.environ["GOOGLE_API_KEY"] = settings.google_api_key
        from langchain_google_genai import ChatGoogleGenerativeAI

        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            api_key=settings.google_api_key,
            temperature=0.2,
        )
    elif settings.llm_provider == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.2,
        )
    elif settings.llm_provider == "groq":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model="llama-3.3-70b-versatile",
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
            temperature=0.2,
        )
    else:
        raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")


def setup_langsmith():
    """Configure LangSmith tracing if enabled."""
    settings = get_settings()
    if settings.langsmith_enabled and settings.langsmith_api_key:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
