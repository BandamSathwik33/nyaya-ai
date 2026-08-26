import { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { StatsModal } from "./components/StatsModal";
import { AuthModal } from "./components/AuthModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { LandingPage } from "./pages/LandingPage";
import { Home } from "./pages/Home";
import { legalApi, tokenStorage } from "./services/api";
import type { UserDetail, UserProfile } from "./types/auth";

export function App() {
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<"landing" | "research">("landing");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = tokenStorage.get();
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const me = await legalApi.getMe();
        setUser(me);
        if (me.profile) {
          setProfile(me.profile);
        }
        if (!me.is_onboarding_completed) {
          setIsOnboardingOpen(true);
        }
      } catch {
        tokenStorage.clear();
        setUser(null);
        setProfile(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserDetail, isNewOrIncomplete: boolean) => {
    setUser(authenticatedUser);
    if (authenticatedUser.profile) {
      setProfile(authenticatedUser.profile);
    }
    if (isNewOrIncomplete || !authenticatedUser.is_onboarding_completed) {
      setIsOnboardingOpen(true);
    }
    setActiveView("research");
  };

  const handleOnboardingCompleted = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (user) {
      setUser({
        ...user,
        is_onboarding_completed: true,
        profile: updatedProfile,
      });
    }
    setActiveView("research");
  };

  const handleLogout = () => {
    legalApi.logout();
    setUser(null);
    setProfile(null);
    setActiveView("landing");
  };

  const handleEnterResearch = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setActiveView("research");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#030712",
        color: "#38bdf8",
        fontSize: "16px",
        fontWeight: 600,
        gap: "12px",
      }}>
        <div className="spinner" />
        <span>Loading NyayaAI Legal Intelligence...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#030712" }}>
      {/* Top Navigation */}
      <Navbar
        onOpenStats={() => setIsStatsOpen(true)}
        user={user}
        profile={profile}
        activeView={activeView}
        onSelectView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeView === "landing" ? (
          <LandingPage
            onEnterResearch={handleEnterResearch}
            onOpenStats={() => setIsStatsOpen(true)}
          />
        ) : (
          <div className="container" style={{ paddingTop: "24px" }}>
            <Home
              user={user}
              profile={profile}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Persistent Footer */}
      <Footer />

      {/* Modals */}
      <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCompleted={handleOnboardingCompleted}
        initialProfile={profile}
      />
    </div>
  );
}

export default App;
