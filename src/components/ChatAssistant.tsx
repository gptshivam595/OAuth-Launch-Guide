import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Bot, ChevronDown, ChevronUp, ExternalLink, RotateCcw, Send, User } from 'lucide-react';
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

const TASK_CHIPS = ['Gmail Sales Assistant', 'LinkedIn Social Agent', 'Airtable CRM Sync', 'Slack Notifications'];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onOpenGuide, onOpenIntake }) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    sender: 'assistant',
    text: "👋 **Find your OAuth path to launch with Composio.** Ask me what your AI agent needs to do. I'll verify if **Composio-managed OAuth** works, identify exact scopes, and flag launch blockers.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, sender: 'user', text, timestamp: new Date().toISOString() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`, sender: 'assistant', text: res.reply, matchedGuideId: res.matchedGuideId,
        sources: res.matchedGuideId ? [
          { title: 'Composio Managed Auth Documentation', url: 'https://docs.composio.dev/toolkits/managed-auth' },
          { title: 'Provider Developer Policies & OAuth Specs', url: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app' },
        ] : undefined, timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, sender: 'assistant', text: 'Could not connect to the research service. Browse the guide library or submit an app name manually.', timestamp: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  return <div className="site-card flex h-[580px] flex-col overflow-hidden rounded-2xl">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div><h3 className="font-semibold text-slate-900">OAuth Launch Assistant</h3><p className="mt-1 text-xs text-slate-500">Ask integration questions and get grounded setup guidance.</p></div>
      <button onClick={() => setMessages([messages[0]])} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
    </div>
    <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
      {messages.map((message) => <div key={message.id} className={`flex max-w-[90%] gap-3 ${message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${message.sender === 'user' ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white'}`}>{message.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-4 w-4" />}</span>
        <div className="space-y-2">
          <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.sender === 'user' ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-700'}`}>{message.sender === 'user' ? <p className="whitespace-pre-wrap">{message.text}</p> : <MarkdownView content={message.text} />}</div>
          {message.matchedGuideId && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800"><BookOpen className="h-4 w-4 text-blue-600" />Verified guide available</span><button onClick={() => onOpenGuide(message.matchedGuideId!)} className="primary-button inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold">Open Guide <ArrowRight className="h-3 w-3" /></button></div></div>}
          {message.sources && <div className="text-xs"><button onClick={() => setExpandedSources((prev) => ({ ...prev, [message.id]: !prev[message.id] }))} className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">{expandedSources[message.id] ? 'Hide sourced evidence' : 'View sourced evidence'}{expandedSources[message.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>{expandedSources[message.id] && <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-2.5">{message.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-slate-500 hover:text-blue-600"><ExternalLink className="h-3 w-3 shrink-0" />{source.title}</a>)}</div>}</div>}
        </div>
      </div>)}
      {loading && <div className="flex items-center gap-3 text-sm text-slate-500"><span className="h-7 w-7 rounded-full bg-blue-600" /><span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">Analyzing Composio fit &amp; scopes...</span></div>}
      <div ref={messagesEndRef} />
    </div>
    <div className="border-t border-slate-100 px-4 py-3"><div className="mb-3 flex gap-2 overflow-x-auto">{TASK_CHIPS.map((chip) => <button key={chip} onClick={() => handleSend(`Tell me about ${chip.toLowerCase()} OAuth setup.`)} className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">{chip}</button>)}</div><form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative"><input value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="Ask about OAuth setup, scopes, review blockers, or Composio fit..." className="soft-input w-full rounded-xl py-3 pl-4 pr-12 text-sm" /><button type="submit" disabled={!input.trim() || loading} className="primary-button absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40"><Send className="h-4 w-4" /></button></form></div>
  </div>;
};
