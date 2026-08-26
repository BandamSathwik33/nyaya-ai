import React from "react";
import { FileText, Hash } from "lucide-react";
import type { SourceItem } from "../types/legal";

interface SourceCardProps {
  source: SourceItem;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const getActBadgeClass = (act: string) => {
    const upper = act.toUpperCase();
    if (upper.includes("BNS") && !upper.includes("BNSS")) return "badge-cyan";
    if (upper.includes("BNSS")) return "badge-indigo";
    if (upper.includes("BSA")) return "badge-amber";
    return "badge-cyan";
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.35)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top row: Act Badge and Document Index */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className={`badge ${getActBadgeClass(source.act || source.source)}`}>
          {source.act || source.source.replace(".pdf", "")}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          #{index + 1}
        </span>
      </div>

      {/* Source PDF name & Page */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
        <FileText size={16} color="#38bdf8" />
        <span style={{ fontSize: "14px", fontWeight: 600 }}>{source.source}</span>
        <span style={{
          marginLeft: "auto",
          fontSize: "12px",
          background: "rgba(255, 255, 255, 0.06)",
          padding: "2px 8px",
          borderRadius: "6px",
          color: "var(--text-secondary)",
        }}>
          Page {source.page}
        </span>
      </div>

      {/* Chunk ID and Relevance Distance */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "8px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        fontSize: "11px",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}>
        <span title={`Vector Chunk ID: ${source.chunk_id}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Hash size={12} />
          {source.chunk_id.length > 16 ? `${source.chunk_id.substring(0, 16)}...` : source.chunk_id}
        </span>
        <span title="ChromaDB L2 Distance Score (lower indicates higher similarity)">
          Dist: <strong style={{ color: source.score < 1.0 ? "#34d399" : "#fbbf24" }}>{source.score.toFixed(4)}</strong>
        </span>
      </div>
    </div>
  );
};
