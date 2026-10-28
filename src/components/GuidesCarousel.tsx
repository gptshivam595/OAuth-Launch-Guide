import React, { useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { GuideSummary } from '../types/client.js';

interface GuidesCarouselProps {
  guides: GuideSummary[];
  onOpenGuide: (id: string) => void;
  onNavigateToResearch?: () => void;
}

export const GuidesCarousel: React.FC<GuidesCarouselProps> = ({ guides, onOpenGuide, onNavigateToResearch }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const filteredGuides = guides.filter((g) => `${g.providerName} ${g.exampleUseCase} ${g.startingPath}`.toLowerCase().includes(filterQuery.toLowerCase()));
  const pageSize = 3;
  const maxIndex = Math.max(0, Math.ceil(filteredGuides.length / pageSize) - 1);
  const currentGuides = filteredGuides.slice(carouselIndex * pageSize, carouselIndex * pageSize + pageSize);

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-600" /><h2 className="text-2xl font-bold tracking-tight">Researched Provider Guides Directory</h2></div>
          <p className="mt-1 text-sm text-slate-500">Verified scopes, Composio-managed compatibility, and approval queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filterQuery} onChange={(e) => { setFilterQuery(e.target.value); setCarouselIndex(0); }} placeholder="Search guides..." className="soft-input w-full rounded-xl py-2.5 pl-9 pr-3 text-sm" /></div>
          {filteredGuides.length > pageSize && <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setCarouselIndex((i) => i > 0 ? i - 1 : maxIndex)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button><span className="px-1 text-xs font-medium text-slate-500">{carouselIndex + 1}/{maxIndex + 1}</span><button type="button" onClick={() => setCarouselIndex((i) => i < maxIndex ? i + 1 : 0)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button></div>}
        </div>
      </div>
      {currentGuides.length === 0 ? <div className="site-card rounded-2xl p-8 text-center text-sm text-slate-500">No provider guides matching “{filterQuery}”.</div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentGuides.map((g) => {
          const isManaged = g.startingPath === 'composio_managed_suitable';
          const isOwned = g.startingPath === 'register_owned_app';
          return <article key={g.id} className="site-card flex min-h-[245px] flex-col rounded-2xl p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{g.providerName}</h3><span className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">v{g.version}</span></div>
            <span className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isManaged ? 'bg-emerald-50 text-emerald-700' : isOwned ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{isManaged ? 'Composio-managed suitable' : isOwned ? 'Owned app advised' : 'Requirements unverified'}</span>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{g.exampleUseCase}</p>
            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"><span className="font-semibold text-slate-500">Wait: </span>{g.externalWaiting}</div>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="truncate text-xs text-slate-500">{g.developerEffort || 'Ready to start'}</span><button onClick={() => onOpenGuide(g.id)} className="secondary-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold">View Guide <ArrowRight className="h-3.5 w-3.5 text-blue-600" /></button></div>
          </article>;
        })}
      </div>}
      {onNavigateToResearch && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>Official provider specs &amp; Composio developer standards</span><button onClick={onNavigateToResearch} className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline">View research decisions <ArrowRight className="h-4 w-4" /></button></div>}
    </section>
  );
};
