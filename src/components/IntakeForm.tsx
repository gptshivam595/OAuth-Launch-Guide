import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { GuideAssumptions } from '../types/client.js';

interface IntakeFormProps {
  initialProvider?: string;
  onSubmit: (provider: string, website: string, assumptions: GuideAssumptions) => void;
  onSelectPreset?: (provider: string) => void;
}

export const IntakeForm: React.FC<IntakeFormProps> = ({
  initialProvider = '',
  onSubmit,
  onSelectPreset,
}) => {
  const [provider, setProvider] = useState(initialProvider);
  const [website, setWebsite] = useState('');
  const [intendedActions, setIntendedActions] = useState('');
  const [audience, setAudience] = useState<'team_only' | 'external_customers' | 'not_sure'>('external_customers');
  const [customBranding, setCustomBranding] = useState<'yes' | 'no_preference' | 'not_sure'>('no_preference');
  const [alreadyHasApp, setAlreadyHasApp] = useState<'no' | 'yes' | 'not_sure'>('no');
  const [error, setError] = useState<string | null>(null);

  // Sync initial provider if passed
  useEffect(() => {
    if (initialProvider) {
      setProvider(initialProvider);
      autoFillActions(initialProvider);
    }
  }, [initialProvider]);

  const autoFillActions = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('linkedin') && !intendedActions) {
      setIntendedActions('Share updates and articles to user feed, and view basic profile info');
    } else if (lower.includes('airtable') && !intendedActions) {
      setIntendedActions('Read base records and create CRM sync entries in user tables');
    } else if (lower.includes('gmail') && !intendedActions) {
      setIntendedActions('Read customer inbound emails and compose draft replies in inbox');
    } else if (lower.includes('slack') && !intendedActions) {
      setIntendedActions('Send notifications and respond to user messages in channels');
    } else if (lower.includes('hubspot') && !intendedActions) {
      setIntendedActions('Create and update contact records and sales pipeline deals');
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProvider(val);
    autoFillActions(val);
  };

  const applyPreset = (presetName: string, defaultAction: string) => {
    setProvider(presetName);
    setIntendedActions(defaultAction);
    if (onSelectPreset) {
      onSelectPreset(presetName);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim()) {
      setError('Please specify which app you want your agent to connect to.');
      return;
    }
    if (!intendedActions.trim()) {
      setError('Please describe what your agent should do with this app.');
      return;
    }

    setError(null);
    onSubmit(provider.trim(), website.trim(), {
      intendedActions: intendedActions.trim(),
      audience,
      customBrandingRequired: customBranding === 'yes',
      alreadyHasApp: alreadyHasApp === 'yes',
      specialNotes: '',
    });
  };

  const isLinkedIn = provider.toLowerCase().includes('linkedin');
  const isGmail = provider.toLowerCase().includes('gmail') || provider.toLowerCase().includes('google');

  return (
    <div className="cyber-panel cyber-highlight-top rounded-2xl p-5 sm:p-7 shadow-2xl text-xs text-[#D1E7DD]">
      {/* Form Header */}
      <div className="pb-4 border-b border-[#1B382B] mb-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#00F29D]" />
              <span>Investigate OAuth Setup Path</span>
            </h2>
            <p className="text-xs text-[#7C988B] mt-0.5">
              Tell our research agent about your target integration, actions, and audience.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#00F29D] bg-[#00F29D]/10 border border-[#00F29D]/25 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] shadow-[0_0_8px_#00F29D]" />
            <span>COMPOSIO-FIRST ASSESSMENT</span>
          </div>
        </div>

        {/* Quick Presets Row */}
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-[#7C988B] font-mono text-[10px] uppercase shrink-0">Popular:</span>
          {[
            { name: 'Gmail', desc: 'Read customer emails and compose follow-ups' },
            { name: 'LinkedIn', desc: 'Share updates to user feed and company pages' },
            { name: 'Airtable', desc: 'Read base records and write CRM sync rows' },
            { name: 'Slack', desc: 'Post notifications and respond to channel messages' },
          ].map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p.name, p.desc)}
              className="rounded-lg border border-[#1B382B] bg-[#0A0F0D] px-2.5 py-1 text-[#D1E7DD] hover:text-white hover:border-[#00F29D]/60 hover:bg-[#171D1A] transition shrink-0 whitespace-nowrap font-medium"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-300 border border-amber-500/30">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. WHICH APP DO YOU WANT YOUR AGENT TO CONNECT TO? * */}
        <div>
          <label className="block text-[11px] font-display font-bold text-[#D1E7DD] uppercase tracking-wider mb-1.5">
            Which app do you want your agent to connect to? *
          </label>
          <input
            type="text"
            value={provider}
            onChange={handleProviderChange}
            placeholder="e.g. LinkedIn, Airtable, Slack, or provider website"
            className="w-full rounded-xl cyber-input px-3.5 py-2.5 text-xs text-white placeholder:text-[#7C988B] focus:border-[#00F29D] transition shadow-inner"
            required
          />
          <p className="mt-1 text-[11px] text-[#7C988B]">
            Enter the third-party application your users will connect—not your own product website.
          </p>
        </div>

        {/* 2. WHAT SHOULD YOUR AGENT DO? * */}
        <div>
          <label className="block text-[11px] font-display font-bold text-[#D1E7DD] uppercase tracking-wider mb-1.5">
            What should your agent do? *
          </label>
          <textarea
            rows={2}
            value={intendedActions}
            onChange={(e) => setIntendedActions(e.target.value)}
            placeholder="e.g. Read incoming customer emails and draft follow-up replies"
            className="w-full rounded-xl cyber-input px-3.5 py-2.5 text-xs text-white placeholder:text-[#7C988B] focus:border-[#00F29D] transition shadow-inner"
            required
          />

          {/* Contextual Nuance Alerts */}
          {isLinkedIn && (
            <p className="mt-1.5 text-[11px] text-[#00E5FF] bg-[#00E5FF]/10 p-2.5 rounded-lg border border-[#00E5FF]/30">
              <span className="font-bold text-white">Nuance check:</span> Personal feed posting (<code className="font-mono text-[10px] text-[#00E5FF]">w_member_social</code>) is self-serve. Managing Company Pages requires LinkedIn's Community Management API partner review.
            </p>
          )}
          {isGmail && (
            <p className="mt-1.5 text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/40">
              <span className="font-bold text-amber-200">Scope check:</span> Official Google API policies classify both reading (<code className="font-mono text-[10px] text-amber-300">gmail.readonly</code>) and drafting/sending (<code className="font-mono text-[10px] text-amber-300">gmail.compose</code>) as Restricted Scopes requiring CASA Tier 2 security assessment for external public apps. (Internal workspace apps bypass this).
            </p>
          )}
        </div>

        {/* 3. WHO WILL CONNECT THEIR ACCOUNTS? * */}
        <div>
          <label className="block text-[11px] font-display font-bold text-[#D1E7DD] uppercase tracking-wider mb-1.5">
            Who will connect their accounts? *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'external_customers', label: 'External customers', desc: 'Public users/tenants' },
              { id: 'team_only', label: 'My team only', desc: 'Internal workspace' },
              { id: 'not_sure', label: 'Not sure yet', desc: 'Evaluating options' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAudience(opt.id as any)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  audience === opt.id
                    ? 'border-[#00F29D] bg-[#00F29D]/10 text-white ring-1 ring-[#00F29D]/50 shadow-[0_0_15px_rgba(0,242,157,0.15)]'
                    : 'border-[#1B382B] bg-[#0A0F0D] text-[#7C988B] hover:border-[#3B4A40] hover:text-[#D1E7DD]'
                }`}
              >
                <span className="font-bold font-display text-xs text-white block mb-0.5">{opt.label}</span>
                <span className="text-[10px] text-[#7C988B]">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4. DO CUSTOMERS NEED TO SEE YOUR PRODUCT'S NAME ON THE CONSENT SCREEN? */}
        <div>
          <label className="block text-[11px] font-display font-bold text-[#D1E7DD] uppercase tracking-wider mb-1.5">
            Do customers need to see your product's name on the consent screen?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'yes', label: 'Yes, our brand', desc: 'Requires owned app' },
              { id: 'no_preference', label: 'No preference', desc: 'Allows Composio app (Recommended)' },
              { id: 'not_sure', label: 'Not sure', desc: 'We will assess' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCustomBranding(opt.id as any)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  customBranding === opt.id
                    ? 'border-[#00F29D] bg-[#00F29D]/10 text-white ring-1 ring-[#00F29D]/50 shadow-[0_0_15px_rgba(0,242,157,0.15)]'
                    : 'border-[#1B382B] bg-[#0A0F0D] text-[#7C988B] hover:border-[#3B4A40] hover:text-[#D1E7DD]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold font-display text-xs text-white block mb-0.5">{opt.label}</span>
                  {opt.id === 'no_preference' && (
                    <span className="text-[9px] font-mono font-bold bg-[#00F29D]/20 text-[#00F29D] border border-[#00F29D]/30 px-1.5 py-0.5 rounded">Fastest</span>
                  )}
                </div>
                <span className="text-[10px] text-[#7C988B]">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. DO YOU ALREADY HAVE AN OAUTH APP REGISTERED WITH THIS PROVIDER? */}
        <div>
          <label className="block text-[11px] font-display font-bold text-[#D1E7DD] uppercase tracking-wider mb-2">
            Do you already have an OAuth app registered with this provider?
          </label>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#D1E7DD]">
            {[
              { id: 'no', label: 'No, starting fresh' },
              { id: 'yes', label: 'Yes, already registered' },
              { id: 'not_sure', label: 'Not sure' },
            ].map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="alreadyHasApp"
                  value={opt.id}
                  checked={alreadyHasApp === opt.id}
                  onChange={() => setAlreadyHasApp(opt.id as any)}
                  className="accent-[#00F29D] h-3.5 w-3.5 cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full btn-emerald-glow px-6 py-3 text-xs font-bold transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-[#060B09] fill-current" />
            <span>Investigate Setup Path</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
