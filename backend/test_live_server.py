"""Live server test script."""

import json
import requests

base_url = "http://127.0.0.1:8000"

# 1. Health
r_health = requests.get(f"{base_url}/health")
print("=== 1. /health ===")
print("Status:", r_health.status_code, r_health.json())

# 2. Stats
r_stats = requests.get(f"{base_url}/api/legal/stats")
print("\n=== 2. /api/legal/stats ===")
print("Status:", r_stats.status_code, r_stats.json())

# 3. Search
r_search = requests.post(
    f"{base_url}/api/legal/search",
    json={"query": "first information report Section 173", "k": 2, "act": "BNSS"}
)
print("\n=== 3. /api/legal/search ===")
print("Status:", r_search.status_code, "Results Count:", r_search.json().get("total_results"))

# 4. Query
r_query = requests.post(
    f"{base_url}/api/legal/query",
    json={"question": "Someone threatened me and demanded money. What legal provisions may be relevant?"},
    timeout=60
)
print("\n=== 4. /api/legal/query ===")
print("Status:", r_query.status_code)
data = r_query.json()
print("Confidence:", data.get("confidence"))
print("Sources count:", len(data.get("sources", [])))
print("Provisions count:", len(data.get("relevant_provisions", [])))
print("\nFULL JSON RESPONSE:\n")
print(json.dumps(data, indent=2))
