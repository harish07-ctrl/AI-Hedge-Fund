"""Risk Manager Agent — Evaluates risk, signal conflicts, concentration, and user risk tolerance."""

from __future__ import annotations

import datetime
import time
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm

RISK_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are the Chief Risk Officer at a retail financial intelligence platform. "
            "Evaluate risk based on analyst reports, user profile risk tolerance, portfolio sector weights, and stock concentration.\n\n"
            "You MUST return a valid JSON object matching EXACTLY this format:\n"
            "{{\n"
            '  "agent": "Risk Manager",\n'
            '  "risk_level": "LOW" | "MODERATE" | "HIGH" | "VERY HIGH",\n'
            '  "confidence": 0-100,\n'
            '  "summary": "1-2 sentence executive summary of risk assessment",\n'
            '  "conflicting_signals": true | false,\n'
            '  "conflict_reason": "Specific explanation of which analyst signals disagreed",\n'
            '  "position_size_limit_pct": 0-100,\n'
            '  "stop_loss_pct": 0-50,\n'
            '  "factors": ["Risk factor 1", "Conflict factor 2", "User profile effect factor 3"],\n'
            '  "sector_risk_warning": "Warning if portfolio sector concentration is high or empty",\n'
            '  "sources": [{{"title": "Risk Policy Rules", "url": "Internal Risk Engine"}}],\n'
            '  "warnings": ["Critical risk alert or concentration warning"]\n'
            "}}\n\n"
            "CRITICAL RULES:\n"
            "- If analyst signals conflict (e.g. Fundamentals BUY vs Sentiment NEGATIVE/SELL), set conflicting_signals: true, increase risk_level, and lower position_size_limit_pct.\n"
            "- Check portfolio sector concentration against user limits.",
        ),
        (
            "human",
            "Evaluate investment risk for {ticker}.\n\n"
            "USER PROFILE:\n{user_profile}\n\n"
            "EXISTING PORTFOLIO CONTEXT:\n{portfolio_context}\n\n"
            "PORTFOLIO SECTOR BREAKDOWN:\n{sector_breakdown}\n\n"
            "FUNDAMENTALS REPORT:\n{fundamentals}\n\n"
            "SENTIMENT REPORT:\n{sentiment}\n\n"
            "TECHNICAL REPORT:\n{technical}\n\n"
            "MACRO REPORT:\n{macro}\n\n"
            "Return JSON risk evaluation.",
        ),
    ]
)


async def run_risk_manager_agent(state: HedgeFundState) -> dict:
    """Execute the risk manager agent with conflict detection and portfolio-aware sector concentration calculation."""
    start_t = time.time()
    ticker = state.ticker
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    messages = [
        AgentMessage(
            agent="risk_manager",
            content=f"Starting risk and portfolio concentration evaluation for {ticker}...",
        )
    ]

    try:
        f_rep = state.fundamentals_report
        s_rep = state.sentiment_report
        t_rep = state.technical_report
        m_rep = state.macro_report

        user_profile = state.user_profile or {
            "risk_tolerance": "Moderate",
            "max_portfolio_concentration": 20.0,
            "available_capital": 100000.0,
        }

        # Compute current portfolio sector concentration
        holdings = state.portfolio_context or []
        total_val = sum(h.get("current_value", (h.get("shares", 0) * h.get("avg_entry_price", 0))) for h in holdings) or 1.0

        sector_totals: dict[str, float] = {}
        stock_weight = 0.0

        for h in holdings:
            sec = h.get("sector", "Other")
            val = h.get("current_value", (h.get("shares", 0) * h.get("avg_entry_price", 0)))
            sector_totals[sec] = sector_totals.get(sec, 0.0) + val
            if h.get("ticker", "").upper() == ticker.upper():
                stock_weight = round((val / total_val) * 100, 2)

        sector_pcts = {k: round((v / total_val) * 100, 1) for k, v in sector_totals.items()}
        max_sector = max(sector_pcts.items(), key=lambda x: x[1]) if sector_pcts else ("None", 0.0)
        max_conc_limit = float(user_profile.get("max_portfolio_concentration", 20.0))

        # Explicitly detect conflicting signals
        f_sig = f_rep.get("signal", "HOLD")
        s_sig = s_rep.get("signal", "NEUTRAL")
        t_sig = t_rep.get("signal", "HOLD")
        m_sig = m_rep.get("signal", "HOLD")

        signals_set = {f_sig, t_sig, m_sig}
        if s_sig == "NEGATIVE":
            signals_set.add("SELL")
        elif s_sig == "POSITIVE":
            signals_set.add("BUY")

        conflicting = False
        conflict_details = ""
        if "BUY" in signals_set and "SELL" in signals_set:
            conflicting = True
            conflict_details = f"Direct conflict: Buy signals (from {[k for k, v in [('Fundamentals', f_sig), ('Technical', t_sig), ('Sentiment', s_sig)] if v in ['BUY', 'POSITIVE']]}) vs Sell/Bearish signals (from {[k for k, v in [('Fundamentals', f_sig), ('Technical', t_sig), ('Sentiment', s_sig)] if v in ['SELL', 'NEGATIVE']]})."
        elif len(signals_set) >= 3:
            conflicting = True
            conflict_details = f"Divergent analyst consensus across fundamentals ({f_sig}), sentiment ({s_sig}), technicals ({t_sig}), and macro ({m_sig})."

        if conflicting:
            messages.append(
                AgentMessage(
                    agent="risk_manager",
                    content=f"⚠ SIGNAL CONFLICT DETECTED: {conflict_details}",
                    data={"step": "conflict_detected", "conflict": conflict_details},
                )
            )

        llm = get_llm()
        chain = RISK_PROMPT | llm | JsonOutputParser()

        parsed = await chain.ainvoke(
            {
                "ticker": ticker,
                "user_profile": str(user_profile),
                "portfolio_context": str(holdings),
                "sector_breakdown": str(sector_pcts),
                "fundamentals": str(f_rep.get("summary") or f_rep),
                "sentiment": str(s_rep.get("summary") or s_rep),
                "technical": str(t_rep.get("summary") or t_rep),
                "macro": str(m_rep.get("summary") or m_rep),
            }
        )

        risk_lvl = str(parsed.get("risk_level", "MODERATE")).upper()
        if conflicting and risk_lvl == "LOW":
            risk_lvl = "MODERATE"

        factors = parsed.get("factors", [])
        if conflicting:
            factors.insert(0, f"Signal Conflict: {conflict_details}")
        factors.append(f"User Risk Tolerance: {user_profile.get('risk_tolerance', 'Moderate')}")
        factors.append(f"Max Portfolio Concentration Cap: {max_conc_limit}% (Current Top Sector: {max_sector[0]} {max_sector[1]}%)")

        elapsed_ms = round((time.time() - start_t) * 1000, 2)

        report = {
            "agent": "Risk Manager",
            "risk_level": risk_lvl,
            "confidence": int(parsed.get("confidence", 78)),
            "summary": parsed.get("summary", "Risk profile evaluated with portfolio concentration rules applied."),
            "conflicting_signals": conflicting or parsed.get("conflicting_signals", False),
            "conflict_details": conflict_details or parsed.get("conflict_reason", ""),
            "position_size_limit_pct": min(
                float(parsed.get("position_size_limit_pct", 15.0)),
                max_conc_limit,
            ),
            "stop_loss_pct": float(parsed.get("stop_loss_pct", 7.5)),
            "factors": factors,
            "portfolio_sector_weights": sector_pcts,
            "top_sector_exposure": {"sector": max_sector[0], "weight_pct": max_sector[1]},
            "existing_stock_weight_pct": stock_weight,
            "sources": [{"title": "Risk Policy Rules & Portfolio Matrix", "url": "Internal Risk Engine"}],
            "warnings": parsed.get("warnings", []),
            "timestamp": now_iso,
            "latency_ms": elapsed_ms,
        }

        messages.append(
            AgentMessage(
                agent="risk_manager",
                content=f"Risk Manager complete in {elapsed_ms}ms: Risk={report['risk_level']} | Conflicting={report['conflicting_signals']} | Pos Limit={report['position_size_limit_pct']}%",
                data={"step": "complete", "report": report},
            )
        )

        return {
            "risk_report": report,
            "agent_latencies": {"risk_manager_latency_ms": elapsed_ms},
            "messages": messages,
        }

    except Exception as e:
        elapsed_ms = round((time.time() - start_t) * 1000, 2)
        messages.append(AgentMessage(agent="risk_manager", content=f"Risk evaluation notice: {str(e)}"))
        fallback_report = {
            "agent": "Risk Manager",
            "risk_level": "MODERATE",
            "confidence": 60,
            "summary": "Risk evaluation operating with conservative default guidelines.",
            "conflicting_signals": False,
            "conflict_details": "",
            "position_size_limit_pct": 10.0,
            "stop_loss_pct": 5.0,
            "factors": ["Standard baseline risk rules"],
            "sources": [],
            "warnings": [f"Risk notice: {str(e)}"],
            "timestamp": now_iso,
            "latency_ms": elapsed_ms,
        }
        return {
            "risk_report": fallback_report,
            "agent_latencies": {"risk_manager_latency_ms": elapsed_ms},
            "messages": messages,
        }
