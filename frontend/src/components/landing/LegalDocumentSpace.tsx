import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Scale, Landmark, Quote, Hash } from "lucide-react";

const DOCUMENT_TILES = [
  {
    type: "Act",
    title: "Bharatiya Nyaya Sanhita, 2023",
    subtitle: "Substantive Criminal Law",
    meta: "Act No. 45 of 2023 • 358 Sections",
    code: "BNS",
    icon: BookOpen,
  },
  {
    type: "Section",
    title: "Section 308: Extortion",
    subtitle: "Offence against Property",
    meta: "Cognizable • Non-Bailable • Imprisonment up to 7 years",
    code: "SEC 308",
    icon: Hash,
  },
  {
    type: "Provision",
    title: "Section 173: FIR Registration",
    subtitle: "Information in Cognizable Cases",
    meta: "Mandatory Electronic / Oral FIR Procedure",
    code: "BNSS 173",
    icon: Scale,
  },
  {
    type: "Judgment Standard",
    title: "Electronic Records Admissibility",
    subtitle: "Section 63 Certificate Standard",
    meta: "Digital Device Evidence & Cryptographic Verification",
    code: "BSA 63",
    icon: Landmark,
  },
  {
    type: "Citation Index",
    title: "Statutory Chunk Index",
    subtitle: "1,554 Granular Chunks",
    meta: "Zero Hallucination Grounded Embeddings",
    code: "CORPUS",
    icon: Quote,
  },
];

export const LegalDocumentSpace: React.FC = () => {
  return (
    <section id="docspace-section" style={{ padding: "100px 0", position: "relative", background: "hsl(var(--background))" }}>
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
              Knowledge Topology
            </span>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              Codified in <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>statutory depth.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", marginTop: "16px", lineHeight: 1.6 }}>
              Every Act, Section, Provision, and Evidentiary Rule indexed in a unified semantic graph.
            </p>
          </motion.div>
        </div>

        {/* Document Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}>
          {DOCUMENT_TILES.map((doc, idx) => {
            const Icon = doc.icon;
            return (
              <motion.div
                key={doc.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <div
                  style={{
                    background: "#080c14",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "18px",
                    padding: "28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    boxShadow: "0 15px 40px rgba(0, 0, 0, 0.5)",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ffffff" }}>
                      <Icon size={18} />
                      <span style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        {doc.type}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "11px",
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "hsl(var(--muted-foreground))",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}>
                      {doc.code}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#ffffff" }}>
                      {doc.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
                      {doc.subtitle}
                    </p>
                  </div>

                  <div style={{
                    paddingTop: "14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    fontSize: "12px",
                    color: "hsl(var(--muted-foreground))",
                  }}>
                    {doc.meta}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
