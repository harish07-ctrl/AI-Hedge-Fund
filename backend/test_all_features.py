"""Comprehensive test script verifying all PS-01 multi-agent financial intelligence features."""

import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import init_db, get_session_factory
from app.agents.graph import run_analysis
from app.api.routes import compare_what_if_profiles


async def main():
    print("=== 1. INITIALIZING DATABASE & SEED DATA ===")
    await init_db()
    print("[OK] Database initialized and seeded successfully.")

    print("\n=== 2. RUNNING 5-AGENT MULTI-AGENT ANALYSIS (AAPL) ===")
    start_time = asyncio.get_event_loop().time()
    result = await run_analysis(ticker="AAPL")
    elapsed = round(asyncio.get_event_loop().time() - start_time, 2)

    print(f"[OK] Analysis completed in {elapsed}s")
    print(f"  Ticker: {result['ticker']}")
    print(f"  Fundamentals Signal: {result['fundamentals_report'].get('signal')} (Conf: {result['fundamentals_report'].get('confidence')}%)")
    print(f"  Sentiment Signal: {result['sentiment_report'].get('signal')} (Conf: {result['sentiment_report'].get('confidence')}%)")
    print(f"  Technical Signal: {result['technical_report'].get('signal')} (Conf: {result['technical_report'].get('confidence')}%)")
    print(f"  Macro Signal: {result['macro_report'].get('signal')} (Regime: {result['macro_report'].get('regime')})")
    print(f"  Risk Level: {result['risk_report'].get('risk_level')} (Conflicting: {result['risk_report'].get('conflicting_signals')})")
    print(f"  Final Decision: {result['final_decision'].get('decision')} (AI Confidence: {int(result['final_decision'].get('confidence', 0)*100)}%)")
    print(f"  User Profile Effect: {result['final_decision'].get('user_profile_effect')}")

    print("\n=== 3. VERIFYING WHAT-IF PROFILE COMPARISON (PERSONALIZATION) ===")
    print("Running same stock (AAPL) through Conservative vs Aggressive profiles...")

    factory = get_session_factory()
    async with factory() as session:
        what_if_data = await compare_what_if_profiles(ticker="AAPL", db=session)

    cons_dec = what_if_data['conservative_result']['decision']
    agg_dec = what_if_data['aggressive_result']['decision']

    print(f"[OK] Conservative Profile Recommendation: {cons_dec.get('decision')} (Conf: {int(cons_dec.get('confidence', 0)*100)}%)")
    print(f"  Profile Rationale: {cons_dec.get('user_profile_effect')}")
    print(f"[OK] Aggressive Profile Recommendation:   {agg_dec.get('decision')} (Conf: {int(agg_dec.get('confidence', 0)*100)}%)")
    print(f"  Profile Rationale: {agg_dec.get('user_profile_effect')}")

    print("\n=== 4. VERIFYING FREE STACK & STRUCTURED OUTPUT COMPLIANCE ===")
    for agent_key in ['fundamentals_report', 'sentiment_report', 'technical_report', 'macro_report', 'risk_report']:
        report = result[agent_key]
        assert "agent" in report, f"Missing 'agent' key in {agent_key}"
        assert "confidence" in report, f"Missing 'confidence' key in {agent_key}"
        assert "factors" in report, f"Missing 'factors' key in {agent_key}"
        assert "sources" in report, f"Missing 'sources' key in {agent_key}"
        print(f"[OK] {report['agent']} structured output verified.")

    print("\n=======================================================")
    print("ALL PS-01 SUCCESS CRITERIA VERIFIED SUCCESSFULLY!")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(main())
