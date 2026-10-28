import React, { useState } from 'react';
import { X, Copy, Check, Download, AlertTriangle, ShieldCheck, Sparkles, FileText, Terminal, Globe, ExternalLink } from 'lucide-react';
import { NextStepPack, Guide } from '../types/client.js';

interface NextStepPackModalProps {
  pack: NextStepPack;
  guide: Guide;
  isOpen: boolean;
  onClose: () => void;
}

export const NextStepPackModal: React.FC<NextStepPackModalProps> = ({
  pack,
  guide,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (!isOpen) return null;

  const mcpUrl = 'https://connect.composio.dev/mcp';
  const cliCommand = `npx composio-core add ${guide.slug}`;

  const fullMarkdown = `# ${pack.title}
*Generated on ${new Date(pack.generatedAt).toLocaleDateString()} for ${guide.providerName}*

## Summary
${pack.summary}

## Composio Connect & Agent Plugins Setup
- Shared Composio MCP URL: \`${mcpUrl}\`
- Agent CLI Setup: \`${cliCommand}\`
- Integration Model: ${pack.pathType === 'managed' ? 'Composio-Managed OAuth (instant, pre-configured scopes)' : 'Owned Provider OAuth Client (custom branding)'}

${pack.sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n')}

${pack.draftPermissionJustification ? `## Draft Permission Justification\n> ${pack.draftPermissionJustification}\n` : ''}

${pack.demoWalkthroughOutline ? `## Demo Walkthrough Video Outline\n${pack.demoWalkthroughOutline}\n` : ''}

${pack.reviewerInstructionsTemplate ? `## Reviewer Test Account Instructions Template\n\`\`\`\n${pack.reviewerInstructionsTemplate}\n\`\`\`\n` : ''}

## Warnings & Disclaimers
${pack.warningsAndDisclaimers.map((w) => `- ${w}`).join('\n')}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.slug}-next-step-pack.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    ...pack.sections.map((s, idx) => ({ id: idx, title: s.title, type: 'section' })),
    { id: pack.sections.length, title: 'Composio Connect & Plugins', type: 'connect' },
    ...(pack.draftPermissionJustification ? [{ id: pack.sections.length + 1, title: 'Scope Justification', type: 'justification' }] : []),
    ...(pack.reviewerInstructionsTemplate ? [{ id: pack.sections.length + 2, title: 'Reviewer Instructions', type: 'instructions' }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="legacy-light-surface relative w-full max-w-3xl rounded-2xl cyber-panel-elevated cyber-highlight-top shadow-2xl my-8 flex flex-col max-h-[90vh] text-slate-700"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1B382B] shrink-0 bg-[#0A0F0D]/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                Action Pack
              </span>
              <span className="rounded-full bg-[#171D1A] px-2.5 py-0.5 text-[10px] font-mono text-[#7C988B] border border-[#1B382B]">
                {pack.pathType === 'managed' ? 'Composio Managed Path' : 'Owned Provider App Path'}
              </span>
            </div>
            <h2 className="text-lg font-display font-bold text-white mt-2">
              {pack.title}
            </h2>
            <p className="text-xs text-[#7C988B] mt-0.5">
              Copy-pasteable setup checklists, Composio Connect MCP endpoints, and draft justifications.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#7C988B] hover:text-[#00F29D] hover:bg-[#171D1A] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body with tabs */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Disclaimer Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Developer Review Required</p>
              <p className="text-amber-300/80 text-[11px] mt-0.5">
                Draft justifications and walkthrough outlines are templates generated from official guidelines. Always review before submitting to providers. This tool does not collect secrets or submit external forms.
              </p>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex border-b border-[#1B382B] gap-2 overflow-x-auto pb-1 text-xs font-medium">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 border-b-2 whitespace-nowrap transition font-display ${
                  activeTab === t.id
                    ? 'border-[#00F29D] text-[#00F29D] font-bold bg-[#00F29D]/5'
                    : 'border-transparent text-[#7C988B] hover:text-white'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="rounded-xl border border-[#1B382B] bg-[#0A0F0D] p-4 text-xs">
            {/* Section content */}
            {activeTab < pack.sections.length && (
              <div>
                <h3 className="text-sm font-display font-bold text-white mb-2">
                  {pack.sections[activeTab].title}
                </h3>
                <div className="text-xs text-[#D1E7DD] whitespace-pre-line leading-relaxed font-sans">
                  {pack.sections[activeTab].content}
                </div>
              </div>
            )}

            {/* Composio Connect & Agent Plugins Tab */}
            {activeTab === pack.sections.length && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className="h-4 w-4 text-[#00F29D]" />
                  <h3 className="text-sm font-display font-bold text-white">Composio Connect & Agent Plugins</h3>
                </div>
                <p className="text-[#7C988B] leading-relaxed">
                  Composio provides a unified <strong>Model Context Protocol (MCP) server</strong> and native <strong>Agent Plugins</strong> so your AI agent can discover tools, trigger user authorization links on the fly, and execute actions across 1000+ apps without custom token storage code.
                </p>

                {/* MCP Endpoint Box */}
                <div className="p-3.5 rounded-xl bg-[#060B09] border border-[#1B382B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-[#00F29D]">1. Composio Connect (MCP Server URL)</span>
                    <a
                      href="https://docs.composio.dev/docs/composio-connect"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00F29D] hover:underline inline-flex items-center gap-1 text-[11px] font-mono"
                    >
                      <span>Docs</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#7C988B]">
                    Add this MCP URL to your client (Cursor, Claude Code, Codex, Windsurf, or LangChain):
                  </p>
                  <div className="flex items-center justify-between bg-[#0A0F0D] border border-[#1B382B] rounded-lg px-3 py-2 font-mono text-[#00F29D]">
                    <span className="truncate">{mcpUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mcpUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[#7C988B] hover:text-[#00F29D] transition text-xs shrink-0 ml-2"
                      title="Copy MCP URL"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* CLI Setup Box */}
                <div className="p-3.5 rounded-xl bg-[#060B09] border border-[#1B382B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-[#00E5FF]">2. Agent Plugin CLI Setup</span>
                    <a
                      href="https://docs.composio.dev/docs/agent-plugins"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00E5FF] hover:underline inline-flex items-center gap-1 text-[11px] font-mono"
                    >
                      <span>Agent Plugins Standard</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#7C988B]">
                    Install toolkit integration directly into your agent runtime via Composio CLI:
                  </p>
                  <div className="flex items-center justify-between bg-[#0A0F0D] border border-[#1B382B] rounded-lg px-3 py-2 font-mono text-[#00E5FF]">
                    <span className="truncate">{cliCommand}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cliCommand);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-[#7C988B] hover:text-[#00E5FF] transition text-xs shrink-0 ml-2"
                      title="Copy CLI command"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scope justification tab */}
            {pack.draftPermissionJustification && activeTab === pack.sections.length + 1 && (
              <div>
                <h3 className="text-sm font-display font-bold text-white mb-2">Draft Permission Justification</h3>
                <blockquote className="p-3.5 rounded-xl bg-[#060B09] border border-[#1B382B] text-[#D1E7DD] leading-relaxed font-sans italic">
                  "{pack.draftPermissionJustification}"
                </blockquote>
                <p className="mt-3 text-[11px] text-[#7C988B] font-mono">
                  Submit this explanation during developer portal app registration or scope review questionnaires.
                </p>
              </div>
            )}

            {/* Reviewer instructions tab */}
            {pack.reviewerInstructionsTemplate && activeTab === pack.sections.length + 2 && (
              <div>
                <h3 className="text-sm font-display font-bold text-white mb-2">Reviewer Test Account Instructions</h3>
                <pre className="p-3.5 rounded-xl bg-[#060B09] border border-[#1B382B] font-mono text-[11px] text-[#D1E7DD] overflow-x-auto whitespace-pre-wrap">
                  {pack.reviewerInstructionsTemplate}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-[#1B382B] bg-[#0A0F0D]/90 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full btn-cyber-ghost px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#00F29D]" /> : <Copy className="h-3.5 w-3.5 text-[#7C988B]" />}
              <span>{copied ? 'Copied' : 'Copy All Markdown'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-full btn-cyber-ghost px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-[#7C988B]" />
              <span>Download .md</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded-full btn-emerald-glow px-5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
