import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, ShieldCheck, Database, BookOpen, Layers } from "lucide-react";
import { LegalIntelligenceCanvas } from "../3d/LegalIntelligenceCanvas";

interface LandingHeroProps {
  onEnterResearch: () => void;
  onOpenFlow: () => void;
  onOpenStats: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterResearch,
  onOpenFlow,
  onOpenStats,
}) => {
  return (
    <section style={{
      position: "relative",
      minHeight: "calc(100vh - 72px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 0 60px",
      overflow: "hidden",
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "48px",
        alignItems: "center",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Left Column: Typography & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: "inline-flex" }}
          >
            <div
              className="badge badge-cyan"
              style={{
                padding: "8px 16px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 0 20px rgba(56, 189, 248, 0.2)",
              }}
            >
              <Sparkles size={14} />
              <span>Grounded in Bharatiya Nyaya Sanhita, 2023</span>
            </div>
          </motion.div>

          {/* Headline & Subheadline */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(48px, 6vw, 76px)",
                fontWeight: 800,
                letterSpacing: "0.04em",
                lineHeight: 1.05,
                background: "linear-gradient(180deg, #ffffff 0%, #cbd5e1 60%, #94a3b8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 40px rgba(255,255,255,0.1)",
              }}
            >
              NYAYA AI
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="gradient-text"
              style={{
                fontSize: "clamp(24px, 3.2vw, 36px)",
                fontWeight: 700,
                marginTop: "8px",
                letterSpacing: "-0.01em",
              }}
            >
              AI-Powered Legal Intelligence
            </motion.h2>
          </div>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "var(--text-secondary)",
              maxWidth: "540px",
            }}
          >
            Understand laws, discover relevant legal provisions, and explore your rights with AI-powered legal research grounded in the official Bare Acts of Indian criminal law.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}
          >
            <button
              type="button"
              onClick={onEnterResearch}
              className="btn-primary"
              style={{
                fontSize: "15px",
                padding: "14px 28px",
                borderRadius: "12px",
                boxShadow: "0 0 30px rgba(56, 189, 248, 0.35)",
              }}
            >
              <span>Explore Research Engine</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={onOpenFlow}
              className="btn-secondary"
              style={{
                fontSize: "15px",
                padding: "14px 24px",
                borderRadius: "12px",
              }}
            >
              <Layers size={17} color="#38bdf8" />
              <span>How It Works</span>
            </button>
          </motion.div>

          {/* Live Trust Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{
              display: "flex",
              gap: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <div
              onClick={onOpenStats}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              title="Click to view full chunk distribution"
            >
              <Database size={16} color="#38bdf8" />
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>1,554</strong> Bare Act Chunks
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <BookOpen size={16} color="#818cf8" />
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                <strong style={{ color: "#f8fafc" }}>BNS • BNSS • BSA</strong>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={16} color="#34d399" />
              <span style={{ fontSize: "13px", color: "#cbd5e1" }}>
                Anti-Criminality Guardrails
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: 3D Legal Intelligence WebGL Centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{
            position: "relative",
            width: "100%",
            height: "520px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Ambient Glow Aura Behind 3D Canvas */}
          <div style={{
            position: "absolute",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 75%)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }} />

          {/* Interactive 3D WebGL Canvas */}
          <LegalIntelligenceCanvas />
        </motion.div>
      </div>
    </section>
  );
};
