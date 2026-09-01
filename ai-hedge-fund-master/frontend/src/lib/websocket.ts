const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface WSMessage {
  type: "status" | "agent_message" | "result" | "error";
  agent?: string;
  content?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export type MessageHandler = (msg: WSMessage) => void;

export class AnalysisWebSocket {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentionalClose = false;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.isIntentionalClose = false;

    try {
      this.ws = new WebSocket(`${WS_URL}/ws/analysis`);
    } catch {
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.handlers.forEach((h) => h(msg));
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onerror = () => {
      // Only notify once, not on every reconnect
      if (this.reconnectAttempts === 0) {
        this.handlers.forEach((h) =>
          h({ type: "error", message: "WebSocket connection error" })
        );
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(3000 * this.reconnectAttempts, 15000);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }
    };
  }

  analyze(ticker: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.reconnectAttempts = 0;
      this.connect();
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ ticker }));
        }
      }, 1000);
      return;
    }
    this.ws.send(JSON.stringify({ ticker }));
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.handlers = [];
    this.reconnectAttempts = 0;
  }
}
