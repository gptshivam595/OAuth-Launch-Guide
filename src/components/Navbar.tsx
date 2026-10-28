import React from 'react';
import { Compass, FileText, Moon, Plus, Search, Sun } from 'lucide-react';

interface NavbarProps {
  currentRoute: 'home' | 'guide' | 'research' | 'job';
  onNavigate: (route: 'home' | 'research') => void;
  onOpenIntake: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  onOpenIntake,
  isDark = false,
  onToggleTheme,
}) => (
  <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
    <div className="mx-auto flex min-h-[68px] max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-3 text-left">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
          <Compass className="h-5 w-5" />
        </span>
        <span className="hidden sm:block">
          <span className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-slate-900">OAuth Launch Guide</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">for Composio</span>
          </span>
        </span>
      </button>

      <nav className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => onNavigate('research')}
          className={`hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex ${
            currentRoute === 'research' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          Research &amp; Decisions
        </button>
        <button className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 md:block">
          Provider Guides
        </button>
        <a href="https://docs.composio.dev" target="_blank" rel="noreferrer" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:block">
          Docs
        </a>
        {onToggleTheme && (
          <button onClick={onToggleTheme} title={isDark ? 'Dark theme active' : 'Toggle theme'} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        <button onClick={onOpenIntake} className="primary-button inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold sm:px-4">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Investigate App</span>
          <span className="sm:hidden">Investigate</span>
        </button>
      </nav>
    </div>
  </header>
);
