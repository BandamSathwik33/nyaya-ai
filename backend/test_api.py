"""Comprehensive test suite for NyayaAI FastAPI backend, RAG pipeline, and AI Agent."""

import json
import logging
import sys
from fastapi.testclient import TestClient

from app.main import app

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("test_api")

client = TestClient(app)


def test_root_endpoint():
    print("\n--- 1. Testing GET / ---")
    response = client.get("/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert "message" in data
    assert data["docs"] == "/docs"
    print("[PASS] GET / passed.")


def test_health_endpoint():
    print("\n--- 2. Testing GET /health ---")
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    print("[PASS] GET /health passed.")


def test_stats_endpoint():
    print("\n--- 3. Testing GET /api/legal/stats ---")
    response = client.get("/api/legal/stats")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    print(f"Collection: {data['collection_name']}, Total Chunks: {data['total_documents']}")
    print(f"Sources Breakdown: {data['sources']}")
    assert data["total_documents"] == 1554, f"Expected 1554 chunks, got {data['total_documents']}"
    assert "BNS.pdf" in data["sources"]
    assert "BNSS.pdf" in data["sources"]
    assert "BSA.pdf" in data["sources"]
    assert sum(data["sources"].values()) == 1554
    print("[PASS] GET /api/legal/stats passed.")


def test_search_endpoint():
    print("\n--- 4. Testing POST /api/legal/search ---")
    payload = {
        "query": "information in cognizable cases first information report",
        "k": 3,
        "act": "BNSS"
    }
    response = client.post("/api/legal/search", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["total_results"] > 0
    first = data["results"][0]
    assert "BNSS" in first["source"]
    print(f"Top Result: {first['act']} | File: {first['source']} | Page: {first['page']} | Score: {first['score']}")
    print("[PASS] POST /api/legal/search passed.")


def test_query_threat_extortion():
    print("\n--- Test A: BNS Threat & Extortion Query ---")
    payload = {
        "question": "Someone threatened me and demanded money. What legal provisions may be relevant?"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    print("Confidence:", data["confidence"])
    print("Sources Count:", len(data["sources"]))
    print("Provisions Count:", len(data["relevant_provisions"]))
    for p in data["relevant_provisions"]:
        print(f"  - [{p['act']}] {p['section_or_topic']}: {p['description']}")
    
    assert len(data["sources"]) > 0, "Expected non-empty sources"
    assert len(data["relevant_provisions"]) > 0, "Expected non-empty relevant_provisions"
    assert data["confidence"] in ("HIGH", "MEDIUM")
    assert any("BNS" in s["source"].upper() for s in data["sources"]), "Expected BNS sources for threat/extortion"
    print("[PASS] Test A (BNS Threat/Extortion) passed.")


def test_query_procedure_fir():
    print("\n--- Test B: BNSS FIR Registration Procedure ---")
    payload = {
        "question": "What is the procedure for registration of FIR?"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    print("Confidence:", data["confidence"])
    print("Sources Count:", len(data["sources"]))
    assert len(data["sources"]) > 0
    assert any("BNSS" in s["source"].upper() for s in data["sources"]), "Expected BNSS sources for FIR procedure"
    print("[PASS] Test B (BNSS FIR Procedure) passed.")


def test_query_electronic_evidence():
    print("\n--- Test C: BSA Electronic Evidence Admissibility ---")
    payload = {
        "question": "What is admissibility of electronic evidence?"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    print("Confidence:", data["confidence"])
    print("Sources Count:", len(data["sources"]))
    assert len(data["sources"]) > 0
    assert any("BSA" in s["source"].upper() for s in data["sources"]), "Expected BSA sources for electronic evidence"
    print("[PASS] Test C (BSA Electronic Evidence) passed.")


def test_query_explicit_act_filter():
    print("\n--- Test D: Explicit act_filter='BNS' ---")
    payload = {
        "question": "What is criminal intimidation under BNS?",
        "act_filter": "BNS"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    
    print("Sources Count:", len(data["sources"]))
    for s in data["sources"]:
        assert "BNS" in s["source"].upper(), f"Expected only BNS sources with act_filter='BNS', got {s['source']}"
    print("[PASS] Test D (Strict BNS Act Filter) passed.")


def test_query_validation_error():
    print("\n--- Test E: Empty / Invalid Query Validation ---")
    res_empty = client.post("/api/legal/query", json={"question": ""})
    assert res_empty.status_code in (400, 422), f"Expected 400/422, got {res_empty.status_code}"
    
    res_ws = client.post("/api/legal/query", json={"question": "  "})
    assert res_ws.status_code in (400, 422), f"Expected 400/422, got {res_ws.status_code}"
    print("[PASS] Test E (Validation Error) passed.")


def test_query_unrelated_mars():
    print("\n--- Test F: Unrelated Query ('Speed limit on Mars') ---")
    payload = {
        "question": "Speed limit on Mars"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    
    print("Confidence:", data["confidence"])
    assert data["confidence"] == "LOW"
    assert "insufficient" in data["answer"].lower()
    print("[PASS] Test F (Unrelated Query Handling) passed.")


def test_source_metadata_preserved():
    print("\n--- Test G: Source Metadata Preservation ---")
    payload = {
        "question": "What is extortion under BNS?"
    }
    response = client.post("/api/legal/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["sources"]) > 0
    for s in data["sources"]:
        assert "act" in s and s["act"]
        assert "source" in s and s["source"].endswith(".pdf")
        assert "page" in s and isinstance(s["page"], int) and s["page"] > 0
        assert "chunk_id" in s and s["chunk_id"]
        assert "score" in s and isinstance(s["score"], float)
    print(f"Sample Source Metadata: {data['sources'][0]}")
    print("[PASS] Test G (Source Metadata Preservation) passed.")


if __name__ == "__main__":
    print("=" * 70)
    print("           NYAYAAI BACKEND COMPLETE VERIFICATION SUITE")
    print("=" * 70)
    try:
        test_root_endpoint()
        test_health_endpoint()
        test_stats_endpoint()
        test_search_endpoint()
        test_query_threat_extortion()
        test_query_procedure_fir()
        test_query_electronic_evidence()
        test_query_explicit_act_filter()
        test_query_validation_error()
        test_query_unrelated_mars()
        test_source_metadata_preserved()
        print("\n" + "=" * 70)
        print("           ALL TESTS (A - G) PASSED SUCCESSFULLY!")
        print("=" * 70)
    except Exception as e:
        logger.exception(f"Test failed with error: {e}")
        sys.exit(1)
