import React, { useState } from 'react';
import { 
  Sparkles, 
  Sliders,
  Search,
  ArrowRight
} from 'lucide-react';
import { GuideSummary, GuideAssumptions } from '../types/client.js';
import { IntakeForm } from './IntakeForm.js';
import { ChatAssistant } from './ChatAssistant.js';
import { GuidesCarousel } from './GuidesCarousel.js';

interface HomeProps {
  guides: GuideSummary[];
  onOpenGuide: (id: string) => void;
  onStartSearch: (provider: string) => void;
  onNavigateToResearch: () => void;
  onSubmitIntake?: (provider: string, website: string, assumptions: GuideAssumptions) => void;
}

export const Home: React.FC<HomeProps> = ({
  guides,
  onOpenGuide,
  onStartSearch,
  onNavigateToResearch,
  onSubmitIntake,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_assist'>('manual');
  const [selectedProviderHint, setSelectedProviderHint] = useState<string>('');

  const handleFormSubmit = (provider: string, website: string, assumptions: GuideAssumptions) => {
    if (onSubmitIntake) {
      onSubmitIntake(provider, website, assumptions);
    } else {
      onStartSearch(provider);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 text-[#D1E7DD]">
      {/* Top Banner / Hero matching composio.dev deep-tech developer toolkit */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1B382B] bg-[#0E1A14]/90 px-3.5 py-1 text-[11px] font-mono font-medium text-[#00F29D] shadow-[0_0_15px_rgba(0,242,157,0.1)] mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] shadow-[0_0_8px_#00F29D]" />
          <span>COMPOSIO DEVELOPER TOOLKIT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
          Find your OAuth path to launch.
        </h1>
        <p className="text-sm sm:text-base text-[#D1E7DD]/90 mt-3 max-w-xl mx-auto leading-relaxed">
          Determine whether Composio-managed OAuth fits your use case, or get an owned-app setup & verification guide.
        </p>
      </div>

      {/* Mode Switcher Tabs: "Manual vs AI Assist" just below hero */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-full bg-[#0A0F0D]/90 border border-[#1B382B] p-1 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === 'manual'
                ? 'btn-emerald-glow'
                : 'text-[#7C988B] hover:text-white hover:bg-[#171D1A]'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_assist')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === 'ai_assist'
                ? 'btn-emerald-glow'
                : 'text-[#7C988B] hover:text-white hover:bg-[#171D1A]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Assist</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Manual Intake Form (Main Landing Page) */}
      {activeTab === 'manual' && (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-200">
          <IntakeForm
            initialProvider={selectedProviderHint}
            onSubmit={handleFormSubmit}
            onSelectPreset={(p) => setSelectedProviderHint(p)}
          />
        </div>
      )}

      {/* Tab 2: AI Assist (OAuth Launch Assistant Chat) */}
      {activeTab === 'ai_assist' && (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-200">
          <ChatAssistant
            onOpenGuide={onOpenGuide}
            onOpenIntake={(hint) => {
              setSelectedProviderHint(hint || '');
              setActiveTab('manual');
            }}
          />
        </div>
      )}

      {/* Visible Bottom Carousel: Three Carousel Boxes */}
      <GuidesCarousel
        guides={guides}
        onOpenGuide={onOpenGuide}
        onNavigateToResearch={onNavigateToResearch}
      />
    </div>
  );
};
