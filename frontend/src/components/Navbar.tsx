import React from "react";
import { UserMenu } from "./UserMenu";
import type { UserDetail, UserProfile } from "../types/auth";

interface NavbarProps {
  onOpenStats: () => void;
  onOpenBareActs?: () => void;
  user: UserDetail | null;
  profile: UserProfile | null;
  activeView: "landing" | "research";
  onSelectView: (view: "landing" | "research") => void;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  profile,
  activeView,
  onSelectView,
  onOpenStats: _onOpenStats,
  onOpenBareActs,
  onOpenAuth,
  onOpenOnboarding,
  onLogout,
}) => {
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(3, 7, 18, 0.75)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    }}>
      <div
        className="nav-header-inner"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 32px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Brand */}
        <div
          onClick={() => onSelectView("landing")}
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "28px",
            letterSpacing: "-0.02em",
            color: "hsl(var(--foreground))",
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          NYAYA<sup style={{ fontSize: "11px", verticalAlign: "super" }}>®</sup>
        </div>

        {/* Center Nav Links (Hidden on mobile) */}
        <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <button
            type="button"
            onClick={() => onSelectView("landing")}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
              fontWeight: activeView === "landing" ? 500 : 400,
              color: activeView === "landing" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeView !== "landing") {
                onSelectView("landing");
                setTimeout(() => document.getElementById("flow-section")?.scrollIntoView({ behavior: "smooth" }), 100);
              } else {
                document.getElementById("flow-section")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
              fontWeight: 400,
              color: "hsl(var(--muted-foreground))",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
          >
            Intelligence Flow
          </button>

          <button
            type="button"
            onClick={() => onSelectView("research")}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
              fontWeight: activeView === "research" ? 500 : 400,
              color: activeView === "research" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
            onMouseLeave={(e) => (e.currentTarget.style.color = activeView === "research" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))")}
          >
            Legal Workbench
          </button>

          {onOpenBareActs && (
            <button
              type="button"
              onClick={onOpenBareActs}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: 400,
                color: "#38bdf8",
                cursor: "pointer",
                transition: "color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7dd3fc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#38bdf8")}
            >
              <span>Bare Acts (BNS / BNSS / BSA)</span>
            </button>
          )}
        </div>

        {/* Right CTA / User controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user ? (
            <UserMenu
              user={user}
              profile={profile}
              onEditPersona={onOpenOnboarding}
              onLogout={onLogout}
            />
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="liquid-glass"
              style={{
                borderRadius: "9999px",
                padding: "8px 22px",
                fontSize: "13px",
                color: "hsl(var(--foreground))",
                cursor: "pointer",
                fontWeight: 500,
                outline: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
