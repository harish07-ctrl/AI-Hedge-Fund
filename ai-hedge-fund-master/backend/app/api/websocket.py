"""WebSocket endpoint for real-time agent activity streaming."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.agents.graph import run_analysis

ws_router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_json(self, websocket: WebSocket, data: dict):
        await websocket.send_json(data)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()


@ws_router.websocket("/ws/analysis")
async def analysis_websocket(websocket: WebSocket):
    """WebSocket endpoint that streams agent activity in real-time.

    Client sends: {"ticker": "AAPL"}
    Server streams: {"type": "agent_message", "agent": "...", "content": "...", "data": {...}}
    Final message: {"type": "result", "data": {...}}
    """
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            ticker = data.get("ticker", "").upper().strip()

            if not ticker:
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": "Missing ticker symbol",
                })
                continue

            await manager.send_json(websocket, {
                "type": "status",
                "message": f"Starting analysis for {ticker}...",
            })

            async def on_message(agent: str, content: str, msg_data: dict[str, Any]):
                await manager.send_json(websocket, {
                    "type": "agent_message",
                    "agent": agent,
                    "content": content,
                    "data": msg_data,
                })

            try:
                result = await run_analysis(ticker=ticker, on_message=on_message)
                await manager.send_json(websocket, {
                    "type": "result",
                    "data": _serialize(result),
                })
            except Exception as e:
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": f"Analysis failed: {str(e)}",
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)


def _serialize(obj: Any) -> Any:
    """Make the result JSON-serializable."""
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(v) for v in obj]
    if hasattr(obj, "__dict__"):
        return _serialize(obj.__dict__)
    return obj
