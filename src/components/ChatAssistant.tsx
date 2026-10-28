import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sendChatMessage } from '../api/client.js';
import { MarkdownView } from './MarkdownView.js';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchedGuideId?: string | null;
  sources?: Array<{ title: string; url: string }>;
  timestamp: string;
}

interface ChatAssistantProps {
  onOpenGuide: (guideId: string) => void;
  onOpenIntake: (providerHint?: string) => void;
}

const TASK_CHIPS = [
  { 
    label: 'Gmail Sales Assistant', 
    prompt: 'My AI sales assistant needs to read Gmail messages and compose replies. What OAuth setup and verification is needed?' 
  },
  { 
    label: 'LinkedIn Social Agent', 
    prompt: 'How do I connect my agent to LinkedIn to post updates for users? Does Composio managed OAuth work in production?' 
  },
  { 
    label: 'Airtable CRM Sync', 
    prompt: 'Can my agent read and update Airtable bases without undergoing provider app review?' 
  },
  { 
    label: 'Slack Notifications', 
    prompt: 'What permissions and approval are required to connect Slack for channel notifications?' 
  },
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  onOpenGuide,
  onOpenIntake,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 **Find your OAuth path to launch with Composio.** Ask me what your AI agent needs to do. I'll verify if **Composio-managed OAuth** works, identify exact scopes, and flag any launch blockers.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        matchedGuideId: res.matchedGuideId,
        sources: res.matchedGuideId ? [
          { title: 'Composio Managed Auth Documentation', url: 'https://docs.composio.dev/toolkits/managed-auth' },
          { title: 'Provider Developer Policies & OAuth Specs', url: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app' }
        ] : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "Could not connect to the research service. You can browse the guide library directly or submit an app name above.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cyber-panel cyber-highlight-top flex flex-col h-[580px] rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1B382B] bg-[#0A0F0D]/85">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30 shadow-[0_0_8px_rgba(0,242,157,0.2)]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-display font-semibold text-white">OAuth Launch Assistant</h3>
            <p className="text-[10px] text-[#7C988B] font-mono">Ask integration questions • Replies under 100 words</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="text-[11px] font-mono text-[#7C988B] hover:text-[#00F29D] flex items-center gap-1 transition px-2.5 py-1 rounded hover:bg-[#171D1A]"
          title="Reset conversation"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                m.sender === 'user'
                  ? 'bg-[#171D1A] text-[#00F29D] border border-[#1B382B]'
                  : 'bg-[#00F29D] text-[#060B09] shadow-[0_0_8px_rgba(0,242,157,0.3)]'
              }`}
            >
              {m.sender === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div className="space-y-2">
              <div
                className={`rounded-xl p-3.5 leading-relaxed text-xs ${
                  m.sender === 'user'
                    ? 'bg-[#00F29D] text-[#060B09] font-medium font-display rounded-tr-none shadow-[0_0_15px_rgba(0,242,157,0.2)]'
                    : 'bg-[#171D1A]/90 border border-[#1B382B] text-[#D1E7DD] rounded-tl-none font-sans'
                }`}
              >
                {m.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <MarkdownView content={m.text} />
                )}
              </div>

              {/* Matched Guide Action Card */}
              {m.matchedGuideId && (
                <div className="rounded-xl border border-[#00F29D]/35 bg-[#0E1A14]/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in shadow-md">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-[#00F29D] shrink-0" />
                    <div>
                      <span className="text-xs font-display font-bold text-white block">
                        Verified Guide Available
                      </span>
                      <span className="text-[10px] text-[#7C988B]">
                        Pre-mapped scopes, approval wait times, and launch recovery
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenGuide(m.matchedGuideId!)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full btn-emerald-glow px-3.5 py-1.5 text-xs font-bold transition shrink-0"
                  >
                    <span>Open Guide</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Expandable Sources */}
              {m.sources && m.sources.length > 0 && (
                <div className="text-[11px] text-[#7C988B]">
                  <button
                    onClick={() => toggleSource(m.id)}
                    className="inline-flex items-center gap-1 text-[#00F29D] hover:text-[#33f7b0] font-medium py-0.5"
                  >
                    <span>{expandedSources[m.id] ? 'Hide Sourced Evidence' : 'View Sourced Evidence'}</span>
                    {expandedSources[m.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expandedSources[m.id] && (
                    <div className="mt-1.5 p-2.5 rounded-lg bg-[#0A0F0D] border border-[#1B382B] space-y-1">
                      {m.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-[#7C988B] hover:text-[#00F29D] transition"
                        >
                          <ExternalLink className="h-2.5 w-2.5 text-[#00F29D] shrink-0" />
                          <span className="underline truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-center text-xs text-[#7C988B]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00F29D] text-[#060B09]">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-xl bg-[#171D1A] border border-[#1B382B] px-3.5 py-2.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] animate-pulse delay-100" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F29D] animate-pulse delay-200" />
              <span className="text-[11px] font-mono text-[#D1E7DD] ml-1">Analyzing Composio fit & scopes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4 Task Chips */}
      <div className="px-4 py-2 border-t border-[#1B382B] bg-[#0A0F0D]/90 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-[#7C988B] font-mono text-[10px] uppercase shrink-0">Quick ask:</span>
        {TASK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.prompt)}
            className="rounded-full border border-[#1B382B] bg-[#171D1A] px-3 py-1 text-[#D1E7DD] hover:text-white hover:border-[#00F29D]/50 hover:bg-[#252B29] transition shrink-0 whitespace-nowrap"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Centered Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-[#1B382B] bg-[#060B09]"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about OAuth setup, scopes, review blockers, or Composio fit..."
            className="w-full rounded-full cyber-input pl-4 pr-12 py-3 text-xs text-white placeholder:text-[#7C988B] transition shadow-inner"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full btn-emerald-glow text-[#060B09] font-bold disabled:opacity-20 transition"
            title="Send query"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
