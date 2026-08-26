"""Comprehensive Backend Integration Audit Suite for NyayaAI."""

import json
import logging
import sys
from fastapi.testclient import TestClient

from app.main import app

logging.basicConfig(level=logging.WARNING)

client = TestClient(app)


def audit_health_and_stats():
    print("=" * 80)
    print("1. AUDITING /health AND /api/legal/stats")
    print("=" * 80)
    
    r_health = client.get("/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.status_code}"
    print(f"[PASS] /health: {r_health.json()}")

    r_stats = client.get("/api/legal/stats")
    assert r_stats.status_code == 200, f"Stats endpoint failed: {r_stats.status_code}"
    stats_data = r_stats.json()
    print(f"[PASS] /api/legal/stats:")
    print(f"       Collection: {stats_data['collection_name']}")
    print(f"       Total Chunks: {stats_data['total_documents']}")
    print(f"       Sources Breakdown: {stats_data['sources']}")
    assert stats_data["total_documents"] == 1554, f"Expected 1554 chunks, got {stats_data['total_documents']}"
    assert "BNS.pdf" in stats_data["sources"]
    assert "BNSS.pdf" in stats_data["sources"]
    assert "BSA.pdf" in stats_data["sources"]


def audit_search_endpoint():
    print("\n" + "=" * 80)
    print("2. AUDITING /api/legal/search (Raw Semantic Retrieval)")
    print("=" * 80)
    
    payload = {"query": "admissibility of electronic record section 63", "k": 3, "act": "BSA"}
    res = client.post("/api/legal/search", json=payload)
    assert res.status_code == 200, f"Search failed: {res.status_code}"
    data = res.json()
    print(f"[PASS] /api/legal/search returned {data['total_results']} chunks for query: '{payload['query']}'")
    for idx, r in enumerate(data["results"], 1):
        print(f"       [{idx}] Act: {r['act']} | File: {r['source']} | Page: {r['page']} | Score: {r['score']}")
    assert data["total_results"] > 0
    assert all("BSA" in r["source"].upper() for r in data["results"])


def audit_required_queries():
    print("\n" + "=" * 80)
    print("3. AUDITING MANDATORY LEGAL RESEARCH QUERIES (1 - 5)")
    print("=" * 80)

    test_queries = [
        {
            "id": "Q1",
            "name": "Threat and Extortion",
            "payload": {"question": "Someone threatened me and demanded money. What legal provisions may be relevant?"},
            "expected_act": "BNS",
            "expect_low_conf": False,
        },
        {
            "id": "Q2",
            "name": "Procedure for Registering FIR",
            "payload": {"question": "What is the procedure for registering an FIR?"},
            "expected_act": "BNSS",
            "expect_low_conf": False,
        },
        {
            "id": "Q3",
            "name": "Rules Regarding Arrest",
            "payload": {"question": "What are the rules regarding arrest?"},
            "expected_act": "BNSS",
            "expect_low_conf": False,
        },
        {
            "id": "Q4",
            "name": "Admissible Evidence Types",
            "payload": {"question": "What types of evidence are admissible?"},
            "expected_act": "BSA",
            "expect_low_conf": False,
        },
        {
            "id": "Q5",
            "name": "Speed limit on Mars (Out of Domain)",
            "payload": {"question": "Speed limit on Mars"},
            "expected_act": None,
            "expect_low_conf": True,
        },
    ]

    for item in test_queries:
        print(f"\n--- Running {item['id']}: {item['name']} ---")
        print(f"Query: \"{item['payload']['question']}\"")
        res = client.post("/api/legal/query", json=item["payload"])
        assert res.status_code == 200, f"Query {item['id']} failed with status {res.status_code}: {res.text}"
        data = res.json()

        print(f"Status: HTTP {res.status_code}")
        print(f"Confidence: {data['confidence']}")
        print(f"Sources Count: {len(data['sources'])}")
        print(f"Relevant Provisions Count: {len(data['relevant_provisions'])}")
        for p in data["relevant_provisions"][:3]:
            print(f"  * [{p['act']}] {p['section_or_topic']}: {p['description'][:80]}...")

        if item["expect_low_conf"]:
            assert data["confidence"] == "LOW", f"Expected LOW confidence for out-of-domain query, got {data['confidence']}"
            assert "insufficient" in data["answer"].lower(), "Expected refusal / insufficient info statement"
            print(f"[PASS] Out-of-domain properly flagged as LOW confidence with grounded refusal.")
        else:
            assert data["confidence"] in ("HIGH", "MEDIUM"), f"Expected HIGH/MEDIUM confidence, got {data['confidence']}"
            assert len(data["sources"]) > 0, "Sources list must not be empty"
            assert len(data["relevant_provisions"]) > 0, "Relevant provisions must not be empty"
            if item["expected_act"]:
                assert any(item["expected_act"] in s["source"].upper() for s in data["sources"]), (
                    f"Expected sources containing {item['expected_act']}"
                )
            print(f"[PASS] {item['id']} ({item['name']}) verified successfully.")


def audit_act_filtering():
    print("\n" + "=" * 80)
    print("4. AUDITING EXPLICIT ACT FILTERS (BNS, BNSS, BSA)")
    print("=" * 80)

    filters = [
        ("BNS", "What is criminal intimidation?", "BNS"),
        ("BNSS", "What are the powers of police during investigation?", "BNSS"),
        ("BSA", "What is primary and secondary evidence?", "BSA"),
    ]

    for target_act, query, expected_source in filters:
        print(f"\n--- Testing filter: act_filter='{target_act}' ---")
        payload = {"question": query, "act_filter": target_act}
        res = client.post("/api/legal/query", json=payload)
        assert res.status_code == 200
        data = res.json()
        print(f"Confidence: {data['confidence']}, Sources: {len(data['sources'])}")
        assert len(data["sources"]) > 0
        for s in data["sources"]:
            assert expected_source in s["source"].upper(), f"Filter leak: expected {expected_source}, got {s['source']}"
        print(f"[PASS] Strict filter '{target_act}' verified (100% chunks from {expected_source}.pdf).")


def audit_validation_errors():
    print("\n" + "=" * 80)
    print("5. AUDITING INPUT VALIDATION & ERROR HANDLING")
    print("=" * 80)

    res_empty = client.post("/api/legal/query", json={"question": ""})
    assert res_empty.status_code in (400, 422)
    print(f"[PASS] Empty string correctly rejected with HTTP {res_empty.status_code}")

    res_ws = client.post("/api/legal/query", json={"question": "    "})
    assert res_ws.status_code in (400, 422)
    print(f"[PASS] Whitespace string correctly rejected with HTTP {res_ws.status_code}")


if __name__ == "__main__":
    print("=" * 80)
    print("       STARTING NYAYAAI COMPLETE BACKEND INTEGRATION AUDIT")
    print("=" * 80)
    try:
        audit_health_and_stats()
        audit_search_endpoint()
        audit_required_queries()
        audit_act_filtering()
        audit_validation_errors()
        print("\n" + "=" * 80)
        print("       ALL BACKEND INTEGRATION AUDIT TESTS PASSED SUCCESSFULLY!")
        print("=" * 80)
    except Exception as e:
        print(f"\n[FATAL AUDIT FAILURE]: {e}")
        sys.exit(1)
