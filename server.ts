import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { z } from 'zod';
import { repository } from './src/server/storage.js';
import { runResearchJob, isSafePublicUrl } from './src/server/researchAgent.js';
import { inspectComposioToolkit } from './src/server/composioCatalog.js';
import { GuideAssumptions, ResearchJob } from './src/server/types.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '256kb' }));

// Input Validation Schemas
const ResearchRequestSchema = z.object({
  providerInput: z
    .string()
    .trim()
    .min(1, 'providerInput cannot be empty')
    .max(100, 'providerInput exceeds maximum length of 100 characters'),
  websiteInput: z
    .string()
    .trim()
    .max(300, 'websiteInput exceeds maximum length of 300 characters')
    .optional()
    .nullable(),
  assumptions: z
    .object({
      intendedActions: z.string().trim().max(500).optional(),
      audience: z.enum(['team_only', 'external_customers', 'not_sure']).optional(),
      customBrandingRequired: z.boolean().optional(),
      alreadyHasApp: z.boolean().optional(),
      specialNotes: z.string().trim().max(500).optional(),
    })
    .optional(),
});

const ChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),
});

const VersionRequestSchema = z.object({
  assumptions: z.object({
    intendedActions: z.string().trim().max(500),
    audience: z.enum(['team_only', 'external_customers', 'not_sure']),
    customBrandingRequired: z.boolean(),
    alreadyHasApp: z.boolean(),
    specialNotes: z.string().trim().max(500).optional(),
  }),
});

// 1. Research API - Start Investigation Job with Validation & SSRF Guard
app.post('/api/research', async (req, res) => {
  try {
    const parseResult = ResearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: parseResult.error.issues.map(i => i.message).join('; ') 
      });
    }

    const { providerInput, websiteInput, assumptions } = parseResult.data;

    // Validate websiteInput against SSRF if supplied
    if (websiteInput) {
      const urlCheck = isSafePublicUrl(websiteInput);
      if (!urlCheck.safe) {
        return res.status(400).json({ 
          error: `Unsafe or restricted website URL: ${urlCheck.error}` 
        });
      }
    }

    // Guard against unbounded concurrent expensive research jobs
    const activeJobs = repository.getAllResearchJobs().filter(j => j.status === 'researching');
    if (activeJobs.length >= 8) {
      return res.status(429).json({ 
        error: 'Too many research investigations are currently in flight. Please allow existing jobs to finish.' 
      });
    }

    const defaultAssumptions: GuideAssumptions = {
      intendedActions: assumptions?.intendedActions || 'Connect AI agent and read/write customer data',
      audience: assumptions?.audience || 'external_customers',
      customBrandingRequired: !!assumptions?.customBrandingRequired,
      alreadyHasApp: !!assumptions?.alreadyHasApp,
      specialNotes: assumptions?.specialNotes || '',
    };

    const jobId = `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const newJob: ResearchJob = {
      id: jobId,
      providerInput,
      websiteInput: websiteInput || undefined,
      assumptions: defaultAssumptions,
      status: 'researching',
      currentStage: 'resolve_identity',
      events: [
        {
          stage: 'resolve_identity',
          title: 'Investigation Job Initialized',
          description: `Queued research job for "${providerInput}"`,
          timestamp: new Date().toISOString(),
        },
      ],
      sourcesDiscovered: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    repository.saveResearchJob(newJob);

    // Fire bounded background research job
    runResearchJob(jobId).catch((err) => {
      console.error(`Background job ${jobId} failed:`, err?.message || err);
    });

    res.json({ jobId, status: 'researching' });
  } catch (err: any) {
    console.error('Error initiating research job:', err);
    res.status(500).json({ error: 'Failed to initiate research job' });
  }
});

// 2. Poll Research Job Status
app.get('/api/research/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'jobId parameter is required' });
  }
  const job = repository.getResearchJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Research job not found' });
  }
  res.json(job);
});

// 3. List All Guides (Curated + Researched)
app.get('/api/guides', (req, res) => {
  try {
    const guides = repository.getAllGuides();
    const summaries = guides.map((g) => ({
      id: g.id,
      slug: g.slug,
      version: g.version,
      providerName: g.providerName,
      exampleUseCase: g.exampleUseCase,
      startingPath: g.pathAssessment.startingPath,
      headline: g.pathAssessment.headline,
      managedAuthAvailable: g.composioToolkitMatch?.managedAuthAvailable || 'unknown',
      metadataStatus: g.composioToolkitMatch?.metadataStatus || 'unverified',
      canStartTesting: g.pathAssessment.canStartTesting,
      developerEffort: g.pathAssessment.developerEffort,
      externalWaiting: g.pathAssessment.externalWaiting,
      updatedAt: g.updatedAt,
    }));
    res.json(summaries);
  } catch (err: any) {
    console.error('Error listing guides:', err);
    res.status(500).json({ error: 'Failed to retrieve guides' });
  }
});

// 4. Get Guide By ID or Slug
app.get('/api/guides/:id', (req, res) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Guide ID is required' });
  }
  let guide = repository.getGuideById(id);
  if (!guide) {
    guide = repository.getGuideBySlug(id);
  }
  if (!guide) {
    return res.status(404).json({ error: 'Guide not found' });
  }
  res.json(guide);
});

// 5. Create a New Version of a Guide with altered assumptions
app.post('/api/guides/:id/version', (req, res) => {
  const { id } = req.params;
  const parseResult = VersionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ 
      error: parseResult.error.issues.map(i => i.message).join('; ') 
    });
  }

  const { assumptions } = parseResult.data;
  const updatedGuide = repository.createGuideVersion(id, assumptions as GuideAssumptions);
  if (!updatedGuide) {
    return res.status(404).json({ error: 'Original guide not found' });
  }
  res.json(updatedGuide);
});

// 6. Get or Generate Next-Step Pack
app.get('/api/guides/:id/next-step-pack', (req, res) => {
  const { id } = req.params;
  const guide = repository.getGuideById(id) || repository.getGuideBySlug(id);
  if (!guide) {
    return res.status(404).json({ error: 'Guide not found' });
  }

  const pack = repository.getNextStepPack(guide.id);
  if (!pack) {
    return res.status(404).json({ error: 'Next-step pack not yet generated for this guide' });
  }
  res.json(pack);
});

app.post('/api/guides/:id/next-step-pack', (req, res) => {
  const { id } = req.params;
  const guide = repository.getGuideById(id) || repository.getGuideBySlug(id);
  if (!guide) {
    return res.status(404).json({ error: 'Guide not found' });
  }

  let pack = repository.getNextStepPack(guide.id);
  if (!pack) {
    pack = {
      id: `pack-${guide.slug}-v${guide.version}`,
      guideId: guide.id,
      generatedAt: new Date().toISOString(),
      pathType: guide.pathAssessment.startingPath === 'composio_managed_suitable' ? 'managed' : 'owned',
      title: `${guide.providerName} Next-Step Pack`,
      summary: `Tailored review preparation and implementation guide for ${guide.providerName}.`,
      sections: [
        {
          title: '1. Immediate Setup Checklist',
          content: guide.setupChecklist
            .map((s) => `- [ ] **${s.action}** (${s.owner}) - ${s.details || s.completionCondition}`)
            .join('\n'),
        },
        {
          title: '2. Permission Justifications',
          content: guide.permissionsTable
            .map((p) => `- **\`${p.permission}\`**: ${p.whyNeeded}`)
            .join('\n'),
        },
      ],
      draftPermissionJustification: `Our AI assistant requires access to ${guide.providerName} to perform: ${guide.exampleUseCase}.`,
      warningsAndDisclaimers: [
        'Local checklist marks your personal progress on this device and does not certify provider approval.',
      ],
    };
    repository.saveNextStepPack(pack);
  }

  res.json(pack);
});

// 7. Check Composio Toolkit
app.get('/api/composio/check/:provider', async (req, res) => {
  const { provider } = req.params;
  if (!provider) {
    return res.status(400).json({ error: 'Provider slug is required' });
  }
  const result = await inspectComposioToolkit(provider);
  res.json(result);
});

// 8. Conversational Chat API for Instant Developer Guidance
app.post('/api/chat', async (req, res) => {
  try {
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: parseResult.error.issues.map(i => i.message).join('; ') 
      });
    }

    const { message } = parseResult.data;
    const guides = repository.getAllGuides();
    let matchedGuide = null;
    const lower = message.toLowerCase();

    for (const g of guides) {
      if (lower.includes(g.slug) || lower.includes(g.providerName.toLowerCase())) {
        matchedGuide = g;
        break;
      }
    }

    let reply = '';
    const matchedGuideId = matchedGuide ? matchedGuide.id : null;

    // Fast path: if user specifically inquired about a known guide, provide immediate grounded answer
    if (matchedGuide) {
      const p = matchedGuide.pathAssessment;
      const topScopes = matchedGuide.permissionsTable
        .slice(0, 3)
        .map(s => `\`${s.permission}\` (${s.reviewImplication})`)
        .join(', ');
      const topBlocker = matchedGuide.blockersAndRecovery[0]?.symptom || 'Quota & domain approval';

      reply = `**Path Recommendation: ${p.headline}**\n\n` +
        `• **Fit Analysis:** ${p.why}\n` +
        `• **Key Scopes:** ${topScopes || 'None specified'}\n` +
        `• **Launch Blocker:** ${topBlocker}\n` +
        `• **External Waiting:** ${p.externalWaiting}\n\n` +
        `You can open the complete verified guide below for step-by-step checklists and review materials.`;
    } else {
      // General question: use Gemini with timeout or fallback
      const apiKey = process.env.GEMINI_RESEARCH_API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
          });

          const guideContext = guides
            .map((g) => `- ${g.providerName}: Path=${g.pathAssessment.startingPath}, Scopes=${g.permissionsTable.map(s => s.permission).join(', ')}`)
            .join('\n');

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `You are OAuth Launch Guide AI for Composio developers. Answer in under 90 words with:
- **Bold Recommendation** (e.g. Composio-managed OAuth vs Owned Provider App)
- 2-3 bullets for scopes and review tier (note: gmail.compose is Restricted)
- 1 bullet for launch blocker
- Mention Composio Connect (MCP: https://connect.composio.dev/mcp) if asking about agent tool execution.
Do not invent fixed audit prices or fake scope strings.

Query: "${message.replace(/[\r\n]/g, ' ').slice(0, 500)}"
Verified Guides Knowledge:
${guideContext}`,
          });

          reply = response.text || 'Recommendation ready.';
        } catch (e: any) {
          console.warn('Gemini chat call error, using fallback:', e?.message || e);
          reply = `**Path Recommendation: Start with Composio-Managed OAuth.**\n\n• **Instant Testing:** Connect without registering a developer app.\n• **Owned App Required:** Needed for custom consent-screen branding or enterprise whitelisting.\n• **Agent Execution:** Connect via Composio MCP (\`https://connect.composio.dev/mcp\`).`;
        }
      } else {
        reply = `**Path Recommendation: Start with Composio-Managed OAuth.**\n\n• **Speed:** Connect without provider portal setup.\n• **Custom Branding:** Register an owned app if your customers mandate your brand.\n• **Agent Execution:** Use Composio MCP (\`https://connect.composio.dev/mcp\`).`;
      }
    }

    res.json({
      reply,
      matchedGuideId,
    });
  } catch (err: any) {
    console.error('Chat API error:', err);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Explicit API 404 fallback: guarantees /api/* requests never fall through to Vite SPA index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Mount Vite or static server
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OAuth Launch Guide] Server listening at http://localhost:${PORT}`);

    // Resume in-flight research jobs across restart
    try {
      const allJobs = repository.getAllResearchJobs();
      const inFlightJobs = allJobs.filter(j => j.status === 'researching' || j.status === 'queued');
      if (inFlightJobs.length > 0) {
        console.log(`[OAuth Launch Guide] Resuming ${inFlightJobs.length} in-flight research job(s)...`);
        for (const job of inFlightJobs) {
          runResearchJob(job.id).catch(err => {
            console.error(`Resumed job ${job.id} failed:`, err?.message || err);
          });
        }
      }
    } catch (resumeErr) {
      console.warn('Error checking/resuming research jobs on startup:', resumeErr);
    }
  });
}

startServer();
