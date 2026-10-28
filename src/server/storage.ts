import fs from 'node:fs';
import path from 'node:path';
import { Guide, NextStepPack, ResearchJob, GuideAssumptions } from './types.js';
import { SEED_GUIDES, SEED_NEXT_STEP_PACKS } from './seedData.js';

interface StorageState {
  guides: Record<string, Guide>;
  researchJobs: Record<string, ResearchJob>;
  nextStepPacks: Record<string, NextStepPack>;
}

export function normalizeGuide(raw: any): Guide {
  if (!raw) return raw;
  const slug = raw.slug || (raw.id ? raw.id.replace(/-guide-v\d+$/, '') : 'provider');
  const providerName = raw.providerName || slug.charAt(0).toUpperCase() + slug.slice(1);

  // Normalize pathAssessment
  const rawPA = raw.pathAssessment || {};
  const startingPath = 
    rawPA.startingPath || raw.startingPath || 
    (raw.composioToolkitMatch?.managedAuthAvailable === 'available' ? 'composio_managed_suitable' : 'register_owned_app');

  const pathAssessment = {
    startingPath,
    headline: rawPA.headline || (startingPath === 'composio_managed_suitable' 
      ? 'Composio-managed OAuth appears suitable for development and initial rollout' 
      : 'Register an owned OAuth app in provider developer portal'),
    why: rawPA.why || rawPA.rationale || raw.rationale || 
      `Path assessment based on provider OAuth requirements and documentation for ${providerName}.`,
    assumptions: {
      intendedActions: rawPA.assumptions?.intendedActions || raw.exampleUseCase || raw.intendedUse || 'Integration actions',
      audience: rawPA.assumptions?.audience || 'external_customers',
      customBrandingRequired: !!rawPA.assumptions?.customBrandingRequired,
      alreadyHasApp: !!rawPA.assumptions?.alreadyHasApp,
      specialNotes: rawPA.assumptions?.specialNotes || '',
    },
    canStartTesting: {
      status: rawPA.canStartTesting?.status || 'yes',
      note: rawPA.canStartTesting?.note || 'Testing is supported in development environment.',
    },
    whatCouldBlockLaunch: rawPA.whatCouldBlockLaunch || raw.launchRisk || 'Workspace administrator approval or provider verification.',
    developerEffort: rawPA.developerEffort || rawPA.effort || raw.effort || '1–2 hours for initial setup.',
    externalWaiting: rawPA.externalWaiting || rawPA.waiting || raw.waiting || (startingPath === 'composio_managed_suitable' ? 'Zero waiting with managed OAuth.' : 'Unknown - depends on provider queue.'),
    myNextAction: rawPA.myNextAction || rawPA.nextAction || raw.nextAction || 'Connect in sandbox environment and verify required permissions.',
    limitations: Array.isArray(rawPA.limitations) ? rawPA.limitations : [
      'Consent screen branding is determined by OAuth app registration.',
      'API rate limits and quotas apply to the registered client.'
    ],
  };

  // Normalize composioToolkitMatch
  let composioToolkitMatch = raw.composioToolkitMatch || raw.toolkit || null;
  if (composioToolkitMatch) {
    composioToolkitMatch = {
      found: composioToolkitMatch.found ?? true,
      slug: composioToolkitMatch.slug || slug,
      name: composioToolkitMatch.name || `${providerName} Toolkit`,
      docUrl: composioToolkitMatch.docUrl || `https://docs.composio.dev/toolkits/${slug}`,
      managedAuthAvailable: composioToolkitMatch.managedAuthAvailable || 'available',
      relevantAuthMethod: composioToolkitMatch.relevantAuthMethod || 'OAuth 2.0',
      metadataStatus: composioToolkitMatch.metadataStatus || 'documentation_checked',
      limitationsDocumented: Array.isArray(composioToolkitMatch.limitationsDocumented) 
        ? composioToolkitMatch.limitationsDocumented 
        : ['Managed OAuth displays Composio branding on the provider consent screen.'],
      supportedActionsSummary: Array.isArray(composioToolkitMatch.supportedActionsSummary)
        ? composioToolkitMatch.supportedActionsSummary
        : [`${slug}_read`, `${slug}_write`],
      customAuthDocUrl: composioToolkitMatch.customAuthDocUrl || 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
    };
  }

  // Normalize sources
  const sources = Array.isArray(raw.sources) ? raw.sources.map((s: any, idx: number) => ({
    id: s.id || `src-${slug}-${idx + 1}`,
    title: s.title || `${providerName} Documentation`,
    canonicalUrl: s.canonicalUrl || s.url || `https://docs.composio.dev/toolkits/${slug}`,
    sourceType: s.sourceType || 'provider_docs',
    retrievalMethod: s.retrievalMethod || 'direct_fetch',
    retrievalStatus: s.retrievalStatus || 'retrieved',
    retrievedAt: s.retrievedAt || new Date().toISOString(),
    summary: s.summary || '',
  })) : [];

  return {
    ...raw,
    id: raw.id || `${slug}-guide-v1`,
    slug,
    version: raw.version || 1,
    providerName,
    providerWebsite: raw.providerWebsite || `https://${slug}.com`,
    exampleUseCase: raw.exampleUseCase || raw.intendedUse || pathAssessment.assumptions.intendedActions,
    composioToolkitMatch,
    useCaseFit: raw.useCaseFit || 'supported_by_evidence',
    pathAssessment,
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites : [],
    permissionsTable: Array.isArray(raw.permissionsTable) ? raw.permissionsTable : [],
    setupChecklist: Array.isArray(raw.setupChecklist) ? raw.setupChecklist : [],
    approvalAndDistribution: raw.approvalAndDistribution || {
      appRegistration: `Self-service registration in ${providerName} developer portal.`,
      apiProductAccessApproval: 'Standard API access enabled upon app registration.',
      providerVerification: 'Provider verification may apply for external public distribution.',
      marketplaceDistribution: 'Optional directory listing.',
      customerAdminApproval: 'Workspace admin approval may be required by enterprise policies.',
      endUserConsent: 'User consent prompt during authorization code exchange.'
    },
    blockersAndRecovery: Array.isArray(raw.blockersAndRecovery) ? raw.blockersAndRecovery : [],
    evidenceAndUnknowns: raw.evidenceAndUnknowns || {
      composioDocs: composioToolkitMatch?.docUrl ? [composioToolkitMatch.docUrl] : [],
      providerDocs: sources.filter((s: any) => s.sourceType === 'provider_docs').map((s: any) => s.canonicalUrl),
      metadataApiObservations: [],
      communityReports: [],
      estimates: [],
      setupAttempts: [],
      unresolvedAssumptions: [],
    },
    sources,
    claims: Array.isArray(raw.claims) ? raw.claims : [],
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export class StorageRepository {
  private filePath: string;
  private state: StorageState;

  constructor(dataDir = path.resolve(process.cwd(), 'data')) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'guides.json');
    this.state = this.loadInitialState();
  }

  private loadInitialState(): StorageState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.guides && Object.keys(parsed.guides).length > 0) {
          const normalizedGuides: Record<string, Guide> = {};
          for (const [id, g] of Object.entries(parsed.guides)) {
            normalizedGuides[id] = normalizeGuide(g);
          }
          return {
            guides: normalizedGuides,
            researchJobs: parsed.researchJobs || {},
            nextStepPacks: parsed.nextStepPacks || {},
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read existing storage, initializing with seed data:', e);
    }

    // Default with seeds
    const guides: Record<string, Guide> = {};
    for (const guide of SEED_GUIDES) {
      guides[guide.id] = normalizeGuide(guide);
    }

    const state: StorageState = {
      guides,
      researchJobs: {},
      nextStepPacks: { ...SEED_NEXT_STEP_PACKS },
    };

    this.persist(state);
    return state;
  }

  private persist(state: StorageState) {
    try {
      const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
    } catch (e) {
      console.error('Error persisting state to disk:', e);
    }
  }

  public getAllGuides(): Guide[] {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.guides) {
          for (const [id, g] of Object.entries(parsed.guides)) {
            this.state.guides[id] = normalizeGuide(g);
          }
        }
      } catch {}
    }
    return Object.values(this.state.guides)
      .map(g => normalizeGuide(g))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getGuideById(id: string): Guide | null {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.guides && parsed.guides[id]) {
          this.state.guides[id] = normalizeGuide(parsed.guides[id]);
        }
      } catch {}
    }
    const guide = this.state.guides[id];
    return guide ? normalizeGuide(guide) : null;
  }

  public getGuideBySlug(slug: string): Guide | null {
    const list = Object.values(this.state.guides).filter(g => g.slug.toLowerCase() === slug.toLowerCase());
    if (list.length === 0) return null;
    const sorted = list.sort((a, b) => b.version - a.version);
    return normalizeGuide(sorted[0]);
  }

  public saveGuide(guide: Guide): Guide {
    const normalized = normalizeGuide(guide);
    normalized.updatedAt = new Date().toISOString();
    this.state.guides[normalized.id] = normalized;
    this.persist(this.state);
    return normalized;
  }

  public createGuideVersion(previousGuideId: string, newAssumptions: GuideAssumptions): Guide | null {
    const prev = this.getGuideById(previousGuideId);
    if (!prev) return null;

    const newVersion = prev.version + 1;
    const newId = `${prev.slug}-guide-v${newVersion}`;

    // Clone and adjust assessment
    const newGuide: Guide = JSON.parse(JSON.stringify(prev));
    newGuide.id = newId;
    newGuide.version = newVersion;
    newGuide.previousVersionId = prev.id;
    newGuide.pathAssessment.assumptions = newAssumptions;
    newGuide.updatedAt = new Date().toISOString();
    newGuide.createdAt = new Date().toISOString();

    // Re-evaluate if custom branding or team vs external changed
    if (newAssumptions.customBrandingRequired) {
      newGuide.pathAssessment.startingPath = 'register_owned_app';
      newGuide.pathAssessment.headline = 'Register your own OAuth app (Custom Branding Required)';
      newGuide.pathAssessment.why = 'Because your customers need to see your product name and logo on the provider authorization screen, Composio-managed OAuth is not sufficient. You must register an owned provider OAuth app.';
    } else if (newGuide.composioToolkitMatch?.managedAuthAvailable === 'available' && !newAssumptions.customBrandingRequired) {
      newGuide.pathAssessment.startingPath = 'composio_managed_suitable';
      newGuide.pathAssessment.headline = 'Composio-managed OAuth appears suitable';
      newGuide.pathAssessment.why = 'Managed OAuth is available and you have not specified custom branding requirements. You can test and launch with Composio managed authentication.';
    }

    this.saveGuide(newGuide);
    return newGuide;
  }

  public getResearchJob(jobId: string): ResearchJob | null {
    let job = this.state.researchJobs[jobId];
    if (!job && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.researchJobs && parsed.researchJobs[jobId]) {
          job = parsed.researchJobs[jobId];
          this.state.researchJobs[jobId] = job;
        }
      } catch {}
    }
    return job || null;
  }

  public getAllResearchJobs(): ResearchJob[] {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.researchJobs) {
          this.state.researchJobs = { ...this.state.researchJobs, ...parsed.researchJobs };
        }
      } catch {}
    }
    return Object.values(this.state.researchJobs);
  }

  public saveResearchJob(job: ResearchJob): ResearchJob {
    job.updatedAt = new Date().toISOString();
    this.state.researchJobs[job.id] = job;
    this.persist(this.state);
    return job;
  }

  public getNextStepPack(guideId: string): NextStepPack | null {
    const pack = this.state.nextStepPacks[guideId];
    if (pack) return pack;
    // Check if any pack has guideId
    return Object.values(this.state.nextStepPacks).find(p => p.guideId === guideId) || null;
  }

  public saveNextStepPack(pack: NextStepPack): NextStepPack {
    this.state.nextStepPacks[pack.guideId] = pack;
    this.persist(this.state);
    return pack;
  }
}

export const repository = new StorageRepository();
