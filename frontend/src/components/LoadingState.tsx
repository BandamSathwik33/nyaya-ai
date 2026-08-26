import React, { useEffect, useState } from "react";
import { LoadingOrbital3D } from "./3d/LoadingOrbital3D";

const RESEARCH_STEPS = [
  { label: "Parsing factual narrative & identifying legal intent", sub: "Natural language processing" },
  { label: "Executing vector similarity search against 1,554 statutory chunks", sub: "ChromaDB Embedding Retrieval" },
  { label: "Isolating applicable chapters under BNS, BNSS & BSA", sub: "Statutory provision ranking" },
  { label: "Synthesizing grounded legal reasoning & exact citations", sub: "Gemini Legal Reasoning" },
];

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < RESEARCH_STEPS.length - 1 ? prev + 1 : prev));
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: "#080c14",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "24px",
      padding: "48px 32px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "24px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
      fontFamily: "var(--font-body)",
    }}>
      {/* 3D Gyroscopic Knowledge Spinner */}
      <LoadingOrbital3D />

      {/* Header */}
      <div>
        <h3 style={{
          fontFamily: "'Instrument Serif', serif",
          fontSize: "30px",
          fontWeight: 400,
          color: "#ffffff",
          letterSpacing: "-0.01em",
          lineHeight: 1.15,
        }}>
          Synthesizing Statutory Research
        </h3>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "6px", maxWidth: "480px" }}>
          Correlating factual narrative against 1,554 codified bare act provisions across BNS, BNSS, and BSA.
        </p>
      </div>

      {/* Editorial Progress Pipeline */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: "480px",
        textAlign: "left",
      }}>
        {RESEARCH_STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                borderRadius: "12px",
                background: isCurrent
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.02)",
                border: isCurrent
                  ? "1px solid rgba(255, 255, 255, 0.25)"
                  : isDone
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid rgba(255, 255, 255, 0.04)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Step indicator dot */}
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isDone ? "#34d399" : isCurrent ? "#ffffff" : "rgba(255, 255, 255, 0.2)",
                  boxShadow: isCurrent ? "0 0 8px #ffffff" : isDone ? "0 0 6px #34d399" : "none",
                  transition: "all 0.3s ease",
                }} />

                <div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: isCurrent ? 500 : 400,
                    color: isCurrent ? "#ffffff" : isDone ? "#e2e8f0" : "hsl(var(--muted-foreground))",
                  }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>
                    {step.sub}
                  </div>
                </div>
              </div>

              {isCurrent && (
                <span style={{
                  fontSize: "10px",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#ffffff",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}>
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
