# AI Hedge Fund

A multi-agent investment analysis system where specialized AI agents collaborate to analyze stocks and make investment decisions. Built with **LangGraph**, **LangChain**, **Google Gemini**, **FastAPI**, and **Next.js**.

## How It Works

Five AI agents work together in a LangGraph workflow:

1. **Fundamentals Agent** — Analyzes SEC filings (10-K, 10-Q) and company financials using RAG
2. **Sentiment Agent** — Evaluates news sentiment and market mood using Tavily search
3. **Technical Agent** — Computes and interprets technical indicators (RSI, MACD, Bollinger Bands)
4. **Risk Manager** — Aggregates all reports and evaluates risk/reward
5. **Portfolio Manager** — Makes the final BUY / HOLD / SELL decision

The three analyst agents run **in parallel**, feed into the Risk Manager, who then passes to the Portfolio Manager for the final call.

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini (free) — swappable to OpenAI, Groq |
| Agent Framework | LangGraph + LangChain |
| RAG | ChromaDB + SEC EDGAR filings |
| Backend | FastAPI + WebSocket |
| Frontend | Next.js + Tailwind CSS + Recharts |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Tracing | LangSmith (optional) |
| Deployment | Vercel (frontend) + Render (backend) |

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys (all free tiers):
  - [Google AI Studio](https://aistudio.google.com/apikey) — Gemini API key
  - [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — Financial data
  - [Tavily](https://tavily.com/) — News search
  - [Finnhub](https://finnhub.io/) — Stock quotes (optional fallback)

### 1. Clone & Setup Backend

```bash
cd ai-hedge-fund/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env     # Windows
# cp .env.example .env     # Mac/Linux
```

Edit `backend/.env` with your API keys:

```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
cd ai-hedge-fund/frontend

npm install

# Configure environment
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # Mac/Linux
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run with Docker (Alternative)

```bash
cd ai-hedge-fund

# Copy and edit backend env file first
copy backend\.env.example backend\.env

docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/{ticker}` | Run full multi-agent analysis |
| GET | `/api/analyses` | List recent analyses |
| GET | `/api/analyses/{id}` | Get specific analysis |
| GET | `/api/portfolio` | Get portfolio holdings |
| GET | `/api/health` | Health check |
| WS | `/ws/analysis` | Real-time agent activity stream |

## Deployment

### Backend → Render

1. Push to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your repo, set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables from `.env`

### Frontend → Vercel

1. Import your repo on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL
   - `NEXT_PUBLIC_WS_URL` = your Render WebSocket URL (use `wss://`)

## Switching LLM Providers

Change `LLM_PROVIDER` in your `.env`:

```env
# Google Gemini (default, free)
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_key

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Groq (free, fast)
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
```

## Optional: LangSmith Tracing

Enable full agent tracing:

```env
LANGSMITH_ENABLED=true
LANGSMITH_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=ai-hedge-fund
```

View traces at [smith.langchain.com](https://smith.langchain.com).

## Project Structure

```
ai-hedge-fund/
├── backend/
│   ├── app/
│   │   ├── agents/           # LangGraph agent definitions
│   │   │   ├── state.py      # Shared state schema
│   │   │   ├── graph.py      # LangGraph workflow
│   │   │   ├── fundamentals.py
│   │   │   ├── sentiment.py
│   │   │   ├── technical.py
│   │   │   ├── risk_manager.py
│   │   │   └── portfolio_manager.py
│   │   ├── tools/            # Agent tool functions
│   │   ├── rag/              # RAG pipeline for SEC filings
│   │   ├── api/              # FastAPI routes + WebSocket
│   │   ├── db/               # Database models
│   │   ├── config.py         # Configuration
│   │   └── main.py           # App entry point
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/       # React components
│   │   └── lib/              # API client + WebSocket
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## License

MIT
