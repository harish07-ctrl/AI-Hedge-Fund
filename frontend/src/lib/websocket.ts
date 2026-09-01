const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface WSMessage {
  type: "status" | "agent_message" | "result" | "error";
  agent?: string;
  content?: string;
  message?: string;
  data?: any;
}

export type WSCallback = (message: WSMessage) => void;

export class AnalysisWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Set<WSCallback> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url: string;

  constructor(url?: string) {
    this.url = url || `${WS_URL}/ws/analysis`;
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(data));
        } catch {
          // ignore non-JSON
        }
      };

      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => this.connect(), 2000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // ignore
    }
  }

  analyze(
    ticker: string,
    profile?: Record<string, unknown>,
    simulations?: { simulate_api_failure?: boolean; simulate_missing_filing?: boolean; simulate_agent_failure?: boolean }
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
      setTimeout(() => this.analyze(ticker, profile, simulations), 500);
      return;
    }

    this.ws.send(
      JSON.stringify({
        ticker,
        profile,
        simulate_api_failure: simulations?.simulate_api_failure || false,
        simulate_missing_filing: simulations?.simulate_missing_filing || false,
        simulate_agent_failure: simulations?.simulate_agent_failure || false,
      })
    );
  }

  onMessage(callback: WSCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.listeners.clear();
    this.ws?.close();
    this.ws = null;
  }
}
