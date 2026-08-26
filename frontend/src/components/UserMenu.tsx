import React, { useState, useRef, useEffect } from "react";
import { LogOut, Sliders, ChevronDown } from "lucide-react";
import type { UserDetail, UserProfile, UserType } from "../types/auth";

interface UserMenuProps {
  user: UserDetail;
  profile: UserProfile | null;
  onEditPersona: () => void;
  onLogout: () => void;
}

const PERSONA_LABELS: Record<UserType, string> = {
  victim_complainant: "Complainant",
  citizen_general: "General Citizen",
  student_researcher: "Law Scholar",
  legal_advocate: "Legal Advocate",
  police_officer: "Police Officer",
};

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  profile,
  onEditPersona,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeType: UserType = profile?.user_type || "citizen_general";
  const roleLabel = PERSONA_LABELS[activeType] || "General Citizen";

  const displayName = user.full_name || user.email.split("@")[0];
  const initial = (user.full_name?.[0] || user.email[0] || "U").toUpperCase();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} style={{ position: "relative", fontFamily: "var(--font-body)" }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="liquid-glass"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderRadius: "9999px",
          padding: "6px 14px 6px 6px",
          cursor: "pointer",
          color: "#ffffff",
          outline: "none",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Minimal Initial Avatar */}
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: 600,
        }}>
          {initial}
        </div>

        {/* User Name & Minimal Role */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#ffffff", lineHeight: 1.2 }}>
            {displayName}
          </span>
          <span style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))", lineHeight: 1 }}>
            {roleLabel}
          </span>
        </div>

        <ChevronDown
          size={14}
          color="hsl(var(--muted-foreground))"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "230px",
            background: "#080c14",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
            padding: "8px",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Header Info */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ fontSize: "11px", color: "hsl(var(--muted-foreground))" }}>Signed in as</div>
            <div style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: "2px",
            }}>
              {user.email}
            </div>
            <div style={{
              display: "inline-block",
              fontSize: "10px",
              color: "hsl(var(--muted-foreground))",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "2px 8px",
              borderRadius: "4px",
              marginTop: "6px",
            }}>
              {roleLabel}
            </div>
          </div>

          {/* Modify Role */}
          <button
            type="button"
            onClick={() => {
              onEditPersona();
              setIsOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              color: "hsl(var(--muted-foreground))",
              fontSize: "13px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
            }}
          >
            <Sliders size={14} />
            <span>Customize Perspective</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              color: "hsl(var(--muted-foreground))",
              fontSize: "13px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(244, 63, 94, 0.08)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "hsl(var(--muted-foreground))";
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
