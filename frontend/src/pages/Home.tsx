import React, { useState, useRef } from "react";
import { Sliders, Search, UploadCloud, BookOpen } from "lucide-react";
import { QueryForm } from "../components/QueryForm";
import { CaseUploadSection } from "../components/CaseUploadSection";
import { ResultsView } from "../components/ResultsView";
import { LoadingState } from "../components/LoadingState";
import { ErrorAlert } from "../components/ErrorAlert";
import { ActViewerModal } from "../components/ActViewerModal";
import type { LegalQueryRequest, LegalQueryResponse } from "../types/legal";
import type { UserDetail, UserProfile, UserType } from "../types/auth";
import { legalApi } from "../services/api";

interface HomeProps {
  user: UserDetail | null;
  profile: UserProfile | null;
  onOpenOnboarding: () => void;
  onOpenAuth: () => void;
}

const PERSONA_LABELS: Record<UserType, { label: string; desc: string }> = {
  victim_complainant: {
    label: "Complainant / Aggrieved Person",
    desc: "Actionable remedies, safety guidance, and Section 173 BNSS FIR procedure",
  },
  citizen_general: {
    label: "General Citizen",
    desc: "Rights awareness, statutory definitions, and standard criminal procedures",
  },
  student_researcher: {
    label: "Academic / Law Scholar",
    desc: "Comparative statutory evolution from IPC/CrPC to 2023 Sanhitas",
  },
  legal_advocate: {
    label: "Advocate / Legal Practitioner",
    desc: "Case preparation, statutory cross-examinations, and evidentiary burdens under BSA",
  },
  police_officer: {
    label: "Investigation Officer",
    desc: "Investigation procedures, arrest guidelines, and search powers under BNSS",
  },
};

export const Home: React.FC<HomeProps> = ({
  user,
  profile,
  onOpenOnboarding,
}) => {
  const [activeTab, setActiveTab] = useState<"inquiry" | "upload">("inquiry");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<LegalQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<LegalQueryRequest | null>(null);

  // Act Viewer Modal state
  const [isActViewerOpen, setIsActViewerOpen] = useState(false);
  const [actViewerAct, setActViewerAct] = useState<string>("BNS");
  const [actViewerPage, setActViewerPage] = useState<number>(1);

  const resultsRef = useRef<HTMLDivElement>(null);

  const activeType: UserType = profile?.user_type || "citizen_general";
  const personaMeta = PERSONA_LABELS[activeType] || {
    label: "General Citizen",
    desc: "Rights awareness and plain statutory definitions",
  };

  const handleOpenAct = (act: string, page?: number) => {
    setActViewerAct(act);
    setActViewerPage(page || 1);
    setIsActViewerOpen(true);
  };

  const handleQuerySubmit = async (request: LegalQueryRequest) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    const enrichedRequest: LegalQueryRequest = {
      ...request,
      user_type: profile?.user_type || undefined,
      purpose: profile?.purpose || undefined,
    };
    setLastRequest(enrichedRequest);

    try {
      const data = await legalApi.queryLegalAssistant(enrichedRequest);
      setResponse(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during legal research.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseUploadSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    if (profile?.user_type) {
      formData.append("user_type", profile.user_type);
    }
    if (profile?.purpose) {
      formData.append("purpose", profile.purpose);
    }

    try {
      const data = await legalApi.analyzeCaseEvidence(formData);
      setResponse(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: any) {
      setError(err.message || "Case evidence analysis failed. Please verify the uploaded file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastRequest) {
      handleQuerySubmit(lastRequest);
    }
  };

  return (
    <div style={{
      maxWidth: "1020px",
      margin: "0 auto",
      padding: "40px 16px 80px",
      display: "flex",
      flexDirection: "column",
      gap: "28px",
      fontFamily: "var(--font-body)",
    }}>
      {/* 1. Header & Active Persona Banner */}
      <div style={{
        background: "#080c14",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "20px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Perspective:
            </span>
            <span style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#ffffff",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}>
              {personaMeta.label}
            </span>
            {user?.full_name && (
              <span style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))" }}>
                ({user.full_name})
              </span>
            )}
          </div>
          <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", marginTop: "6px" }}>
            {personaMeta.desc}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={() => handleOpenAct("BNS", 1)}
            className="liquid-glass"
            style={{
              borderRadius: "9999px",
              padding: "8px 16px",
              fontSize: "12px",
              color: "#38bdf8",
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BookOpen size={13} />
            <span>Open Bare Acts</span>
          </button>

          <button
            type="button"
            onClick={onOpenOnboarding}
            className="liquid-glass"
            style={{
              borderRadius: "9999px",
              padding: "8px 20px",
              fontSize: "13px",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sliders size={13} />
            <span>Modify Persona</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Tabs (Statutory Inquiry vs Upload Case Files) */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.03)",
          padding: "6px",
          borderRadius: "14px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          width: "fit-content",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("inquiry")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: activeTab === "inquiry" ? "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)" : "transparent",
            color: activeTab === "inquiry" ? "#38bdf8" : "var(--text-secondary)",
            borderBottom: activeTab === "inquiry" ? "2px solid #38bdf8" : "2px solid transparent",
          }}
        >
          <Search size={15} />
          <span>Statutory Inquiry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            background: activeTab === "upload" ? "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)" : "transparent",
            color: activeTab === "upload" ? "#38bdf8" : "var(--text-secondary)",
            borderBottom: activeTab === "upload" ? "2px solid #38bdf8" : "2px solid transparent",
          }}
        >
          <UploadCloud size={15} />
          <span>Upload Case File & Evidence</span>
        </button>
      </div>

      {/* 2. Main Query Interface */}
      {activeTab === "inquiry" ? (
        <QueryForm onSubmit={handleQuerySubmit} isLoading={isLoading} />
      ) : (
        <CaseUploadSection onSubmitCase={handleCaseUploadSubmit} isLoading={isLoading} />
      )}

      {/* 3. Loading Indicator */}
      {isLoading && <LoadingState />}

      {/* 4. Error Message */}
      {error && <ErrorAlert message={error} onRetry={handleRetry} />}

      {/* 5. Results View */}
      {response && (
        <div ref={resultsRef} style={{ marginTop: "12px" }}>
          <ResultsView response={response} onOpenAct={handleOpenAct} />
        </div>
      )}

      {/* 6. Interactive Bare Acts PDF Viewer Modal */}
      <ActViewerModal
        isOpen={isActViewerOpen}
        initialAct={actViewerAct}
        initialPage={actViewerPage}
        onClose={() => setIsActViewerOpen(false)}
      />
    </div>
  );
};

