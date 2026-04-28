import { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Language, Section } from "./types";
import { logout, activatePremium, addXP } from "./auth";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import GrammarSection from "./components/GrammarSection";
import ToetsSection from "./components/ToetsSection";
import OefeningSection from "./components/OefeningSection";
import AISection from "./components/AISection";

function MainApp() {
  const { account, setAccount, setLanguage, theme, refreshAccount } = useApp();
  const isDark = theme === "dark";
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (account) refreshAccount();
  }, []);

  const handleLogout = () => {
    logout();
    setAccount(null);
    setActiveSection(null);
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setActiveSection("grammar");
  };

  const handleSubscribe = (months: number) => {
    if (!account) return;
    try { setAccount(activatePremium(account.uid, months)); } catch {}
  };

  const handleEarnXP = (amount: number) => {
    if (!account) return;
    try { setAccount(addXP(account.uid, amount)); } catch {}
  };

  if (!account) return <LoginPage />;

  const renderContent = () => {
    if (!activeSection) {
      return <Dashboard onSelectLanguage={handleSelectLanguage} onGoToAI={() => setActiveSection("ai")} />;
    }
    switch (activeSection) {
      case "grammar": return <GrammarSection />;
      case "toets": return <ToetsSection onEarnXP={handleEarnXP} />;
      case "oefening": return <OefeningSection onEarnXP={handleEarnXP} />;
      case "ai": return (
        <AISection
          isPremium={account.isPremium}
          premiumExpiry={account.premiumExpiry}
          onSubscribe={(months: number) => handleSubscribe(months)}
        />
      );
      default: return <Dashboard onSelectLanguage={handleSelectLanguage} onGoToAI={() => setActiveSection("ai")} />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-950" : "bg-slate-50"}`}>
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onLogout={handleLogout}
        onHome={() => setActiveSection(null)}
      />
      <main className={activeSection === "ai" ? "" : "pb-20"}>
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
