import React from "react";
import { Scale, Shield } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-subtle)",
      background: "rgba(10, 13, 20, 0.95)",
      padding: "40px 0 30px 0",
      marginTop: "80px",
    }}>
      <div className="container" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Scale size={20} color="#38bdf8" />
          <span className="brand-title" style={{ fontSize: "16px", fontWeight: 700 }}>NYAYA AI</span>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "680px", lineHeight: "1.6" }}>
          NyayaAI is an AI-powered legal research platform built strictly upon the indexed official texts of the Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita, and Bharatiya Sakshya Adhiniyam.
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "var(--text-muted)",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "6px 14px",
          borderRadius: "9999px",
          border: "1px solid var(--border-subtle)",
        }}>
          <Shield size={13} color="#34d399" />
          <span>Informational Legal-Tech Assistant • Not a substitute for formal legal counsel</span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
          © {new Date().getFullYear()} NyayaAI. All statutory rights reserved.
        </div>
      </div>
    </footer>
  );
};
