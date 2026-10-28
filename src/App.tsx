import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Home } from './components/Home.js';
import { GuideView } from './components/GuideView.js';
import { ResearchProgress } from './components/ResearchProgress.js';
import { ResearchDecisions } from './components/ResearchDecisions.js';
import { IntakeModal } from './components/IntakeModal.js';
import { fetchAllGuides, fetchGuide, startResearchJob } from './api/client.js';
import { GuideSummary, Guide, GuideAssumptions } from './types/client.js';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'guide' | 'research' | 'job'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/research') return 'research';
      if (path.startsWith('/guides/')) return 'guide';
      if (path.startsWith('/jobs/')) return 'job';
    }
    return 'home';
  });
  const [guides, setGuides] = useState<GuideSummary[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/jobs/')) {
        return path.replace('/jobs/', '');
      }
    }
    return null;
  });
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeProvider, setIntakeProvider] = useState('');
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/guides/') || path.startsWith('/jobs/')) return true;
    }
    return false;
  });
  const [isDark, setIsDark] = useState(true);

  // Sync initial URL on mount and handle popstate
  useEffect(() => {
    loadGuidesList();

    const handleLocation = () => {
      const path = window.location.pathname;
      if (path === '/research') {
        setCurrentRoute('research');
      } else if (path.startsWith('/guides/')) {
        const id = path.replace('/guides/', '');
        if (id) {
          loadSingleGuide(id);
        }
      } else if (path.startsWith('/jobs/')) {
        const jobId = path.replace('/jobs/', '');
        if (jobId) {
          setActiveJobId(jobId);
          setCurrentRoute('job');
        }
      } else {
        setCurrentRoute('home');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const loadGuidesList = async () => {
    try {
      const data = await fetchAllGuides();
      setGuides(data);
    } catch (e) {
      console.error('Failed to load guides:', e);
    }
  };

  const loadSingleGuide = async (idOrSlug: string) => {
    setLoading(true);
    try {
      const guide = await fetchGuide(idOrSlug);
      setSelectedGuide(guide);
      setCurrentRoute('guide');
    } catch (e) {
      console.error('Error fetching guide:', e);
      setCurrentRoute('home');
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (route: 'home' | 'research') => {
    if (route === 'home') {
      window.history.pushState({}, '', '/');
      setCurrentRoute('home');
      loadGuidesList();
    } else if (route === 'research') {
      window.history.pushState({}, '', '/research');
      setCurrentRoute('research');
    }
  };

  const handleOpenGuide = (id: string) => {
    window.history.pushState({}, '', `/guides/${id}`);
    loadSingleGuide(id);
  };

  const handleStartSearch = (providerName: string) => {
    setIntakeProvider(providerName);
    setIntakeOpen(true);
  };

  const handleIntakeSubmit = async (
    provider: string,
    website: string,
    assumptions: GuideAssumptions
  ) => {
    setIntakeOpen(false);

    // Fast path: if the provider is already in our verified guide catalog, navigate straight to it!
    const lower = provider.toLowerCase().trim();
    const existing = guides.find(
      (g) => g.slug === lower || g.providerName.toLowerCase().includes(lower)
    );
    if (existing) {
      handleOpenGuide(existing.id);
      return;
    }

    try {
      const res = await startResearchJob(provider, website, assumptions);
      setActiveJobId(res.jobId);
      window.history.pushState({}, '', `/jobs/${res.jobId}`);
      setCurrentRoute('job');
    } catch (err: any) {
      alert(`Could not start investigation: ${err.message}`);
    }
  };

  const handleGuideReady = (guideId: string) => {
    window.history.pushState({}, '', `/guides/${guideId}`);
    loadSingleGuide(guideId);
    loadGuidesList();
  };

  const handleVersionCreated = (newGuide: Guide) => {
    setSelectedGuide(newGuide);
    window.history.pushState({}, '', `/guides/${newGuide.id}`);
    loadGuidesList();
  };

  return (
    <div className="min-h-screen cyber-grid-bg text-[#D1E7DD] font-sans antialiased flex flex-col relative selection:bg-[#00F29D]/30 selection:text-white">
      {/* Cinematic Vignette Overlay (pointer-events-none) */}
      <div className="fixed inset-0 vignette-overlay pointer-events-none z-0" aria-hidden="true" />

      {/* Top Navigation */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        onOpenIntake={() => {
          setIntakeProvider('');
          setIntakeOpen(true);
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex items-center gap-3 text-xs text-[#7C988B] font-mono">
              <div className="h-4 w-4 rounded-full border-2 border-[#00F29D] border-t-transparent animate-spin" />
              <span>INITIALIZING SETUP DIRECTORY...</span>
            </div>
          </div>
        ) : currentRoute === 'home' ? (
          <Home
            guides={guides}
            onOpenGuide={handleOpenGuide}
            onStartSearch={handleStartSearch}
            onNavigateToResearch={() => navigateTo('research')}
            onSubmitIntake={handleIntakeSubmit}
          />
        ) : currentRoute === 'guide' ? (
          selectedGuide ? (
            <GuideView
              guide={selectedGuide}
              onBack={() => navigateTo('home')}
              onVersionCreated={handleVersionCreated}
            />
          ) : (
            <div className="flex h-96 items-center justify-center">
              <div className="flex items-center gap-3 text-xs text-[#7C988B] font-mono">
                <div className="h-4 w-4 rounded-full border-2 border-[#00F29D] border-t-transparent animate-spin" />
                <span>RETRIEVING GUIDE TELEMETRY...</span>
              </div>
            </div>
          )
        ) : currentRoute === 'research' ? (
          <ResearchDecisions
            onBack={() => navigateTo('home')}
            onOpenIntake={() => {
              setIntakeProvider('');
              setIntakeOpen(true);
            }}
          />
        ) : currentRoute === 'job' && activeJobId ? (
          <ResearchProgress
            jobId={activeJobId}
            onGuideReady={handleGuideReady}
            onRetry={() => {
              setIntakeProvider('');
              setIntakeOpen(true);
            }}
          />
        ) : (
          <Home
            guides={guides}
            onOpenGuide={handleOpenGuide}
            onStartSearch={handleStartSearch}
            onNavigateToResearch={() => navigateTo('research')}
            onSubmitIntake={handleIntakeSubmit}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1B382B] bg-[#060B09]/95 backdrop-blur-md py-6 text-center text-xs text-[#7C988B] relative z-10">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-wide">
            OAUTH LAUNCH GUIDE <span className="text-[#3B4A40]">/</span> INDEPENDENT SPECIFICATION FOR COMPOSIO DEVELOPERS
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-[#7C988B]">Composio Connect (MCP) & Agent Plugins</span>
            <span className="text-[#1B382B]">•</span>
            <button onClick={() => navigateTo('research')} className="text-[#00F29D] hover:underline font-medium">
              Research & Decisions
            </button>
          </div>
        </div>
      </footer>

      {/* Brief Intake Modal (used when clicking Investigate App from subviews) */}
      <IntakeModal
        initialProvider={intakeProvider}
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        onSubmit={handleIntakeSubmit}
      />
    </div>
  );
}
