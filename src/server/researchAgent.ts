import { GoogleGenAI } from '@google/genai';
import { repository } from './storage.js';
import { inspectComposioToolkit } from './composioCatalog.js';
import { getProviderGrounding } from './providerGrounding.js';
import { validateEvidenceContract } from './evidenceValidator.js';
import { 
  Guide, 
  ResearchJob, 
  ResearchJobEvent, 
  GuideAssumptions, 
  Source, 
  Claim, 
  NextStepPack,
  StartingPath,
  PermissionItem,
  ChecklistStep,
  Blocker
} from './types.js';

function getAiClient() {
  const apiKey = process.env.GEMINI_RESEARCH_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isQuotaOrRateLimitError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate-limit') ||
    msg.includes('Rate limit') ||
    err?.status === 429 ||
    err?.code === 429
  );
}

// Bounded SSRF check for user-supplied URLs
export function isSafePublicUrl(urlStr: string): { safe: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, error: 'Only http and https protocols are permitted.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === 'metadata.google.internal' ||
      host === '169.254.169.254'
    ) {
      return { safe: false, error: 'Internal, private, and link-local addresses are restricted.' };
    }
    // Check RFC1918 private IPv4 patterns
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host)) {
      return { safe: false, error: 'Private network IP ranges are restricted.' };
    }
    return { safe: true };
  } catch (e: any) {
    return { safe: false, error: 'Malformed URL.' };
  }
}

async function callModelWithRetry(ai: any, params: any, maxRetries = 2): Promise<any> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      lastError = err;
      const isTransient = 
        err?.status === 503 ||
        err?.code === 503 ||
        err?.message?.includes('503') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('Overloaded');
      if (isTransient && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function runResearchJob(jobId: string): Promise<void> {
  const job = repository.getResearchJob(jobId);
  if (!job) return;

  const updateStage = (
    stage: ResearchJobEvent['stage'],
    title: string,
    description: string,
    sourceUrl?: string
  ) => {
    const event: ResearchJobEvent = {
      stage,
      title,
      description,
      timestamp: new Date().toISOString(),
      sourceUrl,
    };
    job.currentStage = stage;
    job.events.push(event);
    repository.saveResearchJob(job);
  };

  try {
    // Stage 1: Resolve identity
    updateStage(
      'resolve_identity',
      'Resolving Provider Identity',
      `Investigating provider input: "${job.providerInput}". Determining canonical identity and developer portal.`
    );

    const cleanInput = job.providerInput.trim().replace(/[\r\n\t]/g, ' ').slice(0, 100);
    const slug = cleanInput.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'unknown-provider';
    let providerName = cleanInput;
    let providerWebsite = '';

    // Validate website input if supplied
    if (job.websiteInput) {
      const urlCheck = isSafePublicUrl(job.websiteInput);
      if (urlCheck.safe) {
        providerWebsite = job.websiteInput.trim();
      } else {
        console.warn(`Unsafe or invalid website input "${job.websiteInput}": ${urlCheck.error}`);
      }
    }

    // Check verified provider grounding knowledge
    const grounding = getProviderGrounding(cleanInput);

    if (grounding) {
      providerName = grounding.providerName;
      if (!providerWebsite || providerWebsite.includes('example.com')) {
        providerWebsite = grounding.canonicalWebsite;
      }
    } else {
      if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
        const urlCheck = isSafePublicUrl(cleanInput);
        if (urlCheck.safe) {
          try {
            const parsedUrl = new URL(cleanInput);
            providerWebsite = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
            providerName = parsedUrl.hostname.replace(/^www\./, '').split('.')[0];
            providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
          } catch {
            providerName = cleanInput;
          }
        }
      } else {
        providerName = cleanInput.charAt(0).toUpperCase() + cleanInput.slice(1);
      }
    }

    // Stage 2: Check Composio Toolkit
    updateStage(
      'check_composio',
      'Checking Composio Toolkit & Managed Auth Support',
      `Searching Composio documentation for matching toolkit and checking managed authentication schemes.`
    );

    const composioInspection = await inspectComposioToolkit(providerName);
    const toolkitMatch = composioInspection.toolkit;

    if (composioInspection.outcome === 'confirmed_available' && toolkitMatch) {
      updateStage(
        'check_composio',
        `Confirmed Composio Toolkit: ${toolkitMatch.name}`,
        `Managed OAuth is confirmed available. Auth mode: ${toolkitMatch.relevantAuthMethod}. Provenance: ${composioInspection.retrievalProvenance}`,
        toolkitMatch.docUrl
      );
    } else if (composioInspection.outcome === 'confirmed_unavailable' && toolkitMatch) {
      updateStage(
        'check_composio',
        `Composio Toolkit Found: Managed OAuth Not Available`,
        `Documentation explicitly states managed OAuth is unavailable for ${toolkitMatch.name}. Custom OAuth app credentials required.`,
        toolkitMatch.docUrl
      );
    } else if (composioInspection.outcome === 'ambiguous_config' && toolkitMatch) {
      updateStage(
        'check_composio',
        `Composio Toolkit Identified: Managed Auth Ambiguous`,
        `Toolkit documentation inspected, but does not explicitly document whether a default managed OAuth app is available. Treated as unverified.`,
        toolkitMatch.docUrl
      );
    } else if (composioInspection.outcome === 'network_error') {
      updateStage(
        'check_composio',
        `Composio Catalog Check Inconclusive (Network Issue)`,
        `Could not reach Composio documentation service (${composioInspection.errorDetail || 'network failure'}). Availability treated as unknown.`
      );
    } else {
      updateStage(
        'check_composio',
        `No Matching Composio Toolkit Identified`,
        `Provider "${providerName}" was not identified in the Composio toolkit catalogue (${composioInspection.retrievalProvenance}). Direct provider OAuth required.`
      );
    }

    // Stage 3: Read Provider Requirements
    updateStage(
      'read_provider_requirements',
      'Investigating Provider Developer Portal & OAuth Specifications',
      `Retrieving official developer documentation for ${providerName} OAuth registration, scopes, and review policies.`
    );

    const discoveredSources: Source[] = [];

    // Add Composio doc source if found
    if (toolkitMatch && toolkitMatch.found) {
      discoveredSources.push({
        id: `src-comp-${toolkitMatch.slug}`,
        title: `${toolkitMatch.name} Documentation`,
        canonicalUrl: toolkitMatch.docUrl || 'https://docs.composio.dev',
        sourceType: 'composio_docs',
        retrievalMethod: toolkitMatch.metadataStatus === 'api_checked' ? 'metadata_api' : 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: new Date().toISOString(),
        summary: `Documented actions: ${toolkitMatch.supportedActionsSummary.join(', ') || 'No explicit actions extracted.'}`,
      });
    }

    // Add grounded official sources if known
    if (grounding) {
      grounding.officialDocSources.forEach((src, idx) => {
        discoveredSources.push({
          id: `src-grounding-${grounding.slug}-${idx + 1}`,
          title: src.title,
          canonicalUrl: src.url,
          sourceType: 'provider_docs',
          retrievalMethod: 'verified_doc_archive',
          retrievalStatus: 'cached',
          retrievedAt: '2026-10-20T01:00:00Z',
          summary: src.summary,
        });
      });
    }

    const ai = getAiClient();
    let searchCitationsFound = false;

    if (ai && !grounding) {
      try {
        const searchPrompt = `You are an integration research engineer reviewing OAuth 2.0 registration and approval requirements for "${providerName}".
Intended Agent Actions: "${job.assumptions.intendedActions}"
Audience: ${job.assumptions.audience}
Custom Branding: ${job.assumptions.customBrandingRequired ? 'Yes' : 'No'}

Report official facts from primary developer documentation:
1. Exact OAuth 2.0 app registration portal URL.
2. Exact official OAuth scopes for "${job.assumptions.intendedActions}". If scopes cannot be verified from official provider documentation, state "Unverified".
3. Approval and review requirements (app review, quota tiers, verification).
4. Review timelines: Report "Unknown" if no official SLA is published. Do not fabricate timelines.
5. Common developer blockers and rate limits.`;

        let searchRes: any;
        try {
          searchRes = await callModelWithRetry(ai, {
            model: 'gemini-3.8-flash',
            contents: searchPrompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });
        } catch (searchToolErr: any) {
          console.warn('Google Search tool error, attempting direct Gemini call:', searchToolErr?.message || searchToolErr);
          searchRes = await callModelWithRetry(ai, {
            model: 'gemini-3.8-flash',
            contents: searchPrompt,
          });
        }

        const searchChunks = searchRes?.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(searchChunks) && searchChunks.length > 0) {
          searchChunks.forEach((chunk: any, i: number) => {
            if (chunk.web?.uri) {
              const urlCheck = isSafePublicUrl(chunk.web.uri);
              if (urlCheck.safe) {
                searchCitationsFound = true;
                discoveredSources.push({
                  id: `src-web-${i + 1}`,
                  title: chunk.web.title || `${providerName} Official Documentation`,
                  canonicalUrl: chunk.web.uri,
                  sourceType: 'provider_docs',
                  retrievalMethod: 'gemini_search_grounding',
                  retrievalStatus: 'retrieved',
                  retrievedAt: new Date().toISOString(),
                  summary: chunk.web.title,
                });
              }
            }
          });
        }
      } catch (e: any) {
        if (isQuotaOrRateLimitError(e)) {
          console.warn(`Gemini research quota reached (429) for ${providerName}.`);
        } else {
          console.warn('Gemini research query error:', e?.message || e);
        }
      }
    }

    if (discoveredSources.length === 0) {
      discoveredSources.push({
        id: `src-unverified-${slug}`,
        title: `Pending Official Documentation for ${providerName}`,
        canonicalUrl: providerWebsite || `https://www.google.com/search?q=${encodeURIComponent(providerName + ' developer portal oauth')}`,
        sourceType: 'secondary_source',
        retrievalMethod: 'manual_curation',
        retrievalStatus: 'not_attempted',
        retrievedAt: null,
        summary: `Primary official documentation has not yet been retrieved or verified for ${providerName}. Developer verification required.`,
      });
    }

    job.sourcesDiscovered = discoveredSources;
    repository.saveResearchJob(job);

    // Stage 4: Assess OAuth Path
    updateStage(
      'assess_oauth_path',
      'Evaluating Composio-Managed vs Owned App Path',
      `Evaluating evidence against developer brief: custom branding=${job.assumptions.customBrandingRequired}, audience=${job.assumptions.audience}.`
    );

    let startingPath: StartingPath = 'register_owned_app';
    let pathHeadline = '';
    let pathWhy = '';
    let canStartTestingStatus: 'yes' | 'with_limitations' | 'blocked' = 'yes';
    let canStartTestingNote = '';
    let isUnverifiedProvider = false;

    // Check Strava Policy 5.3 AI blocker
    const isStravaAiBlocked = 
      grounding?.slug === 'strava' && 
      (job.assumptions.audience === 'external_customers' || job.assumptions.intendedActions.toLowerCase().includes('agent') || job.assumptions.intendedActions.toLowerCase().includes('ai'));

    if (isStravaAiBlocked) {
      startingPath = 'register_owned_app';
      pathHeadline = 'Blocked by Policy: Strava Section 5.3 Restricts AI Applications with API Data';
      pathWhy = 'Under Strava API Policy (June 2026) Section 5.3, developers are strictly prohibited from using Strava API data to operate AI applications, LLM context grounding, RAG pipelines, or training summaries for external customers. Athlete OAuth consent does not waive this restriction. Section 3.5 permits MCP integrations only for personal single-user workflows.';
      canStartTestingStatus = 'blocked';
      canStartTestingNote = 'Blocked for external multi-customer AI features under Strava API Policy Section 5.3. Permitted only for personal single-user MCP workflows under Section 3.5.';
    } else if (grounding) {
      // Known grounded provider
      if (toolkitMatch?.managedAuthAvailable === 'available' && !job.assumptions.customBrandingRequired) {
        startingPath = 'composio_managed_suitable';
        pathHeadline = 'Composio-managed OAuth appears suitable for development and initial rollout';
        pathWhy = `Composio provides a managed OAuth app for ${providerName}. You can test and connect without registering a custom developer app, provided Composio's consent screen branding is acceptable.`;
        canStartTestingStatus = 'yes';
        canStartTestingNote = `You can test immediately with Composio managed OAuth in your development environment.`;
      } else {
        startingPath = 'register_owned_app';
        pathHeadline = job.assumptions.customBrandingRequired
          ? `Register your own OAuth App (Custom Branding Required)`
          : `Register your own OAuth App (${grounding.startingPathRule.managedAuthNote || 'Owned App Required'})`;
        pathWhy = job.assumptions.customBrandingRequired
          ? `Because your customers need to see your product name and logo on the ${providerName} authorization screen, Composio-managed OAuth is not suitable. You must register an owned OAuth app in ${providerName}'s developer portal.`
          : `Composio managed OAuth is not available or suitable for ${providerName}. Register an owned app in the ${providerName} developer portal.`;
        canStartTestingStatus = 'yes';
        canStartTestingNote = `You can register a test OAuth app in ${providerName} Developer Portal and begin sandbox testing.`;
      }
    } else if (toolkitMatch && toolkitMatch.managedAuthAvailable === 'available' && !job.assumptions.customBrandingRequired) {
      startingPath = 'composio_managed_suitable';
      pathHeadline = `Composio-managed OAuth appears suitable for development and initial rollout`;
      pathWhy = `Composio provides a managed OAuth app for ${providerName} that supports the standard actions required. You can test and connect without registering a custom developer app, provided Composio's consent screen branding is acceptable.`;
      canStartTestingStatus = 'yes';
      canStartTestingNote = 'You can test immediately with Composio managed OAuth in your development environment.';
    } else {
      // Unfamiliar or unverified provider: DO NOT guess!
      isUnverifiedProvider = true;
      startingPath = 'unverified_provider_requirements';
      pathHeadline = `Provider-Specific OAuth Requirements Not Yet Verified`;
      pathWhy = `We could not safely determine the required scopes, app registration rules, or approval process for "${providerName}" from available evidence. Review provider developer documentation before implementation.`;
      canStartTestingStatus = 'with_limitations';
      canStartTestingNote = `Unverified: Determine whether ${providerName} offers a developer sandbox or requires formal business verification before testing.`;
    }

    // Stage 5: Build Guide
    updateStage(
      'build_guide',
      'Synthesizing Structured Setup & Approval Guide',
      `Compiling prerequisites, granular permission mappings, step-by-step checklist, blockers, and recovery paths.`
    );

    const guideId = `${slug}-guide-v1`;

    const validImplications: PermissionItem['reviewImplication'][] = [
      'Non-sensitive / instant',
      'Sensitive scope / verification required',
      'Restricted scope / security audit (CASA)',
      'Partner approval / product application required',
      'Standard user consent',
      'Unknown / unverified'
    ];

    let guidePermissions: PermissionItem[] = [];

    if (grounding?.recommendedScopes) {
      guidePermissions = grounding.recommendedScopes.map(s => ({
        ...s,
        reviewImplication: (validImplications.includes(s.reviewImplication as any)
          ? s.reviewImplication
          : 'Non-sensitive / instant') as PermissionItem['reviewImplication'],
        evidenceStatus: 'verified_official',
        isConfirmedScope: true,
        sourceIds: discoveredSources.map(src => src.id).slice(0, 2),
      }));
    } else {
      // Unfamiliar provider: NEVER invent fake scopes or assume "Non-sensitive / instant"
      guidePermissions = [
        {
          feature: `Intended integration: ${job.assumptions.intendedActions}`,
          permission: 'Pending developer portal confirmation',
          whyNeeded: `Feature requires provider authorization, but exact scope strings have not been verified from official documentation.`,
          providerProductRequirement: `Verify required API products in ${providerName} Developer Portal`,
          reviewImplication: 'Unknown / unverified',
          evidenceStatus: 'unknown_not_documented',
          isConfirmedScope: false,
          sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
          uncertainty: `Provider-specific OAuth scope strings for "${providerName}" could not be safely confirmed from available documentation. Inspect the provider's official scope directory before implementation.`
        }
      ];
    }

    let guideBlockers: Blocker[] = grounding?.blockers
      ? grounding.blockers.map(b => ({ ...b, isHypothesis: false }))
      : [
          {
            symptom: 'OAuth redirect returns redirect_uri_mismatch or invalid_client error',
            checks: [
              'Verify the exact redirect URI entered in the provider developer console.',
              'Confirm that the Client ID and Secret were copied into Composio auth settings without trailing whitespace.'
            ],
            explanationOrHypothesis: 'Provider OAuth servers enforce exact character matching on authorized redirect URIs.',
            isHypothesis: false,
            nextAction: 'Copy the exact Redirect URI from your Composio auth configuration dashboard and update the provider portal.',
            humanHandoff: 'Developer updates portal settings.'
          },
          {
            symptom: 'Authorization fails with "Access not approved" or "Unverified App" warning',
            checks: [
              'Check whether provider requires organizational verification, domain verification, or manual partner review.',
              'Verify if end-user is in the approved test user whitelist.'
            ],
            explanationOrHypothesis: 'Many providers block authorization for unverified third-party applications.',
            isHypothesis: false,
            nextAction: 'Review provider verification guidelines and submit required app details or add test user accounts.',
            humanHandoff: 'Developer or compliance team submits provider verification form.'
          }
        ];

    let approvalAndDist = grounding?.keyFacts || {
      appRegistration: isUnverifiedProvider
        ? `Locate the official ${providerName} Developer Portal to check registration requirements.`
        : `Self-service registration in ${providerName} Developer Portal.`,
      apiProductAccessApproval: isUnverifiedProvider
        ? 'Approval requirements not yet verified. Review provider developer policies.'
        : 'Standard Web API access enabled upon app registration.',
      providerVerification: isUnverifiedProvider
        ? 'Unknown / not verified from official documentation.'
        : (job.assumptions.audience === 'external_customers'
            ? 'Verification or review may be required before making app public to external customers.'
            : 'Not required for team-only or internal testing.'),
      marketplaceDistribution: 'Unknown / optional public directory listing.',
      customerAdminApproval: 'Workspace or tenant administrators may need to approve the integration depending on enterprise policy.',
      endUserConsent: 'End-user authorization dialog showing requested permissions and registered app details.'
    };

    let guideSteps: ChecklistStep[] = [
      {
        id: `${slug}-step-1`,
        action: `Identify Official Developer Portal & Review Launch Constraints`,
        owner: 'developer',
        prerequisites: ['Product feature spec'],
        completionCondition: 'Decided on authentication approach and confirmed portal URL.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: grounding ? 'source_backed' : 'unverified',
        estimate: { duration: '15 min', basis: 'Portal documentation review' },
        phase: 'composio_prep',
        details: isStravaAiBlocked
          ? 'CRITICAL: Strava Policy Section 5.3 restricts AI models and summary generation on API data for external customers. Verify legal compliance before proceeding.'
          : (isUnverifiedProvider
              ? `Locate ${providerName}'s official developer portal and review OAuth documentation before writing code.`
              : `Review branding, rate limits, and quota mode implications for ${providerName}.`)
      },
      {
        id: `${slug}-step-2`,
        action: grounding?.slug === 'mastodon'
          ? 'Configure Dynamic Client Registration (POST /api/v1/apps) or Instance App'
          : `Register OAuth Application in ${providerName} Developer Console`,
        owner: 'developer',
        prerequisites: [`${providerName} developer access`],
        completionCondition: 'Client credentials generated or dynamic registration implemented.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 2),
        evidenceStatus: grounding ? 'source_backed' : 'unverified',
        estimate: { duration: '20 min', basis: 'Portal form submission or API call' },
        phase: 'provider_registration',
        details: grounding?.slug === 'mastodon'
          ? 'Call POST /api/v1/apps on the target Mastodon instance with client_name and redirect_uris.'
          : `Access the ${providerName} developer portal (${grounding?.developerPortalUrl || 'official developer console'}) and register your application.`
      },
      {
        id: `${slug}-step-3`,
        action: `Configure Authorized Redirect URI`,
        owner: 'developer',
        prerequisites: ['App created in portal'],
        completionCondition: 'Redirect URI saved in provider OAuth settings.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'OAuth configuration' },
        phase: 'access_configuration',
        details: 'Copy the Redirect URI from your Composio auth configuration and add it to Authorized Redirect URIs in your provider console.'
      },
      {
        id: `${slug}-step-4`,
        action: `Save Client ID and Secret in Composio Dashboard`,
        owner: 'developer',
        prerequisites: ['Client credentials obtained'],
        completionCondition: 'Custom integration configured under Composio Integrations.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Dashboard field entry' },
        phase: 'composio_prep',
        details: 'Enter your Client ID and Client Secret in Composio custom app settings, and note your Auth Config ID.'
      },
      {
        id: `${slug}-step-5`,
        action: `Execute Test Connection with Sandbox / Development Account`,
        owner: 'developer',
        prerequisites: ['Auth configured in Composio'],
        completionCondition: 'Successful OAuth authorization and active connected account ID.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Interactive consent flow' },
        phase: 'testing_and_launch',
        details: isStravaAiBlocked
          ? 'Note: Test connections must remain within Section 3.5 personal developer workflows.'
          : 'Connect an account and verify that agent actions return expected data.'
      }
    ];

    // Stage 6: Check Evidence & Contract
    updateStage(
      'check_evidence',
      'Verifying Evidence Contract & Claim Citations',
      `Validating claims, referential integrity, and source citations.`
    );

    const initialClaims: Claim[] = [
      {
        id: `cl-${slug}-1`,
        statement: toolkitMatch && toolkitMatch.found
          ? `Composio documentation identifies toolkit "${toolkitMatch.slug}" with ${toolkitMatch.managedAuthAvailable} managed authentication.`
          : `No pre-built Composio toolkit was identified for ${providerName}; direct provider OAuth or custom integration required.`,
        applicability: 'Integration architecture decision.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceClass: toolkitMatch?.found ? 'composio_documentation' : 'unverified',
      },
      {
        id: `cl-${slug}-2`,
        statement: isStravaAiBlocked
          ? 'Strava API Policy Section 5.3 restricts operating AI applications with API data for external customers; Section 3.5 MCP exception is personal-use only.'
          : (grounding
              ? `${providerName} requires an OAuth 2.0 client registered in its developer portal for customized brand consent and owned quota control.`
              : `Provider-specific OAuth requirements have not yet been verified from primary official documentation for ${providerName}.`),
        applicability: isStravaAiBlocked ? 'Legal policy compliance.' : 'Production deployment planning.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 2),
        evidenceClass: grounding ? 'provider_documentation' : 'unverified',
        uncertaintyNote: grounding ? undefined : 'Unresolved requirements must be confirmed in provider developer console.'
      }
    ];

    // Run deterministic evidence validation engine
    const validationResult = validateEvidenceContract(
      initialClaims,
      discoveredSources,
      guidePermissions,
      guideSteps
    );

    // Compute external waiting honestly without fabricating SLAs
    let externalWaiting = 'Not publicly specified';
    if (isStravaAiBlocked) {
      externalWaiting = 'Blocked by Policy - Strava Section 5.3 restricts AI models on API data for external customers.';
    } else if (grounding?.slug === 'mastodon') {
      externalWaiting = 'Zero waiting (instant dynamic client registration per instance).';
    } else if (grounding?.externalWaitingEstimate) {
      externalWaiting = grounding.externalWaitingEstimate;
    } else if (startingPath === 'composio_managed_suitable') {
      externalWaiting = 'Zero waiting with managed OAuth.';
    } else {
      externalWaiting = 'Not publicly specified - official review queues vary; inspect provider portal for published SLAs.';
    }

    const developerEffort = grounding?.developerEffortEstimate || (isUnverifiedProvider
      ? '1–3 hours for portal investigation, credential setup, and test connection.'
      : '1–2 hours for initial configuration and test connection.');

    const limitations: string[] = [];
    if (isStravaAiBlocked) {
      limitations.push(
        'Strava API Policy Section 5.3 prohibits feeding Strava API data into third-party AI models, RAG pipelines, or LLM context for external customers.',
        'Athlete OAuth consent does NOT grant permission to operate AI applications with their data.',
        'Section 3.5 personal MCP exemption applies solely to single-user local developer tools, not multi-customer commercial applications.',
        'Strava getting-started operates in single-player mode (owner athlete only); developers can add up to 10 athletes in default tier.',
        'Active paid Strava subscription required for the application owner/developer.'
      );
    } else if (grounding) {
      limitations.push(
        grounding.startingPathRule.singlePlayerOrQuotaRule,
        grounding.startingPathRule.quotaModesOrTiers
      );
      if (grounding.startingPathRule.subscriptionRequirement) {
        limitations.push(grounding.startingPathRule.subscriptionRequirement);
      }
      if (grounding.startingPathRule.managedAuthNote) {
        limitations.push(grounding.startingPathRule.managedAuthNote);
      }
    } else {
      limitations.push(
        'Provider OAuth requirements have not been confirmed against primary official documentation.',
        'Consent screen branding and approval requirements depend on provider app registration policies.',
        'Verify required scopes and quotas in provider developer console before launching to customers.'
      );
    }

    const myNextAction = isStravaAiBlocked
      ? 'Review Strava Policy 5.3; restrict to personal-use MCP under Section 3.5 or request written partner agreement from Strava Legal.'
      : grounding?.slug === 'mastodon'
      ? 'Implement Dynamic Client Registration (POST /api/v1/apps) on target user instances or enter instance client credentials.'
      : toolkitMatch?.managedAuthAvailable === 'available' && !job.assumptions.customBrandingRequired
      ? 'Connect via Composio Dashboard/SDK to validate your agent actions.'
      : isUnverifiedProvider
      ? `Locate ${providerName} official developer portal, review OAuth documentation, and verify required scope strings.`
      : `Register your OAuth app in ${providerName} Developer Portal (${grounding?.developerPortalUrl || 'developer portal'}) and configure your Composio redirect URI.`;

    const guide: Guide = {
      id: guideId,
      slug,
      version: 1,
      providerName,
      providerWebsite: providerWebsite || (grounding?.canonicalWebsite || ''),
      exampleUseCase: job.assumptions.intendedActions,
      composioToolkitMatch: toolkitMatch,
      useCaseFit: isStravaAiBlocked
        ? 'limitation_found'
        : (toolkitMatch?.managedAuthAvailable === 'available' && !job.assumptions.customBrandingRequired 
            ? 'supported_by_evidence' 
            : (isUnverifiedProvider ? 'unknown' : 'limitation_found')),
      pathAssessment: {
        startingPath,
        headline: pathHeadline,
        why: pathWhy,
        assumptions: job.assumptions,
        canStartTesting: {
          status: canStartTestingStatus,
          note: canStartTestingNote,
        },
        whatCouldBlockLaunch: isStravaAiBlocked
          ? 'Strava API Policy Section 5.3 prohibition on AI models and data ingestion.'
          : (isUnverifiedProvider
              ? 'Unverified provider approval queues, partner restrictions, or lack of public OAuth APIs.'
              : (job.assumptions.audience === 'external_customers'
                  ? `Provider review / verification requirements for public external traffic, or workspace administrator restrictions.`
                  : 'None expected for team-only usage.')),
        developerEffort,
        externalWaiting,
        myNextAction,
        limitations,
      },
      prerequisites: [
        {
          category: `${providerName} Accounts & Access`,
          items: [
            `Active ${providerName} account with administrative privileges.`,
            grounding?.developerPortalUrl 
              ? `Access to ${providerName} Developer Portal (${grounding.developerPortalUrl}).`
              : `Access to ${providerName} Developer Portal.`,
          ],
        },
        {
          category: 'Composio Setup',
          items: [
            'Composio API Key and active workspace.',
            'Redirect URI supplied by your Composio auth configuration.',
          ],
        },
        {
          category: 'Branding & Policy URLs',
          items: [
            'Application Name and Logo.',
            'Privacy Policy and Terms of Service URLs (required for external verification).',
          ],
        },
      ],
      permissionsTable: validationResult.validatedPermissions,
      setupChecklist: validationResult.validatedSteps,
      approvalAndDistribution: approvalAndDist,
      blockersAndRecovery: guideBlockers,
      evidenceAndUnknowns: {
        composioDocs: toolkitMatch && toolkitMatch.found ? [toolkitMatch.docUrl || 'https://docs.composio.dev'] : ['No Composio toolkit documented'],
        providerDocs: discoveredSources.filter(s => s.sourceType === 'provider_docs').map(s => s.canonicalUrl),
        metadataApiObservations: toolkitMatch && toolkitMatch.found ? [`Toolkit slug: ${toolkitMatch.slug}`] : [],
        communityReports: [],
        estimates: [developerEffort],
        setupAttempts: [],
        unresolvedAssumptions: isUnverifiedProvider
          ? [
              'Official OAuth 2.0 scope strings required for intended actions.',
              'Provider review SLA and public distribution requirements.',
              'Whether provider supports self-service app creation or requires partner application.'
            ]
          : ['Whether your target customers enforce strict enterprise SSO integration policies.'],
      },
      sources: discoveredSources,
      claims: validationResult.validatedClaims,
      evidenceValidation: validationResult.summary,
      isPartialResearch: isUnverifiedProvider || validationResult.summary.claimsRequiringReview > 0,
      unverifiedNotice: isUnverifiedProvider
        ? 'Provider-specific OAuth requirements have not yet been verified from primary official documentation. We could not safely determine the required scopes or approval process from the available evidence.'
        : undefined,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Save Guide
    repository.saveGuide(guide);

    // Generate Tailored Next-Step Pack
    const nextStepPack: NextStepPack = {
      id: `pack-${slug}-v1`,
      guideId: guide.id,
      generatedAt: new Date().toISOString(),
      pathType: guide.pathAssessment.startingPath === 'composio_managed_suitable' ? 'managed' : 'owned',
      title: `${providerName} Next-Step Pack: Execution Checklist & Materials`,
      summary: `Tailored action checklist, permission justifications, and connection verification plan for ${providerName}.`,
      sections: [
        {
          title: '1. Registration & Configuration Checklist',
          content: `### Setup Execution
1. Open the **${providerName} Developer Portal** (${grounding?.developerPortalUrl || 'developer console'}).
2. Register a new OAuth 2.0 application for your AI agent.
3. Set Authorized Redirect URI: copy the exact redirect URI from your Composio auth configuration dashboard.
4. Select requested scopes: \`${guidePermissions.map(p => p.permission).join(', ')}\`.
5. Enter Client ID and Secret in your Composio Dashboard and select this auth config in your app.`,
        },
        {
          title: '2. Permission Justifications for Review / Customers',
          content: `### Feature-to-Scope Mapping
${guidePermissions.map(p => `- **\`${p.permission}\`**: ${p.whyNeeded}`).join('\n')}`,
        },
        {
          title: '3. Connection Validation Plan',
          content: `### Validation Steps
- Connect a sandbox or developer test account.
- Trigger agent action: "${job.assumptions.intendedActions}".
- Confirm token issuance and verify audit log in Composio.`,
        },
      ],
      draftPermissionJustification: `Our AI assistant requires access to ${providerName} exclusively to perform "${job.assumptions.intendedActions}" initiated and authorized by the customer.`,
      demoWalkthroughOutline: `1. Show agent dashboard. 2. Click "Connect ${providerName}". 3. Complete OAuth prompt. 4. Execute test action "${job.assumptions.intendedActions}".`,
      warningsAndDisclaimers: [
        'Local checklist marks your personal progress on this device and does not certify provider approval.',
        isStravaAiBlocked
          ? 'CRITICAL LEGAL WARNING: Strava API Policy Section 5.3 restricts multi-customer AI applications. Review legal terms before launching.'
          : (isUnverifiedProvider
              ? 'Requirements remain unverified from primary documentation. Confirm scope names and review policies in provider portal.'
              : 'Review provider rate limits before launching to external customers.'),
      ],
    };

    repository.saveNextStepPack(nextStepPack);

    // Complete Job
    job.status = 'completed';
    job.guideId = guide.id;
    updateStage(
      'completed',
      'Research Complete & Shareable Guide Published',
      `Guide synthesized with ${discoveredSources.length} source(s), ${validationResult.summary.verifiedClaims} verified claim(s), and ${validationResult.summary.claimsRequiringReview} claim(s) flagged for human review.`
    );
  } catch (err: any) {
    console.error('Research job error:', err?.message || err);
    job.status = 'failed';
    job.error = err?.message || 'An unexpected error occurred during research synthesis.';
    updateStage(
      'failed',
      'Investigation Halted with Error Details',
      `Error encountered: ${job.error}. Partial evidence gathered prior to failure is preserved.`
    );
  }
}
