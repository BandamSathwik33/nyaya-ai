import React, { useState } from "react";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import type { ActType, LegalQueryRequest } from "../types/legal";

interface QueryFormProps {
  onSubmit: (request: LegalQueryRequest) => void;
  isLoading: boolean;
}

const SAMPLE_QUERIES = [
  {
    label: "Extortion & Criminal Threat",
    text: "Someone threatened me and demanded money. What legal provisions may be relevant?",
    act: "BNS" as ActType,
  },
  {
    label: "Mandatory FIR Procedure",
    text: "What is the procedure for registering an FIR under Section 173 BNSS?",
    act: "BNSS" as ActType,
  },
  {
    label: "Arrest Without Warrant",
    text: "What are the rules regarding arrest without a warrant under BNSS?",
    act: "BNSS" as ActType,
  },
  {
    label: "Electronic Evidence Certificate",
    text: "What types of electronic records and certificates are admissible as evidence in court?",
    act: "BSA" as ActType,
  },
];

export const QueryForm: React.FC<QueryFormProps> = ({ onSubmit, isLoading }) => {
  const [question, setQuestion] = useState("");
  const [selectedAct, setSelectedAct] = useState<ActType | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmit({
      question: question.trim(),
      top_k: 8,
      act_filter: selectedAct,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSampleClick = (sample: typeof SAMPLE_QUERIES[0]) => {
    setQuestion(sample.text);
    setSelectedAct(sample.act);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="query-form-card"
      style={{
        background: "#080c14",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        padding: "32px",
        position: "relative",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Header & Act Selector */}
      <div
        className="query-form-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "26px",
            fontWeight: 400,
            color: "#ffffff",
            letterSpacing: "-0.01em",
          }}>
            Statutory Inquiry
          </h2>
          <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "2px" }}>
            Search codified bare acts (BNS, BNSS, BSA) with verified citations
          </p>
        </div>

        {/* Act Filter Tabs */}
        <div className="act-filter-group" style={{ display: "flex", gap: "6px" }}>
          {(["ALL", "BNS", "BNSS", "BSA"] as const).map((act) => {
            const isSelected = act === "ALL" ? selectedAct === null : selectedAct === act;
            return (
              <button
                key={act}
                type="button"
                onClick={() => setSelectedAct(act === "ALL" ? null : (act as ActType))}
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  border: isSelected ? "1px solid rgba(255, 255, 255, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  color: isSelected ? "#ffffff" : "hsl(var(--muted-foreground))",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {act === "ALL" ? "All Acts" : act}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Textarea */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a factual scenario, legal dilemma, or statutory inquiry..."
          rows={3}
          disabled={isLoading}
          style={{
            width: "100%",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 18px",
            color: "#ffffff",
            fontSize: "14px",
            fontFamily: "inherit",
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
            e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255, 255, 255, 0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "6px",
          fontSize: "11px",
          color: "hsl(var(--muted-foreground))",
        }}>
          <span>Press <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: "4px" }}>Ctrl + Enter</kbd> to search</span>
          <span>{question.length} / 4000</span>
        </div>
      </div>

      {/* Prompt Scenarios */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
        <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: "4px" }}>
          <Sparkles size={12} /> Prompts:
        </span>
        {SAMPLE_QUERIES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            onClick={() => handleSampleClick(sample)}
            style={{
              fontSize: "12px",
              padding: "4px 12px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              color: "hsl(var(--muted-foreground))",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
            }}
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="liquid-glass"
          disabled={isLoading || !question.trim()}
          style={{
            borderRadius: "9999px",
            padding: "12px 32px",
            fontSize: "14px",
            color: "#ffffff",
            cursor: !question.trim() ? "not-allowed" : "pointer",
            fontWeight: 500,
            opacity: !question.trim() ? 0.4 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            if (question.trim()) e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          {isLoading ? (
            <>
              <div className="spinner" style={{ width: "16px", height: "16px" }} />
              <span>Analyzing statutes...</span>
            </>
          ) : (
            <>
              <Search size={15} />
              <span>Search Provisions</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
