import React, { useState, useRef } from "react";
import { Sliders } from "lucide-react";
import { QueryForm } from "../components/QueryForm";
import { ResultsView } from "../components/ResultsView";
import { LoadingState } from "../components/LoadingState";
import { ErrorAlert } from "../components/ErrorAlert";
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
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<LegalQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<LegalQueryRequest | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const activeType: UserType = profile?.user_type || "citizen_general";
  const personaMeta = PERSONA_LABELS[activeType] || {
    label: "General Citizen",
    desc: "Rights awareness and plain statutory definitions",
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

      {/* 2. Main Query Interface */}
      <QueryForm onSubmit={handleQuerySubmit} isLoading={isLoading} />

      {/* 3. Loading Indicator */}
      {isLoading && <LoadingState />}

      {/* 4. Error Message */}
      {error && <ErrorAlert message={error} onRetry={handleRetry} />}

      {/* 5. Results View */}
      {response && (
        <div ref={resultsRef} style={{ marginTop: "12px" }}>
          <ResultsView response={response} />
        </div>
      )}
    </div>
  );
};
