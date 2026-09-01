"""ChromaDB vector store and retriever for SEC filings RAG."""

from __future__ import annotations

from functools import lru_cache

from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from langchain_community.vectorstores import Chroma

from app.config import get_settings

COLLECTION_NAME = "sec_filings"
PERSIST_DIR = "./chroma_data"

_default_ef = DefaultEmbeddingFunction()


class ChromaDefaultEmbeddings:
    """Wrapper around ChromaDB's free default embedding (runs locally, no API key)."""

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return _default_ef(texts)

    def embed_query(self, text: str) -> list[float]:
        return _default_ef([text])[0]


@lru_cache
def get_embeddings():
    settings = get_settings()
    if settings.llm_provider == "openai" and settings.openai_api_key:
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(api_key=settings.openai_api_key)

    return ChromaDefaultEmbeddings()


def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=PERSIST_DIR,
    )


def get_retriever(ticker: str | None = None, k: int = 5):
    """Get a retriever, optionally filtered by ticker.

    Args:
        ticker: Filter results to a specific stock ticker
        k: Number of documents to retrieve
    """
    vectorstore = get_vectorstore()

    search_kwargs: dict = {"k": k}
    if ticker:
        search_kwargs["filter"] = {"ticker": ticker}

    return vectorstore.as_retriever(search_kwargs=search_kwargs)


async def retrieve_filing_context(query: str, ticker: str, k: int = 5) -> list[dict]:
    """Retrieve relevant filing chunks for a query."""
    retriever = get_retriever(ticker=ticker, k=k)
    docs = await retriever.ainvoke(query)

    return [
        {
            "content": doc.page_content,
            "metadata": doc.metadata,
            "relevance_rank": i + 1,
        }
        for i, doc in enumerate(docs)
    ]
