# 🤖 AI Hedge Fund

An AI-powered stock analysis tool that uses multiple AI agents to analyze stocks and give you a **BUY / HOLD / SELL** recommendation — automatically.

---

## What It Does

You type a stock ticker (like `AAPL` or `TSLA`), and the system:

1. Reads the company's financial filings (10-K, 10-Q from SEC)
2. Checks the latest news and market sentiment
3. Analyzes technical indicators (RSI, MACD, Bollinger Bands)
4. Evaluates overall risk
5. Gives you a final investment recommendation with reasoning

You watch this happen **live** in the browser as each agent completes its job.

---

## How It Works

Five AI agents run in a pipeline:

```
[Fundamentals Agent] ──┐
[Sentiment Agent]    ──┼──► [Risk Manager] ──► [Portfolio Manager] ──► Decision
[Technical Agent]    ──┘
[Macro Agent]        ──┘
```

| Agent | What It Does |
|---|---|
| **Fundamentals** | Reads SEC filings, checks revenue, profit, debt |
| **Sentiment** | Searches recent news, measures market mood |
| **Technical** | Calculates RSI, MACD, moving averages |
| **Macro** | Looks at broader economic conditions |
| **Risk Manager** | Combines all reports, scores the risk |
| **Portfolio Manager** | Makes the final BUY / HOLD / SELL call |

The first four agents run **at the same time** (in parallel), then Risk Manager and Portfolio Manager run in sequence.

---

## Requirements

### Software

| Tool | Version |
|---|---|
| Python | 3.11 or newer |
| Node.js | 18 or newer |
| npm | comes with Node.js |

### API Keys (all free)

| Service | What It's For | Get It |
|---|---|---|
| Google AI Studio | AI (Gemini LLM) | [aistudio.google.com](https://aistudio.google.com/apikey) |
| Alpha Vantage | Stock financial data | [alphavantage.co](https://www.alphavantage.co/support/#api-key) |
| Tavily | News search | [tavily.com](https://tavily.com/) |
| Finnhub | Stock quotes (backup) | [finnhub.io](https://finnhub.io/) |

---

## How to Run

### Step 1 — Set up the Backend

```bash
cd backend

# Install Python packages
pip install -r requirements.txt

# Copy the env file
copy .env.example .env        # Windows
# cp .env.example .env        # Mac / Linux
```

Open `backend/.env` and fill in your API keys:

```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_key_here
ALPHA_VANTAGE_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
```

Start the backend server:

```bash
python -m uvicorn app.main:app --reload --port 8000
```

### Step 2 — Set up the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install packages
npm install

# Copy the env file
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # Mac / Linux
```

Start the frontend:

```bash
npm run dev
```

### Step 3 — Open in Browser

Go to **[http://localhost:3000](http://localhost:3000)**

Type a stock ticker and click **Analyze**. Watch the agents work in real time.

---

## Run with Docker (Easier Alternative)

If you have Docker installed:

```bash
# Copy and fill in the env file first
copy backend\.env.example backend\.env

# Start everything
docker-compose up --build
```

Both backend and frontend start automatically.

---

## Project Structure

```
ai-hedge-fund/
├── backend/
│   └── app/
│       ├── agents/       ← AI agent logic (fundamentals, technical, etc.)
│       ├── tools/        ← Data-fetching tools used by agents
│       ├── rag/          ← SEC filing reader (ChromaDB)
│       ├── api/          ← FastAPI routes + WebSocket
│       └── main.py       ← Backend entry point
├── frontend/
│   └── src/
│       ├── app/          ← Next.js pages
│       └── components/   ← UI components (charts, agent panels, etc.)
├── docker-compose.yml
└── README.md
```

---

## Switch AI Provider

You can swap the AI model in `backend/.env`:

```env
# Google Gemini (default, free)
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_key

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Groq (free and fast)
LLM_PROVIDER=groq
GROQ_API_KEY=your_key
```

---

## API Quick Reference

| Method | URL | Description |
|---|---|---|
| POST | `/api/analyze/{ticker}` | Analyze a stock |
| GET | `/api/analyses` | List past analyses |
| GET | `/api/portfolio` | View portfolio |
| GET | `/api/health` | Check if backend is up |
| WS | `/ws/analysis` | Live agent progress stream |

Full interactive docs at **[http://localhost:8000/docs](http://localhost:8000/docs)**

---

## License

MIT — free to use and modify.
