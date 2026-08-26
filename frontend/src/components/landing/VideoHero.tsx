import React from "react";

interface VideoHeroProps {
  onBeginJourney: () => void;
}

export const VideoHero: React.FC<VideoHeroProps> = ({ onBeginJourney }) => {
  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      width: "100%",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "hsl(var(--background))",
      color: "hsl(var(--foreground))",
      fontFamily: "var(--font-body)",
    }}>
      {/* 1. Fullscreen Looping Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
      />

      {/* Subtle overlay to guarantee crisp text legibility */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(3, 7, 18, 0.35)",
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* 2. Hero Section (Centered Cinematic Typography) */}
      <section style={{
        position: "relative",
        zIndex: 10,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "90px 24px 160px",
        maxWidth: "1280px",
        margin: "0 auto",
        width: "100%",
      }}>
        {/* H1 Heading */}
        <h1
          className="animate-fade-rise"
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: "clamp(48px, 8vw, 104px)",
            lineHeight: 0.95,
            letterSpacing: "-2.46px",
            maxWidth: "1150px",
            fontWeight: 400,
            color: "hsl(var(--foreground))",
          }}
        >
          In the search for <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>truth,</em>{" "}
          law becomes <em style={{ fontStyle: "normal", color: "hsl(var(--muted-foreground))" }}>lucid.</em>
        </h1>

        {/* Subtext */}
        <p
          className="animate-fade-rise-delay"
          style={{
            color: "hsl(var(--muted-foreground))",
            fontSize: "clamp(16px, 2vw, 18px)",
            maxWidth: "672px",
            marginTop: "32px",
            lineHeight: 1.65,
            fontWeight: 400,
          }}
        >
          From natural factual inquiry to cited legal reasoning. The next generation of Indian criminal law intelligence across BNS, BNSS, and BSA.
        </p>

        {/* Hero CTA Button */}
        <button
          type="button"
          onClick={onBeginJourney}
          className="liquid-glass animate-fade-rise-delay-2"
          style={{
            borderRadius: "9999px",
            padding: "20px 56px",
            fontSize: "16px",
            color: "hsl(var(--foreground))",
            marginTop: "48px",
            cursor: "pointer",
            fontWeight: 500,
            outline: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Begin Journey
        </button>
      </section>
    </div>
  );
};
