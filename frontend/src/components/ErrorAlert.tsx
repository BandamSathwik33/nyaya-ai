import React from "react";
import { AlertOctagon, RefreshCw, WifiOff, ShieldAlert } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  const isNetwork = message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("network");
  const isRateLimit = message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("503");

  return (
    <div className="glass-panel" style={{
      padding: "24px",
      borderColor: "rgba(244, 63, 94, 0.35)",
      background: "rgba(30, 15, 25, 0.6)",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div style={{
          background: "rgba(244, 63, 94, 0.15)",
          padding: "10px",
          borderRadius: "12px",
          color: "#f43f5e",
          flexShrink: 0,
        }}>
          {isNetwork ? <WifiOff size={24} /> : isRateLimit ? <ShieldAlert size={24} /> : <AlertOctagon size={24} />}
        </div>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fecdd3" }}>
            {isNetwork ? "Backend Connection Error" : isRateLimit ? "Service Capacity / Rate Limit" : "Legal Research Error"}
          </h3>
          <p style={{ fontSize: "14px", color: "#fda4af", marginTop: "4px", lineHeight: "1.5" }}>
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onRetry}
            className="btn-secondary"
            style={{
              borderColor: "rgba(244, 63, 94, 0.3)",
              color: "#fecdd3",
              fontSize: "13px",
              padding: "8px 16px",
            }}
          >
            <RefreshCw size={14} />
            <span>Retry Research</span>
          </button>
        </div>
      )}
    </div>
  );
};
