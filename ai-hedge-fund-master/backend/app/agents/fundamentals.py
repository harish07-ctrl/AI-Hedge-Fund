"""Fundamentals Agent — Analyzes SEC filings and company financials."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm
from app.rag.grader import grade_answer
from app.rag.retriever import retrieve_filing_context
from app.tools.sec_filings import get_sec_filings
from app.tools.stock_data import get_company_overview

FUNDAMENTALS_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a senior fundamentals analyst at a top hedge fund. "
            "Analyze the company or fund using ALL of the provided data.\n\n"
            "You must provide:\n"
            "1. Revenue and earnings analysis (or performance/returns analysis for ETFs/funds)\n"
            "2. Balance sheet health (or asset size and expense analysis for ETFs/funds)\n"
            "3. Competitive positioning\n"
            "4. Key risks\n"
            "5. A fundamentals score from 1-10\n"
            "6. A brief recommendation (bullish/neutral/bearish)\n\n"
            "IMPORTANT: Use ALL the data fields provided in the overview — cite specific "
            "numbers (market cap, PE ratio, beta, 52-week range, expense ratio, returns, "
            "volume, etc.). Do NOT say 'limited data available' if the overview has data. "
            "Be specific and quantitative.",
        ),
        (
            "human",
            "Analyze {ticker}.\n\n"
            "COMPANY/FUND OVERVIEW:\n{overview}\n\n"
            "SEC FILING EXCERPTS:\n{filing_context}\n\n"
            "Provide your fundamentals analysis using all available data points above.",
        ),
    ]
)


async def run_fundamentals_agent(state: HedgeFundState) -> dict:
    """Execute the fundamentals analysis agent."""
    ticker = state.ticker
    messages = []

    messages.append(
        AgentMessage(
            agent="fundamentals",
            content=f"Starting fundamentals analysis for {ticker}...",
        )
    )

    try:
        overview = await get_company_overview.ainvoke({"ticker": ticker})
        messages.append(
            AgentMessage(
                agent="fundamentals",
                content=f"Retrieved company overview for {ticker}",
                data={"step": "overview"},
            )
        )

        # Try multiple filing types: 10-K for stocks, N-CSR for ETFs/funds
        filing_context = []
        filing_types = ["10-K", "10-Q", "N-CSR"]
        found_filings = False
        for ftype in filing_types:
            filings_result = await get_sec_filings.ainvoke(
                {"ticker": ticker, "filing_type": ftype, "count": 2}
            )
            if filings_result.get("filings"):
                query = f"{ticker} revenue earnings profit loss risk factors"
                filing_context = await retrieve_filing_context(
                    query=query, ticker=ticker, k=5
                )
                messages.append(
                    AgentMessage(
                        agent="fundamentals",
                        content=f"Retrieved {len(filing_context)} excerpts from {ftype} filings",
                        data={"step": "rag_retrieval"},
                    )
                )
                found_filings = True
                break

        if not found_filings:
            messages.append(
                AgentMessage(
                    agent="fundamentals",
                    content="No SEC filings found — using overview data only",
                    data={"step": "no_filings"},
                )
            )

        filing_text = "\n\n".join(
            f"[Excerpt {i+1}]: {doc['content']}"
            for i, doc in enumerate(filing_context)
        ) or "No SEC filing data available."

        overview_text = "\n".join(
            f"  {k}: {v}" for k, v in overview.items() if v and k != "error"
        ) or "No overview data available."

        llm = get_llm()
        chain = FUNDAMENTALS_PROMPT | llm

        response = await chain.ainvoke(
            {
                "ticker": ticker,
                "overview": overview_text,
                "filing_context": filing_text,
            }
        )

        analysis = response.content

        # Grade the analysis for hallucination if we have sources
        grading = {"grounded": True, "confidence": 1.0}
        if filing_context:
            grading = await grade_answer(analysis, filing_context)

        messages.append(
            AgentMessage(
                agent="fundamentals",
                content=f"Fundamentals analysis complete (grounding confidence: {grading['confidence']:.0%})",
                data={"step": "complete"},
            )
        )

        return {
            "fundamentals_report": {
                "analysis": analysis,
                "overview": overview,
                "grounding": grading,
                "sources_used": len(filing_context),
            },
            "messages": messages,
        }
    except Exception as e:
        messages.append(
            AgentMessage(agent="fundamentals", content=f"Error: {str(e)}")
        )
        return {
            "fundamentals_report": {"error": str(e)},
            "messages": messages,
            "errors": [f"Fundamentals agent error: {str(e)}"],
        }
