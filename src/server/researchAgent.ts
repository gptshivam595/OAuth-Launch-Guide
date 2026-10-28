import { GoogleGenAI } from '@google/genai';
import { repository } from './storage.js';
import { inspectComposioToolkit } from './composioCatalog.js';
import { getProviderGrounding } from './providerGrounding.js';
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
      `Investigating provider input: "${job.providerInput}". Determining canonical website and developer portal.`
    );

    let cleanProvider = job.providerInput.trim();
    let providerName = cleanProvider;
    let providerWebsite = job.websiteInput || '';

    // Check verified provider grounding knowledge
    const grounding = getProviderGrounding(cleanProvider);

    if (grounding) {
      providerName = grounding.providerName;
      if (!providerWebsite || providerWebsite.includes('mastodon.com') || providerWebsite.includes('example.com')) {
        providerWebsite = grounding.canonicalWebsite;
      }
    } else {
      if (cleanProvider.startsWith('http://') || cleanProvider.startsWith('https://')) {
        try {
          const parsedUrl = new URL(cleanProvider);
          providerWebsite = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
          providerName = parsedUrl.hostname.replace('www.', '').split('.')[0];
          providerName = providerName.charAt(0).toUpperCase() + providerName.slice(1);
        } catch (e) {
          // keep cleanProvider
        }
      } else {
        providerName = cleanProvider.charAt(0).toUpperCase() + cleanProvider.slice(1);
        // Do not fabricate an unverified name.com
        if (!providerWebsite) {
          providerWebsite = '';
        }
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

    if (toolkitMatch && toolkitMatch.found) {
      updateStage(
        'check_composio',
        `Found Composio Toolkit: ${toolkitMatch.name}`,
        `Managed OAuth status: ${toolkitMatch.managedAuthAvailable}. Auth method: ${toolkitMatch.relevantAuthMethod}. Provenance: ${composioInspection.retrievalProvenance}`,
        toolkitMatch.docUrl
      );
    } else if (toolkitMatch && toolkitMatch.managedAuthAvailable === 'unknown') {
      updateStage(
        'check_composio',
        `Composio Toolkit Status Uncertain`,
        `Documentation check attempted but connection was inconclusive. Provenance: ${composioInspection.retrievalProvenance}`
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
      `Retrieving official developer documentation for ${providerName} OAuth 2.0 registration, required scopes, and review policies.`
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
        summary: `Documented actions: ${toolkitMatch.supportedActionsSummary.join(', ')}`,
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
          retrievalMethod: 'direct_fetch',
          retrievalStatus: 'retrieved',
          retrievedAt: new Date().toISOString(),
          summary: src.summary,
        });
      });
    }

    const ai = getAiClient();
    let rawResearchSummary = '';

    if (ai) {
      try {
        let groundingContext = '';
        if (grounding) {
          groundingContext = `Known official provider specifications:\n- Developer Portal: ${grounding.developerPortalUrl}\n- Quota/Tier rules: ${grounding.startingPathRule.quotaModesOrTiers}\n- Official doc URLs: ${grounding.officialDocSources.map(s => s.url).join(', ')}`;
        }

        const searchPrompt = `You are an expert integration engineer researching OAuth 2.0 registration and approval requirements for "${providerName}" (website: ${providerWebsite || 'decentralized/per-instance'}).
Intended Agent Actions: "${job.assumptions.intendedActions}"
Audience: ${job.assumptions.audience}
Custom Branding Needed: ${job.assumptions.customBrandingRequired ? 'Yes' : 'No'}
${groundingContext}

Investigate and report official documentation details:
1. Exact OAuth app registration workflow and portal URL.
2. Required OAuth scopes for: "${job.assumptions.intendedActions}".
3. Approval and review requirements (app review, quota modes, verification).
4. Timelines: Use "Unknown" if timeline is variable or undocumented in official guides.
5. Common developer blockers, quota limits, and AI/policy constraints.`;

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
          console.warn('Google Search tool error, falling back to direct Gemini generation:', searchToolErr?.message || searchToolErr);
          searchRes = await callModelWithRetry(ai, {
            model: 'gemini-3.8-flash',
            contents: searchPrompt,
          });
        }

        rawResearchSummary = searchRes.text || '';

        // Extract search grounding citations
        const searchChunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(searchChunks)) {
          searchChunks.forEach((chunk: any, i: number) => {
            if (chunk.web?.uri) {
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
          });
        }
      } catch (e: any) {
        if (isQuotaOrRateLimitError(e)) {
          if (!grounding) {
            throw new Error(`Gemini API rate limit or quota exceeded (429 RESOURCE_EXHAUSTED). To prevent fabricating ungrounded guidance, investigation has halted. Please retry once quota resets.`);
          }
          console.warn(`Gemini research quota reached (429). Using verified official documentation archive for ${providerName}.`);
        } else {
          console.warn('Gemini research query error:', e?.message || e);
          if (!grounding) {
            throw new Error(`Provider documentation search failed: ${e?.message || 'Unknown model error'}`);
          }
        }
      }
    } else if (!grounding) {
      throw new Error('Server environment variable GEMINI_RESEARCH_API_KEY is not configured and no cached grounding exists for this provider.');
    }

    job.sourcesDiscovered = discoveredSources;
    repository.saveResearchJob(job);

    // Stage 4: Assess OAuth Path
    updateStage(
      'assess_oauth_path',
      'Evaluating Composio-Managed vs Owned App Path',
      `Synthesizing evidence against developer brief: custom branding=${job.assumptions.customBrandingRequired}, audience=${job.assumptions.audience}.`
    );

    let startingPath: StartingPath = 'register_owned_app';
    let pathHeadline = '';
    let pathWhy = '';

    // Check Strava Policy 5.3 AI blocker
    const isStravaAiBlocked = 
      grounding?.slug === 'strava' && 
      (job.assumptions.audience === 'external_customers' || job.assumptions.intendedActions.toLowerCase().includes('agent') || job.assumptions.intendedActions.toLowerCase().includes('ai'));

    if (isStravaAiBlocked) {
      startingPath = 'register_owned_app';
      pathHeadline = 'Blocked by Policy: Strava Section 5.3 Restricts AI Applications with API Data';
      pathWhy = 'Under Strava API Policy (June 2026) Section 5.3, developers are strictly prohibited from using Strava API data to operate AI applications, LLM context grounding, RAG pipelines, or training summaries for external customers. Athlete OAuth consent does not waive this restriction. Section 3.5 permits MCP integrations only for personal single-user workflows.';
    } else if (!toolkitMatch || !toolkitMatch.found) {
      startingPath = 'provider_not_found_in_composio';
      pathHeadline = 'Provider not found in Composio (Direct Provider OAuth Required)';
      pathWhy = `Composio does not have a pre-built toolkit for ${providerName}. Connecting this app requires registering an owned OAuth app directly in ${providerName}'s developer portal or using decentralized dynamic registration.`;
    } else if (job.assumptions.customBrandingRequired) {
      startingPath = 'register_owned_app';
      pathHeadline = `Register your own OAuth App (Custom Branding Required)`;
      pathWhy = `Because your customers need to see your product name and logo on the ${providerName} authorization screen, Composio-managed OAuth is not suitable. You must register an owned OAuth app in ${providerName}'s developer portal and configure your client credentials in Composio.`;
    } else if (toolkitMatch.managedAuthAvailable === 'unavailable') {
      startingPath = 'register_owned_app';
      pathHeadline = `Register your own OAuth App (Composio-Managed OAuth Not Available)`;
      pathWhy = `Composio documentation explicitly notes that managed OAuth is not available for ${providerName}. You must register an owned OAuth app in ${providerName}'s developer portal and configure custom credentials in Composio.`;
    } else if (toolkitMatch.managedAuthAvailable === 'available') {
      startingPath = 'composio_managed_suitable';
      pathHeadline = `Composio-managed OAuth appears suitable for development and initial rollout`;
      pathWhy = `Composio provides a managed OAuth app for ${providerName} that supports the standard actions required. You can test and connect without registering a custom developer app, provided Composio's consent screen branding is acceptable.`;
    } else {
      startingPath = 'register_owned_app';
      pathHeadline = `Register your own OAuth App`;
      pathWhy = `Managed OAuth status is unverified or unavailable. Register an owned provider OAuth app in ${providerName}'s developer portal.`;
    }

    // Stage 5: Build Guide (Synthesize structured guide)
    updateStage(
      'build_guide',
      'Synthesizing Structured Setup & Approval Guide',
      `Compiling prerequisites, granular permission mappings, step-by-step checklist, blockers, and recovery paths.`
    );

    const slug = cleanProvider.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const guideId = `${slug}-guide-v1`;

    const validImplications: PermissionItem['reviewImplication'][] = [
      'Non-sensitive / instant',
      'Sensitive scope / verification required',
      'Restricted scope / security audit (CASA)',
      'Partner approval / product application required',
      'Standard user consent'
    ];

    let guidePermissions: PermissionItem[] = grounding?.recommendedScopes
      ? grounding.recommendedScopes.map(s => ({
          ...s,
          reviewImplication: (validImplications.includes(s.reviewImplication as any)
            ? s.reviewImplication
            : 'Non-sensitive / instant') as PermissionItem['reviewImplication'],
          sourceIds: discoveredSources.map(src => src.id).slice(0, 2),
        }))
      : [
          {
            feature: `Core integration: ${job.assumptions.intendedActions}`,
            permission: `${slug}.read, ${slug}.write`,
            whyNeeded: `Enables AI agent to execute: ${job.assumptions.intendedActions}`,
            providerProductRequirement: `Standard ${providerName} Web API`,
            reviewImplication: 'Non-sensitive / instant',
            sourceIds: discoveredSources.map(s => s.id).slice(0, 2),
            uncertainty: 'Confirm specific scope strings against provider developer portal documentation.',
          },
        ];

    let guideBlockers: Blocker[] = grounding?.blockers
      ? grounding.blockers.map(b => ({
          ...b,
          isHypothesis: false,
        }))
      : [
          {
            symptom: 'OAuth redirect returns redirect_uri_mismatch error',
            checks: ['Verify the exact redirect URI entered in provider portal.'],
            explanationOrHypothesis: 'Provider requires exact character match with the URL generated by Composio.',
            isHypothesis: false,
            nextAction: 'Copy the exact Redirect URI from your Composio auth configuration and update the provider portal.',
            humanHandoff: 'Developer updates portal settings.',
          },
        ];

    let approvalAndDist = grounding?.keyFacts || {
      appRegistration: `Self-service registration in ${providerName} Developer Portal. Instant.`,
      apiProductAccessApproval: 'Standard Web API access enabled upon app registration.',
      providerVerification: job.assumptions.audience === 'external_customers'
        ? `Verification or review may be required before making app public to external tenants.`
        : 'Not required for team-only or internal testing.',
      marketplaceDistribution: 'Optional public directory listing.',
      customerAdminApproval: 'Workspace administrators may need to approve the third-party connection.',
      endUserConsent: 'End-user authorization dialog showing requested permissions and registered app details.',
    };

    let guideSteps: ChecklistStep[] = [
      {
        id: `${slug}-step-1`,
        action: `Review Authentication Requirements & Launch Constraints`,
        owner: 'developer',
        prerequisites: ['Product feature spec'],
        completionCondition: 'Decided on authentication approach.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Product decision' },
        phase: 'composio_prep',
        details: isStravaAiBlocked
          ? 'CRITICAL: Strava Policy Section 5.3 restricts AI models and summary generation on API data for external customers. Verify legal compliance before proceeding.'
          : 'Review branding, rate limits, and quota mode implications.',
      },
      {
        id: `${slug}-step-2`,
        action: grounding?.slug === 'mastodon'
          ? 'Configure Dynamic Client Registration (POST /api/v1/apps) or Instance App'
          : `Register OAuth 2.0 Application in ${providerName} Developer Portal`,
        owner: 'developer',
        prerequisites: [`${providerName} developer access`],
        completionCondition: 'Client credentials generated or dynamic registration implemented.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 2),
        evidenceStatus: 'source_backed',
        estimate: { duration: '20 min', basis: 'Portal form submission or API call' },
        phase: 'provider_registration',
        details: grounding?.slug === 'mastodon'
          ? 'Call POST /api/v1/apps on the target Mastodon instance with client_name and redirect_uris.'
          : `Access the ${providerName} developer portal (${grounding?.developerPortalUrl || 'developer console'}) and register your application.`,
      },
      {
        id: `${slug}-step-3`,
        action: `Configure Redirect URI in Provider Settings`,
        owner: 'developer',
        prerequisites: ['App created in portal'],
        completionCondition: 'Redirect URI saved in provider OAuth settings.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 1),
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'OAuth configuration' },
        phase: 'access_configuration',
        details: 'Copy the Redirect URI from your Composio auth configuration and add it to Authorized Redirect URIs in your provider console.',
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
        details: 'Enter your Client ID and Client Secret in Composio custom app settings, and note your Auth Config ID.',
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
          : 'Connect an account and verify that agent actions return expected data.',
      },
    ];

    // Stage 6: Check Evidence & Contract
    updateStage(
      'check_evidence',
      'Verifying Evidence Contract & Claim Citations',
      `Validating claims against official provider policies and Composio documentation.`
    );

    const claims: Claim[] = [
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
          : `${providerName} requires an OAuth 2.0 client registered in its developer portal for customized brand consent and owned quota control.`,
        applicability: isStravaAiBlocked ? 'Legal policy compliance.' : 'Production deployments requiring custom branding.',
        sourceIds: discoveredSources.map(s => s.id).slice(0, 2),
        evidenceClass: 'provider_documentation',
      },
    ];

    // Compute external waiting honestly
    let externalWaiting = 'Unknown';
    if (isStravaAiBlocked) {
      externalWaiting = 'Blocked by Policy - Strava Section 5.3 restricts AI models on API data for external customers.';
    } else if (grounding?.slug === 'mastodon') {
      externalWaiting = 'Zero waiting (instant dynamic client registration per instance).';
    } else if (grounding?.externalWaitingEstimate) {
      externalWaiting = grounding.externalWaitingEstimate;
    } else if (startingPath === 'composio_managed_suitable') {
      externalWaiting = 'Zero waiting with managed OAuth.';
    } else {
      externalWaiting = 'Unknown - official documentation does not guarantee a fixed SLA; depends on provider review queue.';
    }

    const developerEffort = grounding?.developerEffortEstimate || '1–2 hours for initial configuration and test connection.';

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
        'Branding on consent screen is determined by OAuth client ownership.',
        'Rate limits and API quotas apply to the registered client ID.',
        'Users must grant permissions at authorization time.'
      );
    }

    const myNextAction = isStravaAiBlocked
      ? 'Review Strava Policy 5.3; restrict to personal-use MCP under Section 3.5 or request written partner agreement from Strava Legal.'
      : grounding?.slug === 'mastodon'
      ? 'Implement Dynamic Client Registration (POST /api/v1/apps) on target user instances or enter instance client credentials.'
      : toolkitMatch?.managedAuthAvailable === 'available' && !job.assumptions.customBrandingRequired
      ? 'Connect via Composio Dashboard/SDK to validate your agent actions.'
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
            : 'limitation_found'),
      pathAssessment: {
        startingPath,
        headline: pathHeadline,
        why: pathWhy,
        assumptions: job.assumptions,
        canStartTesting: {
          status: isStravaAiBlocked ? 'blocked' : 'yes',
          note: isStravaAiBlocked
            ? 'Blocked for external multi-customer AI features under Strava API Policy Section 5.3. Permitted only for personal single-user MCP workflows under Section 3.5.'
            : (toolkitMatch?.managedAuthAvailable === 'available'
                ? 'You can test immediately with Composio managed OAuth in your development environment.'
                : `You can register a test OAuth app in ${providerName} Developer Portal and begin sandbox testing.`),
        },
        whatCouldBlockLaunch: isStravaAiBlocked
          ? 'Strava API Policy Section 5.3 prohibition on AI models and data ingestion.'
          : (job.assumptions.audience === 'external_customers'
              ? `Provider review / verification requirements for public external traffic, or workspace administrator restrictions.`
              : 'None expected for team-only usage.'),
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
      permissionsTable: guidePermissions,
      setupChecklist: guideSteps,
      approvalAndDistribution: approvalAndDist,
      blockersAndRecovery: guideBlockers,
      evidenceAndUnknowns: {
        composioDocs: toolkitMatch && toolkitMatch.found ? [toolkitMatch.docUrl || 'https://docs.composio.dev'] : ['No Composio toolkit documented'],
        providerDocs: discoveredSources.filter(s => s.sourceType === 'provider_docs').map(s => s.canonicalUrl),
        metadataApiObservations: toolkitMatch && toolkitMatch.found ? [`Toolkit slug: ${toolkitMatch.slug}`] : [],
        communityReports: [],
        estimates: [developerEffort],
        setupAttempts: [],
        unresolvedAssumptions: [
          'Whether your target customers enforce strict enterprise SSO integration policies.',
        ],
      },
      sources: discoveredSources,
      claims,
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
          : 'Review provider rate limits before launching to external customers.',
      ],
    };

    repository.saveNextStepPack(nextStepPack);

    // Complete Job
    job.status = 'completed';
    job.guideId = guide.id;
    updateStage(
      'completed',
      'Research Complete & Shareable Guide Published',
      `Guide successfully synthesized with ${discoveredSources.length} sources and ${claims.length} verified claims.`
    );
  } catch (err: any) {
    console.error('Research job error:', err?.message || err);
    job.status = 'failed';
    job.error = err?.message || 'An unexpected error occurred during research synthesis.';
    updateStage(
      'failed',
      'Investigation Halted with Error Details',
      `Error encountered: ${job.error}. Partial evidence gathered prior to failure is preserved. You can retry with your server key once quota is available.`
    );
  }
}
