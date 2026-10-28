import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Layers, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Building,
  Key,
  ShieldCheck,
  Info,
  BookOpen,
  Filter,
  Zap,
  Globe
} from 'lucide-react';
import { Guide, NextStepPack, GuideAssumptions, StartingPath } from '../types/client.js';
import { NextStepPackModal } from './NextStepPackModal.js';
import { createGuideVersion, fetchNextStepPack } from '../api/client.js';

interface GuideViewProps {
  guide: Guide;
  onBack: () => void;
  onVersionCreated: (newGuide: Guide) => void;
}

export const GuideView: React.FC<GuideViewProps> = ({
  guide,
  onBack,
  onVersionCreated,
}) => {
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [pack, setPack] = useState<NextStepPack | null>(null);
  const [loadingPack, setLoadingPack] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'scopes' | 'checklist' | 'blockers' | 'evidence'>('overview');
  const [selectedOwnerFilter, setSelectedOwnerFilter] = useState<string>('all');
  const [showAssumptionEditor, setShowAssumptionEditor] = useState(false);
  
  // Accordion state: first step open by default
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    [guide?.setupChecklist?.[0]?.id || 'step-0']: true,
  });

  const isManagedAvailable = !!(guide?.composioToolkitMatch?.found && guide?.composioToolkitMatch?.managedAuthAvailable === 'available');

  // User-selected path view override (defaults to guide recommendation, but user can click either card)
  const [selectedPathOverride, setSelectedPathOverride] = useState<StartingPath>(() => {
    if (!isManagedAvailable) return 'register_owned_app';
    return guide?.pathAssessment?.startingPath || 'composio_managed_suitable';
  });

  // Sync when guide changes
  useEffect(() => {
    if (!guide?.pathAssessment) return;
    if (!isManagedAvailable) {
      setSelectedPathOverride('register_owned_app');
    } else {
      setSelectedPathOverride(guide.pathAssessment.startingPath);
    }
    if (guide.setupChecklist?.[0]?.id) {
      setOpenAccordions({ [guide.setupChecklist[0].id]: true });
    }
  }, [guide?.id, guide?.pathAssessment?.startingPath, isManagedAvailable]);

  // Load local device progress
  useEffect(() => {
    if (!guide?.id) return;
    try {
      const stored = localStorage.getItem(`progress_${guide.id}`);
      if (stored) {
        setCompletedSteps(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [guide?.id]);

  const toggleStep = (stepId: string) => {
    const next = { ...completedSteps, [stepId]: !completedSteps[stepId] };
    setCompletedSteps(next);
    try {
      localStorage.setItem(`progress_${guide.id}`, JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const toggleAccordion = (stepId: string) => {
    setOpenAccordions((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenPack = async () => {
    setLoadingPack(true);
    try {
      const data = await fetchNextStepPack(guide.id);
      setPack(data);
      setPackModalOpen(true);
    } catch (e) {
      console.error('Failed to load next-step pack:', e);
    } finally {
      setLoadingPack(false);
    }
  };

  const handleExportMarkdown = () => {
    const md = `# ${guide.providerName} OAuth Launch Guide (v${guide.version})
Starting Path: ${guide.pathAssessment.headline}
Use Case: ${guide.exampleUseCase}

## Path Assessment
${guide.pathAssessment.why}

## Key Metrics
- Developer Effort: ${guide.pathAssessment.developerEffort}
- External Waiting: ${guide.pathAssessment.externalWaiting}
- Can Start Testing: ${guide.pathAssessment.canStartTesting.status} (${guide.pathAssessment.canStartTesting.note})
- Launch Blocker: ${guide.pathAssessment.whatCouldBlockLaunch}

## Permissions & Scopes
${guide.permissionsTable.map(p => `- \`${p.permission}\`: ${p.whyNeeded} [${p.reviewImplication}]`).join('\n')}

## Setup Checklist
${guide.setupChecklist.map(s => `- [ ] ${s.action} (${s.owner}) - ${s.details || s.completionCondition}`).join('\n')}

## Blockers & Recovery
${guide.blockersAndRecovery.map(b => `- **${b.symptom}**: ${b.explanationOrHypothesis}\n  Next Action: ${b.nextAction}`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.slug}-guide-v${guide.version}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateAssumptions = async (updated: Partial<GuideAssumptions>) => {
    const newAssumptions: GuideAssumptions = {
      ...guide.pathAssessment.assumptions,
      ...updated,
    };
    try {
      const newGuide = await createGuideVersion(guide.id, newAssumptions);
      if (newGuide) {
        setShowAssumptionEditor(false);
        onVersionCreated(newGuide);
      }
    } catch (e) {
      console.error('Failed to create new version:', e);
    }
  };

  if (!guide || !guide.pathAssessment || !guide.id) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center gap-3 text-xs text-zinc-400 font-medium">
          <div className="h-4 w-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <span>Loading guide details...</span>
        </div>
      </div>
    );
  }

  const pAssessment = guide.pathAssessment;
  const totalSteps = guide.setupChecklist?.length || 0;
  const completedCount = (guide.setupChecklist || []).filter(s => !!completedSteps[s.id]).length;

  const filteredSteps = (guide.setupChecklist || []).filter(s => {
    if (selectedOwnerFilter === 'all') return true;
    return s.owner === selectedOwnerFilter;
  });

  // Short BIG stats formatting with honest Unknown fallbacks
  const devEffortStr = pAssessment?.developerEffort || '';
  const shortEffort = devEffortStr.includes('15') || devEffortStr.includes('30')
    ? '15–30m'
    : devEffortStr.includes('1–2') || devEffortStr.includes('1-2')
    ? '1–2 hrs'
    : devEffortStr.includes('2–4') || devEffortStr.includes('2-4')
    ? '2–4 hrs'
    : devEffortStr.trim() ? devEffortStr.slice(0, 15) : 'Unknown';

  const extWaitStr = pAssessment?.externalWaiting || '';
  const shortWaiting = extWaitStr.toLowerCase().includes('zero') || extWaitStr.toLowerCase().includes('none')
    ? 'Instant'
    : extWaitStr.toLowerCase().includes('unknown') || extWaitStr.toLowerCase().includes('vary')
    ? 'Unknown'
    : extWaitStr.includes('weeks') || extWaitStr.includes('3')
    ? '3–6 wks'
    : extWaitStr.trim() ? extWaitStr.slice(0, 14) : 'Unknown';

  return (
    <div className="legacy-light-surface mx-auto max-w-5xl px-4 sm:px-6 py-6 text-slate-700">
      {/* Top back & actions bar */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7C988B] hover:text-[#00F29D] transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 rounded-full btn-cyber-ghost px-3.5 py-1.5 text-xs font-medium text-[#D1E7DD] hover:text-white transition shadow-sm"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-[#00F29D]" /> : <Copy className="h-3.5 w-3.5 text-[#7C988B]" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 rounded-full btn-cyber-ghost px-3.5 py-1.5 text-xs font-medium text-[#D1E7DD] hover:text-white transition shadow-sm"
            title="Download clean Markdown summary"
          >
            <Download className="h-3.5 w-3.5 text-[#7C988B]" />
            <span>Markdown</span>
          </button>

          <button
            onClick={handleOpenPack}
            disabled={loadingPack}
            className="inline-flex items-center gap-1.5 rounded-full btn-emerald-glow px-4 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#060B09]" />
            <span>{loadingPack ? 'Loading...' : 'Prepare Action Pack'}</span>
          </button>
        </div>
      </div>

      {/* Guide Header Banner */}
      <div className="cyber-panel cyber-highlight-top rounded-2xl p-5 sm:p-6 shadow-xl mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-tight">{guide.providerName}</h1>
              <span className="font-mono text-[10px] text-[#7C988B] bg-[#0A0F0D] px-2 py-0.5 rounded border border-[#1B382B]">
                v{guide.version}
              </span>
              {guide.providerWebsite && (
                <a
                  href={guide.providerWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#00F29D] hover:underline font-mono"
                >
                  <span>{guide.providerWebsite.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold uppercase ${
                pAssessment.startingPath === 'composio_managed_suitable'
                  ? 'bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30'
                  : pAssessment.startingPath === 'unverified_provider_requirements'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  pAssessment.startingPath === 'composio_managed_suitable' 
                    ? 'bg-[#00F29D] shadow-[0_0_6px_#00F29D]' 
                    : pAssessment.startingPath === 'unverified_provider_requirements'
                    ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                    : 'bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]'
                }`} />
                {pAssessment.startingPath === 'composio_managed_suitable' && 'Composio-Managed Suitable'}
                {pAssessment.startingPath === 'register_owned_app' && 'Owned Provider App Advised'}
                {pAssessment.startingPath === 'unverified_provider_requirements' && 'Requirements Unverified'}
                {pAssessment.startingPath === 'provider_not_found_in_composio' && 'Custom Provider App'}
              </span>
            </div>
            <p className="text-xs text-[#7C988B] mt-1.5">
              Intended Use: <span className="text-[#D1E7DD] font-medium">"{guide.exampleUseCase || guide.pathAssessment?.assumptions?.intendedActions || 'Integration actions'}"</span>
            </p>
          </div>

          {guide.unverifiedNotice && (
            <div className="w-full mt-4 p-4 rounded-xl border border-amber-500/40 bg-amber-950/25 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-display font-bold text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>Provider-Specific Requirements Not Verified</span>
              </div>
              <p className="text-[#D1E7DD] leading-relaxed">
                {guide.unverifiedNotice}
              </p>
              <div className="p-3 rounded-lg bg-[#060B09]/80 border border-amber-500/20 space-y-1.5">
                <div className="font-semibold text-white">Recommended Next Steps for Developer:</div>
                <ul className="list-disc pl-4 space-y-1 text-[#7C988B] font-mono text-[11px]">
                  <li>Identify the official developer portal for {guide.providerName}.</li>
                  <li>Find the provider's official OAuth 2.0 authentication and authorization documentation.</li>
                  <li>Locate the official scope directory matching your intended actions.</li>
                  <li>Check whether application registration is self-service or requires manual partner approval.</li>
                  <li>Review public distribution verification, domain checks, and privacy policy requirements.</li>
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowAssumptionEditor(!showAssumptionEditor)}
            className="text-xs font-mono font-medium text-[#00F29D] hover:underline self-start sm:self-auto"
          >
            {showAssumptionEditor ? '[Hide Assumptions]' : `[Tweak Assumptions → v${guide.version + 1}]`}
          </button>
        </div>

        {/* Inline Assumption Editor Drawer */}
        {showAssumptionEditor && (
          <div className="mt-4 pt-4 border-t border-[#1B382B] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#0A0F0D] p-4 rounded-xl border border-[#1B382B]">
            <div>
              <span className="block font-display font-semibold text-[#D1E7DD] mb-1.5">Target Audience</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ audience: 'external_customers' })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    pAssessment.assumptions?.audience === 'external_customers'
                      ? 'btn-emerald-glow'
                      : 'bg-[#171D1A] text-[#7C988B] hover:text-white border border-[#1B382B]'
                  }`}
                >
                  External Users
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ audience: 'team_only' })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    pAssessment.assumptions?.audience === 'team_only'
                      ? 'btn-emerald-glow'
                      : 'bg-[#171D1A] text-[#7C988B] hover:text-white border border-[#1B382B]'
                  }`}
                >
                  Team Only
                </button>
              </div>
            </div>

            <div>
              <span className="block font-display font-semibold text-[#D1E7DD] mb-1.5">Custom Brand Consent</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ customBrandingRequired: true })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    pAssessment.assumptions?.customBrandingRequired
                      ? 'btn-emerald-glow'
                      : 'bg-[#171D1A] text-[#7C988B] hover:text-white border border-[#1B382B]'
                  }`}
                >
                  Required (Owned)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAssumptions({ customBrandingRequired: false })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    !pAssessment.assumptions?.customBrandingRequired
                      ? 'btn-emerald-glow'
                      : 'bg-[#171D1A] text-[#7C988B] hover:text-white border border-[#1B382B]'
                  }`}
                >
                  Composio OK
                </button>
              </div>
            </div>

            <div>
              <span className="block font-display font-semibold text-[#D1E7DD] mb-1">Assumption Persistence</span>
              <p className="text-[11px] text-[#7C988B] mt-1 font-mono">
                Saving updates creates an explicit, versioned guide branch on disk.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hero: ONE NEXT ACTION */}
      <div className="cyber-panel cyber-highlight-top rounded-2xl p-5 mb-5 shadow-xl border-[#00F29D]/30 bg-gradient-to-r from-[#0E1A14] via-[#102319] to-[#0A0F0D]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00F29D] text-[#060B09] font-bold shadow-[0_0_15px_rgba(0,242,157,0.35)] mt-0.5">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F29D] block mb-0.5">
                YOUR NEXT ACTION
              </span>
              <p className="text-sm sm:text-base font-display font-bold text-white leading-snug">
                {pAssessment.myNextAction || 'Review setup steps below'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenPack}
            className="inline-flex items-center justify-center gap-1.5 rounded-full btn-emerald-glow px-4 py-2 text-xs font-bold transition shrink-0"
          >
            <span>Prepare Action Pack</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BIG Short Effort/Wait Values */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {/* Developer Effort */}
        <div className="cyber-panel rounded-xl p-4 shadow-sm hover:border-[#00F29D]/40 transition">
          <span className="text-[10px] font-mono font-bold text-[#7C988B] uppercase tracking-wider block mb-1">
            Setup Effort
          </span>
          <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
            {shortEffort}
          </div>
          <p className="text-[10px] text-[#7C988B] mt-1 truncate font-mono" title={pAssessment.developerEffort}>
            {pAssessment.developerEffort || 'Unknown developer effort'}
          </p>
        </div>

        {/* External Waiting */}
        <div className="cyber-panel rounded-xl p-4 shadow-sm hover:border-[#00F29D]/40 transition">
          <span className="text-[10px] font-mono font-bold text-[#7C988B] uppercase tracking-wider block mb-1">
            External Waiting
          </span>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#00F29D] tracking-tight">
            {shortWaiting}
          </div>
          <p className="text-[10px] text-[#7C988B] mt-1 truncate font-mono" title={pAssessment.externalWaiting}>
            {pAssessment.externalWaiting || 'Unknown waiting time'}
          </p>
        </div>

        {/* Can I start testing? */}
        <div className="cyber-panel rounded-xl p-4 shadow-sm hover:border-[#00F29D]/40 transition">
          <span className="text-[10px] font-mono font-bold text-[#7C988B] uppercase tracking-wider block mb-1">
            Can I test now?
          </span>
          <div className="text-2xl sm:text-3xl font-display font-bold text-[#00E5FF] tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" />
            <span className="capitalize">{(pAssessment.canStartTesting?.status || 'yes').replace('_', ' ')}</span>
          </div>
          <p className="text-[10px] text-[#7C988B] mt-1 truncate font-mono" title={pAssessment.canStartTesting?.note}>
            {pAssessment.canStartTesting?.note || 'Testing status'}
          </p>
        </div>

        {/* Launch Blocker */}
        <div className="cyber-panel rounded-xl p-4 shadow-sm hover:border-[#00F29D]/40 transition">
          <span className="text-[10px] font-mono font-bold text-[#7C988B] uppercase tracking-wider block mb-1">
            Launch Risk
          </span>
          <div className="text-sm font-display font-bold text-amber-400 flex items-center gap-1.5 mt-1 line-clamp-1">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span className="truncate">{(pAssessment.whatCouldBlockLaunch || 'None identified').split(';')[0]}</span>
          </div>
          <p className="text-[10px] text-[#7C988B] mt-1 line-clamp-2 font-mono" title={pAssessment.whatCouldBlockLaunch}>
            {pAssessment.whatCouldBlockLaunch || 'None identified'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#1B382B] gap-1 mb-5 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: '1. Path & Fit' },
          { id: 'scopes', label: '2. Scopes & Access' },
          { id: 'checklist', label: `3. Checklist (${completedCount}/${totalSteps})` },
          { id: 'blockers', label: '4. Blockers & Fixes' },
          { id: 'evidence', label: '5. Evidence & Sources' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 whitespace-nowrap transition font-display ${
              activeTab === tab.id
                ? 'border-[#00F29D] text-[#00F29D] font-bold bg-[#00F29D]/5'
                : 'border-transparent text-[#7C988B] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Path & Fit Comparison */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="cyber-panel rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-[#00F29D]" />
              <h2 className="text-sm font-display font-bold text-white">Recommended Path Rationale</h2>
            </div>
            <p className="text-xs text-[#D1E7DD] leading-relaxed font-sans">{pAssessment.why || 'Path assessment rationale based on provider integration requirements.'}</p>
          </div>

          {/* Side by side comparison: COMPOSIO RECOMMENDED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Card 1: Composio-Managed OAuth */}
            {isManagedAvailable ? (
              <div 
                onClick={() => setSelectedPathOverride('composio_managed_suitable')}
                className={`rounded-2xl border p-5 transition cursor-pointer relative ${
                  selectedPathOverride === 'composio_managed_suitable'
                    ? 'border-[#00F29D] bg-gradient-to-b from-[#0E1A14] to-[#0A0F0D] ring-1 ring-[#00F29D]/50 shadow-[0_0_20px_rgba(0,242,157,0.15)]'
                    : 'border-[#1B382B] bg-[#0A0F0D]/90 hover:border-[#3B4A40]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-white text-sm">Composio-Managed OAuth</span>
                  <span className="rounded-full bg-[#00F29D] text-[#060B09] px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase shadow-sm">
                    Recommended for Composio
                  </span>
                </div>
                <p className="text-[11px] text-[#7C988B] mb-3">
                  Zero developer app registration. Fastest path to test your AI agent.
                </p>
                <ul className="space-y-2 text-[#D1E7DD] text-xs">
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F29D] font-bold">✓</span>
                    <span>Instant sandbox connection (no developer app needed)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F29D] font-bold">✓</span>
                    <span>Automatic token encryption & refresh managed by Composio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#00F29D] font-bold">✓</span>
                    <span>Pre-approved scopes for rapid agent prototyping</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#7C988B]">
                    <span className="text-[#3B4A40] font-bold">✕</span>
                    <span>Displays "Composio" on user consent screen</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#7C988B]">
                    <span className="text-[#3B4A40] font-bold">✕</span>
                    <span>Shared rate limits with other platform developers</span>
                  </li>
                </ul>

                <div className="mt-4 pt-3 border-t border-[#1B382B] flex items-center justify-between text-[11px]">
                  <span className="text-[#00F29D] font-semibold">
                    {selectedPathOverride === 'composio_managed_suitable' ? 'Active Selected Path' : 'Click to select this path'}
                  </span>
                  <span className="font-mono text-[10px] text-[#7C988B]">FASTEST</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1B382B] bg-[#0A0F0D]/60 p-5 opacity-60 cursor-not-allowed relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-[#7C988B] text-sm">Composio-Managed OAuth</span>
                  <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase">
                    Not Available
                  </span>
                </div>
                <p className="text-[11px] text-[#7C988B] mb-3">
                  {!guide.composioToolkitMatch?.found 
                    ? `No pre-built Composio toolkit exists for ${guide.providerName}.`
                    : `Composio documentation explicitly notes managed OAuth is not provided for ${guide.providerName}.`}
                </p>
                <div className="rounded-lg bg-[#060B09] p-3 text-[11px] text-[#7C988B] border border-[#1B382B] mb-3">
                  <p>
                    {!guide.composioToolkitMatch?.found
                      ? `Direct provider OAuth integration is required. Register an app in ${guide.providerName}'s developer portal.`
                      : `You must create your own OAuth app in ${guide.providerName}'s developer portal and configure custom credentials in Composio.`}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#1B382B] flex items-center justify-between text-[11px] text-[#7C988B]">
                  <span>Disabled for this provider</span>
                  <span className="font-mono text-[10px]">Direct App Required</span>
                </div>
              </div>
            )}

            {/* Card 2: Owned Provider OAuth App */}
            <div 
              onClick={() => setSelectedPathOverride('register_owned_app')}
              className={`rounded-2xl border p-5 transition cursor-pointer relative ${
                selectedPathOverride === 'register_owned_app' || !isManagedAvailable
                  ? 'border-[#00E5FF] bg-gradient-to-b from-[#0A171C] to-[#0A0F0D] ring-1 ring-[#00E5FF]/50 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                  : 'border-[#1B382B] bg-[#0A0F0D]/90 hover:border-[#3B4A40]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-white text-sm">Owned Provider OAuth App</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${
                  !isManagedAvailable 
                    ? 'bg-[#00E5FF] text-[#060B09] shadow-sm'
                    : 'bg-[#171D1A] text-[#7C988B] border border-[#1B382B]'
                }`}>
                  {!isManagedAvailable ? 'Required for this Provider' : 'For Custom Branding'}
                </span>
              </div>
              <p className="text-[11px] text-[#7C988B] mb-3">
                Register in provider portal; connect credentials via Composio Custom Auth.
              </p>
              <ul className="space-y-2 text-[#D1E7DD] text-xs">
                <li className="flex items-center gap-2">
                  <span className="text-[#00E5FF] font-bold">✓</span>
                  <span>Your brand logo & name on customer consent screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E5FF] font-bold">✓</span>
                  <span>Dedicated API rate limits & quotas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00E5FF] font-bold">✓</span>
                  <span>Full control over redirect URIs and scopes</span>
                </li>
                <li className="flex items-center gap-2 text-[#7C988B]">
                  <span className="text-[#3B4A40] font-bold">✕</span>
                  <span>Requires portal registration & possible verification</span>
                </li>
                <li className="flex items-center gap-2 text-[#7C988B]">
                  <span className="text-[#3B4A40] font-bold">✕</span>
                  <span>Subject to provider review queues before external rollout</span>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-[#1B382B] flex items-center justify-between text-[11px]">
                <span className="text-[#00E5FF] font-semibold">
                  {selectedPathOverride === 'register_owned_app' || !isManagedAvailable ? 'Active Selected Path' : 'Click to select this path'}
                </span>
                <span className="font-mono text-[10px] text-[#7C988B]">DEDICATED</span>
              </div>
            </div>
          </div>

          {/* Composio Toolkit Details */}
          {guide.composioToolkitMatch ? (
            <div className="rounded-xl border border-[#1B382B] bg-[#0A0F0D] p-4 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display font-bold text-white block">
                  Composio Toolkit Match: {guide.composioToolkitMatch.name || `${guide.providerName} Toolkit`}
                </span>
                {guide.composioToolkitMatch.docUrl && (
                  <a
                    href={guide.composioToolkitMatch.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00F29D] hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Composio Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-[#7C988B] text-[11px] mb-2 font-mono">
                Auth scheme: <strong className="text-[#D1E7DD]">{guide.composioToolkitMatch.relevantAuthMethod || 'OAuth 2.0'}</strong> | Status: <strong className="text-[#D1E7DD]">{guide.composioToolkitMatch.metadataStatus || 'documentation_checked'}</strong>
              </p>
              {guide.composioToolkitMatch.limitationsDocumented && guide.composioToolkitMatch.limitationsDocumented.length > 0 && (
                <ul className="space-y-1 text-[#7C988B] text-[11px]">
                  {guide.composioToolkitMatch.limitationsDocumented.map((l, i) => (
                    <li key={i}>• {l}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-[#1B382B] bg-[#0A0F0D] p-4 text-xs">
              <span className="font-display font-bold text-[#D1E7DD] block mb-1">
                Composio Toolkit: Direct Provider OAuth
              </span>
              <p className="text-[#7C988B] text-[11px]">
                No pre-built Composio toolkit catalog entry identified for {guide.providerName}. Connect via custom actions or generic OAuth 2.0 configuration.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Scopes & Permissions */}
      {activeTab === 'scopes' && (
        <div className="cyber-panel rounded-xl overflow-hidden shadow-sm text-xs">
          <div className="p-3.5 border-b border-[#1B382B] bg-[#0A0F0D] flex items-center justify-between text-[#7C988B]">
            <span className="font-display font-semibold text-white">Granular scope mapping for requested actions</span>
            <span className="text-[11px] text-[#00F29D] font-mono">{guide.permissionsTable.length} Scopes Mapped</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#060B09] border-b border-[#1B382B] text-[#7C988B] font-display">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold">Feature</th>
                <th className="py-2.5 px-3.5 font-semibold">Scope Name</th>
                <th className="py-2.5 px-3.5 font-semibold">Why Needed</th>
                <th className="py-2.5 px-3.5 font-semibold">Review Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B382B] text-[#D1E7DD]">
              {guide.permissionsTable.map((p, i) => (
                <tr key={i} className="hover:bg-[#171D1A]/50 transition">
                  <td className="py-3 px-3.5 font-medium text-white">
                    <div>{p.feature}</div>
                    {p.uncertainty && (
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5">{p.uncertainty}</div>
                    )}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <code className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                        p.isConfirmedScope === false || p.permission.includes('Pending')
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                          : 'bg-[#060B09] border-[#1B382B] text-[#00F29D]'
                      }`}>
                        {p.permission}
                      </code>
                      {p.isConfirmedScope === false && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-semibold">
                          Unconfirmed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3.5 leading-relaxed text-[#7C988B]">{p.whyNeeded}</td>
                  <td className="py-3 px-3.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                      p.reviewImplication.includes('Restricted')
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : p.reviewImplication.includes('Sensitive')
                        ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                        : p.reviewImplication.includes('Unknown')
                        ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        : 'bg-[#00F29D]/20 text-[#00F29D] border border-[#00F29D]/30'
                    }`}>
                      {p.reviewImplication}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Numbered Setup Accordions */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0A0F0D] border border-[#1B382B] p-3.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white">Setup Progress:</span>
              <span className="text-[#7C988B]">{completedCount} of {totalSteps} steps marked on this device</span>
              <div className="h-2 w-28 bg-[#171D1A] rounded-full overflow-hidden ml-2 border border-[#1B382B]">
                <div 
                  className="h-full bg-[#00F29D] shadow-[0_0_8px_#00F29D] transition-all duration-300" 
                  style={{ width: `${totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#7C988B]" />
              <select
                value={selectedOwnerFilter}
                onChange={(e) => setSelectedOwnerFilter(e.target.value)}
                className="bg-[#060B09] border border-[#1B382B] rounded-lg px-2.5 py-1 text-xs text-[#D1E7DD] focus:outline-none focus:border-[#00F29D] font-mono"
              >
                <option value="all">All Action Owners</option>
                <option value="developer">Developer Actions</option>
                <option value="agent">Agent Actions</option>
                <option value="provider_reviewer">Provider Reviewer</option>
                <option value="customer_admin">Customer Admin</option>
              </select>
            </div>
          </div>

          {/* Accordion Steps List */}
          <div className="space-y-2">
            {filteredSteps.map((step, idx) => {
              const isOpen = !!openAccordions[step.id];
              const isDone = !!completedSteps[step.id];

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border transition overflow-hidden ${
                    isDone 
                      ? 'border-[#00F29D]/40 bg-[#0E1A14]/70' 
                      : isOpen 
                      ? 'border-[#00F29D]/60 bg-[#121E18]' 
                      : 'border-[#1B382B] bg-[#0A0F0D] hover:border-[#3B4A40]'
                  }`}
                >
                  {/* Step Header */}
                  <div
                    onClick={() => toggleAccordion(step.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(step.id);
                        }}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          isDone
                            ? 'bg-[#00F29D] border-[#00F29D] text-[#060B09] font-bold shadow-[0_0_8px_rgba(0,242,157,0.4)]'
                            : 'border-[#1B382B] bg-[#060B09] hover:border-[#00F29D]'
                        }`}
                        title="Mark complete on this machine"
                      >
                        {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>

                      {/* Number and Title */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#00F29D]">
                          Step {idx + 1}
                        </span>
                        <span className={`text-xs font-display font-semibold ${isDone ? 'text-[#7C988B] line-through' : 'text-white'}`}>
                          {step.action}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-[#171D1A] px-2.5 py-0.5 text-[10px] font-mono text-[#7C988B] border border-[#1B382B] hidden sm:inline">
                        {step.owner}
                      </span>
                      {step.estimate?.duration && (
                        <span className="text-[10px] text-[#7C988B] font-mono">
                          {step.estimate.duration}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-[#7C988B]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#7C988B]" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#1B382B] text-xs space-y-2 text-[#D1E7DD] bg-[#060B09]/40">
                      {step.details && (
                        <p className="leading-relaxed text-[#D1E7DD] font-sans">{step.details}</p>
                      )}
                      <div className="p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B] text-[11px] text-[#7C988B]">
                        <strong className="text-white">Completion Condition:</strong> {step.completionCondition}
                      </div>
                      {step.prerequisites && step.prerequisites.length > 0 && (
                        <div className="text-[10px] text-[#7C988B] font-mono">
                          Prerequisites: {step.prerequisites.join(' • ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Blockers & Fixes */}
      {activeTab === 'blockers' && (
        <div className="space-y-3">
          {guide.blockersAndRecovery.map((b, idx) => (
            <div key={idx} className="cyber-panel rounded-xl p-4 text-xs shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-display font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{b.symptom}</span>
              </div>
              <p className="text-[#D1E7DD] leading-relaxed mb-3">{b.explanationOrHypothesis}</p>
              
              <div className="p-3 rounded-lg bg-[#0A0F0D] border border-[#1B382B] space-y-1.5 text-[11px]">
                <div className="text-[#00F29D]">
                  <strong className="font-semibold text-white">Recommended Recovery:</strong> {b.nextAction}
                </div>
                {b.humanHandoff && (
                  <div className="text-[#7C988B]">
                    <strong className="text-[#D1E7DD]">Human Action Needed:</strong> {b.humanHandoff}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Evidence & Sources */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          {/* Validation Summary Card */}
          {guide.evidenceValidation && (
            <div className="cyber-panel rounded-xl p-5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <div>
                  <h3 className="font-display font-bold text-white text-sm">Deterministic Evidence Contract Audit</h3>
                  <p className="text-[11px] text-[#7C988B] font-mono">
                    Referential integrity validation against stored sources
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-semibold ${
                  guide.evidenceValidation.overallReliability === 'high_confidence'
                    ? 'bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30'
                    : guide.evidenceValidation.overallReliability === 'partially_verified'
                    ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    guide.evidenceValidation.overallReliability === 'high_confidence'
                      ? 'bg-[#00F29D]'
                      : guide.evidenceValidation.overallReliability === 'partially_verified'
                      ? 'bg-[#00E5FF]'
                      : 'bg-amber-400'
                  }`} />
                  {guide.evidenceValidation.overallReliability === 'high_confidence' && 'High Confidence (All Claims Verified)'}
                  {guide.evidenceValidation.overallReliability === 'partially_verified' && 'Partially Verified'}
                  {guide.evidenceValidation.overallReliability === 'unverified_desk_research' && 'Unverified Desk Research'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B]">
                  <span className="text-[10px] text-[#7C988B] font-mono block">Total Claims</span>
                  <span className="text-base font-display font-bold text-white">{guide.evidenceValidation.totalClaims}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B]">
                  <span className="text-[10px] text-[#7C988B] font-mono block">Verified Claims</span>
                  <span className="text-base font-display font-bold text-[#00F29D]">{guide.evidenceValidation.verifiedClaims}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B]">
                  <span className="text-[10px] text-[#7C988B] font-mono block">Review Queue</span>
                  <span className="text-base font-display font-bold text-amber-400">{guide.evidenceValidation.claimsRequiringReview}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B]">
                  <span className="text-[10px] text-[#7C988B] font-mono block">Discovered Sources</span>
                  <span className="text-base font-display font-bold text-[#00E5FF]">{guide.sources.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sourced Citations */}
          <div className="cyber-panel rounded-xl p-5 text-xs">
            <h3 className="font-display font-bold text-white mb-3">Primary Documentation & Reference Sources</h3>
            <div className="divide-y divide-[#1B382B]">
              {guide.sources.map((s) => (
                <div key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <a
                      href={s.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00F29D] hover:underline font-semibold flex items-center gap-1 font-display"
                    >
                      <span>{s.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {s.summary && <p className="text-[#7C988B] text-[11px]">{s.summary}</p>}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#7C988B]">
                      <span>Method: <strong className="text-[#D1E7DD]">{s.retrievalMethod}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className={s.retrievalStatus === 'retrieved' ? 'text-[#00F29D]' : 'text-amber-400'}>{s.retrievalStatus}</strong></span>
                      {s.retrievedAt && (
                        <>
                          <span>•</span>
                          <span>Timestamp: {new Date(s.retrievedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-[#7C988B] shrink-0 uppercase bg-[#0A0F0D] px-2 py-0.5 rounded border border-[#1B382B] self-start">
                    {s.sourceType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Consequential Claims Audit */}
          {guide.claims && guide.claims.length > 0 && (
            <div className="cyber-panel rounded-xl p-5 text-xs">
              <h3 className="font-display font-bold text-white mb-3">Audited Claims & Grounding Proof</h3>
              <div className="space-y-3">
                {guide.claims.map((c) => {
                  const linkedSources = guide.sources.filter(s => c.sourceIds?.includes(s.id));
                  return (
                    <div key={c.id} className="p-3.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[#D1E7DD] text-xs">"{c.statement}"</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                          c.validationStatus === 'verified'
                            ? 'bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {c.validationStatus || 'verified'}
                        </span>
                      </div>

                      {c.validationNote && (
                        <div className="text-[11px] text-[#7C988B] font-mono">
                          Audit Note: <span className="text-[#D1E7DD]">{c.validationNote}</span>
                        </div>
                      )}

                      {c.uncertaintyNote && (
                        <div className="text-[11px] text-amber-400 font-mono">
                          Remaining Uncertainty: {c.uncertaintyNote}
                        </div>
                      )}

                      {linkedSources.length > 0 && (
                        <div className="pt-2 border-t border-[#1B382B]/60 flex flex-wrap gap-2 text-[10px] font-mono">
                          <span className="text-[#7C988B]">Cited Sources:</span>
                          {linkedSources.map(ls => (
                            <a
                              key={ls.id}
                              href={ls.canonicalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#00E5FF] hover:underline flex items-center gap-1"
                            >
                              <span>{ls.title}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Step Pack Modal */}
      {pack && (
        <NextStepPackModal
          pack={pack}
          guide={guide}
          isOpen={packModalOpen}
          onClose={() => setPackModalOpen(false)}
        />
      )}
    </div>
  );
};
