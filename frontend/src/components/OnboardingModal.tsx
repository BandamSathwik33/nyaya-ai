import React, { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { legalApi } from "../services/api";
import type { OnboardingQuestionnaireRequest, ResearchPurpose, UserProfile, UserType } from "../types/auth";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (profile: UserProfile) => void;
  initialProfile?: UserProfile | null;
}

const ROLES: Array<{
  type: UserType;
  title: string;
  category: string;
  description: string;
}> = [
  {
    type: "victim_complainant",
    title: "Complainant / Aggrieved Person",
    category: "Actionable Protection",
    description: "Facing an active offence or dispute. Requires plain guidance on police complaints, safety remedies, and FIR registration.",
  },
  {
    type: "legal_advocate",
    title: "Advocate / Legal Practitioner",
    category: "Professional Practice",
    description: "Preparing court arguments, bail petitions, statutory cross-examinations, and evidentiary burdens under BSA.",
  },
  {
    type: "student_researcher",
    title: "Academic / Law Scholar",
    category: "Comparative Jurisprudence",
    description: "Conducting conceptual research on the transition from IPC, CrPC, and IEA to the 2023 Sanhitas.",
  },
  {
    type: "citizen_general",
    title: "General Citizen",
    category: "Rights Awareness",
    description: "Seeking to understand legal rights, statutory definitions, and standard procedures under Indian law.",
  },
];

const OBJECTIVES: Array<{
  purpose: ResearchPurpose;
  title: string;
  detail: string;
}> = [
  {
    purpose: "seeking_remedy",
    title: "Immediate Legal Remedies & Safety",
    detail: "Understand immediate protective measures, restraining relief, and lawful remedies.",
  },
  {
    purpose: "reporting_crime",
    title: "Filing an FIR & Police Procedures",
    detail: "Step-by-step guidance under Section 173 BNSS for cognizable offence reporting.",
  },
  {
    purpose: "case_preparation",
    title: "Litigation & Defence Preparation",
    detail: "Examine statutory elements, penal clauses, exceptions, and evidentiary standards.",
  },
  {
    purpose: "academic_study",
    title: "Statutory Reference & Analysis",
    detail: "In-depth legislative text exploration, definitions, and chapter comparisons.",
  },
];

const DOMAIN_OPTIONS: Array<{
  id: string;
  title: string;
  subtitle: string;
  defaultNotes: string;
  icon: string;
  actBadge: string;
}> = [
  {
    id: "extortion_threat",
    title: "Extortion, Threat & Criminal Intimidation",
    subtitle: "Threats to person or property, blackmail, extortion demands under Section 308 BNS.",
    defaultNotes: "Threats, extortion, criminal intimidation, or coercion under BNS.",
    icon: "🛡️",
    actBadge: "BNS",
  },
  {
    id: "fir_procedure",
    title: "Police FIR & Investigation Safeguards",
    subtitle: "Lodging an FIR under Section 173 BNSS, zero FIR, arrest rules & bail procedures.",
    defaultNotes: "Filing an FIR, police procedure, arrest rights, and bail under BNSS.",
    icon: "📑",
    actBadge: "BNSS",
  },
  {
    id: "fraud_cheating",
    title: "Financial Cheating, Cyber Fraud & Forgery",
    subtitle: "Online scam, UPI/banking fraud, breach of trust, forged documents under BNS.",
    defaultNotes: "Financial cheating, cyber fraud, forgery, and breach of trust.",
    icon: "💳",
    actBadge: "BNS",
  },
  {
    id: "digital_evidence",
    title: "Electronic Evidence & Digital Records",
    subtitle: "WhatsApp chats, CCTV footage, call logs & Section 63 BSA certificate criteria.",
    defaultNotes: "Electronic records, digital certificates under Sec 63 BSA, and admissibility.",
    icon: "📱",
    actBadge: "BSA",
  },
  {
    id: "general_awareness",
    title: "General Criminal Law & Rights Awareness",
    subtitle: "Statutory rights, procedural timelines, legal definitions & Sanhitas reference.",
    defaultNotes: "General legal inquiry, rights awareness, and statutory provisions.",
    icon: "⚖️",
    actBadge: "All Acts",
  },
  {
    id: "custom_inquiry",
    title: "Custom Legal Scenario (Optional Details)",
    subtitle: "Provide your own specific factual scenario or custom inquiry notes.",
    defaultNotes: "",
    icon: "✍️",
    actBadge: "Custom",
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<UserType>(initialProfile?.user_type || "victim_complainant");
  const [selectedPurpose, setSelectedPurpose] = useState<ResearchPurpose>(initialProfile?.purpose || "seeking_remedy");
  const [selectedDomain, setSelectedDomain] = useState<string>("extortion_threat");
  const [backgroundNotes, setBackgroundNotes] = useState(initialProfile?.background_notes || "");
  const [showCustomText, setShowCustomText] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "expert">(
    initialProfile?.experience_level || "beginner"
  );
  const [language, setLanguage] = useState(initialProfile?.preferred_language || "en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId);
    const domain = DOMAIN_OPTIONS.find((d) => d.id === domainId);
    if (domainId === "custom_inquiry") {
      setShowCustomText(true);
    } else {
      setShowCustomText(false);
      setBackgroundNotes(domain?.defaultNotes || "");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const chosenDomain = DOMAIN_OPTIONS.find((d) => d.id === selectedDomain);
    const finalNotes = backgroundNotes.trim() || chosenDomain?.defaultNotes || "General statutory inquiry";

    const payload: OnboardingQuestionnaireRequest = {
      user_type: selectedType,
      purpose: selectedPurpose,
      background_notes: finalNotes,
      experience_level: experienceLevel,
      preferred_language: language,
    };

    try {
      const profile = await legalApi.submitOnboarding(payload);
      onCompleted(profile);
      onClose();
    } catch (err: any) {
      setError(err.message || "Unable to save profile preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content-card"
        style={{
          maxWidth: "680px",
          padding: "36px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Close control */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            background: "transparent",
            border: "none",
            color: "hsl(var(--muted-foreground))",
            cursor: "pointer",
            padding: "4px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
        >
          <X size={18} />
        </button>

        {/* Progress indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Step {step} of 3
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: "32px",
                  height: "2px",
                  background: s <= step ? "#ffffff" : "rgba(255, 255, 255, 0.15)",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "13px",
            color: "#f87171",
            marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        {/* STEP 1: Perspective Selection */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}>
                Select your perspective
              </h2>
              <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "6px" }}>
                Analysis tone, procedural guidance, and statutory depth adapt to your role.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ROLES.map((role) => {
                const isSelected = selectedType === role.type;
                return (
                  <div
                    key={role.type}
                    onClick={() => setSelectedType(role.type)}
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
                          {role.title}
                        </h3>
                        <span style={{
                          fontSize: "11px",
                          color: "hsl(var(--muted-foreground))",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}>
                          {role.category}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "4px", lineHeight: 1.45 }}>
                        {role.description}
                      </p>
                    </div>

                    {/* Radio indicator */}
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: isSelected ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}>
                      {isSelected && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px" }}>
              <button
                type="button"
                className="liquid-glass"
                onClick={() => setStep(2)}
                style={{
                  borderRadius: "9999px",
                  padding: "12px 32px",
                  fontSize: "14px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Objective Selection */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "32px",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}>
                Primary objective
              </h2>
              <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "6px" }}>
                What are you seeking to determine or prepare?
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {OBJECTIVES.map((obj) => {
                const isSelected = selectedPurpose === obj.purpose;
                return (
                  <div
                    key={obj.purpose}
                    onClick={() => setSelectedPurpose(obj.purpose)}
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "14px",
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>
                        {obj.title}
                      </h3>
                      <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "2px" }}>
                        {obj.detail}
                      </p>
                    </div>

                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: isSelected ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {isSelected && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>

              <button
                type="button"
                className="liquid-glass"
                onClick={() => setStep(3)}
                style={{
                  borderRadius: "9999px",
                  padding: "12px 32px",
                  fontSize: "14px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Legal Scenario & Domain Selection (Option Selection Based) */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "30px",
                fontWeight: 400,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}>
                Primary legal scenario
              </h2>
              <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "4px" }}>
                Select your legal inquiry area to pre-calibrate statutory citations and provisions.
              </p>
            </div>

            {/* Option Cards Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginBottom: "18px" }}>
              {DOMAIN_OPTIONS.map((domain) => {
                const isSelected = selectedDomain === domain.id;
                return (
                  <div
                    key={domain.id}
                    onClick={() => handleDomainSelect(domain.id)}
                    style={{
                      background: isSelected ? "rgba(255, 255, 255, 0.07)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "1px solid rgba(255, 255, 255, 0.45)" : "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      transition: "all 0.18s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "20px", flexShrink: 0 }}>{domain.icon}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>
                            {domain.title}
                          </h3>
                          <span style={{
                            fontSize: "10px",
                            color: "hsl(var(--muted-foreground))",
                            background: "rgba(255, 255, 255, 0.06)",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            fontWeight: 500,
                          }}>
                            {domain.actBadge}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", marginTop: "2px", lineHeight: 1.35 }}>
                          {domain.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Radio indicator */}
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: isSelected ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {isSelected && (
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffffff" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Custom Notes */}
            {showCustomText && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px" }}>
                  Specific Case Details / Notes (Optional)
                </label>
                <textarea
                  value={backgroundNotes}
                  onChange={(e) => setBackgroundNotes(e.target.value)}
                  placeholder="Outline any specific dates, amounts, or incident facts..."
                  rows={2}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>
            )}

            {/* Language & Familiarity Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}>
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="en" style={{ background: "#080c14" }}>English</option>
                  <option value="hi" style={{ background: "#080c14" }}>Hindi (हिंदी)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}>
                  Familiarity
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e: any) => setExperienceLevel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="beginner" style={{ background: "#080c14" }}>General (Plain English)</option>
                  <option value="intermediate" style={{ background: "#080c14" }}>Academic / Student</option>
                  <option value="expert" style={{ background: "#080c14" }}>Practicing Advocate</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>

              <button
                type="button"
                className="liquid-glass"
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  borderRadius: "9999px",
                  padding: "12px 36px",
                  fontSize: "14px",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <span>Enter Workbench</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
