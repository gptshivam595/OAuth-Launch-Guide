import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Sparkles } from 'lucide-react';
import { GuideAssumptions } from '../types/client.js';

interface IntakeFormProps {
  initialProvider?: string;
  onSubmit: (provider: string, website: string, assumptions: GuideAssumptions) => void;
  onSelectPreset?: (provider: string) => void;
}

const presets = [
  { name: 'Gmail', desc: 'Read customer emails and compose follow-ups' },
  { name: 'LinkedIn', desc: 'Share updates to user feed and company pages' },
  { name: 'Airtable', desc: 'Read base records and write CRM sync rows' },
  { name: 'Slack', desc: 'Post notifications and respond to channel messages' },
  { name: 'Notion', desc: 'Read and update workspace pages' },
  { name: 'HubSpot', desc: 'Create and update contact records' },
];

export const IntakeForm: React.FC<IntakeFormProps> = ({ initialProvider = '', onSubmit, onSelectPreset }) => {
  const [provider, setProvider] = useState(initialProvider);
  const [website, setWebsite] = useState('');
  const [intendedActions, setIntendedActions] = useState('');
  const [audience, setAudience] = useState<'team_only' | 'external_customers' | 'not_sure'>('external_customers');
  const [customBranding, setCustomBranding] = useState<'yes' | 'no_preference' | 'not_sure'>('no_preference');
  const [alreadyHasApp, setAlreadyHasApp] = useState<'no' | 'yes' | 'not_sure'>('no');
  const [error, setError] = useState<string | null>(null);

  const autoFillActions = (name: string) => {
    if (intendedActions) return;
    const lower = name.toLowerCase();
    const actions = lower.includes('linkedin') ? 'Share updates and articles to user feed, and view basic profile info'
      : lower.includes('airtable') ? 'Read base records and create CRM sync entries in user tables'
      : lower.includes('gmail') ? 'Read customer inbound emails and compose draft replies in inbox'
      : lower.includes('slack') ? 'Send notifications and respond to user messages in channels'
      : lower.includes('hubspot') ? 'Create and update contact records and sales pipeline deals' : '';
    if (actions) setIntendedActions(actions);
  };

  useEffect(() => {
    if (initialProvider) {
      setProvider(initialProvider);
      autoFillActions(initialProvider);
    }
  }, [initialProvider]);

  const applyPreset = (name: string, desc: string) => {
    setProvider(name);
    setIntendedActions(desc);
    onSelectPreset?.(name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim()) return setError('Please specify which app you want your agent to connect to.');
    if (!intendedActions.trim()) return setError('Please describe what your agent should do with this app.');
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
  const optionGroups = [
    { label: 'Who will connect their accounts?', value: audience, set: setAudience, options: [
      ['external_customers', 'External customers', 'Public users/tenants'],
      ['team_only', 'My team only', 'Internal workspace'],
      ['not_sure', 'Not sure yet', 'Evaluating options'],
    ] },
    { label: "Do customers need to see your product's name on the consent screen?", value: customBranding, set: setCustomBranding, options: [
      ['yes', 'Yes, our brand', 'Requires owned app'],
      ['no_preference', 'No preference', 'Allows Composio app (Recommended)'],
      ['not_sure', 'Not sure', 'We will assess'],
    ] },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Popular providers</span>
          <span className="text-xs text-slate-400">Choose one to prefill the investigation</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button key={preset.name} type="button" onClick={() => applyPreset(preset.name, preset.desc)} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Which app do you want your agent to connect to? <span className="text-blue-600">*</span></label>
          <input value={provider} onChange={(e) => { setProvider(e.target.value); autoFillActions(e.target.value); }} placeholder="e.g. LinkedIn, Airtable, Slack, or provider website" className="soft-input w-full rounded-xl px-3.5 py-3 text-sm" required />
          <p className="mt-1.5 text-xs text-slate-500">Enter the third-party application your users will connect—not your own product website.</p>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-800">What should your agent do? <span className="text-blue-600">*</span></label>
          <textarea rows={3} value={intendedActions} onChange={(e) => setIntendedActions(e.target.value)} placeholder="e.g. Read incoming customer emails and draft follow-up replies" className="soft-input w-full rounded-xl px-3.5 py-3 text-sm" required />
          {isLinkedIn && <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800"><strong>Nuance check:</strong> Personal feed posting is self-serve. Managing Company Pages requires LinkedIn partner review.</p>}
          {isGmail && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800"><strong>Scope check:</strong> Gmail restricted scopes may require a CASA Tier 2 assessment for external public apps.</p>}
        </div>
        {optionGroups.map((group) => (
          <fieldset key={group.label} className="lg:col-span-2">
            <legend className="mb-2 text-sm font-semibold text-slate-800">{group.label}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {group.options.map(([id, label, desc]) => {
                const selected = group.value === id;
                return <button key={id} type="button" onClick={() => group.set(id as never)} className={`selection-card ${selected ? 'selection-card-selected' : ''} relative rounded-xl p-4 text-left`}>
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">{label}{selected && <Check className="h-4 w-4 text-blue-600" />}</span>
                  <span className="mt-1 block text-xs text-slate-500">{desc}</span>
                </button>;
              })}
            </div>
          </fieldset>
        ))}
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Do you already have an OAuth app registered with this provider?</label>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {[['no', 'No, starting fresh'], ['yes', 'Yes, already registered'], ['not_sure', 'Not sure']].map(([id, label]) => (
              <label key={id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="alreadyHasApp" checked={alreadyHasApp === id} onChange={() => setAlreadyHasApp(id as typeof alreadyHasApp)} className="h-4 w-4 accent-blue-600" />{label}
              </label>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Provider website <span className="font-normal text-slate-400">(optional)</span></label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://provider.com" className="soft-input w-full rounded-xl px-3.5 py-3 text-sm" />
        </div>
      </div>
      <button type="submit" className="primary-button inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold sm:w-auto">
        <Sparkles className="h-4 w-4" /><span>Investigate Setup Path</span><ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
};
