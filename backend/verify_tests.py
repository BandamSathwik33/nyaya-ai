"""Verification runner for Tests A, B, C, D on NyayaAI."""

import json
import logging
from app.agent.researcher import run_legal_research

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")


def run_test_a():
    print("\n" + "=" * 70)
    print("TEST A: Threat and demand for money (Substantive offence)")
    print("=" * 70)
    query = "Someone threatened me and demanded money. What legal provisions may be relevant?"
    res = run_legal_research(query)
    print(f"Query: {query}")
    print(f"Confidence: {res['confidence']}")
    print(f"Sources Count: {len(res['sources'])}")
    print(f"Relevant Provisions Count: {len(res['relevant_provisions'])}")
    for p in res['relevant_provisions']:
        print(f"  - [{p['act']}] {p['section_or_topic']}: {p['description']}")
    print(f"Why it may apply:\n{res['why_they_may_apply'][:200]}...")
    print(f"Additional Facts Needed:\n{res['additional_facts_needed']}")
    print(f"Answer Excerpt:\n{res['answer'][:300]}...")
    
    assert len(res['sources']) > 0, "TEST A failed: sources is empty"
    assert len(res['relevant_provisions']) > 0, "TEST A failed: relevant_provisions is empty"
    assert res['confidence'] in ("HIGH", "MEDIUM"), f"TEST A failed: confidence is {res['confidence']}"
    print("\n>>> TEST A PASSED! <<<\n")


def run_test_b():
    print("\n" + "=" * 70)
    print("TEST B: Procedure for registering an FIR (BNSS filtered)")
    print("=" * 70)
    query = "What is the procedure for registering an FIR?"
    res = run_legal_research(query, act_filter="BNSS")
    print(f"Query: {query}")
    print(f"Act Filter: BNSS")
    print(f"Confidence: {res['confidence']}")
    print(f"Sources Count: {len(res['sources'])}")
    for s in res['sources'][:3]:
        print(f"  - Source: {s['source']} (Page {s['page']}, Score {s['score']})")
    print(f"Relevant Provisions Count: {len(res['relevant_provisions'])}")
    for p in res['relevant_provisions']:
        print(f"  - [{p['act']}] {p['section_or_topic']}: {p['description']}")
    print(f"Answer Excerpt:\n{res['answer'][:300]}...")

    assert len(res['sources']) > 0, "TEST B failed: sources is empty"
    assert any("BNSS" in s['source'].upper() for s in res['sources']), "TEST B failed: no BNSS sources"
    print("\n>>> TEST B PASSED! <<<\n")


def run_test_c():
    print("\n" + "=" * 70)
    print("TEST C: Out-of-Domain Query ('Speed limit on Mars')")
    print("=" * 70)
    query = "Speed limit on Mars"
    res = run_legal_research(query)
    print(f"Query: {query}")
    print(f"Confidence: {res['confidence']}")
    print(f"Answer Excerpt:\n{res['answer'][:300]}...")

    assert res['confidence'] == "LOW", f"TEST C failed: expected LOW confidence, got {res['confidence']}"
    assert "insufficient" in res['answer'].lower(), "TEST C failed: did not indicate insufficient info"
    print("\n>>> TEST C PASSED! <<<\n")


def run_test_d():
    print("\n" + "=" * 70)
    print("TEST D: Criminal intimidation under BNS")
    print("=" * 70)
    query = "What is criminal intimidation under BNS?"
    res = run_legal_research(query, act_filter="BNS")
    print(f"Query: {query}")
    print(f"Act Filter: BNS")
    print(f"Confidence: {res['confidence']}")
    print(f"Sources Count: {len(res['sources'])}")
    print(f"Relevant Provisions Count: {len(res['relevant_provisions'])}")
    for p in res['relevant_provisions']:
        print(f"  - [{p['act']}] {p['section_or_topic']}: {p['description']}")
    print(f"Answer Excerpt:\n{res['answer'][:300]}...")

    assert len(res['sources']) > 0, "TEST D failed: sources is empty"
    assert len(res['relevant_provisions']) > 0, "TEST D failed: relevant_provisions is empty"
    assert any("BNS" in s['source'].upper() for s in res['sources']), "TEST D failed: no BNS sources"
    print("\n>>> TEST D PASSED! <<<\n")


if __name__ == "__main__":
    print("Starting NyayaAI Verification Suite for Tests A, B, C, D...")
    run_test_a()
    run_test_b()
    run_test_c()
    run_test_d()
    print("=" * 70)
    print("ALL 4 VERIFICATION TESTS (A, B, C, D) COMPLETED SUCCESSFULLY!")
    print("=" * 70)
