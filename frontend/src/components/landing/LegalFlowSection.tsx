import React from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  BrainCircuit, 
  Search, 
  FileText, 
  Scale, 
  CheckCircle2 
} from "lucide-react";

const FLOW_STEPS = [
  {
    step: "01",
    label: "Factual Inquiry",
    subtitle: "Natural Language Input",
    desc: "A citizen, advocate, or aggrieved person submits a real-world legal dilemma in plain English.",
    icon: MessageSquare,
    badge: "Input Layer",
  },
  {
    step: "02",
    label: "Perspective Calibration",
    subtitle: "Role & Intent Analysis",
    desc: "Calibrates output depth to user persona while enforcing strict anti-criminal safety boundaries.",
    icon: BrainCircuit,
    badge: "Semantic Layer",
  },
  {
    step: "03",
    label: "Vector Retrieval",
    subtitle: "ChromaDB Embedding Search",
    desc: "Executes dense cosine similarity lookup against 1,554 statutory bare act chunks in under 50ms.",
    icon: Search,
    badge: "Vector Knowledge",
  },
  {
    step: "04",
    label: "Statutory Isolation",
    subtitle: "Official Bare Act Corpus",
    desc: "Pinpoints exact chapters and clauses from Bharatiya Nyaya Sanhita, BNSS, and Sakshya Adhiniyam.",
    icon: FileText,
    badge: "Statutory Law",
  },
  {
    step: "05",
    label: "Procedural Mapping",
    subtitle: "Offence & Penalty Extraction",
    desc: "Identifies essential legal ingredients, punishment tiers, and cognizable trial procedures.",
    icon: Scale,
    badge: "Analysis Layer",
  },
  {
    step: "06",
    label: "Grounded Synthesis",
    subtitle: "Transparent Citations",
    desc: "Produces reasoned legal guidance with exact section citations and verifiable source pages.",
    icon: CheckCircle2,
    badge: "Grounded Output",
  },
];

export const LegalFlowSection: React.FC = () => {
  return (
    <section id="flow-section" style={{ padding: "100px 0", position: "relative", background: "hsl(var(--background))" }}>
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
              Architecture & Process
            </span>
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 400,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              From inquiry to <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>legal insight.</em>
            </h2>
            <p style={{ fontSize: "15px", color: "hsl(var(--muted-foreground))", marginTop: "16px", lineHeight: 1.6 }}>
              A transparent, grounded retrieval pipeline built for precision across Indian criminal jurisprudence.
            </p>
          </motion.div>
        </div>

        {/* 6-Stage Connected Flow Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}>
          {FLOW_STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
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
                    padding: "28px",
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
                  {/* Step Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{
                      fontSize: "26px",
                      fontFamily: "'Instrument Serif', serif",
                      fontWeight: 400,
                      color: "#ffffff",
                    }}>
                      {item.step}
                    </span>
                    <span style={{
                      fontSize: "11px",
                      color: "hsl(var(--muted-foreground))",
                      background: "rgba(255, 255, 255, 0.04)",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      marginBottom: "16px",
                    }}>
                      <Icon size={20} />
                    </div>

                    <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#ffffff" }}>
                      {item.label}
                    </h3>
                    <h4 style={{ fontSize: "13px", fontWeight: 400, color: "hsl(var(--muted-foreground))", marginTop: "2px" }}>
                      {item.subtitle}
                    </h4>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", lineHeight: 1.55 }}>
                    {item.desc}
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
