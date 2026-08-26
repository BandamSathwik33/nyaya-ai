"""Direct retrieval test script for 5 diagnostic legal queries."""

import logging
from app.rag.retriever import retrieve_legal_context, detect_intended_act
from app.rag.qa import calculate_retrieval_confidence

logging.basicConfig(level=logging.WARNING)

queries = [
    "Someone threatened me and demanded money. What legal provisions may be relevant?",
    "What is criminal intimidation under BNS?",
    "What is extortion under BNS?",
    "What is the procedure for registration of FIR?",
    "What is admissibility of electronic evidence?"
]

for q in queries:
    print("=" * 70)
    print("QUERY:", q)
    detected = detect_intended_act(q)
    print("DETECTED ACT:", detected)
    chunks = retrieve_legal_context(q, k=8)
    print("CHUNKS RETRIEVED:", len(chunks))
    conf = calculate_retrieval_confidence(chunks)
    print("CALCULATED CONFIDENCE:", conf)
    scores = [c["score"] for c in chunks]
    print("ALL DISTANCE SCORES:", scores)
    for idx, c in enumerate(chunks[:3], 1):
        preview = c["content"].replace("\n", " ")[:140]
        print(f"  [{idx}] Act: {c['act']} | File: {c['source']} | Page: {c['page']} | Chunk: {c['chunk_id']} | Distance: {c['score']}")
        print(f"      Text: {preview}...")
print("=" * 70)
