"""WebSocket endpoint for real-time agent activity streaming with simulation support."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.agents.graph import run_analysis
from app.db.database import get_session_factory
from app.db.models import UserProfile, Analysis, BehaviorEvent, PerformanceMetric

ws_router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
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
    """WebSocket endpoint that streams 6-agent activity in real-time.

    Client sends: {"ticker": "AAPL", "profile": {...}, "simulate_api_failure": false, ...}
    Server streams: {"type": "agent_message", "agent": "...", "content": "...", "data": {...}}
    Final message: {"type": "result", "data": {...}}
    """
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            ticker = data.get("ticker", "").upper().strip()
            profile_override = data.get("profile")
            sim_api = bool(data.get("simulate_api_failure", False))
            sim_filing = bool(data.get("simulate_missing_filing", False))
            sim_agent = bool(data.get("simulate_agent_failure", False))

            if not ticker:
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": "Missing ticker symbol",
                })
                continue

            await manager.send_json(websocket, {
                "type": "status",
                "message": f"Starting 6-agent LangGraph workflow for {ticker} (4 Parallel Analysts + 2 Decision Agents)...",
            })

            user_profile = profile_override
            if not user_profile:
                try:
                    factory = get_session_factory()
                    async with factory() as session:
                        res = await session.execute(select(UserProfile).where(UserProfile.user_id == "default"))
                        prof_obj = res.scalar_one_or_none()
                        if prof_obj:
                            user_profile = prof_obj.to_dict()
                except Exception:
                    pass

            async def on_message(agent: str, content: str, msg_data: dict[str, Any]):
                await manager.send_json(websocket, {
                    "type": "agent_message",
                    "agent": agent,
                    "content": content,
                    "data": msg_data,
                })

            try:
                result = await run_analysis(
                    ticker=ticker,
                    user_profile=user_profile,
                    simulate_api_failure=sim_api,
                    simulate_missing_filing=sim_filing,
                    simulate_agent_failure=sim_agent,
                    on_message=on_message,
                )

                # Persist analysis & metrics
                try:
                    factory = get_session_factory()
                    async with factory() as session:
                        analysis = Analysis.from_result(result)
                        session.add(analysis)

                        evt = BehaviorEvent(
                            event_type="stock_analyzed",
                            ticker=ticker,
                            details_json=json.dumps({
                                "decision": result.get("final_decision", {}).get("decision"),
                                "confidence": result.get("final_decision", {}).get("confidence"),
                                "simulation": {"api_failure": sim_api, "missing_filing": sim_filing, "agent_failure": sim_agent},
                            }),
                        )
                        session.add(evt)

                        pm = result.get("performance_metrics", {})
                        metric = PerformanceMetric(
                            analysis_id=result.get("analysis_id", ""),
                            ticker=ticker,
                            total_latency_ms=pm.get("total_latency_ms", 0.0),
                            agreement_score=pm.get("agreement_score", 1.0),
                            api_failures_count=1 if sim_api else 0,
                            cache_hit=result.get("is_demo_data", False),
                        )
                        session.add(metric)
                        await session.commit()
                except Exception:
                    pass

                await manager.send_json(websocket, {
                    "type": "result",
                    "data": _serialize(result),
                })
            except Exception as e:
                await manager.send_json(websocket, {
                    "type": "error",
                    "message": f"Analysis notice: {str(e)}",
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
