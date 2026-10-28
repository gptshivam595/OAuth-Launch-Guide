import React from 'react';
import { Compass, BookOpen, FileText, Plus, Moon, Sun, Sparkles } from 'lucide-react';

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
  isDark = true,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1B382B] bg-[#060B09]/85 backdrop-blur-md cyber-highlight-top">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90 focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00F29D] text-[#060B09] shadow-[0_0_12px_rgba(0,242,157,0.4)] font-bold">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-white tracking-tight text-sm">
                  OAuth Launch Guide
                </span>
                <span className="hidden sm:inline-flex rounded border border-[#1B382B] bg-[#0F1512] px-2 py-0.5 text-[10px] font-mono font-medium text-[#00F29D]">
                  for Composio
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Navigation links & Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              currentRoute === 'home'
                ? 'bg-[#1B211E] text-white border border-[#1B382B] shadow-sm'
                : 'text-[#7C988B] hover:text-white hover:bg-[#171D1A]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00F29D]" />
            <span>Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('research')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              currentRoute === 'research'
                ? 'bg-[#1B211E] text-white border border-[#1B382B] shadow-sm'
                : 'text-[#7C988B] hover:text-white hover:bg-[#171D1A]'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#7C988B]" />
            <span className="hidden sm:inline">Research & Decisions</span>
            <span className="sm:hidden">Research</span>
          </button>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={isDark ? "Dark theme active" : "Toggle theme"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1B382B] bg-[#0F1512] text-[#7C988B] hover:text-white hover:border-[#00F29D]/40 transition"
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-[#00F29D]" /> : <Moon className="h-3.5 w-3.5 text-[#7C988B]" />}
            </button>
          )}

          <button
            onClick={onOpenIntake}
            className="flex items-center gap-1.5 rounded-full btn-emerald-glow px-4 py-1.5 text-xs font-bold transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Investigate App</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
