import React, { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import SetupWizard from './components/Onboarding/SetupWizard';
import ResumeList from './components/Resumes/ResumeList';
import JobTargetList from './components/JobTargets/JobTargetList';
import KanbanBoard from './components/Board/KanbanBoard';
import AIAssistant from './components/AI/AIAssistant';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import ArchiveView from './components/Archive/ArchiveView';
import HelpView from './components/Help/HelpView';
import SettingsView from './components/Settings/SettingsView';

export type Page = 'resumes' | 'targets' | 'board' | 'archive' | 'ai' | 'analytics' | 'help' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('resumes');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null); // null = loading

  // Check first-run and load theme
  useEffect(() => {
    window.jobotta.getSettings().then((s: any) => {
      const t = s?.theme || 'light';
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
      setShowOnboarding(s?.onboardingComplete !== 'true');
    }).catch(() => {
      setShowOnboarding(true);
    });
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Still loading settings
  if (showOnboarding === null) return null;

  // First-run wizard
  if (showOnboarding) {
    return <SetupWizard onComplete={() => setShowOnboarding(false)} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'resumes': return <ResumeList />;
      case 'targets': return <JobTargetList />;
      case 'board': return <KanbanBoard />;
      case 'archive': return <ArchiveView />;
      case 'ai': return <AIAssistant />;
      case 'analytics': return <AnalyticsDashboard />;
      case 'help': return <HelpView />;
      case 'settings': return <SettingsView onThemeChange={handleThemeChange} />;
    }
  };

  const pageTitle: Record<Page, string> = {
    resumes: 'Resumes',
    targets: 'Job Targets',
    board: 'Job Board',
    archive: 'Archive',
    ai: 'AI Assistant',
    analytics: 'Analytics',
    help: 'Help & Support',
    settings: 'Settings',
  };

  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="main-content">
        <div className="content-header">
          <h2>{pageTitle[currentPage]}</h2>
        </div>
        <div className="content-body">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
