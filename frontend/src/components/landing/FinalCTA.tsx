import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FinalCTAProps {
  onExplore: () => void;
  onOpenStats: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onExplore }) => {
  return (
    <section style={{ padding: "100px 0 120px", position: "relative", background: "hsl(var(--background))" }}>
      <div className="container" style={{ position: "relative", zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            padding: "64px 36px",
            textAlign: "center",
            background: "#080c14",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(38px, 5vw, 64px)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}>
              Understand the law. <br />
              <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>Know your rights.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", marginTop: "16px", maxWidth: "560px", lineHeight: 1.6 }}>
              A unified legal intelligence platform grounded directly in the 2023 codified criminal statutes of India.
            </p>
          </div>

          <button
            type="button"
            onClick={onExplore}
            className="liquid-glass"
            style={{
              borderRadius: "9999px",
              padding: "16px 44px",
              fontSize: "15px",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "12px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span>Begin Journey</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
