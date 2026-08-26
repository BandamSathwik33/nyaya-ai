import React from "react";
import { Bookmark } from "lucide-react";

interface LegalAnswerRendererProps {
  content: string;
}

export const LegalAnswerRenderer: React.FC<LegalAnswerRendererProps> = ({ content }) => {
  if (!content) return null;

  // 1. Helper to render text with bold terms and inline citation badges
  const renderFormattedText = (text: string) => {
    // Replace citation patterns [Doc.pdf, Pages X-Y, Chunks '...'] with clean badges
    const citationRegex = /\[([A-Za-z0-9_.-]+(?:,\s*(?:Pages?|Page)\s*[0-9–-]+)?(?:,\s*Chunks?\s*['`][^'`]+['`])?)\]/g;

    const parts = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const rawCitation = match[1];
      // Clean display text (e.g. "BNSS.pdf, Pages 54-55" without ugly chunk keys)
      const cleanLabel = rawCitation
        .replace(/,\s*Chunks?\s*['`][^'`]+['`]/gi, "")
        .replace(/\.pdf/gi, "");

      parts.push(
        <span
          key={match.index}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: 500,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#ffffff",
            padding: "2px 8px",
            borderRadius: "6px",
            margin: "0 4px",
            verticalAlign: "middle",
          }}
          title={rawCitation}
        >
          <Bookmark size={10} color="#fbbf24" />
          <span>{cleanLabel}</span>
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Now format bold text (**text**)
    return parts.map((part, idx) => {
      if (typeof part !== "string") return part;

      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return (
        <React.Fragment key={idx}>
          {boldParts.map((sub, sIdx) => {
            if (sub.startsWith("**") && sub.endsWith("**")) {
              const cleanBold = sub.slice(2, -2);
              return (
                <strong key={sIdx} style={{ color: "#ffffff", fontWeight: 600 }}>
                  {cleanBold}
                </strong>
              );
            }
            return sub;
          })}
        </React.Fragment>
      );
    });
  };

  // 2. Split response by markdown section headers (### Header)
  const sections = content.split(/(?=###\s+)/g).filter((s) => s.trim().length > 0);

  // If text does not contain ### headers, split by standard double newlines
  if (sections.length <= 1 && !content.includes("###")) {
    const paragraphs = content.split(/\n\n+/g);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ fontSize: "14px", lineHeight: 1.75, color: "#d1d5db" }}>
            {renderFormattedText(p)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sections.map((sec, secIdx) => {
        const lines = sec.trim().split("\n");
        const rawTitleLine = lines[0] || "";
        const isHeader = rawTitleLine.startsWith("###");
        const title = isHeader ? rawTitleLine.replace(/^###\s+/, "") : "";
        const bodyLines = isHeader ? lines.slice(1) : lines;
        const bodyText = bodyLines.join("\n").replace(/^---\s*$/gm, "").trim();

        if (!title && !bodyText) return null;

        // Group list items or bullet points
        const items = bodyText
          .split(/\n(?=(?:[0-9]+\.\s+|\*\s+|-|\u2022))/g)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        return (
          <div
            key={secIdx}
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "16px",
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Section Header */}
            {title && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                }}>
                  {secIdx + 1}
                </div>
                <h4 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}>
                  {title}
                </h4>
              </div>
            )}

            {/* Content Body */}
            {items.length > 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {items.map((item, itemIdx) => {
                  // Check if item starts with a numbered bullet (e.g. 1. **Title:** Desc)
                  const matchNumber = item.match(/^([0-9]+)\.\s+/);
                  const isNumbered = Boolean(matchNumber);
                  const cleanItemText = item.replace(/^(?:[0-9]+\.\s+|\*\s+|-|\u2022\s*)/, "");

                  return (
                    <div
                      key={itemIdx}
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: "rgba(255, 255, 255, 0.015)",
                        border: "1px solid rgba(255, 255, 255, 0.04)",
                      }}
                    >
                      {isNumbered ? (
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#94a3b8",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}>
                          {matchNumber![1]}
                        </span>
                      ) : (
                        <div style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "rgba(255, 255, 255, 0.4)",
                          marginTop: "8px",
                          flexShrink: 0,
                        }} />
                      )}

                      <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#d1d5db", flex: 1 }}>
                        {renderFormattedText(cleanItemText)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "14px", lineHeight: 1.75, color: "#d1d5db" }}>
                {renderFormattedText(bodyText)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
