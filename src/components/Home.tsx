import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Sliders } from 'lucide-react';
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

export const Home: React.FC<HomeProps> = ({ guides, onOpenGuide, onStartSearch, onNavigateToResearch, onSubmitIntake }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai_assist'>('manual');
  const [selectedProviderHint, setSelectedProviderHint] = useState('');
  const handleFormSubmit = (provider: string, website: string, assumptions: GuideAssumptions) =>
    onSubmitIntake ? onSubmitIntake(provider, website, assumptions) : onStartSearch(provider);

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="relative mb-10 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-white to-indigo-50/80 px-5 py-10 sm:px-10 lg:px-14">
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold tracking-wide text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            COMPOSIO DEVELOPER TOOLKIT
          </div>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 sm:text-5xl">
            Find your OAuth <span className="text-gradient">path to launch.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Determine whether Composio-managed OAuth fits your use case, or get an owned-app setup &amp; verification guide.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            {['Verified provider insights', 'Clear action steps', 'Based on real experience'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="site-card rounded-3xl p-4 sm:p-7 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Sparkles className="h-5 w-5" /></span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Investigate OAuth Setup Path</h2>
              <p className="mt-1 text-sm text-slate-500">Tell our research agent about your target integration, actions, and audience.</p>
              <span className="mt-3 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-blue-700">COMPOSIO-FIRST ASSESSMENT</span>
            </div>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'manual' as const, label: 'Manual', icon: Sliders },
              { id: 'ai_assist' as const, label: 'AI Assist', icon: Sparkles },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>
        </div>
        {activeTab === 'manual' ? (
          <IntakeForm initialProvider={selectedProviderHint} onSubmit={handleFormSubmit} onSelectPreset={setSelectedProviderHint} />
        ) : (
          <ChatAssistant onOpenGuide={onOpenGuide} onOpenIntake={(hint) => { setSelectedProviderHint(hint || ''); setActiveTab('manual'); }} />
        )}
      </section>

      <GuidesCarousel guides={guides} onOpenGuide={onOpenGuide} onNavigateToResearch={onNavigateToResearch} />
    </div>
  );
};
