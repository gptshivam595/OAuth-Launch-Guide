# OAuth Launch Guide

> **"Find your OAuth path to launch with Composio."**  
> An evidence-driven engineering system designed for developers connecting AI agents to external third-party applications via Composio. Evaluates whether Composio-managed OAuth is suitable, audits provider verification and approval policies, and generates tailored launch packs.

- **Repository:** [https://github.com/gptshivam595/OAuth-Launch-Guide](https://github.com/gptshivam595/OAuth-Launch-Guide)
- **Live Application URL:** [https://ais-dev-d3o2qycysbeekoxn4do67i-470606151310.asia-southeast1.run.app](https://ais-dev-d3o2qycysbeekoxn4do67i-470606151310.asia-southeast1.run.app)

---

## 1. Product Context & Target User

### The Developer Dilemma
Engineers building autonomous AI agents face an opaque, high-risk barrier before their first customer can connect:
> *"Our AI sales agent needs to read incoming customer Gmail emails and sync contact records into Airtable or HubSpot. What must we configure so our customers can connect their accounts, and what will block our launch?"*

Developers piece together scattered provider documentation, wrestle with developer portals, and frequently discover too late that an innocent-sounding scope requires weeks in an external review queue or thousands of dollars for a mandatory CASA Tier 2 security audit.

### Why Composio-Managed OAuth Matters
Composio provisions managed OAuth apps for multiple toolkits. When suitable, managed OAuth lets developers start coding and testing their AI agent immediately without creating provider developer accounts or waiting for review queues.

### Why Managed Auth is Separate from Provider Action Access
1. **Toolkit Availability ≠ Universal Action Support:** A toolkit match in a catalogue does not mean all permissions are granted. For example, in Google Workspace, reading inboxes (`gmail.readonly`) is a **Restricted Scope** requiring an annual CASA Tier 2 third-party audit, while drafting replies (`gmail.compose`) is also restricted.
2. **Quota & Rate Limits:** Composio managed OAuth apps share platform rate limits. For high-throughput apps (e.g., LinkedIn social scheduling), official documentation explicitly advises an owned app.
3. **White-Label Consent Screen Branding:** Managed OAuth displays "Composio" on the provider consent screen. Enterprise customers often mandate seeing the developer's brand and logo.

---

## 2. Main User Journey & Core Features

```
[Developer Brief Intake]
       │
       ▼
[Live 6-Stage Investigation Pipeline]
       │
       ├─ 1. Resolve Provider Identity (SSRF-guarded canonical website & portal)
       ├─ 2. Inspect Composio Toolkit (6 distinct outcomes; no binary guessing)
       ├─ 3. Read Provider Requirements (Official doc archive or grounded search)
       ├─ 4. Assess Managed vs Owned Path (Policy blockers & branding criteria)
       ├─ 5. Synthesize Structured Guide (Honest scope status; zero fabricated SLAs)
       └─ 6. Validate Evidence Contract (Deterministic referential integrity audit)
       │
       ▼
[Interactive Setup & Approval Guide]
       ├─ Recommended Starting Path & Big KPI Stats
       ├─ Managed vs Owned Path Comparison Cards
       ├─ Granular Permissions & Scopes Table (Confirmed vs Unconfirmed scopes)
       ├─ Numbered Setup Accordion Checklist (Local device progress tracking)
       ├─ Approval & Distribution Journey (Registration to User Consent)
       ├─ Blockers & Recovery Playbooks (Hypotheses, checks, next actions, human handoffs)
       ├─ Audited Claims & Grounding Proof (Linked primary sources & validation notes)
       └─ Action Pack Generation (CLI/MCP configs, demo video outlines, justifications)
```

1. **Brief Intake Workflow:** Captures intended actions, audience (team only vs external customers), custom branding needs, and existing app status.
2. **Deterministic Evidence Validation:** Structural validation engine enforcing that every claim references a real stored source. If sources are missing or unverified, claims are downgraded to `requires_human_review`.
3. **Honest Unverified Fallbacks:** For unfamiliar providers, the system never invents fake scope names (e.g. `{provider}.read`) or labels them "Non-sensitive / instant". It marks them `Requirements Unverified` and provides actionable verification checklists.
4. **Action Pack Generator (`Prepare My Next-Step Pack`):** Generates copy-pasteable configuration checklists, permission justifications for provider review forms, YouTube demo walkthrough outlines, and reviewer test instructions.

---

## 3. Architecture & Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS (Obsidian Cyber-Grid design system: `#060B09` canvas, 40px engineering grid, diffuse emerald illumination `#00F29D`, Space Grotesk display typography, Inter body, and JetBrains Mono code/telemetry).
- **Backend:** Node.js + Express (`server.ts`) serving Vite middleware in development and static bundles in production.
- **Security & Validation:** Zod schemas for all API payloads (`POST /api/research`, `POST /api/chat`, `POST /api/guides/:id/version`), SSRF protection blocking loopback and RFC1918 private IPs, 256kb request size limit, and bounded concurrent job execution (max 8 in-flight).
- **Research Engine:** Server-side Google Gen AI SDK (`@google/genai`, model `gemini-3.8-flash`) with search grounding and official provider grounding archive (`KNOWN_PROVIDER_GROUNDINGS`).
- **Persistence:** Local atomic JSON storage (`data/guides.json`) utilizing temp-file rename swaps, write mutex locking, and corrupted file recovery.

---

## 4. Research & Evidence-Validation Approach

We strictly distinguish evidence classes across the system:

| Evidence Class | System Definition | Validation Behavior |
|---|---|---|
| **Verified from Official Source** (`verified_official`) | Sourced from primary provider developer portal, legal agreement, or official Composio doc. | Passes deterministic referential integrity; marked `verified`. |
| **Observed in Live API** (`observed_api`) | Retrieved from live Composio v3.1 metadata endpoint. | Provenance recorded with HTTP request timestamp. |
| **Supported Evidence** (`supported_evidence`) | Corroborated by secondary reference or developer documentation archive. | Marked `verified` with source citations. |
| **Estimated** (`estimated`) | Developer effort calculations based on console form complexity. | Explicitly labeled as estimate with basis documented. |
| **Inferred — Requires Confirmation** (`inferred_confirmation_required`) | Derived from architectural constraints (e.g. custom branding mandates owned OAuth). | Flagged for developer confirmation. |
| **Unknown / Not Publicly Documented** (`unknown_not_documented`) | Provider review turnaround times or unverified scope strings. | Displayed honestly as `Not publicly specified` or `Pending portal lookup`. |
| **Unverified** (`unverified`) | Claim references missing sources or source retrieval failed. | Automatically downgraded to `requires_human_review`. |
| **Blocked by Policy** (`blocked_policy`) | Documented legal restriction (e.g. Strava Section 5.3). | Halts path progression and flags legal compliance requirement. |

---

## 5. Curated Provider Guides & Policy Nuances

| Provider | Recommended Path | Managed Auth Status | Key Architectural & Policy Nuance |
|---|---|---|---|
| **Airtable** | Composio-managed suitable | **Available** | Granular per-base OAuth scopes. No provider review queue for private apps. Zero external waiting. |
| **LinkedIn** | Register owned app | **Available (quota-limited)** | High-throughput posting risks shared rate limit exhaustion. `w_member_social` is self-service; company page posting requires Community Management API partner approval. |
| **Gmail** | Register owned app | **Available (test-only, 100 users)** | `gmail.readonly` and `gmail.compose` are Google Restricted Scopes requiring Google Verification + CASA Tier 2 security audit for external users. |
| **Strava** | Blocked for AI | **Unavailable (no toolkit)** | **Policy 5.3 Blocker**: Strava API Agreement strictly prohibits using API data to operate AI applications, LLM context, RAG pipelines, or training summaries for external customers. Section 3.5 MCP exception is personal-use only. |
| **Spotify** | Register owned app | **Unavailable (verified badge)** | Development Mode limits access to max 5 whitelisted user accounts; app owner must hold Spotify Premium. Extended Quota Mode required for public scale. |
| **Xero** | Register owned app | **Unavailable (verified badge)** | Starter tier capped at 5 active organisation connections. Connecting > 5 organisations requires Xero App Store Partner Certification. Multi-tenant PKCE with `xero-tenant-id` header. |
| **DocuSign** | Register owned app | **Unavailable (no toolkit)** | Modern go-live has **no universal 20-call requirement** (automated for eligible accounts or reviewed). Public multi-customer SaaS integrations require DocuSign Partner Program membership. |
| **Mastodon** | Direct Provider OAuth | **Unavailable (no central toolkit)** | Decentralized ActivityPub. OAuth is **per instance** (`https://<instance>/oauth/authorize`). Dynamic Client Registration (`POST /api/v1/apps`) enables instant credentials with zero review queue. |
| **Linear** | Composio-managed suitable | **Available** | Standard workspace OAuth 2.0 with personal API key alternative. Quick connection flow. |

---

## 6. Environment Setup & Local Running

### Prerequisites
- Node.js 18+ (Node 20 or Node 22 recommended)
- npm or bun

### Environment Configuration
Create `.env` based on `.env.example`:
```bash
# GEMINI_RESEARCH_API_KEY: Gemini API Key for AI investigation agent and chat
GEMINI_RESEARCH_API_KEY="your-gemini-api-key"

# GEMINI_API_KEY: Default fallback Gemini API Key injected by AI Studio
GEMINI_API_KEY="your-gemini-api-key"

# COMPOSIO_API_KEY: Optional. Read-only metadata inspection against GET https://backend.composio.dev/api/v3.1/toolkits/{slug}
COMPOSIO_API_KEY=""
```

### Installation & Execution
```bash
# Install dependencies
npm install

# Run full-stack development server (Express backend + Vite middleware on port 3000)
npm run dev

# Run automated verification test suite
npm test

# Type-check codebase
npm run lint

# Build production bundle
npm run build
npm start
```

---

## 7. Automated Tests Executed & Results

An automated test suite (`tests/suite.ts`) verifies system behavior across 8 core integration scenarios:

| Test ID | Scenario | Target Behavior Tested | Result |
|---|---|---|---|
| **Test A** | Known provider with managed OAuth (Airtable) | Evidence-backed recommendations, documented Airtable scopes, consent screen branding disclaimer. | **PASS** |
| **Test B** | Known provider with managed OAuth unavailable (Spotify & Xero) | Recommends owned provider app, verifies quota mode restrictions (5 users for Spotify, 5 orgs for Xero). | **PASS** |
| **Test C** | Unknown / unfamiliar provider | Never fabricates fake `{provider}.read` scopes; flags scopes as `Unconfirmed`; does not assume "Non-sensitive / instant"; reports waiting time as `Not publicly specified`. | **PASS** |
| **Test D** | External research failure & SSRF protection | Verifies SSRF guard blocks `127.0.0.1`, `169.254.169.254`, and private RFC1918 ranges while permitting public HTTPS portals. | **PASS** |
| **Test E** | Ambiguous metadata handling | Missing or empty toolkits produce `toolkit_not_found` / `ambiguous_config` rather than false affirmative recommendations. | **PASS** |
| **Test F** | Evidence validation contract | Claim referencing non-existent source ID fails structural validation and downgrades to `requires_human_review` / `unverified`. Valid claim verified with `high_confidence`. | **PASS** |
| **Test G** | Shareable guide & persistence | Guide resolves by ID and slug; guide versioning increments cleanly (`v1` -> `v2`) with stable IDs; adjusts path when custom branding is required. | **PASS** |
| **Test H** | Flagship guides structural integrity | All 9+ repository guides validate with non-empty permissions, checklists, sources, and starting paths. | **PASS** |

**Command Executed:** `npm test` (`tsx tests/suite.ts`)  
**Status:** **100/100 checks PASSED.**

---

## 8. Known Limitations & Honest Disclosures

- **Exploratory Desk Research:** All guidance is synthesized from official developer portals, published API agreements, and Composio documentation.
- **Provider SLA Variance:** Provider review queues (Strava rate limit increases, Spotify Extended Quota, Xero App Store certification, DocuSign partner programs) do not publish guaranteed SLAs; these are reported as **`Not publicly specified`** rather than guessed.
- **Local Progress Tracking:** Checkboxes in the setup checklist store state in browser `localStorage`. Checking an item tracks internal team progress and does not certify provider approval.
- **Local JSON Persistence:** Persistent data is stored locally in `data/guides.json` with atomic file writes. Hosting environments that discard local ephemeral containers require persistent volume mounts or cloud storage for durable long-term retention.
- **No Credential Proxying:** This system guides developers through OAuth planning and review preparation; it is not a credential proxy or token storage vault.
