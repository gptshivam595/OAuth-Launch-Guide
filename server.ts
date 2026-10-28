import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { repository } from './src/server/storage.js';
import { runResearchJob } from './src/server/researchAgent.js';
import { inspectComposioToolkit } from './src/server/composioCatalog.js';
import { GuideAssumptions, ResearchJob } from './src/server/types.js';

dotenv.config();

const app = express();
app.use(express.json());

// 1. Research API - Start Investigation Job
app.post('/api/research', async (req, res) => {
  try {
    const { providerInput, websiteInput, assumptions } = req.body;

    if (!providerInput || typeof providerInput !== 'string') {
      return res.status(400).json({ error: 'providerInput is required.' });
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

    // Fire and forget bounded background research job
    runResearchJob(jobId).catch((err) => {
      console.error(`Background job ${jobId} failed:`, err);
    });

    res.json({ jobId, status: 'researching' });
  } catch (err: any) {
    console.error('Error initiating research job:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// 2. Poll Research Job Status
app.get('/api/research/:jobId', (req, res) => {
  const job = repository.getResearchJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Research job not found' });
  }
  res.json(job);
});

// 3. List All Guides (Curated + Researched)
app.get('/api/guides', (req, res) => {
  const guides = repository.getAllGuides();
  // Return summarized list
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
});

// 4. Get Guide By ID or Slug
app.get('/api/guides/:id', (req, res) => {
  const { id } = req.params;
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
  const { assumptions } = req.body;
  if (!assumptions) {
    return res.status(400).json({ error: 'assumptions are required to create a new version' });
  }

  const updatedGuide = repository.createGuideVersion(id, assumptions);
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
  const result = await inspectComposioToolkit(provider);
  res.json(result);
});

// 8. Conversational Chat API for Instant Developer Guidance
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

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
      const topScopes = matchedGuide.permissionsTable.map(s => `\`${s.permission}\` (${s.reviewImplication})`).slice(0, 3).join(', ');
      const topBlocker = matchedGuide.blockersAndRecovery[0]?.symptom || 'Quota & domain approval';

      reply = `**Path Recommendation: ${p.headline}**\n\n` +
        `• **Fit Analysis:** ${p.why}\n` +
        `• **Key Scopes:** ${topScopes}\n` +
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
Do not invent fixed audit prices.

Query: "${message}"
Verified Guides Knowledge:
${guideContext}`,
          });

          reply = response.text || 'Recommendation ready.';
        } catch (e) {
          console.warn('Gemini chat call error, using fallback:', e);
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
    res.status(500).json({ error: err.message || 'Failed to generate response' });
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

    // Preserve & resume in-flight research jobs across restart
    try {
      const allJobs = repository.getAllResearchJobs();
      const inFlightJobs = allJobs.filter(j => j.status === 'researching' || j.status === 'queued');
      if (inFlightJobs.length > 0) {
        console.log(`[OAuth Launch Guide] Found ${inFlightJobs.length} in-flight research job(s) across restart. Resuming...`);
        for (const job of inFlightJobs) {
          runResearchJob(job.id).catch(err => {
            console.error(`Resumed job ${job.id} failed:`, err);
          });
        }
      }
    } catch (resumeErr) {
      console.warn('Error checking/resuming research jobs on startup:', resumeErr);
    }
  });
}

startServer();
