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

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
  initialProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<UserType>(initialProfile?.user_type || "victim_complainant");
  const [selectedPurpose, setSelectedPurpose] = useState<ResearchPurpose>(initialProfile?.purpose || "seeking_remedy");
  const [backgroundNotes, setBackgroundNotes] = useState(initialProfile?.background_notes || "");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "expert">(
    initialProfile?.experience_level || "beginner"
  );
  const [language, setLanguage] = useState(initialProfile?.preferred_language || "en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isStep3Valid = backgroundNotes.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isStep3Valid) {
      setError("Please outline your inquiry (at least 5 characters) to complete your profile.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: OnboardingQuestionnaireRequest = {
      user_type: selectedType,
      purpose: selectedPurpose,
      background_notes: backgroundNotes.trim(),
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
          maxWidth: "640px",
          padding: "36px",
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
            Part {step} of 3
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

        {/* STEP 3: Case Circumstances (Mandatory Input) */}
        {step === 3 && (
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
                Case circumstances
              </h2>
              <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "6px" }}>
                Outline the specific incident or legal inquiry to calibrate the research engine.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "#ffffff" }}>
                    Factual summary <span style={{ color: "#f87171" }}>*</span>
                  </label>
                  <span style={{ fontSize: "12px", color: isStep3Valid ? "#34d399" : "hsl(var(--muted-foreground))" }}>
                    {backgroundNotes.trim().length} characters
                  </span>
                </div>

                <textarea
                  required
                  value={backgroundNotes}
                  onChange={(e) => {
                    setBackgroundNotes(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Someone is demanding money under threat of property destruction..."
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: isStep3Valid ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px" }}>
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
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
                  <label style={{ display: "block", fontSize: "12px", color: "hsl(var(--muted-foreground))", marginBottom: "6px" }}>
                    Familiarity
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e: any) => setExperienceLevel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
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
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
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
                disabled={loading || !isStep3Valid}
                style={{
                  borderRadius: "9999px",
                  padding: "12px 36px",
                  fontSize: "14px",
                  color: "#ffffff",
                  cursor: isStep3Valid ? "pointer" : "not-allowed",
                  fontWeight: 500,
                  opacity: isStep3Valid ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <span>Initializing...</span>
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
