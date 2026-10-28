import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  Compass, 
  FileCheck 
} from 'lucide-react';
import { fetchResearchJob } from '../api/client.js';
import { ResearchJob, ResearchJobEvent } from '../types/client.js';

interface ResearchProgressProps {
  jobId: string;
  onGuideReady: (guideId: string) => void;
  onRetry: () => void;
}

const STAGES: { key: ResearchJobEvent['stage']; label: string; icon: any }[] = [
  { key: 'resolve_identity', label: '1. Resolve Provider Identity', icon: Compass },
  { key: 'check_composio', label: '2. Check Composio Toolkit & Managed Auth', icon: Layers },
  { key: 'read_provider_requirements', label: '3. Read Provider Setup & Scopes', icon: BookOpen },
  { key: 'assess_oauth_path', label: '4. Assess Managed vs Owned OAuth Path', icon: ShieldCheck },
  { key: 'build_guide', label: '5. Build Structured Sourced Guide', icon: FileCheck },
  { key: 'check_evidence', label: '6. Check Evidence & Scope Contract', icon: CheckCircle2 },
];

export const ResearchProgress: React.FC<ResearchProgressProps> = ({
  jobId,
  onGuideReady,
  onRetry,
}) => {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    let isMounted = true;

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 6;

    async function poll() {
      try {
        const data = await fetchResearchJob(jobId);
        if (!isMounted) return;
        consecutiveErrors = 0;
        setJob(data);

        if (data.status === 'completed' && data.guideId) {
          return;
        } else if (data.status === 'failed') {
          return;
        }

        // Poll every 1.5s
        timer = setTimeout(poll, 1500);
      } catch (e: any) {
        if (!isMounted) return;
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setError(e.message || 'Error communicating with research agent');
        } else {
          timer = setTimeout(poll, 1800);
        }
      }
    }

    poll();

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-200">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-red-200 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <h2 className="text-base font-bold text-white">Investigation Encountered a Network Error</h2>
          </div>
          <p className="text-xs text-red-300 mb-4">{error}</p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-400 px-4 py-2 text-xs font-bold text-black transition"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retry Research Job</span>
          </button>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === job?.currentStage);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 text-[#D1E7DD]">
      {/* Top Banner */}
      <div className="mb-6 cyber-panel cyber-highlight-top rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00F29D]/15 px-3 py-0.5 text-xs font-mono font-bold text-[#00F29D] border border-[#00F29D]/30 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] animate-pulse shadow-[0_0_6px_#00F29D]" />
                Live Agent Investigation
              </span>
              <span className="text-xs text-[#7C988B] font-mono">Job: {jobId.slice(0, 16)}...</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white mt-2">
              Investigating OAuth Requirements: {job?.providerInput || 'Target Provider'}
            </h1>
            <p className="text-xs text-[#7C988B] mt-1">
              Actions: <span className="text-[#D1E7DD] font-medium">"{job?.assumptions.intendedActions}"</span> | Audience: <span className="text-[#D1E7DD] font-medium">{job?.assumptions.audience}</span>
            </p>
          </div>

          {job?.status === 'completed' && job.guideId && (
            <button
              onClick={() => onGuideReady(job.guideId!)}
              className="inline-flex items-center gap-2 rounded-full btn-emerald-glow px-6 py-2.5 text-xs font-bold transition shadow-lg shrink-0 cursor-pointer"
            >
              <span>View Sourced Guide</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {job?.status === 'failed' && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full btn-cyber-ghost px-5 py-2 text-xs font-semibold text-white transition shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Investigation</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Execution Stages */}
        <div className="lg:col-span-1 cyber-panel rounded-2xl p-5 shadow-xl">
          <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[#7C988B] mb-4">
            Investigation Stages
          </h2>
          <div className="space-y-3">
            {STAGES.map((s, idx) => {
              const isPast = job?.status === 'completed' || (currentStageIndex > -1 && idx < currentStageIndex);
              const isCurrent = job?.status !== 'completed' && job?.currentStage === s.key;

              return (
                <div
                  key={s.key}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs transition ${
                    isCurrent
                      ? 'border-[#00F29D] bg-[#0E1A14] text-white ring-1 ring-[#00F29D]/50 shadow-[0_0_12px_rgba(0,242,157,0.15)]'
                      : isPast
                      ? 'border-[#1B382B] bg-[#0A0F0D] text-[#D1E7DD]'
                      : 'border-transparent text-[#7C988B]'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-mono ${
                      isPast
                        ? 'bg-[#00F29D]/20 text-[#00F29D] font-bold border border-[#00F29D]/30'
                        : isCurrent
                        ? 'bg-[#00F29D] text-[#060B09] font-bold shadow-[0_0_8px_rgba(0,242,157,0.4)] animate-pulse'
                        : 'bg-[#171D1A] text-[#7C988B]'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold font-display">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discovered Sources Box */}
          <div className="mt-6 pt-5 border-t border-[#1B382B]">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#7C988B] mb-3 flex items-center justify-between">
              <span>Discovered Sources</span>
              <span className="text-[11px] text-[#00F29D] font-mono">
                {job?.sourcesDiscovered.length || 0}
              </span>
            </h3>
            {job?.sourcesDiscovered && job.sourcesDiscovered.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {job.sourcesDiscovered.map((source) => (
                  <li key={source.id} className="truncate">
                    <a
                      href={source.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#00F29D] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0 text-[#7C988B]" />
                      <span className="truncate">{source.title || source.canonicalUrl}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#7C988B] italic">Discovered URLs will appear here as sources are inspected.</p>
            )}
          </div>
        </div>

        {/* Right Column: Activity Log & Events */}
        <div className="lg:col-span-2 cyber-panel rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1B382B]">
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-[#7C988B]">
              Agent Activity Stream
            </h2>
            <span className="text-[11px] text-[#7C988B] font-mono">
              Live execution telemetry
            </span>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
            {job?.events && job.events.length > 0 ? (
              job.events.map((evt, idx) => (
                <div key={idx} className="relative pl-6 pb-2 border-l border-[#1B382B] last:border-transparent">
                  <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-[#00F29D] shadow-[0_0_8px_#00F29D] ring-4 ring-[#060B09]" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-display font-bold text-white">{evt.title}</span>
                    <span className="text-[10px] text-[#7C988B] font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#D1E7DD] mt-1 leading-relaxed">{evt.description}</p>
                  {evt.sourceUrl && (
                    <a
                      href={evt.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#00F29D] hover:underline mt-1.5 font-mono"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span>{evt.sourceUrl}</span>
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#7C988B]">
                <span>Waiting for agent to initialize research pipeline...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
