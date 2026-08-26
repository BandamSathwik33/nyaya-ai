"""Comprehensive Production-Hardening Test Suite for NyayaAI."""

import json
import logging
import sys
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.rag.retriever import retrieve_legal_context, detect_intended_act
from app.rag.qa import calculate_retrieval_confidence, LEGAL_DISCLAIMER
from app.rag.vectorstore import get_vectorstore_stats
from app.agent.tools import parse_structured_sections, extract_key_legal_concepts

logging.basicConfig(level=logging.WARNING)


class ProductionHardeningTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """Verify GET /health returns 200 with required structure."""
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("timestamp", data)
        self.assertIn("app_name", data)

    def test_02_vectorstore_stats_integrity(self):
        """Verify GET /api/legal/stats confirms 1,554 chunks across BNS, BNSS, BSA."""
        res = self.client.get("/api/legal/stats")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("total_documents"), 1554)
        sources = data.get("sources", {})
        self.assertIn("BNS.pdf", sources)
        self.assertIn("BNSS.pdf", sources)
        self.assertIn("BSA.pdf", sources)
        self.assertEqual(sum(sources.values()), 1554)

    def test_03_semantic_search_basic(self):
        """Verify POST /api/legal/search retrieves valid statutory passages."""
        res = self.client.post("/api/legal/search", json={"query": "procedure for registering an FIR", "k": 3})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_results"], 3)
        for item in data["results"]:
            self.assertTrue(len(item["content"]) > 0)
            self.assertTrue(item["page"] >= 1)
            self.assertIn(".pdf", item["source"])
            self.assertIn(item["act"], ("BNS", "BNSS", "BSA"))

    def test_04_strict_act_filtering(self):
        """Verify POST /api/legal/search enforces strict Act isolation with zero leaks."""
        for target_act in ["BNS", "BNSS", "BSA"]:
            res = self.client.post("/api/legal/search", json={"query": "offence and procedure", "k": 4, "act": target_act})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["total_results"], 4)
            for item in data["results"]:
                self.assertEqual(item["act"], target_act, f"Act filter leak: expected {target_act}, got {item['act']}")
                self.assertIn(f"{target_act}.pdf", item["source"])

    def test_05_invalid_act_filter_handling(self):
        """Verify invalid act_filter returns HTTP 400 with descriptive error."""
        res_search = self.client.post("/api/legal/search", json={"query": "theft", "act": "INVALID_ACT"})
        self.assertEqual(res_search.status_code, 400)
        self.assertIn("Invalid act filter", res_search.json()["detail"])

        res_query = self.client.post("/api/legal/query", json={"question": "What is theft?", "act_filter": "UNKNOWN"})
        self.assertEqual(res_query.status_code, 400)
        self.assertIn("Invalid act_filter", res_query.json()["detail"])

    def test_06_input_validation_boundaries(self):
        """Verify input boundary constraints (empty, whitespace, top_k limits, max length)."""
        # Empty string
        res_empty = self.client.post("/api/legal/query", json={"question": ""})
        self.assertIn(res_empty.status_code, (400, 422))

        # Whitespace
        res_ws = self.client.post("/api/legal/query", json={"question": "      "})
        self.assertIn(res_ws.status_code, (400, 422))

        # Invalid top_k (< 1)
        res_k_low = self.client.post("/api/legal/query", json={"question": "Valid query", "top_k": 0})
        self.assertEqual(res_k_low.status_code, 422)

        # Invalid top_k (> 20)
        res_k_high = self.client.post("/api/legal/query", json={"question": "Valid query", "top_k": 50})
        self.assertEqual(res_k_high.status_code, 422)

        # Oversized question (> 4000 chars)
        res_oversized = self.client.post("/api/legal/query", json={"question": "A" * 4500})
        self.assertEqual(res_oversized.status_code, 422)

    def test_07_act_detection_and_query_routing(self):
        """Verify heuristic Act classifier accurately routes queries."""
        self.assertEqual(detect_intended_act("Someone threatened me and demanded money"), "BNS")
        self.assertEqual(detect_intended_act("What is the punishment for extortion under section 308?"), "BNS")
        self.assertEqual(detect_intended_act("What is the procedure for registering an FIR?"), "BNSS")
        self.assertEqual(detect_intended_act("What are the rules regarding arrest without warrant?"), "BNSS")
        self.assertEqual(detect_intended_act("How to prove an electronic record in evidence?"), "BSA")
        self.assertEqual(detect_intended_act("What is primary and secondary evidence?"), "BSA")
        self.assertIsNone(detect_intended_act("What is the speed of light in vacuum?"))

    def test_08_deterministic_confidence_math(self):
        """Verify confidence calculation is strictly deterministic."""
        high_chunks = [{"score": 0.85}, {"score": 0.90}, {"score": 0.92}]
        self.assertEqual(calculate_retrieval_confidence(high_chunks), "HIGH")

        medium_chunks = [{"score": 1.05}, {"score": 1.10}, {"score": 1.15}]
        self.assertEqual(calculate_retrieval_confidence(medium_chunks), "MEDIUM")

        low_chunks = [{"score": 1.45}, {"score": 1.55}, {"score": 1.60}]
        self.assertEqual(calculate_retrieval_confidence(low_chunks), "LOW")

        self.assertEqual(calculate_retrieval_confidence([]), "LOW")

    def test_09_structured_markdown_parser_edge_cases(self):
        """Verify structured parser handles complex, nested, and malformed markdown without crashing."""
        # 1. Complex nested markdown
        nested_md = """### 1. Direct Answer
Direct answer text.

### 2. Potentially Relevant Provision(s)
* **Bharatiya Nyaya Sanhita, 2023 (BNS)**:
  * **Section 308(1)**: Extortion definition
  * **Section 351**: Criminal intimidation
* **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)**:
  * **Section 173**: Information in cognizable cases

### 3. Why It May Apply
Under Section 308(1), whoever puts any person in fear of injury...

### 6. Additional Facts Needed
* 1. What was the exact nature of the threat?
* 2. Was money actually paid?

### 8. Disclaimer
""" + LEGAL_DISCLAIMER

        parsed = parse_structured_sections(nested_md)
        self.assertEqual(len(parsed["relevant_provisions"]), 3)
        self.assertEqual(parsed["relevant_provisions"][0]["act"], "Bharatiya Nyaya Sanhita, 2023 (BNS)")
        self.assertEqual(parsed["relevant_provisions"][2]["act"], "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)")
        self.assertEqual(len(parsed["additional_facts_needed"]), 2)

        # 2. Completely malformed / unformatted text
        malformed_text = "Just a raw string with no markdown headers or bullets whatsoever."
        parsed_malformed = parse_structured_sections(malformed_text)
        self.assertEqual(parsed_malformed["relevant_provisions"], [])
        self.assertEqual(parsed_malformed["additional_facts_needed"], [])
        self.assertIn(parsed_malformed["why_they_may_apply"], ("", None))

    def test_10_source_metadata_preservation(self):
        """Verify all statutory source fields (act, source, page, chunk_id, score) survive retrieval."""
        chunks = retrieve_legal_context("What is criminal intimidation?", k=3)
        self.assertEqual(len(chunks), 3)
        for c in chunks:
            self.assertIn("act", c)
            self.assertIn("source", c)
            self.assertIn("page", c)
            self.assertIn("chunk_id", c)
            self.assertIn("score", c)
            self.assertIn("content", c)
            self.assertTrue(isinstance(c["page"], int))
            self.assertTrue(isinstance(c["score"], (int, float)))


if __name__ == "__main__":
    unittest.main()
