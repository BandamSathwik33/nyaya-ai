import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Scale,
  BookOpen,
  FileCheck2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { LegalQueryResponse } from "../types/legal";
import { SourceCard } from "./SourceCard";
import { LegalAnswerRenderer } from "./LegalAnswerRenderer";

interface ResultsViewProps {
  response: LegalQueryResponse;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ response }) => {
  const [showAllSources, setShowAllSources] = useState(false);

  const getConfidencePill = (conf: string) => {
    switch (conf.toUpperCase()) {
      case "HIGH":
        return (
          <span style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "4px 12px",
            borderRadius: "9999px",
            background: "rgba(52, 211, 153, 0.1)",
            border: "1px solid rgba(52, 211, 153, 0.3)",
            color: "#34d399",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <CheckCircle2 size={13} /> High Grounding
          </span>
        );
      case "MEDIUM":
        return (
          <span style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "4px 12px",
            borderRadius: "9999px",
            background: "rgba(251, 191, 36, 0.1)",
            border: "1px solid rgba(251, 191, 36, 0.3)",
            color: "#fbbf24",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <AlertTriangle size={13} /> Medium Grounding
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: "12px",
            fontWeight: 500,
            padding: "4px 12px",
            borderRadius: "9999px",
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            color: "#f87171",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <ShieldAlert size={13} /> Low Grounding
          </span>
        );
    }
  };

  const getActColor = (act: string) => {
    const norm = act.toUpperCase();
    if (norm.includes("BNS") || norm.includes("NYAYA")) return "#fbbf24";
    if (norm.includes("BNSS") || norm.includes("SURAKSHA")) return "#38bdf8";
    return "#818cf8";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. Header Visual Status Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 24px",
        background: "#080c14",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Scale size={18} color="#ffffff" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
            Statutory Research Grounding
          </span>
          {getConfidencePill(response.confidence)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
          <Layers size={14} />
          <span>{response.sources.length} Verified Bare Act Chunks</span>
        </div>
      </div>

      {/* 2. Visual Statutory Provisions Grid */}
      {response.relevant_provisions && response.relevant_provisions.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FileCheck2 size={18} color="#ffffff" />
            <h3 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "24px",
              fontWeight: 400,
              color: "#ffffff",
            }}>
              Identified Statutory Provisions
            </h3>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {response.relevant_provisions.map((prov, i) => {
              const actColor = getActColor(prov.act);
              return (
                <div
                  key={i}
                  style={{
                    background: "#080c14",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: actColor,
                        background: "rgba(255, 255, 255, 0.04)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        border: `1px solid ${actColor}40`,
                      }}>
                        {prov.act}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>
                      {prov.section_or_topic}
                    </h4>

                    <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "6px", lineHeight: 1.5 }}>
                      {prov.description}
                    </p>
                  </div>

                  {prov.relevance_reason && (
                    <div style={{
                      paddingTop: "12px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                      fontSize: "12px",
                      color: "#e2e8f0",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                    }}>
                      <ArrowRight size={13} style={{ flexShrink: 0, marginTop: "2px", color: actColor }} />
                      <span>{prov.relevance_reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Synthesis & Legal Reasoning */}
      <div style={{
        background: "#080c14",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <BookOpen size={18} color="#ffffff" />
          <h3 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "26px",
            fontWeight: 400,
            color: "#ffffff",
          }}>
            Legal Analysis & Procedural Guidance
          </h3>
        </div>

        <LegalAnswerRenderer content={response.answer} />
      </div>

      {/* 4. Missing Facts Alert */}
      {response.additional_facts_needed && response.additional_facts_needed.length > 0 && (
        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "20px 24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#ffffff" }}>
            <HelpCircle size={16} />
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
              Key Case Factors to Clarify
            </h4>
          </div>
          <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {response.additional_facts_needed.map((fact, idx) => (
              <li key={idx} style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Verifiable Bare Act Sources */}
      {response.sources && response.sources.length > 0 && (
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}>
            <h4 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "22px",
              fontWeight: 400,
              color: "#ffffff",
            }}>
              Verifiable Bare Act Sources ({response.sources.length})
            </h4>
            {response.sources.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSources(!showAllSources)}
                className="liquid-glass"
                style={{
                  borderRadius: "9999px",
                  padding: "4px 14px",
                  fontSize: "12px",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{showAllSources ? "Show Less" : `View All ${response.sources.length}`}</span>
                {showAllSources ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}>
            {(showAllSources ? response.sources : response.sources.slice(0, 3)).map((src, idx) => (
              <SourceCard key={src.chunk_id} source={src} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
