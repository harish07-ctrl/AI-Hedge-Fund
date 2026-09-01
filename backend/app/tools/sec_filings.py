"""SEC EDGAR API tools for fetching company filings (100% free)."""

from __future__ import annotations

from typing import Any

import httpx
from langchain_core.tools import tool

from app.config import get_settings

SEC_BASE = "https://efts.sec.gov/LATEST"
EDGAR_BASE = "https://data.sec.gov"


@tool
async def get_sec_filings(
    ticker: str, filing_type: str = "10-K", count: int = 3
) -> dict[str, Any]:
    """Fetch recent SEC filings for a company.

    Args:
        ticker: Stock ticker symbol (e.g. AAPL)
        filing_type: Filing type - 10-K (annual), 10-Q (quarterly), 8-K (events)
        count: Number of filings to retrieve
    """
    settings = get_settings()
    headers = {"User-Agent": settings.sec_edgar_user_agent}

    try:
        cik = await _get_cik(ticker, headers)
        if not cik:
            return {
                "ticker": ticker,
                "filing_type": filing_type,
                "filings": [],
                "warning": f"⚠ Financial document unavailable: SEC CIK not found for {ticker}",
            }

        filings = await _get_filing_list(cik, filing_type, count, headers)
        if not filings:
            return {
                "ticker": ticker,
                "filing_type": filing_type,
                "filings": [],
                "warning": f"⚠ Financial document unavailable: No recent {filing_type} filings on EDGAR",
            }

        return {
            "ticker": ticker,
            "cik": cik,
            "filing_type": filing_type,
            "filings": filings,
        }
    except Exception as e:
        return {
            "ticker": ticker,
            "filing_type": filing_type,
            "filings": [],
            "warning": f"⚠ Financial document unavailable: {str(e)}",
        }


@tool
async def get_filing_text(filing_url: str) -> dict[str, Any]:
    """Download and extract text from a specific SEC filing URL."""
    settings = get_settings()
    headers = {"User-Agent": settings.sec_edgar_user_agent}

    try:
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(filing_url, headers=headers, timeout=30)
            resp.raise_for_status()

            from bs4 import BeautifulSoup

            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)

            max_chars = 15000
            if len(text) > max_chars:
                text = text[:max_chars] + "\n\n[... truncated for brevity ...]"

            return {"url": filing_url, "text": text, "length": len(text)}
    except Exception as e:
        return {"error": f"⚠ Financial document unavailable: {str(e)}", "text": ""}


async def _get_cik(ticker: str, headers: dict) -> str | None:
    """Look up CIK number from ticker symbol using SEC company tickers JSON."""
    upper = ticker.upper()
    async with httpx.AsyncClient(verify=False) as client:
        try:
            resp = await client.get(
                "https://www.sec.gov/files/company_tickers.json",
                headers=headers,
                timeout=15,
            )
            if resp.status_code == 200:
                for entry in resp.json().values():
                    if entry.get("ticker", "").upper() == upper:
                        return str(entry["cik_str"])
        except Exception:
            pass

        try:
            resp = await client.get(
                f"{SEC_BASE}/search-index?q=%22{upper}%22&dateRange=custom&startdt=2020-01-01&forms=10-K",
                headers=headers,
                timeout=15,
            )
            if resp.status_code == 200:
                hits = resp.json().get("hits", {}).get("hits", [])
                if hits:
                    return hits[0].get("_source", {}).get("entity_id", "")
        except Exception:
            pass

    return None


async def _get_filing_list(
    cik: str, filing_type: str, count: int, headers: dict
) -> list[dict[str, Any]]:
    """Get list of recent filings from EDGAR full-text search."""
    async with httpx.AsyncClient(verify=False) as client:
        padded = str(cik).zfill(10)
        resp = await client.get(
            f"{EDGAR_BASE}/submissions/CIK{padded}.json",
            headers=headers,
            timeout=15,
        )
        if resp.status_code != 200:
            return []

        data = resp.json()
        recent = data.get("filings", {}).get("recent", {})
        forms = recent.get("form", [])
        dates = recent.get("filingDate", [])
        accessions = recent.get("accessionNumber", [])
        primary_docs = recent.get("primaryDocument", [])

        filings = []
        for i, form in enumerate(forms):
            if form == filing_type and len(filings) < count:
                acc_no = accessions[i].replace("-", "")
                doc_url = f"{EDGAR_BASE}/Archives/edgar/data/{cik}/{acc_no}/{primary_docs[i]}"
                filings.append(
                    {
                        "form": form,
                        "filing_date": dates[i],
                        "accession_number": accessions[i],
                        "document_url": doc_url,
                    }
                )
        return filings
