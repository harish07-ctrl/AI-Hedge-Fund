"""
AI Hedge Fund — Streamlit App
Connects to the FastAPI backend at http://localhost:8000
Run with:  streamlit run streamlit_app.py
"""

import httpx
import streamlit as st
import pandas as pd

# ─── CONFIG ───────────────────────────────────────────────────────────────────
import os

st.set_page_config(
    page_title="AI Hedge Fund",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Allow backend URL to be customized via environment variable, secrets, or sidebar
DEFAULT_BACKEND = os.getenv("BACKEND_URL", "http://localhost:8000")
if "backend_url" not in st.session_state:
    st.session_state["backend_url"] = DEFAULT_BACKEND

# ─── SIDEBAR ──────────────────────────────────────────────────────────────────

st.sidebar.title("AI Hedge Fund")
st.sidebar.caption("Multi-agent investment analysis")

with st.sidebar.expander("⚙️ Backend Connection Settings", expanded=False):
    backend_input = st.text_input(
        "Backend API URL",
        value=st.session_state["backend_url"],
        help="If deploying on Streamlit Cloud, enter your public backend URL (e.g., Render, Railway, ngrok). For local testing, use http://localhost:8000"
    )
    if backend_input != st.session_state["backend_url"]:
        st.session_state["backend_url"] = backend_input.rstrip("/")
        st.rerun()

API_BASE = f"{st.session_state['backend_url'].rstrip('/')}/api"

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def api_get(path: str) -> dict | list | None:
    try:
        r = httpx.get(f"{API_BASE}{path}", timeout=30)
        r.raise_for_status()
        return r.json()
    except (httpx.ConnectError, httpx.ConnectTimeout):
        st.error(
            f"⚠️ **Cannot reach backend at `{st.session_state['backend_url']}`**.\n\n"
            "- **Running locally?** Start the FastAPI server: `python -m uvicorn app.main:app --port 8000`\n"
            "- **On Streamlit Cloud?** Streamlit Cloud runs on a remote server, so `localhost:8000` points to Streamlit's container, not your computer. Deploy your FastAPI backend to [Render](https://render.com) or [Railway](https://railway.app), or expose with [ngrok](https://ngrok.com), and paste the URL in the sidebar setting."
        )
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None


def api_post(path: str, payload: dict) -> dict | None:
    try:
        r = httpx.post(f"{API_BASE}{path}", json=payload, timeout=120)
        r.raise_for_status()
        return r.json()
    except (httpx.ConnectError, httpx.ConnectTimeout):
        st.error(
            f"⚠️ **Cannot reach backend at `{st.session_state['backend_url']}`**.\n\n"
            "- **Running locally?** Ensure backend is running.\n"
            "- **On Streamlit Cloud?** Configure your deployed backend URL in the sidebar."
        )
        return None
    except Exception as e:
        st.error(f"API error: {e}")
        return None


def decision_badge(decision: str) -> str:
    colors = {"BUY": "green", "SELL": "red", "HOLD": "orange"}
    color = colors.get(decision, "gray")
    return f":{color}[**{decision}**]"


page = st.sidebar.radio(
    "Navigate",
    ["Analyze Stock", "Portfolio", "Watchlist", "Performance", "History"],
)

health = api_get("/health")
if health:
    st.sidebar.success(f"Backend: {health.get('status', 'unknown')}")
else:
    st.sidebar.error("Backend offline")

# ─── PAGE: ANALYZE STOCK ──────────────────────────────────────────────────────

if page == "Analyze Stock":
    st.title("Stock Analyzer")
    st.caption("Six AI agents analyze the stock and give a BUY / HOLD / SELL recommendation.")

    col1, col2 = st.columns([2, 1])
    with col1:
        ticker = st.text_input("Stock Ticker", value="AAPL", max_chars=10).upper().strip()
    with col2:
        st.markdown("###")
        analyze_btn = st.button("Run Analysis", type="primary", use_container_width=True)

    st.divider()

    if analyze_btn and ticker:
        with st.spinner(f"Running 6-agent analysis on **{ticker}** ... this takes 30-60 seconds"):
            result = api_post(f"/analyze/{ticker}", {})

        if result:
            decision = result.get("final_decision", {})
            dec_text = decision.get("decision", "HOLD")
            confidence = decision.get("confidence", 0)
            if confidence <= 1.0:
                confidence = int(confidence * 100)

            dcol1, dcol2, dcol3 = st.columns(3)
            dcol1.metric("Decision", dec_text)
            dcol2.metric("Confidence", f"{confidence}%")
            dcol3.metric("Position Size", f"{decision.get('position_size_pct', '-')}%")

            st.markdown(f"> {decision.get('reasoning', '')}")
            st.divider()

            tabs = st.tabs(["Fundamentals", "Sentiment", "Technical", "Macro", "Risk", "Performance"])

            with tabs[0]:
                fund = result.get("fundamentals_report", {})
                st.subheader("Fundamentals Agent")
                st.write(fund.get("summary", "No summary available."))
                if "signal" in fund:
                    st.info(f"Signal: **{fund['signal']}**")

            with tabs[1]:
                sent = result.get("sentiment_report", {})
                st.subheader("Sentiment Agent")
                st.write(sent.get("summary", "No summary available."))
                if "signal" in sent:
                    st.info(f"Signal: **{sent['signal']}**")

            with tabs[2]:
                tech = result.get("technical_report", {})
                st.subheader("Technical Agent")
                st.write(tech.get("summary", "No summary available."))
                indicators = tech.get("indicators", {})
                if indicators:
                    st.json(indicators)

            with tabs[3]:
                macro = result.get("macro_report", {})
                st.subheader("Macro Agent")
                st.write(macro.get("summary", "No summary available."))

            with tabs[4]:
                risk = result.get("risk_report", {})
                st.subheader("Risk Manager")
                st.write(risk.get("summary", "No summary available."))
                if "risk_score" in risk:
                    st.metric("Risk Score", risk["risk_score"])

            with tabs[5]:
                pm = result.get("performance_metrics", {})
                st.subheader("Pipeline Metrics")
                if pm:
                    st.metric("Total Latency", f"{pm.get('total_latency_ms', 0):.0f} ms")
                    st.json(pm)

# ─── PAGE: PORTFOLIO ──────────────────────────────────────────────────────────

elif page == "Portfolio":
    st.title("Portfolio")

    holdings = api_get("/portfolio")
    if holdings is not None:
        if not holdings:
            st.info("No holdings yet. Add some below.")
        else:
            df = pd.DataFrame(holdings)
            display_cols = [c for c in ["ticker", "shares", "avg_entry_price", "current_price", "current_value", "sector"] if c in df.columns]
            st.dataframe(df[display_cols], use_container_width=True)

    st.divider()
    st.subheader("Add / Update Holding")
    c1, c2, c3, c4 = st.columns(4)
    t = c1.text_input("Ticker").upper().strip()
    sh = c2.number_input("Shares", min_value=0.0, step=1.0)
    pr = c3.number_input("Avg Buy Price ($)", min_value=0.0, step=0.01)
    sec = c4.selectbox("Sector", ["Technology", "Healthcare", "Finance", "Energy", "Consumer", "Utilities", "Real Estate", "Other"])

    if st.button("Save Holding", type="primary"):
        if t and sh > 0 and pr > 0:
            res = api_post("/portfolio", {"ticker": t, "shares": sh, "avg_entry_price": pr, "sector": sec})
            if res:
                st.success(f"Saved {t}!")
                st.rerun()
        else:
            st.warning("Please fill in all fields.")

# ─── PAGE: WATCHLIST ──────────────────────────────────────────────────────────

elif page == "Watchlist":
    st.title("Watchlist")

    items = api_get("/watchlist")
    if items is not None:
        if not items:
            st.info("Watchlist is empty. Add tickers below.")
        else:
            for item in items:
                col1, col2, col3 = st.columns([2, 1, 1])
                col1.markdown(f"**{item.get('ticker', '')}**")
                col2.markdown(item.get("ai_signal", "HOLD"))
                col3.markdown(f"Confidence: {item.get('confidence', '-')}%")

    st.divider()
    st.subheader("Add to Watchlist")
    new_ticker = st.text_input("Ticker to watch").upper().strip()
    if st.button("Add", type="primary"):
        if new_ticker:
            res = api_post("/watchlist", {"ticker": new_ticker})
            if res:
                st.success(f"Added {new_ticker} to watchlist!")
                st.rerun()
        else:
            st.warning("Enter a ticker symbol.")

# ─── PAGE: PERFORMANCE ────────────────────────────────────────────────────────

elif page == "Performance":
    st.title("Performance Metrics")

    perf = api_get("/performance")
    if perf:
        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Analyses Tracked", perf.get("total_analyses_tracked", 0))
        c2.metric("Avg Latency", f"{perf.get('avg_latency_ms', 0):.0f} ms")
        c3.metric("Agreement Score", f"{int(perf.get('avg_agreement_score', 0) * 100)}%")
        c4.metric("Top Sector", perf.get("top_sector", "-"))

        st.divider()

        agent_lats = perf.get("agent_latency_averages", {})
        if agent_lats:
            st.subheader("Agent Latency Breakdown")
            lat_df = pd.DataFrame(
                [{"Agent": k.replace("_ms", "").replace("_", " ").title(), "Latency (ms)": v}
                 for k, v in agent_lats.items() if k != "total_pipeline_ms"]
            )
            st.bar_chart(lat_df.set_index("Agent"))

        recent = perf.get("recent_metrics", [])
        if recent:
            st.subheader("Recent Metrics")
            st.dataframe(pd.DataFrame(recent), use_container_width=True)

# ─── PAGE: HISTORY ────────────────────────────────────────────────────────────

elif page == "History":
    st.title("Behavioral History")

    history = api_get("/user/history")
    if history is not None:
        if not history:
            st.info("No history yet.")
        else:
            df = pd.DataFrame(history)
            display_cols = [c for c in ["created_at", "event_type", "ticker", "details_json"] if c in df.columns]
            st.dataframe(df[display_cols], use_container_width=True)

    st.subheader("Recent Analyses")
    analyses = api_get("/analyses")
    if analyses:
        rows = [{"Ticker": a.get("ticker"), "Decision": a.get("decision"), "Confidence": a.get("confidence"), "Created At": a.get("created_at")} for a in analyses]
        st.dataframe(pd.DataFrame(rows), use_container_width=True)
