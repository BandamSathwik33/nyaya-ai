import React from "react";
import { FileText, BookOpen } from "lucide-react";
import type { SourceItem } from "../types/legal";

interface SourceCardProps {
  source: SourceItem;
  index: number;
  onOpenAct?: (act: string, page?: number) => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index, onOpenAct }) => {
  const getActBadgeClass = (act: string) => {
    const upper = act.toUpperCase();
    if (upper.includes("BNS") && !upper.includes("BNSS")) return "badge-cyan";
    if (upper.includes("BNSS")) return "badge-indigo";
    if (upper.includes("BSA")) return "badge-amber";
    return "badge-cyan";
  };

  const actKey = (source.act || source.source.replace(".pdf", "")).toUpperCase();

  const handleCardClick = () => {
    if (onOpenAct) {
      onOpenAct(actKey, source.page);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: onOpenAct ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.4)";
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
          {actKey}
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

      {/* Interactive Action & Distance Score */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "8px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        fontSize: "11px",
        color: "var(--text-muted)",
      }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: "#38bdf8",
          fontWeight: 500,
        }}>
          <BookOpen size={12} />
          <span>Click to View Bare Act</span>
        </span>
        <span title="ChromaDB Relevance Score">
          Dist: <strong style={{ color: source.score < 1.0 ? "#34d399" : "#fbbf24" }}>{source.score.toFixed(4)}</strong>
        </span>
      </div>
    </div>
  );
};

