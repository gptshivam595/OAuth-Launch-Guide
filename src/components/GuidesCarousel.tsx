import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, ChevronLeft, ChevronRight, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { GuideSummary } from '../types/client.js';

interface GuidesCarouselProps {
  guides: GuideSummary[];
  onOpenGuide: (id: string) => void;
  onNavigateToResearch?: () => void;
}

export const GuidesCarousel: React.FC<GuidesCarouselProps> = ({
  guides,
  onOpenGuide,
  onNavigateToResearch,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const filteredGuides = guides.filter((g) =>
    g.providerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
    g.exampleUseCase.toLowerCase().includes(filterQuery.toLowerCase()) ||
    g.startingPath.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const CAROUSEL_SIZE = 3;
  const maxIndex = Math.max(0, Math.ceil(filteredGuides.length / CAROUSEL_SIZE) - 1);

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const currentGuides = filteredGuides.slice(
    carouselIndex * CAROUSEL_SIZE,
    carouselIndex * CAROUSEL_SIZE + CAROUSEL_SIZE
  );

  return (
    <div className="w-full mt-8 pt-6 border-t border-[#1B382B]">
      {/* Directory Header with Search & Carousel Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#00F29D]" />
            <h2 className="text-base font-display font-bold text-white tracking-tight">
              Researched Provider Guides Directory
            </h2>
          </div>
          <p className="text-xs text-[#7C988B] mt-0.5">
            Verified scopes, Composio-managed compatibility, and approval queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7C988B]" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value);
                setCarouselIndex(0);
              }}
              placeholder="Filter guides..."
              className="w-full rounded-full cyber-input pl-8 pr-3 py-2 text-xs text-white placeholder:text-[#7C988B] transition shadow-inner"
            />
          </div>

          {/* Carousel Arrows */}
          {filteredGuides.length > CAROUSEL_SIZE && (
            <div className="flex items-center gap-1.5 shrink-0 bg-[#0A0F0D] p-1 rounded-full border border-[#1B382B]">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full text-[#7C988B] hover:text-[#00F29D] hover:bg-[#171D1A] transition"
                title="Previous guides"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono text-[#7C988B] px-1.5">
                {carouselIndex + 1}/{maxIndex + 1}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full text-[#7C988B] hover:text-[#00F29D] hover:bg-[#171D1A] transition"
                title="Next guides"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3 Carousel Boxes Visible */}
      {filteredGuides.length === 0 ? (
        <div className="cyber-panel rounded-2xl p-8 text-center text-xs text-[#7C988B]">
          No provider guides matching "{filterQuery}". Use the search bar above to launch real-time research.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentGuides.map((g) => {
            const isComposioManaged = g.startingPath === 'composio_managed_suitable';
            const isOwnedApp = g.startingPath === 'register_owned_app';

            return (
              <div
                key={g.id}
                className="cyber-panel rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#00F29D]/50 hover:shadow-[0_0_20px_rgba(0,242,157,0.12)] transition group duration-200"
              >
                <div>
                  {/* Top line: Name & Version */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-display font-bold text-white group-hover:text-[#00F29D] transition line-clamp-1">
                      {g.providerName}
                    </h3>
                    <span className="font-mono text-[9px] text-[#7C988B] bg-[#0A0F0D] px-1.5 py-0.5 rounded border border-[#1B382B] shrink-0">
                      v{g.version}
                    </span>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="mb-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase ${
                        isComposioManaged
                          ? 'bg-[#00F29D]/15 text-[#00F29D] border border-[#00F29D]/30'
                          : isOwnedApp
                          ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30'
                          : 'bg-[#171D1A] text-[#7C988B] border border-[#1B382B]'
                      }`}
                    >
                      {isComposioManaged && 'Composio-Managed Suitable'}
                      {isOwnedApp && 'Owned App Advised'}
                      {!isComposioManaged && !isOwnedApp && 'Custom Provider App'}
                    </span>
                  </div>

                  {/* Use Case Brief */}
                  <p className="text-[11px] text-[#7C988B] line-clamp-2 mb-3 leading-relaxed">
                    {g.exampleUseCase}
                  </p>

                  {/* Wait Time Breakdown Box - compact with 2-line clamp */}
                  <div className="rounded-lg border border-[#1B382B] bg-[#0A0F0D]/90 p-2 text-[11px] text-[#D1E7DD] mb-3 leading-snug">
                    <span className="font-semibold text-[#7C988B]">Wait: </span>
                    <span className="text-[#D1E7DD] line-clamp-2" title={g.externalWaiting}>{g.externalWaiting}</span>
                  </div>
                </div>

                {/* Bottom Card Footer: Effort & Action Button */}
                <div className="pt-3 border-t border-[#1B382B] flex items-center justify-between gap-2">
                  <div className="text-[10px] text-[#7C988B] truncate font-mono">
                    {g.developerEffort ? (
                      <>EFFORT: <span className="text-[#D1E7DD] font-semibold">{g.developerEffort.replace(/for [^;]+/g, '').trim()}</span></>
                    ) : (
                      <span className="text-[#00F29D] font-semibold">READY</span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenGuide(g.id)}
                    className="inline-flex items-center gap-1 rounded-full btn-cyber-ghost px-3 py-1 text-[11px] font-semibold text-white transition group-hover:border-[#00F29D] shrink-0"
                  >
                    <span>View Guide</span>
                    <ArrowRight className="h-3 w-3 text-[#00F29D] transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rationale and Docs link */}
      {onNavigateToResearch && (
        <div className="mt-5 flex items-center justify-between text-xs text-[#7C988B] px-1">
          <span className="font-mono text-[10px] uppercase">Official Provider Specs & Composio Developer Standards</span>
          <button
            onClick={onNavigateToResearch}
            className="text-[#00F29D] hover:underline font-semibold inline-flex items-center gap-1 transition"
          >
            <span>View Research Decisions & Evidence</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
