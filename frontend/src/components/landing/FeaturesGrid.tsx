import React from "react";
import { motion } from "framer-motion";
import { 
  ScanSearch, 
  FileCheck2, 
  Layers, 
  Quote, 
  FolderArchive, 
  ShieldCheck 
} from "lucide-react";

const FEATURES = [
  {
    title: "Legal Query Analysis",
    tagline: "Intent & Perspective Mapping",
    description: "Evaluates complex factual inquiries, categorizes cognitive offences, and adapts legal synthesis to victim, citizen, or advocate perspectives.",
    icon: ScanSearch,
    badge: "Factual Parsing",
  },
  {
    title: "Relevant Statutory Provisions",
    tagline: "BNS, BNSS & BSA Isolation",
    description: "Extracts exact chapters, sections, definitions, and trial procedures directly from the codified 2023 criminal statutes.",
    icon: FileCheck2,
    badge: "Statutory Law",
  },
  {
    title: "Semantic Legal Search",
    tagline: "Sub-Second Vector Lookups",
    description: "Dense vector search powered by local sentence embeddings, delivering relevant legal passages in less than 50 milliseconds.",
    icon: Layers,
    badge: "ChromaDB RAG",
  },
  {
    title: "Citation-Based Answers",
    tagline: "100% Grounded Transparency",
    description: "Every synthesized sentence is verifiable against specific Bare Act PDF pages, document chunks, and statutory provision headers.",
    icon: Quote,
    badge: "Zero Hallucination",
  },
  {
    title: "Legal Document Retrieval",
    tagline: "Granular PDF Page Slicing",
    description: "Explore Bare Act chunks with direct access to Section text, punishment ranges, and procedural rules under the 2023 legal reform.",
    icon: FolderArchive,
    badge: "Bare Act Corpus",
  },
  {
    title: "Ethical Safety Architecture",
    tagline: "Strict Anti-Criminality Boundaries",
    description: "Real-time interception against evidence tampering, witness intimidation, and law evasion with authoritative statutory warnings.",
    icon: ShieldCheck,
    badge: "Safety Protocol",
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section id="features-section" style={{ padding: "100px 0", position: "relative", background: "hsl(var(--background))" }}>
      <div className="container">
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 60px" }}>
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
              Core Capabilities
            </span>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Engineered for <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>precision & integrity.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", marginTop: "16px", lineHeight: 1.6 }}>
              A robust intelligence stack built for practitioners, researchers, and citizens seeking verified legal grounding.
            </p>
          </motion.div>
        </div>

        {/* Feature Cards Grid */}
        <div className="responsive-card-grid">
          {FEATURES.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div
                  style={{
                    background: "#080c14",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "18px",
                    padding: "32px",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "20px",
                    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.5)",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                      }}>
                        <Icon size={20} />
                      </div>
                      <span style={{
                        fontSize: "11px",
                        color: "hsl(var(--muted-foreground))",
                        background: "rgba(255, 255, 255, 0.04)",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: "1px solid rgba(255, 255, 255, 0.06)",
                      }}>
                        {feat.badge}
                      </span>
                    </div>

                    {/* Title & Tagline */}
                    <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>
                      {feat.title}
                    </h3>
                    <h4 style={{ fontSize: "13px", fontWeight: 400, color: "hsl(var(--muted-foreground))" }}>
                      {feat.tagline}
                    </h4>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
