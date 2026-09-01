"""Document ingestion pipeline for SEC filings into ChromaDB."""

from __future__ import annotations

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.rag.retriever import get_vectorstore
from app.tools.sec_filings import get_filing_text


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1500,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
)


async def ingest_filing(ticker: str, filing_url: str, filing_date: str) -> int:
    """Download a SEC filing, chunk it, and store in ChromaDB.

    Returns the number of chunks stored.
    """
    result = await get_filing_text.ainvoke({"filing_url": filing_url})

    if "error" in result:
        raise ValueError(result["error"])

    text = result["text"]

    doc = Document(
        page_content=text,
        metadata={
            "ticker": ticker,
            "source": filing_url,
            "filing_date": filing_date,
            "doc_type": "sec_filing",
        },
    )

    chunks = text_splitter.split_documents([doc])

    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = i
        chunk.metadata["total_chunks"] = len(chunks)

    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)

    return len(chunks)


async def ingest_filings_for_ticker(
    ticker: str, filing_type: str = "10-K", count: int = 2
) -> dict:
    """Ingest multiple filings for a ticker."""
    from app.tools.sec_filings import get_sec_filings

    result = await get_sec_filings.ainvoke(
        {"ticker": ticker, "filing_type": filing_type, "count": count}
    )

    if "error" in result:
        return {"error": result["error"], "ingested": 0}

    total_chunks = 0
    ingested_filings = []

    for filing in result.get("filings", []):
        try:
            n = await ingest_filing(
                ticker=ticker,
                filing_url=filing["document_url"],
                filing_date=filing["filing_date"],
            )
            total_chunks += n
            ingested_filings.append(filing["filing_date"])
        except Exception as e:
            ingested_filings.append(f"FAILED: {filing['filing_date']} - {str(e)}")

    return {
        "ticker": ticker,
        "filing_type": filing_type,
        "ingested_filings": ingested_filings,
        "total_chunks": total_chunks,
    }
