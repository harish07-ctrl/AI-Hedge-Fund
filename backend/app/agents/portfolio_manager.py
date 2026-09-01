"""Portfolio Manager Agent — Produces personalized BUY/HOLD/SELL decisions with explicit personalization calculations."""

from __future__ import annotations

import datetime
import time
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.agents.state import AgentMessage, HedgeFundState
from app.config import get_llm

PORTFOLIO_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are the Portfolio Manager at an AI financial intelligence platform for retail investors. "
            "You make the final personalized investment recommendation based on analyst reports, risk evaluation, "
            "portfolio sector holdings, and the user's specific risk profile.\n\n"
            "CRITICAL PERSONALIZATION RULES:\n"
            "- First determine the RAW BASE AI SIGNAL (e.g. BUY 85%) from pure analyst market data.\n"
            "- Then apply PERSONALIZATION ADJUSTMENTS based on the user's Risk Tolerance, Investment Horizon, and existing Portfolio Sector Concentration.\n"
            "- If user is Conservative or existing sector concentration is high (> user cap), apply negative conviction deltas and reduce position sizing.\n"
            "- If user is Aggressive and catalysts are strong, allow higher position sizing up to user concentration limit.\n"
            "- Structure why_decision with positive_factors, risk_factors, and user_profile_effect.\n\n"
            "You MUST return a JSON object with exactly these keys:\n"
            "{{\n"
            '  "base_signal": "BUY" | "HOLD" | "SELL",\n'
            '  "base_confidence": 0.0-1.0,\n'
            '  "personalization_adjustments": [\n'
            '    {{"factor": "Risk Tolerance Effect", "delta_pct": -10 | 0 | 10, "description": "Reason for adjustment"}}\n'
            '  ],\n'
            '  "decision": "BUY" | "HOLD" | "SELL",\n'
            '  "confidence": 0.0-1.0,\n'
            '  "target_price": number or null,\n'
            '  "stop_loss": number or null,\n'
            '  "position_size_pct": 0-100,\n'
            '  "time_horizon": "short" | "medium" | "long",\n'
            '  "reasoning": "2-3 sentence executive summary of decision",\n'
            '  "positive_factors": ["Positive catalyst 1", "Positive metric 2"],\n'
            '  "risk_factors": ["Risk factor 1", "Volatility warning 2"],\n'
            '  "user_profile_effect": "Clear explanation of how user profile and portfolio exposure shaped the recommendation"\n'
            "}}\n\n"
            "Always clearly present confidence as AI/model conviction.",
        ),
        (
            "human",
            "Make personalized investment decision for {ticker}.\n\n"
            "USER PROFILE:\n{user_profile}\n\n"
            "EXISTING PORTFOLIO CONTEXT:\n{portfolio_context}\n\n"
            "FUNDAMENTALS REPORT:\n{fundamentals}\n\n"
            "SENTIMENT REPORT:\n{sentiment}\n\n"
            "TECHNICAL REPORT:\n{technical}\n\n"
            "MACRO REPORT:\n{macro}\n\n"
            "RISK ASSESSMENT:\n{risk}\n\n"
            "Return personalized JSON decision with explicit personalization calculations.",
        ),
    ]
)


async def run_portfolio_manager_agent(state: HedgeFundState) -> dict:
    """Execute the portfolio manager agent with explicit personalization calculations and why-this-decision breakdown."""
    start_t = time.time()
    ticker = state.ticker
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    messages = [
        AgentMessage(
            agent="portfolio_manager",
            content=f"Synthesizing all analyst signals with user profile and portfolio constraints for {ticker}...",
        )
    ]

    try:
        user_profile = state.user_profile or {
            "risk_tolerance": "Moderate",
            "investment_horizon": "Medium term",
            "available_capital": 100000.0,
            "max_portfolio_concentration": 20.0,
        }

        f_rep = state.fundamentals_report
        s_rep = state.sentiment_report
        t_rep = state.technical_report
        m_rep = state.macro_report
        r_rep = state.risk_report

        llm = get_llm()
        chain = PORTFOLIO_PROMPT | llm | JsonOutputParser()

        parsed = await chain.ainvoke(
            {
                "ticker": ticker,
                "user_profile": str(user_profile),
                "portfolio_context": str(state.portfolio_context),
                "fundamentals": str(f_rep.get("summary") or f_rep),
                "sentiment": str(s_rep.get("summary") or s_rep),
                "technical": str(t_rep.get("summary") or t_rep),
                "macro": str(m_rep.get("summary") or m_rep),
                "risk": str(r_rep.get("summary") or r_rep),
            }
        )

        dec = str(parsed.get("decision", "HOLD")).upper()
        if dec not in ["BUY", "HOLD", "SELL"]:
            dec = "HOLD"

        conf = float(parsed.get("confidence", 0.78))
        if conf > 1.0:
            conf = conf / 100.0

        base_sig = str(parsed.get("base_signal", dec)).upper()
        base_conf = float(parsed.get("base_confidence", conf))
        if base_conf > 1.0:
            base_conf = base_conf / 100.0

        current_price = t_rep.get("current_price") or 100.0
        target = parsed.get("target_price")
        if not target and current_price:
            multiplier = 1.15 if dec == "BUY" else (0.90 if dec == "SELL" else 1.05)
            target = round(current_price * multiplier, 2)

        stop = parsed.get("stop_loss")
        if not stop and current_price:
            stop = round(current_price * 0.92, 2)

        adjustments = parsed.get("personalization_adjustments", [])
        if not adjustments:
            risk_tol = user_profile.get("risk_tolerance", "Moderate")
            if risk_tol == "Conservative":
                adjustments = [
                    {"factor": "Conservative Risk Tolerance", "delta_pct": -12, "description": "Downshifted conviction to enforce capital preservation."},
                    {"factor": "Portfolio Concentration Cap", "delta_pct": -5, "description": "Capped position sizing to prevent concentration spike."}
                ]
            elif risk_tol == "Aggressive":
                adjustments = [
                    {"factor": "Aggressive Risk Tolerance", "delta_pct": +8, "description": "Expanded position size allocation to capitalize on upside momentum."}
                ]
            else:
                adjustments = [
                    {"factor": "Moderate Balanced Profile", "delta_pct": 0, "description": "Balanced risk/reward distribution aligned with standard benchmarks."}
                ]

        positive_factors = parsed.get("positive_factors", [
            f"Fundamentals: {f_rep.get('summary', 'Steady financials')}",
            f"Technical: {t_rep.get('summary', 'Support levels intact')}",
        ])
        risk_factors = parsed.get("risk_factors", [
            f"Risk Level: {r_rep.get('risk_level', 'MODERATE')}",
            f"Macro Regime: {m_rep.get('regime', 'NEUTRAL_MACRO')}",
        ])

        elapsed_ms = round((time.time() - start_t) * 1000, 2)

        decision_data = {
            "ticker": ticker,
            "decision": dec,
            "confidence": round(conf, 2),
            "base_signal": base_sig,
            "base_confidence": round(base_conf, 2),
            "personalization_adjustments": adjustments,
            "target_price": target,
            "stop_loss": stop,
            "position_size_pct": float(parsed.get("position_size_pct", r_rep.get("position_size_limit_pct", 10.0))),
            "time_horizon": parsed.get("time_horizon", user_profile.get("investment_horizon", "medium")),
            "reasoning": parsed.get("reasoning", "Balanced multi-agent synthesis under user parameters."),
            "user_profile_effect": parsed.get(
                "user_profile_effect",
                f"Recommendation tailored to {user_profile.get('risk_tolerance', 'Moderate')} profile with max {user_profile.get('max_portfolio_concentration', 20)}% concentration cap."
            ),
            "profile_used": user_profile,
            "timestamp": now_iso,
            "latency_ms": elapsed_ms,
        }

        why_decision_data = {
            "final_decision": dec,
            "confidence_pct": int(conf * 100),
            "positive_factors": positive_factors,
            "risk_factors": risk_factors,
            "user_profile_effect": decision_data["user_profile_effect"],
            "conflicting_signals": r_rep.get("conflicting_signals", False),
            "conflict_details": r_rep.get("conflict_details", ""),
        }

        personalization_data = {
            "base_signal": base_sig,
            "base_confidence_pct": int(base_conf * 100),
            "adjustments": adjustments,
            "final_decision": dec,
            "final_confidence_pct": int(conf * 100),
            "risk_tolerance": user_profile.get("risk_tolerance", "Moderate"),
            "max_concentration_limit_pct": user_profile.get("max_portfolio_concentration", 20.0),
        }

        messages.append(
            AgentMessage(
                agent="portfolio_manager",
                content=(
                    f"Final Decision: {decision_data['decision']} | "
                    f"AI Conviction: {int(decision_data['confidence'] * 100)}% | "
                    f"Base AI: {base_sig} ({int(base_conf * 100)}%)"
                ),
                data={"step": "complete", "decision": decision_data},
            )
        )

        return {
            "final_decision": decision_data,
            "why_decision": why_decision_data,
            "personalization_breakdown": personalization_data,
            "agent_latencies": {"portfolio_manager_latency_ms": elapsed_ms},
            "messages": messages,
        }

    except Exception as e:
        elapsed_ms = round((time.time() - start_t) * 1000, 2)
        messages.append(AgentMessage(agent="portfolio_manager", content=f"Decision notice: {str(e)}"))
        fallback_decision = {
            "ticker": ticker,
            "decision": "HOLD",
            "confidence": 0.55,
            "base_signal": "HOLD",
            "base_confidence": 0.60,
            "personalization_adjustments": [{"factor": "Conservative Fail-Safe", "delta_pct": -5, "description": "Safe baseline applied."}],
            "target_price": None,
            "stop_loss": None,
            "position_size_pct": 5.0,
            "time_horizon": "medium",
            "reasoning": f"Decision defaulted to HOLD under fail-safe rules: {str(e)}",
            "user_profile_effect": "Conservative fallback applied.",
            "profile_used": state.user_profile,
            "timestamp": now_iso,
            "latency_ms": elapsed_ms,
        }
        return {
            "final_decision": fallback_decision,
            "why_decision": {
                "final_decision": "HOLD",
                "confidence_pct": 55,
                "positive_factors": ["Core data baseline intact"],
                "risk_factors": ["System fail-safe active"],
                "user_profile_effect": "Conservative baseline applied.",
            },
            "personalization_breakdown": {
                "base_signal": "HOLD",
                "base_confidence_pct": 60,
                "adjustments": [{"factor": "Fail-Safe", "delta_pct": -5, "description": "Safe bounds applied"}],
                "final_decision": "HOLD",
                "final_confidence_pct": 55,
            },
            "agent_latencies": {"portfolio_manager_latency_ms": elapsed_ms},
            "messages": messages,
        }
