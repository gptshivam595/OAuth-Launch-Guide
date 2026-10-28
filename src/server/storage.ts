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
  const slug = (raw.slug || (raw.id ? raw.id.replace(/-guide-v\d+$/, '') : 'provider'))
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
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
      : (startingPath === 'unverified_provider_requirements'
          ? 'Provider-Specific OAuth Requirements Not Yet Verified'
          : 'Register an owned OAuth app in provider developer portal')),
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
    externalWaiting: rawPA.externalWaiting || rawPA.waiting || raw.waiting || (startingPath === 'composio_managed_suitable' ? 'Zero waiting with managed OAuth.' : 'Not publicly specified - inspect provider developer portal.'),
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
      managedAuthAvailable: composioToolkitMatch.managedAuthAvailable || 'unknown',
      lookupOutcome: composioToolkitMatch.lookupOutcome || 'ambiguous_config',
      relevantAuthMethod: composioToolkitMatch.relevantAuthMethod || 'OAuth 2.0',
      metadataStatus: composioToolkitMatch.metadataStatus || 'documentation_checked',
      limitationsDocumented: Array.isArray(composioToolkitMatch.limitationsDocumented) 
        ? composioToolkitMatch.limitationsDocumented 
        : ['Inspect Composio documentation for toolkit authentication specifics.'],
      supportedActionsSummary: Array.isArray(composioToolkitMatch.supportedActionsSummary)
        ? composioToolkitMatch.supportedActionsSummary
        : [],
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
    retrievedAt: s.retrievedAt || null,
    summary: s.summary || '',
    supportingExcerpt: s.supportingExcerpt || '',
  })) : [];

  return {
    ...raw,
    id: raw.id || `${slug}-guide-v${raw.version || 1}`,
    slug,
    version: raw.version || 1,
    previousVersionId: raw.previousVersionId || undefined,
    providerName,
    providerWebsite: raw.providerWebsite || '',
    exampleUseCase: raw.exampleUseCase || raw.intendedUse || pathAssessment.assumptions.intendedActions,
    composioToolkitMatch,
    useCaseFit: raw.useCaseFit || 'unknown',
    pathAssessment,
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites : [],
    permissionsTable: Array.isArray(raw.permissionsTable) ? raw.permissionsTable : [],
    setupChecklist: Array.isArray(raw.setupChecklist) ? raw.setupChecklist : [],
    approvalAndDistribution: raw.approvalAndDistribution || {
      appRegistration: `Locate ${providerName} developer console to review app registration requirements.`,
      apiProductAccessApproval: 'Approval requirements not yet verified. Review provider developer policies.',
      providerVerification: 'Unknown - verification requirements vary by provider.',
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
    evidenceValidation: raw.evidenceValidation || undefined,
    isPartialResearch: raw.isPartialResearch || undefined,
    unverifiedNotice: raw.unverifiedNotice || undefined,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export class StorageRepository {
  private filePath: string;
  private state: StorageState;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(dataDir = path.resolve(process.cwd(), 'data')) {
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        console.warn(`Could not create data directory ${dataDir}:`, e);
      }
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
      console.warn('Failed to parse existing storage, creating backup and falling back to seed data:', e);
      try {
        if (fs.existsSync(this.filePath)) {
          fs.copyFileSync(this.filePath, `${this.filePath}.corrupted.${Date.now()}`);
        }
      } catch {}
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

    this.persistSync(state);
    return state;
  }

  private persistSync(state: StorageState): boolean {
    try {
      const tempPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.filePath);
      return true;
    } catch (e: any) {
      console.error('Error persisting state to disk:', e?.message || e);
      return false;
    }
  }

  private async persist(state: StorageState): Promise<boolean> {
    this.writeLock = this.writeLock.then(async () => {
      this.persistSync(state);
    });
    await this.writeLock;
    return true;
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
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const list = Object.values(this.state.guides).filter(g => g.slug.toLowerCase() === cleanSlug);
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
      newGuide.pathAssessment.headline = 'Composio-managed OAuth appears suitable for development and initial rollout';
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
    return Object.values(this.state.nextStepPacks).find(p => p.guideId === guideId) || null;
  }

  public saveNextStepPack(pack: NextStepPack): NextStepPack {
    this.state.nextStepPacks[pack.guideId] = pack;
    this.persist(this.state);
    return pack;
  }
}

export const repository = new StorageRepository();
