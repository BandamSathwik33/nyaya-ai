"""Final Production Audit Test Runner for NyayaAI."""

import json
import logging
import sys
from fastapi.testclient import TestClient

from app.main import app
from app.rag.retriever import retrieve_legal_context, detect_intended_act
from app.rag.qa import calculate_retrieval_confidence
from app.rag.vectorstore import get_vectorstore_stats
from app.agent.tools import parse_structured_sections

logging.basicConfig(level=logging.WARNING)

client = TestClient(app)


def audit_layer1_retrieval():
    print("=" * 80)
    print("LAYER 1 & 2 DIRECT AUDIT: CHROMADB VECTORSTORE & RETRIEVER INSPECTION")
    print("=" * 80)
    
    stats = get_vectorstore_stats()
    print(f"Collection Name: {stats.get('collection_name')}")
    print(f"Total Chunks in DB: {stats.get('total_documents')}")
    print(f"Sources Distribution: {stats.get('sources')}")
    assert stats.get("total_documents") == 1554, f"Expected 1554, got {stats.get('total_documents')}"
    
    queries = [
        ("Threat & Demand Money", "Someone threatened me and demanded money. What legal provisions may be relevant?", None),
        ("FIR Procedure", "What is the procedure for registering an FIR?", "BNSS"),
        ("Arrest Rules", "What is the procedure for arresting a person?", "BNSS"),
        ("Evidence Relevance", "What evidence may be relevant to prove a fact in court?", "BSA"),
        ("Out-of-Domain Football", "Who will win a football match tomorrow?", None),
    ]

    for name, q, explicit_filter in queries:
        print("\n" + "-" * 60)
        print(f"Direct Retrieval Test: {name}")
        print(f"Query: '{q}' | Filter: {explicit_filter}")
        detected = detect_intended_act(q)
        print(f"Detected Act: {detected}")
        
        chunks = retrieve_legal_context(query=q, k=8, act_filter=explicit_filter)
        confidence = calculate_retrieval_confidence(chunks)
        print(f"Retrieved Chunks: {len(chunks)} | Calculated Confidence: {confidence}")
        
        for idx, c in enumerate(chunks[:3], 1):
            txt = c['content'].replace('\n', ' ')[:100]
            print(f"  [{idx}] Act: {c['act']} | File: {c['source']} | Page: {c['page']} | Chunk: {c['chunk_id']} | Dist: {c['score']}")
            print(f"      Excerpt: {txt}...")


def audit_layer3_api_endpoints():
    print("\n" + "=" * 80)
    print("LAYER 3 & 4 FULL API & AGENT END-TO-END AUDIT")
    print("=" * 80)

    # A. Health
    r_health = client.get("/health")
    assert r_health.status_code == 200
    print(f"[PASS] GET /health: {r_health.json()}")

    # B. Stats
    r_stats = client.get("/api/legal/stats")
    assert r_stats.status_code == 200
    print(f"[PASS] GET /api/legal/stats: total_documents={r_stats.json()['total_documents']}")

    # C. Semantic Search
    r_search = client.post("/api/legal/search", json={"query": "What is the procedure for registering an FIR?", "k": 3})
    assert r_search.status_code == 200
    data_search = r_search.json()
    print(f"[PASS] POST /api/legal/search: {data_search['total_results']} chunks returned.")
    assert data_search['total_results'] == 3

    # D. BNS Threat/Extortion
    print("\n--- Testing D. BNS Threat/Extortion Query ---")
    q_threat = "Someone threatened me and demanded money. What legal provisions may be relevant?"
    chunks_threat = retrieve_legal_context(q_threat, k=8)
    conf_threat = calculate_retrieval_confidence(chunks_threat)
    print(f"Retriever directly returned {len(chunks_threat)} chunks with confidence={conf_threat}.")
    assert len(chunks_threat) == 8
    assert conf_threat in ("HIGH", "MEDIUM")
    assert any("BNS" in c["act"].upper() for c in chunks_threat)
    print(f"Top BNS Chunk: {chunks_threat[0]['chunk_id']} (Page {chunks_threat[0]['page']}, Score {chunks_threat[0]['score']})")

    # E. BNSS Arrest Query
    print("\n--- Testing E. BNSS Arrest Query ---")
    q_arrest = "What is the procedure for arresting a person?"
    chunks_arrest = retrieve_legal_context(q_arrest, k=8, act_filter="BNSS")
    assert len(chunks_arrest) == 8
    assert all("BNSS" in c["source"].upper() for c in chunks_arrest)
    print(f"BNSS filter strictly returned {len(chunks_arrest)} BNSS chunks (100% from BNSS.pdf).")

    # F. BSA Evidence Query
    print("\n--- Testing F. BSA Evidence Query ---")
    q_evid = "What evidence may be relevant to prove a fact in court?"
    chunks_evid = retrieve_legal_context(q_evid, k=8, act_filter="BSA")
    assert len(chunks_evid) == 8
    assert all("BSA" in c["source"].upper() for c in chunks_evid)
    print(f"BSA filter strictly returned {len(chunks_evid)} BSA chunks (100% from BSA.pdf).")

    # G. Act Filtering
    print("\n--- Testing G. Act Filter Constraints ---")
    for target in ["BNS", "BNSS", "BSA"]:
        res_filter = client.post("/api/legal/search", json={"query": "general procedure and rules", "k": 4, "act": target})
        assert res_filter.status_code == 200
        items = res_filter.json()["results"]
        assert len(items) == 4
        for item in items:
            assert target in item["source"].upper(), f"Filter leak for {target}: got {item['source']}"
        print(f"[PASS] Strict search filter '{target}' verified.")

    # H. Out of Domain
    print("\n--- Testing H. Out of Domain Query ---")
    q_football = "Who will win a football match tomorrow?"
    chunks_football = retrieve_legal_context(q_football, k=8)
    conf_football = calculate_retrieval_confidence(chunks_football)
    print(f"Out-of-domain '{q_football}' direct retrieval distance scores: {[c['score'] for c in chunks_football]}")
    print(f"Calculated Confidence: {conf_football}")
    assert conf_football == "LOW"

    # I. Empty / Invalid Input
    print("\n--- Testing I. Empty and Invalid Input ---")
    r_empty = client.post("/api/legal/query", json={"question": ""})
    assert r_empty.status_code in (400, 422)
    print(f"[PASS] Empty question rejected with HTTP {r_empty.status_code}.")

    r_ws = client.post("/api/legal/query", json={"question": "   "})
    assert r_ws.status_code in (400, 422)
    print(f"[PASS] Whitespace question rejected with HTTP {r_ws.status_code}.")


def audit_layer4_structured_parser():
    print("\n" + "=" * 80)
    print("LAYER 4 AUDIT: STRUCTURED RESPONSE PARSER INTEGRITY")
    print("=" * 80)

    sample_answer = """### 1. Direct Answer
Threatening someone and demanding money constitutes Extortion under Section 308 of Bharatiya Nyaya Sanhita, 2023.

### 2. Potentially Relevant Provision(s)
* **Bharatiya Nyaya Sanhita, 2023 (BNS):**
  * **Section 308(1):** Offence of Extortion
  * **Section 351(1):** Criminal Intimidation
* **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS):**
  * **Section 173:** Information in cognizable cases

### 3. Why It May Apply
Under Section 308(1), whoever puts any person in fear of injury and dishonestly induces delivery of property commits extortion.

### 4. Punishment / Procedure
Extortion is punishable with imprisonment or fine under BNS.

### 5. Important Exceptions or Related Provisions
Threat to reputation of a deceased person is covered under explanation.

### 6. Additional Facts Needed
* Was any property actually handed over?
* What was the exact nature and immediacy of the threat conveyed?
* Are there electronic communications or witnesses?

### 7. Sources
* BNS.pdf (Page 80)
* BNSS.pdf (Page 55)

### 8. Disclaimer
DISCLAIMER: NyayaAI provides automated legal information...
"""

    parsed = parse_structured_sections(sample_answer)
    print(f"Parsed Provisions Count: {len(parsed['relevant_provisions'])}")
    for p in parsed['relevant_provisions']:
        print(f"  * [{p['act']}] {p['section_or_topic']}: {p['description']}")
    assert len(parsed['relevant_provisions']) == 3
    assert parsed['relevant_provisions'][0]['act'] == "Bharatiya Nyaya Sanhita, 2023 (BNS)"
    assert parsed['relevant_provisions'][2]['act'] == "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)"
    
    print(f"Parsed Additional Facts Count: {len(parsed['additional_facts_needed'])}")
    assert len(parsed['additional_facts_needed']) == 3
    print(f"Why It May Apply Length: {len(parsed['why_they_may_apply'])} chars")
    assert len(parsed['why_they_may_apply']) > 20
    print("[PASS] Structured parser successfully tested against nested markdown output.")


if __name__ == "__main__":
    try:
        audit_layer1_retrieval()
        audit_layer3_api_endpoints()
        audit_layer4_structured_parser()
        print("\n" + "=" * 80)
        print("       ALL PRODUCTION AUDIT CHECKS PASSED WITH 100% SUCCESS!")
        print("=" * 80)
    except Exception as e:
        print(f"\n[AUDIT FAILURE]: {e}")
        sys.exit(1)
