import React, { useEffect, useState } from "react";
import { X, Database, Shield } from "lucide-react";
import type { VectorstoreStatsResponse } from "../types/legal";
import { legalApi } from "../services/api";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<VectorstoreStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await legalApi.getStats();
        if (isMounted) setStats(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load stats");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-card" style={{
        maxWidth: "600px",
        padding: "28px",
        background: "rgba(15, 20, 32, 0.95)",
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            padding: "6px",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div style={{
            background: "rgba(56, 189, 248, 0.15)",
            padding: "8px",
            borderRadius: "10px",
            color: "#38bdf8",
          }}>
            <Database size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 700 }}>ChromaDB Knowledge Base</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Official Indian Criminal Law Corpus</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading database statistics...
          </div>
        ) : error ? (
          <div style={{ padding: "20px", color: "#f43f5e", textAlign: "center" }}>{error}</div>
        ) : stats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Top Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total Indexed Chunks</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>
                  {stats.total_documents.toLocaleString()}
                </div>
              </div>
              <div style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Vector Collection</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc", marginTop: "10px", fontFamily: "var(--font-mono)" }}>
                  {stats.collection_name}
                </div>
              </div>
            </div>

            {/* Statutory Distribution */}
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
                Statute Document Breakdown
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(stats.sources).map(([doc, count]) => {
                  const pct = Math.round((count / stats.total_documents) * 100);
                  const isBNS = doc.includes("BNS");
                  const isBNSS = doc.includes("BNSS");
                  const color = isBNS ? "#38bdf8" : isBNSS ? "#818cf8" : "#fbbf24";

                  return (
                    <div
                      key={doc}
                      style={{
                        background: "rgba(255, 255, 255, 0.02)",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600 }}>{doc}</span>
                        <span style={{ fontFamily: "var(--font-mono)", color }}>
                          {count} chunks ({pct}%)
                        </span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Embedding Info */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              paddingTop: "12px",
              borderTop: "1px solid var(--border-subtle)",
            }}>
              <Shield size={14} color="#34d399" />
              <span>Local Embeddings: sentence-transformers/all-MiniLM-L6-v2 (Zero Quota / Fast L2 Search)</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
