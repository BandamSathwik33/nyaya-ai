"""CLI test runner for NyayaAI Legal Question-Answering (RAG) Service.

Usage:
    python test_qa.py "Someone intentionally causes grievous injury to another person"
    python test_qa.py "What is the procedure when police arrest without warrant?" --filter BNSS
"""

import argparse
import sys

from app.rag.qa import answer_legal_question


def main():
    parser = argparse.ArgumentParser(
        description="NyayaAI Legal Question-Answering CLI Diagnostic",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "question",
        type=str,
        nargs="?",
        default="Someone intentionally causes grievous injury to another person",
        help="The legal query or scenario to analyze",
    )
    parser.add_argument(
        "-f", "--filter",
        type=str,
        default=None,
        help="Optional Act filter (e.g. BNS, BNSS, BSA)",
    )
    parser.add_argument(
        "-k", "--top-k",
        type=int,
        default=8,
        help="Number of relevant statutory chunks to retrieve for LLM context",
    )

    args = parser.parse_args()

    print("\n" + "=" * 70)
    print("           NYAYAAI LEGAL QA - END-TO-END RAG TEST")
    print("=" * 70)
    print(f" Question   : \"{args.question}\"")
    print(f" Act Filter : {args.filter or 'All Acts (BNS, BNSS, BSA)'}")
    print(f" Top-K      : {args.top_k}")
    print("=" * 70 + "\n")

    try:
        result = answer_legal_question(
            question=args.question,
            top_k=args.top_k,
            act_filter=args.filter,
        )
    except Exception as e:
        print(f"\n[ERROR] QA processing failed: {e}\n")
        sys.exit(1)

    print("QUESTION:")
    print(f"  {result['question']}\n")

    print("ANSWER:")
    print(f"{result['answer']}\n")

    print("SOURCES:")
    if result.get("sources"):
        for idx, src in enumerate(result["sources"], start=1):
            act = src.get("act", "Unknown")
            source_file = src.get("source", "N/A")
            page = src.get("page", "N/A")
            chunk_id = src.get("chunk_id", "N/A")
            score = src.get("score", src.get("distance_score", 0.0))
            print(f"  [{idx}] {act} | Page {page} | Chunk: {chunk_id} | File: {source_file} (score: {score})")
    else:
        print("  No source passages retrieved.")
    print()

    print("CONFIDENCE:")
    print(f"  {result.get('confidence', 'N/A').upper()}\n")

    print("DISCLAIMER:")
    print(f"  {result.get('disclaimer', 'N/A')}\n")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
