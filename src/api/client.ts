import { Guide, GuideSummary, NextStepPack, ResearchJob, GuideAssumptions } from '../types/client.js';

async function safeJsonFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackError = 'Request failed'
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    throw new Error(`Network error contacting server: ${netErr?.message || fallbackError}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Check if it returned HTML (e.g. proxy 502/503 or SPA index.html)
    const preview = await res.text().catch(() => '');
    const isHtml = preview.trim().startsWith('<') || preview.includes('<!DOCTYPE');
    if (isHtml) {
      throw new Error(`Server temporarily unavailable or returned HTML instead of JSON (${res.status} ${res.statusText}).`);
    }
    throw new Error(`Expected JSON response but received ${contentType || 'non-JSON'} (${res.status}).`);
  }

  if (!res.ok) {
    let errBody: any = {};
    try {
      errBody = await res.json();
    } catch {
      // non-parseable
    }
    throw new Error(errBody.error || `${fallbackError} (${res.status} ${res.statusText})`);
  }

  try {
    return await res.json();
  } catch (jsonErr: any) {
    throw new Error(`Failed to parse server response as JSON: ${jsonErr.message}`);
  }
}

export async function fetchAllGuides(): Promise<GuideSummary[]> {
  return safeJsonFetch<GuideSummary[]>('/api/guides', undefined, 'Failed to fetch guides list');
}

export async function fetchGuide(idOrSlug: string): Promise<Guide> {
  return safeJsonFetch<Guide>(`/api/guides/${idOrSlug}`, undefined, `Failed to load guide "${idOrSlug}"`);
}

export async function startResearchJob(
  providerInput: string,
  websiteInput: string | undefined,
  assumptions: GuideAssumptions
): Promise<{ jobId: string; status: string }> {
  return safeJsonFetch<{ jobId: string; status: string }>(
    '/api/research',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerInput, websiteInput, assumptions }),
    },
    'Failed to start research investigation'
  );
}

export async function fetchResearchJob(jobId: string): Promise<ResearchJob> {
  return safeJsonFetch<ResearchJob>(`/api/research/${jobId}`, undefined, 'Failed to poll research job');
}

export async function createGuideVersion(guideId: string, assumptions: GuideAssumptions): Promise<Guide> {
  return safeJsonFetch<Guide>(
    `/api/guides/${guideId}/version`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assumptions }),
    },
    'Failed to create new guide version'
  );
}

export async function fetchNextStepPack(guideId: string): Promise<NextStepPack> {
  return safeJsonFetch<NextStepPack>(
    `/api/guides/${guideId}/next-step-pack`,
    {
      method: 'POST',
    },
    'Failed to generate or retrieve next-step pack'
  );
}

export async function sendChatMessage(message: string): Promise<{ reply: string; matchedGuideId?: string | null }> {
  return safeJsonFetch<{ reply: string; matchedGuideId?: string | null }>(
    '/api/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    },
    'Chat request failed'
  );
}
