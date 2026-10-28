import React from 'react';
import { 
  FileText, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Compass, 
  Layers, 
  ArrowRight,
  Info,
  Terminal,
  Cpu
} from 'lucide-react';

interface ResearchDecisionsProps {
  onBack: () => void;
  onOpenIntake: () => void;
}

export const ResearchDecisions: React.FC<ResearchDecisionsProps> = ({
  onBack,
  onOpenIntake,
}) => {
  return (
    <div className="legacy-light-surface mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 text-slate-700">
      {/* Top Header */}
      <div className="mb-8 pb-6 border-b border-[#1B382B]">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-full bg-[#00F29D]/15 px-3 py-0.5 text-[10px] font-mono font-bold text-[#00F29D] border border-[#00F29D]/30 uppercase">
            Design Rationale & Architecture
          </span>
          <span className="text-xs text-[#7C988B] font-mono">/ Composio APM Deliverable</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
          Research, Architecture & Product Decisions
        </h1>
        <p className="text-xs sm:text-sm text-[#7C988B] mt-2 max-w-3xl leading-relaxed">
          How desk research, provider policies, Composio Connect (MCP), and the Agent Plugins standard shaped the OAuth Launch Guide.
        </p>

        {/* Mandatory Research Disclosure */}
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold text-amber-200">Research Method Disclosure:</span>
            <p className="mt-0.5 text-amber-300/80">
              Exploratory desk research and official documentation audit. No developer interviews or authenticated provider setup attempts have been completed unless recorded in the validation log below.
            </p>
          </div>
        </div>
      </div>

      {/* Target Developer & Problem Definition */}
      <div className="mb-8 cyber-panel cyber-highlight-top rounded-2xl p-6 shadow-xl">
        <h2 className="text-base font-display font-bold text-white mb-3 flex items-center gap-2">
          <Compass className="h-5 w-5 text-[#00F29D]" />
          <span>The Developer Persona & Problem Context</span>
        </h2>
        <div className="space-y-3 text-xs text-[#D1E7DD] leading-relaxed font-sans">
          <p>
            <strong className="text-white">Primary Persona:</strong> XYZ is an engineer building an autonomous AI sales assistant. Their assistant must connect to customer inboxes (Gmail) and CRM tables (HubSpot or Airtable) to qualify incoming leads.
          </p>
          <p>
            <strong className="text-white">The Problem:</strong> When XYZ reads provider documentation, they encounter a maze of terms: client IDs, scopes, test users, consent screens, verification videos, and annual security audits (CASA Tier 2). They cannot easily answer:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#7C988B] pl-2">
            <li><em>Can I test with Composio's managed OAuth app right now?</em></li>
            <li><em>Will Google or LinkedIn block my external customers at launch?</em></li>
            <li><em>How long will verification take—days or weeks?</em></li>
            <li><em>What materials must I prepare (demo video, domain verification, privacy policy)?</em></li>
          </ul>

          {/* System Roles Breakdown Table */}
          <div className="mt-4 pt-4 border-t border-[#1B382B]">
            <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider mb-2">
              System Roles & Output Boundary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#1B382B] rounded-xl overflow-hidden">
                <thead className="bg-[#060B09] border-b border-[#1B382B] font-display">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold text-[#7C988B]">Person / System</th>
                    <th className="py-2.5 px-3.5 font-semibold text-[#7C988B]">Exact Role in Integration Journey</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B382B] bg-[#0A0F0D]">
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-white">XYZ's Developer</td>
                    <td className="py-2.5 px-3.5 text-[#D1E7DD]">Uses <strong>OAuth Launch Guide</strong> to evaluate requirements, choose between Composio-managed vs owned OAuth, and generate review packs.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-[#00F29D]">Research Agent</td>
                    <td className="py-2.5 px-3.5 text-[#D1E7DD]">Investigates provider requirements live, audits Composio toolkits, and produces sourced, actionable guidance and Next-Step action packs.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-white">XYZ's AI Sales Assistant</td>
                    <td className="py-2.5 px-3.5 text-[#D1E7DD]">The developer's finished AI product that consumes permitted Gmail & CRM APIs after setup.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-white">Aman (XYZ Customer)</td>
                    <td className="py-2.5 px-3.5 text-[#D1E7DD]">Authorizes access to his own accounts at runtime via the provider's standard OAuth consent dialog.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Composio Connect & Agent Plugins Section */}
      <div className="mb-8 cyber-panel rounded-2xl p-6 shadow-xl text-xs border-[#1B382B]">
        <h2 className="text-base font-display font-bold text-white mb-2 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-[#00F29D]" />
          <span>Composio Connect & Agent Plugins Integration</span>
        </h2>
        <p className="text-[#D1E7DD] leading-relaxed mb-4">
          Composio solves the developer's integration runtime challenge through <strong>Composio Connect</strong> and the open <strong>Agent Plugins</strong> standard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0A0F0D] border border-[#1B382B]">
            <h3 className="font-display font-bold text-[#00F29D] text-sm mb-1.5 flex items-center gap-1.5">
              <span>1. Composio Connect (MCP)</span>
            </h3>
            <p className="text-[#7C988B] mb-2 leading-relaxed">
              Shared Model Context Protocol endpoint at <code className="font-mono text-[#00F29D] bg-[#060B09] px-1.5 py-0.5 rounded border border-[#1B382B]">https://connect.composio.dev/mcp</code>.
            </p>
            <ul className="space-y-1 text-[#7C988B] text-[11px]">
              <li>• Connects AI clients (Cursor, Claude Code, Codex, Windsurf) to 1000+ apps without custom SDK sessions.</li>
              <li>• Exposes 7 meta-tools allowing the agent to discover tools, request OAuth consent on demand, and execute actions.</li>
              <li>• Eliminates token storage and refresh plumbing from the agent codebase.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0F0D] border border-[#1B382B]">
            <h3 className="font-display font-bold text-[#00E5FF] text-sm mb-1.5 flex items-center gap-1.5">
              <span>2. Agent Plugins Standard</span>
            </h3>
            <p className="text-[#7C988B] mb-2 leading-relaxed">
              Open, vendor-neutral standard co-developed with maintainers from Microsoft, OpenAI, Amazon, Cursor, and Vercel.
            </p>
            <ul className="space-y-1 text-[#7C988B] text-[11px]">
              <li>• Packages reusable Agent Skills (instructions) and MCP servers together into portable plugins.</li>
              <li>• Enables seamless CLI installation: <code className="font-mono text-[#00E5FF] bg-[#060B09] px-1.5 py-0.5 rounded border border-[#1B382B]">composio plugin install</code>.</li>
              <li>• Decouples agent prompt logic from low-level OAuth credentials.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Decisions: Observation -> Source -> Limitation -> Decision */}
      <div className="mb-8">
        <h2 className="text-lg font-display font-bold text-white mb-4">
          Key Product Decisions & Research Evidence
        </h2>

        <div className="space-y-4">
          {[
            {
              title: '1. Recommend Composio-Managed OAuth for Speed, Owned App for White-Labeling',
              observation: 'Composio provides managed OAuth for many toolkits, enabling developers to prototype and test instantly with zero developer portal registration.',
              source: 'Composio Docs (Managed Auth & Custom App vs Managed App)',
              sourceUrl: 'https://docs.composio.dev/toolkits/managed-auth',
              limitation: 'Managed OAuth displays "Composio" branding on consent screens and shares rate limits. Owned app is required when customers mandate custom enterprise branding.',
              decision: 'Recommend Composio-Managed OAuth prominently for fastest time-to-market, with instant path toggling to Owned App when custom branding is required.',
            },
            {
              title: '2. Inquire About Intended Actions & Clarify Scopes Early',
              observation: 'A toolkit badge does not mean every action has identical review tiers. In Gmail, reading inboxes (gmail.readonly) and drafting (gmail.compose) are Restricted Scopes requiring CASA Tier 2 audits for external public apps.',
              source: 'Google Workspace Gmail API Scopes & Restricted Scope Verification',
              sourceUrl: 'https://developers.google.com/workspace/gmail/api/auth/scopes',
              limitation: 'Developers often assume having a valid OAuth token grants unlimited access to all API endpoints.',
              decision: 'Ask developers what their agent will specifically do during intake, and provide explicit scope mapping showing review implications.',
            },
            {
              title: '3. Shared Quota Awareness for High-Volume Providers',
              observation: 'Composio documentation explicitly advises registering an owned LinkedIn OAuth app for production to avoid shared rate limit exhaustion across all Composio users.',
              source: 'Composio LinkedIn Setup Guide',
              sourceUrl: 'https://composio.dev/auth/linkedin',
              limitation: 'Managed OAuth creates a shared single point of failure for production volume.',
              decision: 'For LinkedIn and high-volume providers, advise owned app registration for production external rollout.',
            },
            {
              title: '4. Dynamic Investigation for Unfamiliar Providers',
              observation: 'Competitor platforms maintain static guides for top 50 apps, leaving developers with custom or internal SaaS apps with zero guidance.',
              source: 'Nango Auth Guide & Arcade Production Auth Specs',
              sourceUrl: 'https://nango.dev/docs/guides/auth/auth-guide',
              limitation: 'Pre-written guides cannot cover the long tail of enterprise tools.',
              decision: 'Implement a bounded research agent using Google Gen AI with search grounding to investigate unfamiliar providers dynamically and synthesize structured guides with attached sources.',
            },
          ].map((item, idx) => (
            <div key={idx} className="cyber-panel rounded-xl p-5 shadow-sm text-xs">
              <h3 className="font-display font-bold text-white text-sm mb-3">{item.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#D1E7DD]">
                <div className="rounded-xl bg-[#0A0F0D] p-3.5 border border-[#1B382B]">
                  <span className="font-display font-bold text-[#00F29D] block mb-1">Observation</span>
                  <p className="leading-relaxed">{item.observation}</p>
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#00F29D] hover:underline mt-2.5 font-mono"
                  >
                    <span>Source: {item.source}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="rounded-xl bg-[#0A0F0D] p-3.5 border border-[#1B382B]">
                  <span className="font-display font-bold text-[#00E5FF] block mb-1">Limitation & Product Decision</span>
                  <p className="text-[#7C988B] mb-1.5"><span className="text-[#D1E7DD] font-semibold">Limitation:</span> {item.limitation}</p>
                  <p className="font-medium text-[#D1E7DD] bg-[#0E1A14] p-2.5 rounded-lg border border-[#00F29D]/30 mt-1">
                    <span className="font-bold text-[#00F29D]">Decision:</span> {item.decision}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Log */}
      <div className="mb-8 cyber-panel rounded-2xl p-6 shadow-xl">
        <div className="pb-3 border-b border-[#1B382B] flex items-center justify-between mb-4">
          <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#00F29D]" />
            <span>Validation Log: Claims, Checks & Corrections</span>
          </h2>
          <span className="text-xs text-[#7C988B] font-mono">/ Honest audit of test scenarios</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse border border-[#1B382B] rounded-xl overflow-hidden">
            <thead>
              <tr className="border-b border-[#1B382B] bg-[#060B09] text-[#7C988B] font-display">
                <th className="py-2.5 px-3 font-semibold">Scenario</th>
                <th className="py-2.5 px-3 font-semibold">Claim Checked</th>
                <th className="py-2.5 px-3 font-semibold">Method</th>
                <th className="py-2.5 px-3 font-semibold">Observed Result & Correction</th>
                <th className="py-2.5 px-3 font-semibold">Remaining Uncertainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B382B] bg-[#0A0F0D] text-[#D1E7DD]">
              <tr>
                <td className="py-3 px-3 font-medium text-white">Airtable Private App</td>
                <td className="py-3 px-3">"Airtable requires an app review before any external user can connect."</td>
                <td className="py-3 px-3">Airtable Developer Hub official documentation inspection</td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-[#00F29D]">Corrected:</span> False. Airtable does not require review for unlisted private OAuth integrations; review only applies to public Airtable Marketplace listings.
                </td>
                <td className="py-3 px-3 text-[#7C988B]">Enterprise admin policies may restrict third-party client IDs.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-white">LinkedIn Company Page</td>
                <td className="py-3 px-3">"w_member_social allows posting to LinkedIn Company Pages."</td>
                <td className="py-3 px-3">Microsoft Learn LinkedIn API permissions audit</td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-[#00F29D]">Corrected:</span> False. w_member_social is strictly personal. Organization posting requires w_organization_social via Community Management API partner approval.
                </td>
                <td className="py-3 px-3 text-[#7C988B]">Partner program acceptance criteria for early-stage companies.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-white">Gmail Scopes</td>
                <td className="py-3 px-3">"Composio managed OAuth removes the need for Google verification."</td>
                <td className="py-3 px-3">Google OAuth Restricted Scope policy audit</td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-[#00F29D]">Clarified:</span> Managed OAuth works for development/test users. But launching external customer connections under your own brand requires Google verification and CASA Tier 2 for restricted scopes.
                </td>
                <td className="py-3 px-3 text-[#7C988B]">Variable turnaround times across Google reviewer queues.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Back button */}
      <div className="text-center pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full btn-emerald-glow px-6 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <span>← Back to OAuth Launch Guide</span>
        </button>
      </div>
    </div>
  );
};
