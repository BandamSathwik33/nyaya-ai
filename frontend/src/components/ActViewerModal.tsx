import React, { useState, useEffect } from "react";
import { X, ExternalLink, Download, BookOpen } from "lucide-react";

interface ActViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAct?: string;
  initialPage?: number;
}

const ACT_METADATA: Record<string, { title: string; subtitle: string; path: string; totalPages: number }> = {
  BNS: {
    title: "Bharatiya Nyaya Sanhita, 2023",
    subtitle: "Substantive Criminal Law & Penal Code",
    path: "/acts/BNS.pdf",
    totalPages: 106,
  },
  BNSS: {
    title: "Bharatiya Nagarik Suraksha Sanhita, 2023",
    subtitle: "Criminal Procedure, Investigation & Bail",
    path: "/acts/BNSS.pdf",
    totalPages: 247,
  },
  BSA: {
    title: "Bharatiya Sakshya Adhiniyam, 2023",
    subtitle: "Evidence, Admissibility & Electronic Records",
    path: "/acts/BSA.pdf",
    totalPages: 47,
  },
};

export const ActViewerModal: React.FC<ActViewerModalProps> = ({
  isOpen,
  onClose,
  initialAct = "BNS",
  initialPage = 1,
}) => {
  const [selectedAct, setSelectedAct] = useState<string>("BNS");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (initialAct) {
      const norm = initialAct.toUpperCase().replace(".PDF", "").trim();
      if (ACT_METADATA[norm]) {
        setSelectedAct(norm);
      }
    }
    if (initialPage && initialPage > 0) {
      setPage(initialPage);
    }
  }, [initialAct, initialPage, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentAct = ACT_METADATA[selectedAct] || ACT_METADATA["BNS"];
  const pdfUrl = `${currentAct.path}#page=${page}&view=FitH`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#080c14",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1150px",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.6)",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "#ffffff",
                  lineHeight: 1.2,
                }}
              >
                {currentAct.title}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {currentAct.subtitle} • Page {page}
              </p>
            </div>
          </div>

          {/* Act Switcher Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.04)",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            {(["BNS", "BNSS", "BSA"] as const).map((actKey) => (
              <button
                key={actKey}
                onClick={() => {
                  setSelectedAct(actKey);
                  setPage(1);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: selectedAct === actKey ? "rgba(255, 255, 255, 0.15)" : "transparent",
                  color: selectedAct === actKey ? "#ffffff" : "var(--text-secondary)",
                }}
              >
                {actKey}
              </button>
            ))}
          </div>

          {/* Actions & Close */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <a
              href={currentAct.path}
              target="_blank"
              rel="noreferrer"
              title="Open bare act in separate tab"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "8px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <ExternalLink size={14} />
              <span>Open Tab</span>
            </a>

            <a
              href={currentAct.path}
              download={`${selectedAct}.pdf`}
              title="Download official PDF"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "8px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-secondary)",
                padding: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div style={{ flex: 1, position: "relative", background: "#0b0f19" }}>
          <iframe
            src={pdfUrl}
            title={`${currentAct.title} PDF`}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};
