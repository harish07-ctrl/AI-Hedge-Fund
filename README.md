# 🤖 AI Hedge Fund — PS-01 Financial Intelligence System

> **PS-01 Track Implementation**: Multi-Agent Autonomous Financial Intelligence System for Retail Investors.  
> Transforming raw market feeds, regulatory filings, and user risk profiles into explainable, personalized investment decisions with complete provenance citations.

---

## 🎯 Problem Solved (PS-01 Context)

India added 130M+ retail investors (80% under 30), yet SEBI 2024 reports that **89% of retail F&O traders lose capital**. While institutional hedge funds deploy multi-analyst teams running simultaneous fundamentals, technicals, sentiment, and macro research before committing capital, retail investors rely on isolated price charts and tips.

**Our Solution**: An orchestrated, multi-agent autonomous financial intelligence engine that pulls real-time feeds, queries SEC/regulatory filings via RAG, weights findings against the investor's personalized risk profile, and delivers an auditable **BUY / HOLD / SELL** decision in under 60 seconds.

---

## 🏛️ System Architecture & Workflow

```
                        ┌───────────────────────────────┐
                        │   User Profile / Preferences  │
                        └──────────────┬────────────────┘
                                       │ (Risk, Horizon, Sectors)
                                       ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                PARALLEL REASONING LAYER (LangGraph Fan-Out)                 │
 │                                                                             │
 │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌─────┐  │
 │  │Fundamentals Agent│  │ Sentiment Agent  │  │ Technical Agent  │  │Macro│  │
 │  │(SEC EDGAR + RAG) │  │ (Tavily Search)  │  │(RSI,MACD,Bolling)│  │Agent│  │
 │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  └──┬──┘  │
 └───────────┼─────────────────────┼─────────────────────┼───────────────┼─────┘
             └─────────────────────┼─────────────────────┘               │
                                   ▼                                     │
                    ┌─────────────────────────────┐                      │
                    │   Risk Manager Synthesis    │◄─────────────────────┘
                    │   (Risk/Reward & Exposure)  │
                    └──────────────┬──────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │   Portfolio Manager Engine  │
                    │ (BUY/HOLD/SELL + Position %)│
                    └──────────────┬──────────────┘
                                   ▼
         ┌──────────────────────────────────────────────────┐
         │  Live Explainable UI + Provenance & Evidence     │
         │  • Next.js 15 Web App: http://localhost:3000     │
         │  • Streamlit Cloud App: http://localhost:8502    │
         │  • FastAPI Backend:    http://localhost:8000     │
         └──────────────────────────────────────────────────┘
```

---

## 📋 PS-01 Compliance Matrix

| Requirement | Implementation Detail | Source File |
|---|---|---|
| **1. Multi-Dimensional Signal Classification** | Classifies market data across 4 dimensions: Price Momentum (RSI/MACD), Volume/Volatility (Bollinger Bands), Sentiment (+/- score), and Fundamentals. | [`technical.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/agents/technical.py), [`sentiment.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/agents/sentiment.py) |
| **2. RAG Grounding & Source Attribution** | Queries SEC 10-K/10-Q corporate disclosures chunked and embedded in ChromaDB vector store; every signal cites exact document citations. | [`retriever.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/rag/retriever.py), [`fundamentals.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/agents/fundamentals.py) |
| **3. Multi-Agent Parallel Execution** | 4 analyst agents run concurrently via LangGraph fan-out, synthesized sequentially by Risk Manager and Portfolio Manager. | [`graph.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/agents/graph.py) |
| **4. Personalized Behavioral Profiling** | Modifies recommendation, position size %, and stop-loss based on risk tolerance (Conservative vs Aggressive) with live **What-If comparison**. | [`portfolio_manager.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/agents/portfolio_manager.py), [`routes.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/api/routes.py) |
| **5. Live Explainable Interface** | Real-time WebSocket trace stream, interactive workflow graph, signal breakdown cards, why-this-decision explanation, and portfolio tracker. | [`page.tsx`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/frontend/src/app/page.tsx), [`AgentWorkflowGraph.tsx`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/frontend/src/components/AgentWorkflowGraph.tsx) |
| **6. 4 Measurable Performance Metrics** | Captures: (1) Total Pipeline Latency, (2) Inter-Agent Agreement Score, (3) Portfolio Risk Concentration %, and (4) Signal Confidence. | [`SessionPerformanceView.tsx`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/frontend/src/components/SessionPerformanceView.tsx), [`models.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/db/models.py) |
| **7. Fault-Tolerant Degraded Data Handling** | Interactive simulation toggles for: (a) Live API outages, (b) Missing regulatory filings, and (c) Agent feed failures with zero uncited crash outputs. | [`DegradedDataControl.tsx`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/frontend/src/components/DegradedDataControl.tsx), [`cache_manager.py`](file:///c:/Users/mades/OneDrive/Documents/Desktop/ai-hedge-fund-master/backend/app/tools/cache_manager.py) |

---

## 🔑 Configured APIs & Environment

Fill in your free API keys in `backend/.env`:

| API / Provider | Configuration Variable | Purpose |
|---|---|---|
| **Google Gemini (LLM)** | `GOOGLE_API_KEY` | Primary reasoning model for all 6 agents |
| **Alpha Vantage** | `ALPHA_VANTAGE_API_KEY` | Real-time stock prices & historical candles |
| **Finnhub** | `FINNHUB_API_KEY` | Company profile & quote fallback |
| **Tavily Search** | `TAVILY_API_KEY` | Live financial news & sentiment retrieval |
| **SEC EDGAR** | `SEC_EDGAR_USER_AGENT` | Official 10-K / 10-Q corporate disclosures |

---

## 🚀 Quick Start Guide

### 1. Start the FastAPI Backend

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be active at: **[http://localhost:8000](http://localhost:8000)** (Interactive Docs: `http://localhost:8000/docs`)

### 2. Start the Next.js Frontend

```bash
cd frontend
npm run dev
```

Next.js UI will be active at: **[http://localhost:3000](http://localhost:3000)**

### 3. Start the Streamlit App (Alternative)

```bash
# From project root
streamlit run streamlit_app.py
```

Streamlit UI will be active at: **[http://localhost:8502](http://localhost:8502)**

---

## 🧪 Demo Scenarios for Judges

1. **Standard End-to-End Analysis**: Enter `AAPL` or `TSLA` → Watch 4 parallel agent traces animate → Inspect the final cited BUY/HOLD/SELL call.
2. **What-If Personalization**: Click **"What-If Comparison"** to see identical market data evaluated under Conservative vs Aggressive user profiles.
3. **Degraded-Data Resilience**: Open the **"Degraded Data Simulation"** panel, enable *Simulate Missing Filings* or *API Failure*, and verify graceful fallback execution.
4. **Judge Demo Walkthrough**: Click **"Judge Demo / PS-01 Guide"** in the top navigation bar for an instant interactive compliance audit.

---

## 📂 Repository Structure

```
ai-hedge-fund/
├── backend/
│   ├── app/
│   │   ├── agents/           # 6 specialized LangGraph agents + state schemas
│   │   │   ├── fundamentals.py   # SEC 10-K RAG analyst
│   │   │   ├── sentiment.py      # Tavily news sentiment analyst
│   │   │   ├── technical.py      # RSI, MACD, Bollinger analyst
│   │   │   ├── macro.py          # Economic & interest rate analyst
│   │   │   ├── risk_manager.py   # Risk scoring & exposure synthesis
│   │   │   └── portfolio_manager.py # Decision & position sizing
│   │   ├── rag/              # ChromaDB vector store + retrieval
│   │   ├── tools/            # Data fetching & caching fallbacks
│   │   ├── api/              # FastAPI REST endpoints + WebSocket stream
│   │   └── db/               # SQLite persistent models & behavioral audit
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js 15 App Router pages
│   │   └── components/       # PS-01 UI cards, charts, graph visualizer
│   └── package.json
├── streamlit_app.py          # Standalone Streamlit application
├── requirements.txt          # Root requirements for Streamlit Cloud
└── README.md
```

---

## 📄 License

MIT License — free to use and distribute.

