import React from "react";
import { Sparkles } from "lucide-react";

export const HeroSection: React.FC = () => {
  return (
    <div style={{ textAlign: "center", padding: "48px 0 32px 0" }}>
      {/* Badge */}
      <div style={{ display: "inline-flex", marginBottom: "18px" }}>
        <div className="badge badge-cyan" style={{ padding: "6px 16px", fontSize: "13px" }}>
          <Sparkles size={14} /> Grounded in Official 2023 Criminal Statutes
        </div>
      </div>

      {/* Main Title */}
      <h1 style={{
        fontSize: "clamp(32px, 5vw, 52px)",
        fontWeight: 800,
        lineHeight: 1.15,
        marginBottom: "16px",
      }}>
        Next-Generation <span className="gradient-text">Indian Legal AI</span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: "clamp(16px, 2vw, 18px)",
        color: "var(--text-secondary)",
        maxWidth: "760px",
        margin: "0 auto 36px auto",
        lineHeight: 1.6,
      }}>
        Instant, verified statutory analysis across the new Indian criminal framework:{" "}
        <strong style={{ color: "#38bdf8" }}>Bharatiya Nyaya Sanhita (BNS)</strong>,{" "}
        <strong style={{ color: "#818cf8" }}>Bharatiya Nagarik Suraksha Sanhita (BNSS)</strong>, and{" "}
        <strong style={{ color: "#fbbf24" }}>Bharatiya Sakshya Adhiniyam (BSA)</strong>.
      </p>

      {/* 3 Pillars Overview Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
        maxWidth: "960px",
        margin: "0 auto",
      }}>
        <div style={{
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(56, 189, 248, 0.15)",
          borderRadius: "16px",
          padding: "20px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="badge badge-cyan">BNS, 2023</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Substantive Law</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Criminal offences, definitions, penalties, extortion, criminal intimidation, theft, and bodily harm.
          </p>
        </div>

        <div style={{
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(99, 102, 241, 0.15)",
          borderRadius: "16px",
          padding: "20px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="badge badge-indigo">BNSS, 2023</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Procedure</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Investigation, FIR registration, arrest rules, bail, summons, magistrate inquiry, and court trials.
          </p>
        </div>

        <div style={{
          background: "rgba(15, 23, 42, 0.4)",
          border: "1px solid rgba(245, 158, 11, 0.15)",
          borderRadius: "16px",
          padding: "20px",
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span className="badge badge-amber">BSA, 2023</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Evidence</span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Admissibility of electronic records, burden of proof, primary/secondary evidence, and witness rules.
          </p>
        </div>
      </div>
    </div>
  );
};
