import React from "react";
import { motion } from "framer-motion";
import { Scale, User, FileCheck, ArrowRight, BookOpen, Layers } from "lucide-react";

interface LiveChatPreviewProps {
  onTryNow: () => void;
}

export const LiveChatPreview: React.FC<LiveChatPreviewProps> = ({ onTryNow }) => {
  return (
    <section id="preview-section" style={{ padding: "100px 0", position: "relative", background: "hsl(var(--background))" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto 60px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span style={{
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 500,
              display: "inline-block",
              marginBottom: "12px",
            }}>
              Simulation
            </span>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Live synthesis <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>preview.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", marginTop: "16px", lineHeight: 1.6 }}>
              Experience how the research engine parses complex inquiries into verified statutory citations.
            </p>
          </motion.div>
        </div>

        {/* Console Card */}
        <div style={{ maxWidth: "840px", margin: "0 auto" }}>
          <div
            style={{
              background: "#080c14",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              padding: "36px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: "16px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Scale size={18} color="#ffffff" />
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#ffffff" }}>
                  NYAYA Intelligence Engine
                </span>
                <span style={{
                  fontSize: "11px",
                  color: "hsl(var(--muted-foreground))",
                  background: "rgba(255, 255, 255, 0.04)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}>
                  BNS • BNSS • BSA
                </span>
              </div>

              <span style={{
                fontSize: "11px",
                color: "#34d399",
                background: "rgba(52, 211, 153, 0.08)",
                padding: "3px 10px",
                borderRadius: "9999px",
                border: "1px solid rgba(52, 211, 153, 0.2)",
              }}>
                Grounded Analysis
              </span>
            </div>

            {/* User Inquiry */}
            <div style={{
              background: "rgba(255, 255, 255, 0.02)",
              padding: "16px 20px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}>
              <User size={16} color="hsl(var(--muted-foreground))" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                  Inquiry
                </div>
                <p style={{ fontSize: "14px", color: "#ffffff", lineHeight: 1.5 }}>
                  "Someone threatened me with physical harm and demanded money over the phone. Which legal provisions are relevant and what immediate steps should I take?"
                </p>
              </div>
            </div>

            {/* AI Answer */}
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
            }}>
              <Scale size={16} color="#ffffff" style={{ marginTop: "3px", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>
                    Statutory Synthesis
                  </div>
                  <p style={{ fontSize: "14px", color: "#d1d5db", lineHeight: 1.65 }}>
                    Under Indian criminal law, threatening harm to demand property constitutes the cognizable offence of <strong style={{ color: "#ffffff" }}>Extortion</strong>. You are entitled to immediate police registration under mandatory electronic or oral FIR procedures.
                  </p>
                </div>

                {/* Citations */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{
                    fontSize: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}>
                    <BookOpen size={12} /> Section 308 BNS (Extortion)
                  </span>

                  <span style={{
                    fontSize: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}>
                    <FileCheck size={12} /> Section 173 BNSS (FIR Procedure)
                  </span>

                  <span style={{
                    fontSize: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    color: "#ffffff",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}>
                    <Layers size={12} /> Section 351 BNS (Intimidation)
                  </span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={onTryNow}
                className="liquid-glass"
                style={{
                  borderRadius: "9999px",
                  padding: "10px 24px",
                  fontSize: "13px",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Launch Research Workbench</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
