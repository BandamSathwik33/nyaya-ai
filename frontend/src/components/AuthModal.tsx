import React, { useEffect, useRef, useState } from "react";
import { X, ShieldCheck } from "lucide-react";
import { legalApi } from "../services/api";
import type { UserDetail } from "../types/auth";

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserDetail, isNewUser: boolean) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "995105926889-brmib46eoidd7as43241kcqgn5ve3d4h.apps.googleusercontent.com";

  useEffect(() => {
    if (!isOpen) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (!response.credential) return;
            setLoading(true);
            setError(null);
            try {
              await legalApi.loginWithGoogle(response.credential);
              const me = await legalApi.getMe();
              onSuccess(me, !me.is_onboarding_completed);
              onClose();
            } catch (err: any) {
              setError(err.message || "Google authentication failed on server.");
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 360,
          text: "continue_with",
          shape: "pill",
        });
      }
    };

    if (window.google) {
      setTimeout(initGoogle, 100);
    } else {
      const timer = setTimeout(initGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, googleClientId, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content-card"
        style={{
          maxWidth: "440px",
          padding: "40px 32px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
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

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "34px",
            fontWeight: 400,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            Authentication
          </h2>
          <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))", marginTop: "8px", lineHeight: 1.5 }}>
            Sign in with your Google account to access persona-calibrated legal research.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.1)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "10px",
            padding: "12px",
            fontSize: "13px",
            color: "#f87171",
            marginBottom: "20px",
            width: "100%",
          }}>
            {error}
          </div>
        )}

        {/* Loading status */}
        {loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "13px",
            color: "#ffffff",
            marginBottom: "16px",
          }}>
            <div className="spinner" style={{ width: "16px", height: "16px" }} />
            <span>Validating Google authorization...</span>
          </div>
        )}

        {/* Google Rendered SSO Container */}
        <div style={{ display: "flex", justifyContent: "center", minHeight: "44px", width: "100%", margin: "8px 0 20px" }}>
          <div ref={googleBtnRef} style={{ display: "flex", justifyContent: "center" }} />
        </div>

        {/* Trust Footnote */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "hsl(var(--muted-foreground))",
          marginTop: "12px",
        }}>
          <ShieldCheck size={14} color="#34d399" />
          <span>OAuth 2.0 cryptographically verified with Google</span>
        </div>
      </div>
    </div>
  );
};
