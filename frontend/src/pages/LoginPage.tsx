import React, { useState, useEffect, useRef } from "react";
import { Scale, Mail, Lock, User as UserIcon, LogIn, UserPlus, Sparkles, Shield, CheckCircle } from "lucide-react";
import { legalApi } from "../services/api";
import type { UserDetail } from "../types/auth";

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginPageProps {
  onLoginSuccess: (user: UserDetail, isNewOrIncomplete: boolean) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  // Initialize Real Google Identity Services (GSI)
  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (!response.credential) return;
            setLoading(true);
            setError(null);
            try {
              // Send real Google ID token to backend for cryptographic verification
              await legalApi.loginWithGoogle(response.credential);
              const me = await legalApi.getMe();
              onLoginSuccess(me, !me.is_onboarding_completed);
            } catch (err: any) {
              setError(err.message || "Google authentication verification failed on server.");
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_blue",
          size: "large",
          width: 380,
          text: "signin_with",
          shape: "rectangular",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const timer = setTimeout(initGoogle, 1000);
      return () => clearTimeout(timer);
    }
  }, [googleClientId, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        await legalApi.register(email, password, fullName);
      } else {
        await legalApi.login(email, password);
      }

      const me = await legalApi.getMe();
      onLoginSuccess(me, mode === "register" || !me.is_onboarding_completed);
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClickWhenNoClientId = () => {
    setError(
      "To enable live Google OAuth popup, add your GOOGLE_CLIENT_ID to .env. Alternatively, sign in or register with email & password above!"
    );
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 10%, #1e1b4b 0%, #030712 100%)",
      padding: "24px",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        maxWidth: "960px",
        width: "100%",
        gap: "32px",
        alignItems: "center",
      }}>
        {/* Left Side: Branding & Features */}
        <div style={{ padding: "20px" }}>
          <div style={{ display: "inline-flex", marginBottom: "20px" }}>
            <div className="badge badge-cyan" style={{ padding: "6px 14px", fontSize: "12px" }}>
              <Sparkles size={14} /> Official 2023 Criminal Law Framework
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 25px rgba(56, 189, 248, 0.25)",
            }}>
              <Scale size={32} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="brand-title" style={{ fontSize: "28px", fontWeight: 800 }}>NYAYA</span>
                <span className="gradient-text" style={{ fontSize: "28px", fontWeight: 800 }}>AI</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
                Indian Criminal Law Research Engine
              </p>
            </div>
          </div>

          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#f8fafc", lineHeight: 1.3, marginBottom: "16px" }}>
            Persona-Driven AI Legal Research Grounded in BNS, BNSS & BSA
          </h2>

          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "24px" }}>
            Please sign in to access personalized legal research. NyayaAI customizes statutory analysis, FIR filing remedies, and proof requirements based on who you are.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
              <CheckCircle size={16} color="#34d399" />
              <span>Tailored for Victims, Citizens, Advocates, and Law Students</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#cbd5e1" }}>
              <Shield size={16} color="#38bdf8" />
              <span>1,554 Pre-Indexed Official Government Bare Act Chunks</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#818cf8" }}>
              <CheckCircle size={16} color="#818cf8" />
              <span>Strict Anti-Criminality & Law-Evasion Guardrails</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="glass-panel" style={{
          padding: "36px",
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                background: mode === "login" ? "rgba(56, 189, 248, 0.15)" : "transparent",
                border: mode === "login" ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                color: mode === "login" ? "#38bdf8" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                background: mode === "register" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: mode === "register" ? "1px solid var(--accent-indigo)" : "1px solid transparent",
                color: mode === "register" ? "#818cf8" : "var(--text-muted)",
                transition: "all 0.2s ease",
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#f8fafc" }}>
              {mode === "login" ? "Sign in to NyayaAI" : "Register New Account"}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
              {mode === "login"
                ? "Enter your email and password to access the legal research assistant."
                : "Create an account to complete the onboarding questionnaire."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              borderRadius: "10px",
              padding: "12px",
              fontSize: "13px",
              color: "#f87171",
              marginBottom: "18px",
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Full Name (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                  <input
                    type="text"
                    placeholder="e.g. Advocate Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 38px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "10px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "14px" }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: "8px", padding: "12px" }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : mode === "login" ? (
                <>
                  <LogIn size={16} />
                  <span>Sign In & Enter NyayaAI</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account & Onboard</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            margin: "20px 0",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
            <span style={{ padding: "0 12px" }}>or continue with</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)" }} />
          </div>

          {/* Real Google GSI Container or Action Button */}
          {googleClientId ? (
            <div
              ref={googleBtnRef}
              style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "44px" }}
            />
          ) : (
            <button
              type="button"
              onClick={handleGoogleClickWhenNoClientId}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s ease",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
