# OAuth Launch Guide

> **"Find your OAuth path to launch with Composio."**  
> An independent take-home prototype designed for developers using Composio to connect AI agents to external applications.

---

## 1. Product Context & The Developer Dilemma

Developers building autonomous AI agents face a common, time-consuming challenge before they can launch:

> *"Our AI sales assistant needs to read incoming customer Gmail emails and sync contact records into Airtable or HubSpot. What must we do so our customers can connect their accounts, and what might prevent us from launching?"*

Today, developers piece together scattered provider documentation, work through opaque developer portals, and discover late that a scope they requested requires weeks of waiting or thousands of dollars for a mandatory third-party security assessment.

### Why Start with Composio-Managed Fit?
Composio provides managed OAuth for many toolkits. When available and suitable, this allows developers to start coding and testing their AI agent immediately without creating provider developer accounts or waiting for review queues.

### Why is Managed Auth Separate from Provider Action Access?
1. **Toolkit Availability ≠ Universal Action Support:** A toolkit badge in a catalogue does not mean every permission is granted. For example, in Google Workspace, drafting replies (`gmail.compose`) is a Sensitive Scope, while reading inboxes (`gmail.readonly`) is a **Restricted Scope** requiring an annual CASA Tier 2 security audit.
2. **Quota & Rate Limits:** Composio managed OAuth apps share platform rate limits across all platform developers. For high-throughput apps (e.g., LinkedIn social scheduling), Composio documentation explicitly advises registering an owned app to avoid throttling.
3. **White-Label Consent Screen Branding:** Managed OAuth displays "Composio" on the provider consent screen. Enterprise customers often mandate seeing the developer's actual product name and logo.

### Why Owned-App Setup and Approval Guidance Remains the Core Guide
Managed OAuth helps developers start quickly, but as products mature to external customer launches, owned provider apps are frequently necessary. Developers need unambiguous guidance on:
- Where to register the OAuth app in the provider's developer console.
- Exactly which scopes map to their intended features.
- What verification videos, domain verifications, and privacy policy materials are required.
- Where their agent can act vs where a human must intervene.

---

## 2. Key Architecture & Features

### Architecture Overview
- **Frontend:** React 19 + TypeScript + Tailwind CSS (warm off-white palette `#FAFAF9`, `#18181B`, `#4F46E5`).
- **Backend:** Node.js + Express (`server.ts`) integrating Vite middleware in development and static bundle serving in production.
- **AI Research Pipeline:** Server-side Google Gen AI SDK (`@google/genai`, model `gemini-3.8-flash`) executing a bounded research workflow with Google search grounding and structured synthesis.
- **Persistence:** File-backed storage repository (`./data/guides.json`) surviving server restarts, supporting guide versioning, research job tracking, and next-step action packs.
- **Zero Exposed Secrets:** API keys (`GEMINI_API_KEY`, optional `COMPOSIO_API_KEY`) run strictly server-side.

### Core Modules
1. **Home & Researched Guide Library (`/`):**
   - Three thoroughly researched flagship guides (**Airtable**, **LinkedIn**, and **Gmail**), each investigating distinct challenges.
   - Live intake input allowing developers to investigate any provider by name or website.
2. **Brief Intake Workflow:**
   - Captures intended actions, audience (team only vs external customers), custom branding needs, and existing app status.
   - Contextual nuance warnings (e.g., LinkedIn personal vs company page, Gmail sensitive vs restricted scopes).
3. **Live Research Experience (`/jobs/:jobId`):**
   - Displays real execution stages:
     1. Resolve provider identity
     2. Check Composio toolkit & managed auth
     3. Read provider setup & access requirements
     4. Assess managed vs owned OAuth path
     5. Build structured guide
     6. Check evidence contract
   - Activity event stream with genuine timestamps and discovered source links.
4. **Interactive Setup & Approval Guide (`/guides/:id`):**
   - **Recommended Starting Path** assessment with quick glance metrics (Can I test now?, Launch blockers, Effort, Waiting, Next action).
   - **8 Core Sections:**
     1. Composio Fit
     2. Recommended Setup Path (Managed vs Owned comparison)
     3. Prerequisites
     4. Permissions & Scopes Table (Feature, Scope, Why needed, Review implication, Uncertainty)
     5. Setup Checklist with local device progress tracking (`"Your progress on this device"`)
     6. Approval & Distribution Journey (Registration, API approval, Provider verification, Marketplace, Admin approval, User consent)
     7. Blockers & Recovery Playbooks (Root causes, checks, hypotheses, next actions, human handoffs)
     8. Evidence & Unknowns (Attached primary sources and documented setup attempts)
5. **Agent Action: "Prepare My Next-Step Pack":**
   - Generates copy-pasteable configuration checklists, permission justifications for provider review forms, YouTube demo walkthrough outlines, and reviewer test account instructions.
   - Markdown export and clipboard copy.
6. **Research & Decisions Page (`/research`):**
   - Documents the research methodology, citations from developer community discussions (Reddit r/SaaS, r/OpenWebUI, ShopifyAppDev), alternative platforms (Nango, Pipedream, Arcade), and the validation log.

---

---

## 4. Flagship & Live Investigated Examples

| Provider | Starting Path | Managed Auth Status | Key Architectural & Policy Nuance |
|---|---|---|---|
| **Airtable** | Composio-managed suitable | **Available** | Granular per-base OAuth scopes. No app review queue for private apps. Instant testing. |
| **LinkedIn** | Register owned app | **Available (quota-limited)** | High-throughput posting risks shared rate limit exhaustion. `w_member_social` is self-service; organizational posting requires Community Management API partner approval. |
| **Gmail** | Register owned app | **Available (test-only, 100 users)** | `gmail.readonly` is a Google Restricted Scope requiring OAuth verification + annual CASA Tier 2 security audit ($1,500–$6,000) for external customers. Drafting (`gmail.compose`) avoids CASA. |
| **Strava** | Register owned app (Blocked for AI) | **Unavailable (no toolkit)** | Getting-started operates in single-player mode (owner only) up to 10 athletes; app owner subscription required. **Critical Policy 5.3 Blocker**: Strava strictly prohibits feeding API data into AI models, RAG pipelines, or LLM grounding for external customers (Section 3.5 MCP exception is personal-use only). Athlete OAuth consent does not waive this restriction. |
| **Spotify** | Register owned app | **Unavailable (verified badge)** | Development Mode requires app owner Spotify Premium and is limited to max 5 whitelisted user accounts. Extended Quota Mode application required for commercial scale. Composio managed OAuth explicitly not available. |
| **Xero** | Register owned app | **Unavailable (verified badge)** | Starter (Early) tier capped at 5 active organisation connections. Connecting > 5 organisations requires Xero App Store Partner Certification. Multi-tenant PKCE with `xero-tenant-id` header. |
| **DocuSign** | Register owned app | **Unavailable (no toolkit)** | Modern go-live has **no universal 20-call requirement** (automatic for eligible accounts or reviewed). Public multi-customer SaaS applications require the DocuSign Partner Program. |
| **Mastodon** | Direct Provider OAuth | **Unavailable (no central toolkit)** | Decentralized and federated ActivityPub architecture. OAuth is **per instance** (`https://<instance>/oauth/authorize`). Dynamic Client Registration (`POST /api/v1/apps`) enables instant authorization credentials with zero waiting. Canonical source: `joinmastodon.org`. |

---

## 5. What We Learned, Corrected, and Could Not Verify

### What We Learned & Corrected
1. **Composio Negation Parsing Bug:**
   - *Observation:* Previously, `docs.composio.dev/toolkits/spotify` and `/xero` returned HTTP 200 and mentioned OAuth 2.0, causing the system to mistakenly claim managed OAuth was "available".
   - *Correction:* Inspected the exact `Authentication Details` DOM badge. Both toolkits explicitly display `<span ...>Composio-managed OAuth not available</span>` and document FAQ entries explaining why default OAuth apps are omitted. The parser now enforces strict badge negation and disables the managed path for these toolkits.
2. **Strava June 2026 AI Policy Restrictions:**
   - *Observation:* Many integration guides treat Strava as standard self-service OAuth.
   - *Correction:* Identified Section 5.3 of the Strava API Agreement & Developer Policy, which strictly restricts using Strava API data to operate third-party AI applications, context grounding, prompt construction, RAG, or training summaries for external customers. Athlete OAuth consent does not grant this right. Section 3.5 provides an MCP exception solely for single-user personal developer setups.
3. **DocuSign Modern Go-Live Criteria:**
   - *Observation:* Legacy developer articles frequently cite an outdated mandatory 20 successful API calls rule before go-live.
   - *Correction:* Verified modern DocuSign platform guidelines: the universal 20-call rule is retired. Go-live is either automated for eligible business accounts or reviewed; multi-tenant public SaaS integrations must enroll in the DocuSign Partner Program.
4. **Decentralized Fediverse Architecture (Mastodon):**
   - *Observation:* Generic generators fabricate central portals like `mastodon.com/developers`.
   - *Correction:* Grounded on canonical `joinmastodon.org` and `docs.joinmastodon.org/spec/oauth/`. Mastodon OAuth is per instance; applications register dynamically via `POST /api/v1/apps` with zero external review queue.
5. **API Routing & SPA Content-Type Safety:**
   - *Observation:* Polling jobs failed with `Unexpected token <` when dev server restarts or unhandled `/api/*` routes fell through to Vite's SPA `index.html`.
   - *Correction:* Added strict Express API 404 handler (`app.all('/api/*', ...)`), resilient content-type verification in `client.ts`, job restart resumption in `server.ts`, and polling retry guards in `ResearchProgress.tsx`.

### What We Could Not Verify (Honest Unknowns)
- **Review Queues & Turnaround Timelines:** Official documentation for Strava rate limit increases, Spotify Extended Quota mode, Xero App Store certification, and DocuSign partner approvals do not publish guaranteed SLAs. These are explicitly reported as **`Unknown`** rather than fabricated numbers.
- **Dynamic Quota Allocations:** Exact custom rate limits granted to individual partner applicants vary based on business negotiation.

---

## 6. Setup & Running Locally

### Prerequisites
- Node.js 18+ (Node 20 or Node 22 recommended)
- npm or bun

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
# GEMINI_RESEARCH_API_KEY: Required for live research and structured synthesis
GEMINI_RESEARCH_API_KEY="your-gemini-api-key"

# COMPOSIO_API_KEY: Optional. Read-only metadata inspection against GET https://backend.composio.dev/api/v3.1/toolkits/{slug}
# If omitted, verified public documentation is used with "Documentation checked" badge.
COMPOSIO_API_KEY=""
```

### Installation & Run
```bash
# Install dependencies
npm install

# Start full-stack development server (Express backend + Vite middleware on port 3000)
npm run dev

# Or build and run production bundle
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Limitations & Disclaimers

- **Exploratory Desk Research:** All guidance is synthesized from official provider developer portals, published API agreements, and Composio documentation.
- **Local Progress Tracking:** Interactive checkboxes in the Setup Checklist store state locally on the developer's device (`localStorage`). Checking a step tracks internal team progress and does not certify provider approval.
- **No Token Storage:** This tool guides developers through OAuth planning and preparation; it is not a credential proxy or token storage vault.
