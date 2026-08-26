import React from "react";
import { VideoHero } from "../components/landing/VideoHero";
import { LegalFlowSection } from "../components/landing/LegalFlowSection";
import { FeaturesGrid } from "../components/landing/FeaturesGrid";
import { LegalDocumentSpace } from "../components/landing/LegalDocumentSpace";
import { LiveChatPreview } from "../components/landing/LiveChatPreview";
import { FinalCTA } from "../components/landing/FinalCTA";

interface LandingPageProps {
  onEnterResearch: () => void;
  onOpenStats: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterResearch,
  onOpenStats,
}) => {
  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "hsl(var(--background))" }}>
      {/* 1. Fullscreen Cinematic Background Video Hero */}
      <VideoHero onBeginJourney={onEnterResearch} />

      {/* 2. Connected Legal Flow Pipeline */}
      <LegalFlowSection />

      {/* 3. Core Capabilities Features Grid */}
      <FeaturesGrid />

      {/* 4. Codified Statutory Knowledge Space */}
      <LegalDocumentSpace />

      {/* 5. Interactive Assistant Preview */}
      <LiveChatPreview onTryNow={onEnterResearch} />

      {/* 6. Powerful Final CTA */}
      <FinalCTA onExplore={onEnterResearch} onOpenStats={onOpenStats} />
    </div>
  );
};
