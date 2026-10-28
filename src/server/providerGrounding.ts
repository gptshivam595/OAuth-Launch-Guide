export interface ProviderGrounding {
  providerName: string;
  slug: string;
  canonicalWebsite: string;
  developerPortalUrl: string;
  officialDocSources: {
    title: string;
    url: string;
    summary: string;
  }[];
  keyFacts: {
    appRegistration: string;
    apiProductAccessApproval: string;
    providerVerification: string;
    marketplaceDistribution: string;
    customerAdminApproval: string;
    endUserConsent: string;
  };
  startingPathRule: {
    singlePlayerOrQuotaRule: string;
    quotaModesOrTiers: string;
    subscriptionRequirement?: string;
    managedAuthNote?: string;
    aiPolicyRestriction?: {
      isBlocked: boolean;
      policySection: string;
      policyUrl: string;
      reason: string;
    };
  };
  recommendedScopes: {
    permission: string;
    whyNeeded: string;
    feature: string;
    reviewImplication: string;
  }[];
  blockers: {
    symptom: string;
    checks: string[];
    explanationOrHypothesis: string;
    nextAction: string;
    humanHandoff: string;
  }[];
  externalWaitingEstimate: string;
  developerEffortEstimate: string;
}

export const KNOWN_PROVIDER_GROUNDINGS: Record<string, ProviderGrounding> = {
  strava: {
    providerName: 'Strava',
    slug: 'strava',
    canonicalWebsite: 'https://strava.com',
    developerPortalUrl: 'https://www.strava.com/settings/api',
    officialDocSources: [
      {
        title: 'Strava API Getting Started Guide',
        url: 'https://developers.strava.com/docs/getting-started/',
        summary: 'Official guide covering initial application setup, single-player athlete restrictions, 10-athlete testing tier, and rate limit increase requests.',
      },
      {
        title: 'Strava API Agreement & Developer Policy (June 2026)',
        url: 'https://www.strava.com/legal/api_policy',
        summary: 'Section 5.3 explicitly restricts operating AI applications with API data (including LLM grounding, context, prompt construction, RAG, and AI summaries). Section 3.5 MCP exception is strictly limited to personal single-user setups, not multi-customer commercial apps.',
      },
      {
        title: 'Strava API Agreement',
        url: 'https://www.strava.com/legal/api',
        summary: 'Developer terms requiring application owners to maintain an active paid Strava subscription and detailing commercial distribution constraints.',
      },
      {
        title: 'Strava OAuth 2.0 Reference',
        url: 'https://developers.strava.com/docs/authentication/',
        summary: 'OAuth 2.0 authorization code exchange and token refresh specification for Strava athletes.',
      },
    ],
    keyFacts: {
      appRegistration: 'Self-service API application registration under Strava Profile Settings -> My API Application.',
      apiProductAccessApproval: 'Initial default rate limit of 100 requests per 15 minutes, 1,000 per day. Default tier is restricted to single-player (developer athlete profile only), with option to request up to 10 athletes for testing.',
      providerVerification: 'Wider external production access requires submitting an Application for Rate Limit Increase / API Review to Strava developer support.',
      marketplaceDistribution: 'No public open directory; integrations are distributed directly via OAuth redirect or certified partner listings.',
      customerAdminApproval: 'Not applicable (individual consumer athlete authorization).',
      endUserConsent: 'Athletes authorize data access on Strava standard consent screen. NOTE: Athlete OAuth consent does not grant an exemption from Section 5.3 AI data restrictions.',
    },
    startingPathRule: {
      singlePlayerOrQuotaRule: 'Strava getting-started operates in single-player mode (owner athlete only). Developers can add up to 10 athletes for development testing in the default tier before business approval.',
      quotaModesOrTiers: 'Default Tier: Single-player up to 10 athletes (100 req/15 min). Production Tier: Requires rate-limit increase approval with Strava business review.',
      subscriptionRequirement: 'Active Strava subscription required for the application owner/developer to maintain an API integration.',
      managedAuthNote: 'No pre-built Composio toolkit; register an owned OAuth app in Strava Settings -> My API Application.',
      aiPolicyRestriction: {
        isBlocked: true,
        policySection: 'Section 5.3 & Section 3.5',
        policyUrl: 'https://www.strava.com/legal/api_policy',
        reason: 'Strava API Policy (June 2026) Section 5.3 prohibits operating AI applications using API data, including LLM context, RAG grounding, and training summaries for external customers. Section 3.5 MCP exception applies strictly to personal use only.',
      },
    },
    recommendedScopes: [
      {
        permission: 'read',
        whyNeeded: 'Read basic public athlete segment efforts and public profile information.',
        feature: 'Public Profile Read',
        reviewImplication: 'Default / Standard',
      },
      {
        permission: 'read_all',
        whyNeeded: 'Read private athlete profile and sensitive stats.',
        feature: 'Private Profile Read',
        reviewImplication: 'Sensitive / Review needed for wide distribution',
      },
      {
        permission: 'profile:read_all',
        whyNeeded: 'Access complete athlete profile and body metrics.',
        feature: 'Comprehensive Profile Access',
        reviewImplication: 'Sensitive',
      },
      {
        permission: 'activity:read',
        whyNeeded: 'Read public athlete activity summaries (runs, rides, workouts).',
        feature: 'Activity Summary Read',
        reviewImplication: 'Standard',
      },
      {
        permission: 'activity:read_all',
        whyNeeded: 'Read private athlete activities and GPS route streams.',
        feature: 'Private Activity Read',
        reviewImplication: 'Sensitive (requires clear user consent)',
      },
      {
        permission: 'activity:write',
        whyNeeded: 'Upload new workouts or update activity titles and descriptions.',
        feature: 'Activity Creation & Modification',
        reviewImplication: 'Standard write permission',
      },
    ],
    blockers: [
      {
        symptom: 'Operating multi-customer AI application or LLM context/RAG summaries with Strava API data is prohibited by Policy 5.3',
        checks: [
          'Review Strava API Policy Section 5.3 on AI models and data ingestion.',
          'Check whether use case relies on Section 3.5 personal MCP exemption versus multi-customer external commercial app.',
        ],
        explanationOrHypothesis: 'Strava API Policy Section 5.3 explicitly restricts feeding Strava data into third-party AI models, RAG pipelines, or LLM grounding. User OAuth consent does NOT waive Section 5.3 developer agreement restrictions. Section 3.5 permits MCP integrations only for single-user personal workflows.',
        nextAction: 'Limit Strava integration to non-AI activity synchronization or personal-use MCP scripts. For external AI features, request special written commercial exemption from Strava Partnerships.',
        humanHandoff: 'Legal / Partnerships team requests written policy amendment from Strava Legal.',
      },
      {
        symptom: 'Non-developer athletes cannot authorize app or see "This app is in development" error',
        checks: ['Verify whether the athlete is added to the 10-athlete testing list in Strava developer settings.'],
        explanationOrHypothesis: 'Strava limits new apps to single-player (owner only) or up to 10 designated athletes until a rate-limit increase is approved.',
        nextAction: 'Add the test athlete ID under My API Application or submit an official rate limit increase application for public launch.',
        humanHandoff: 'Developer submits rate limit application to Strava developer relations.',
      },
      {
        symptom: 'API application suspended or inaccessible',
        checks: ['Confirm the app owner account maintains an active paid Strava subscription.'],
        explanationOrHypothesis: 'Strava terms require developers to maintain an active subscription to maintain API access.',
        nextAction: 'Renew or reactivate Strava subscription for the owner account.',
        humanHandoff: 'Account owner updates billing.',
      },
    ],
    externalWaitingEstimate: 'Unknown - Strava rate-limit review times are variable and undocumented in official developer guides.',
    developerEffortEstimate: '1–2 hours for initial sandbox app creation and OAuth authorization testing.',
  },

  spotify: {
    providerName: 'Spotify',
    slug: 'spotify',
    canonicalWebsite: 'https://spotify.com',
    developerPortalUrl: 'https://developer.spotify.com/dashboard',
    officialDocSources: [
      {
        title: 'Spotify Developer Quota Modes Reference',
        url: 'https://developer.spotify.com/documentation/web-api/concepts/quota-modes',
        summary: 'Details Development Mode restrictions (max 5 whitelisted users, Premium owner required) versus Extended Quota Mode eligibility and review.',
      },
      {
        title: 'Spotify Web API Concepts: App Registration',
        url: 'https://developer.spotify.com/documentation/web-api/concepts/apps',
        summary: 'Official app creation workflow, Client ID/Secret generation, and redirect URI management.',
      },
      {
        title: 'Composio Spotify Toolkit Documentation',
        url: 'https://docs.composio.dev/toolkits/spotify',
        summary: 'Official Composio documentation explicitly confirming: "Composio-managed OAuth not available. Create your own OAuth app in the Spotify Developer Dashboard."',
      },
    ],
    keyFacts: {
      appRegistration: 'Self-service registration in Spotify Developer Dashboard. Instant Client ID and Secret.',
      apiProductAccessApproval: 'Development Mode allows up to 5 user accounts explicitly added by email in the dashboard. App owner must have Spotify Premium.',
      providerVerification: 'Extended Quota Mode requires formal application submission in the Spotify Developer Dashboard, passing commercial/non-commercial review.',
      marketplaceDistribution: 'No public marketplace; apps connect directly via standard Spotify OAuth dialog.',
      customerAdminApproval: 'Not applicable (individual Spotify account consent).',
      endUserConsent: 'User consent prompt displays registered app name, logo, and requested permission scopes.',
    },
    startingPathRule: {
      singlePlayerOrQuotaRule: 'Development Mode is restricted to 5 pre-approved user accounts entered by email in the developer dashboard. App owner must hold a Spotify Premium subscription.',
      quotaModesOrTiers: 'Development Mode (5 users, Premium owner) -> Extended Quota Mode (application review for commercial/public scale).',
      managedAuthNote: 'Composio-managed OAuth is explicitly NOT available for Spotify. You must register an owned app in Spotify Developer Dashboard.',
    },
    recommendedScopes: [
      {
        permission: 'user-read-private',
        whyNeeded: 'Read user country and subscription status for regional playback availability.',
        feature: 'Profile Details',
        reviewImplication: 'Standard',
      },
      {
        permission: 'user-read-email',
        whyNeeded: 'Identify the authenticated user by email address.',
        feature: 'User Identity',
        reviewImplication: 'Standard',
      },
      {
        permission: 'playlist-read-private',
        whyNeeded: 'Read user private playlists to enable agent curation.',
        feature: 'Private Playlist Read',
        reviewImplication: 'Standard',
      },
      {
        permission: 'playlist-modify-public',
        whyNeeded: 'Create and update public playlists on user behalf.',
        feature: 'Public Playlist Management',
        reviewImplication: 'Standard',
      },
      {
        permission: 'playlist-modify-private',
        whyNeeded: 'Create and update collaborative or private playlists.',
        feature: 'Private Playlist Management',
        reviewImplication: 'Standard',
      },
    ],
    blockers: [
      {
        symptom: 'User sees "User not registered in developer dashboard" error during authorization',
        checks: ['Verify the user Spotify account email is explicitly added to the Developer Dashboard Users and Access list.'],
        explanationOrHypothesis: 'In Development Mode, Spotify rejects any user not pre-registered in the dashboard.',
        nextAction: 'Add the test user email to the dashboard User Management list, or apply for Extended Quota Mode.',
        humanHandoff: 'Developer updates dashboard access list.',
      },
      {
        symptom: 'Cannot create developer app in dashboard',
        checks: ['Confirm developer account owner has an active Spotify Premium subscription.'],
        explanationOrHypothesis: 'Spotify requires app creators to have an active Premium subscription.',
        nextAction: 'Upgrade developer account to Spotify Premium.',
        humanHandoff: 'Developer subscribes to Premium.',
      },
    ],
    externalWaitingEstimate: 'Unknown - Spotify Extended Quota Mode review times are queue-dependent and undocumented.',
    developerEffortEstimate: '1–2 hours for dashboard registration, redirect URI setup, and user whitelist configuration.',
  },

  xero: {
    providerName: 'Xero',
    slug: 'xero',
    canonicalWebsite: 'https://xero.com',
    developerPortalUrl: 'https://developer.xero.com/app/manage',
    officialDocSources: [
      {
        title: 'Xero OAuth 2.0 API Overview',
        url: 'https://developer.xero.com/documentation/guides/oauth2/overview/',
        summary: 'Official guide on OAuth 2.0 authorization code flow with PKCE, connection limits, and multi-tenant organisation selection.',
      },
      {
        title: 'Xero App Store Partner Program & Certification',
        url: 'https://developer.xero.com/app-store/partnering-with-xero/',
        summary: 'Explains the 5 active organisation limit for uncertified apps and requirements to become a certified Xero App Store partner for external customers.',
      },
      {
        title: 'Composio Xero Toolkit Documentation',
        url: 'https://docs.composio.dev/toolkits/xero',
        summary: 'Official Composio documentation explicitly confirming: "Composio-managed OAuth not available. Create your own OAuth app in the Xero Developer Portal."',
      },
    ],
    keyFacts: {
      appRegistration: 'Self-service registration in Xero Developer Portal (developer.xero.com/app/manage). Instant Client ID and Secret.',
      apiProductAccessApproval: 'Standard uncertified/Starter app allows up to 5 active organisation connections. Connecting more than 5 client organisations requires Xero App Partner certification.',
      providerVerification: 'App Store Certification requires security review, user workflow verification, and commercial agreement with Xero.',
      marketplaceDistribution: 'Listing on Xero App Store is required for apps targeting broad customer discovery and unlimited connections.',
      customerAdminApproval: 'Xero organisation administrator (or standard user with permissions) must authorize the connection and select the target tenant.',
      endUserConsent: 'User logs in, reviews scopes, and selects which Xero organisation to grant access to. Returns tenant_id.',
    },
    startingPathRule: {
      singlePlayerOrQuotaRule: 'Uncertified apps are limited to a maximum of 5 active organisation connections. Exceeding 5 connections requires completing Xero App Store Partner Certification.',
      quotaModesOrTiers: 'Starter Tier (Max 5 active organisation connections) -> Certified App Store Partner (unlimited organisation connections, commercial partner revenue share).',
      managedAuthNote: 'Composio-managed OAuth is explicitly NOT available for Xero. You must register an owned app in Xero Developer Portal.',
    },
    recommendedScopes: [
      {
        permission: 'openid',
        whyNeeded: 'OpenID Connect identity verification.',
        feature: 'Authentication',
        reviewImplication: 'Standard',
      },
      {
        permission: 'profile',
        whyNeeded: 'Retrieve user basic profile information.',
        feature: 'User Identity',
        reviewImplication: 'Standard',
      },
      {
        permission: 'email',
        whyNeeded: 'Retrieve verified user email for account linking.',
        feature: 'Account Linking',
        reviewImplication: 'Standard',
      },
      {
        permission: 'accounting.transactions',
        whyNeeded: 'Read and write invoices, bank transactions, and bills.',
        feature: 'Transaction Management',
        reviewImplication: 'Sensitive accounting data',
      },
      {
        permission: 'accounting.contacts',
        whyNeeded: 'Read and update customers and suppliers.',
        feature: 'Contact Management',
        reviewImplication: 'Standard financial scope',
      },
      {
        permission: 'offline_access',
        whyNeeded: 'Receive a refresh token for long-lived offline agent access (valid for 60 days).',
        feature: 'Offline Refresh Token',
        reviewImplication: 'Standard for automated agents',
      },
    ],
    blockers: [
      {
        symptom: 'Cannot connect 6th organisation; error "Organization limit reached"',
        checks: ['Count currently connected active organisations in Xero Developer Portal.'],
        explanationOrHypothesis: 'Uncertified Xero applications are strictly capped at 5 active organisation connections.',
        nextAction: 'Disconnect an inactive test organisation or apply for Xero App Store Partner Certification.',
        humanHandoff: 'Product team submits certification application to Xero.',
      },
      {
        symptom: 'API call returns 400 or "xero-tenant-id header missing"',
        checks: ['Verify the authorized tenant ID was retrieved from https://api.xero.com/connections.'],
        explanationOrHypothesis: 'Xero requires passing the xero-tenant-id header with every API call.',
        nextAction: 'Ensure integration stores and includes the tenant ID corresponding to the authorized organisation.',
        humanHandoff: 'Developer configures tenant header.',
      },
    ],
    externalWaitingEstimate: 'Unknown - Xero App Store certification review times are variable and depend on partner queue and security audit.',
    developerEffortEstimate: '2–3 hours for portal setup, PKCE redirect configuration, and tenant-selection handling.',
  },

  docusign: {
    providerName: 'DocuSign',
    slug: 'docusign',
    canonicalWebsite: 'https://docusign.com',
    developerPortalUrl: 'https://admindemo.docusign.com',
    officialDocSources: [
      {
        title: 'DocuSign Go-Live Process Guide',
        url: 'https://developers.docusign.com/platform/go-live/',
        summary: 'Official guide covering modern go-live verification. Note: Modern go-live does NOT require a universal 20-call rule; eligible developer accounts receive automatic review or submitted review.',
      },
      {
        title: 'DocuSign Partner Program for Public Integrations',
        url: 'https://partners.docusign.com',
        summary: 'Requirements for public multi-tenant SaaS applications and ISVs distributing to external DocuSign customers.',
      },
      {
        title: 'DocuSign OAuth 2.0 Authentication',
        url: 'https://developers.docusign.com/platform/auth/',
        summary: 'Authorization Code Grant and JWT Grant flows for DocuSign eSignature REST API.',
      },
    ],
    keyFacts: {
      appRegistration: 'Self-service registration in DocuSign Developer Demo Sandbox (admindemo.docusign.com). Integration Key (Client ID) generated instantly.',
      apiProductAccessApproval: 'Developer Demo Sandbox is completely free with full eSignature features. Go-Live review promotes the Integration Key to production accounts.',
      providerVerification: 'Modern go-live does NOT mandate a universal 20-call requirement. Standard eligible enterprise/business accounts can undergo automatic go-live approval or fast-track review. Public multi-customer SaaS integrations require joining the DocuSign Partner Program.',
      marketplaceDistribution: 'Listing on DocuSign Partner Directory requires DocuSign Partner Program membership.',
      customerAdminApproval: 'Enterprise account administrators can manage integration keys and grant organization-wide administrative consent.',
      endUserConsent: 'DocuSign consent screen prompts users to authorize the integration to access envelopes and documents.',
    },
    startingPathRule: {
      singlePlayerOrQuotaRule: 'Testing is unlimited in free Developer Demo Sandbox. Go-Live review is required to promote the Integration Key to live production DocuSign accounts.',
      quotaModesOrTiers: 'Developer Sandbox (Free, unmetered testing) -> Production Go-Live (Automatic or reviewed depending on account plan; Public ISV SaaS requires DocuSign Partner Program).',
      managedAuthNote: 'Configure owned DocuSign Integration Key and Secret in Composio custom auth or direct OAuth integration.',
    },
    recommendedScopes: [
      {
        permission: 'signature',
        whyNeeded: 'Basic eSignature REST API access for creating and sending envelopes.',
        feature: 'eSignature Operations',
        reviewImplication: 'Core eSignature scope',
      },
      {
        permission: 'extended',
        whyNeeded: 'Receive long-lived refresh tokens for background agent automation.',
        feature: 'Offline Refresh Access',
        reviewImplication: 'Standard',
      },
      {
        permission: 'impersonation',
        whyNeeded: 'Required ONLY for JWT Grant service authentication to act on behalf of a designated user.',
        feature: 'Service Account JWT Impersonation',
        reviewImplication: 'Sensitive - requires admin consent',
      },
    ],
    blockers: [
      {
        symptom: 'Integration Key works in demo but returns 401/404 in production',
        checks: ['Confirm Go-Live review was completed and Integration Key was promoted to production.'],
        explanationOrHypothesis: 'DocuSign Integration Keys exist in demo until explicitly promoted via the Go-Live process to a target production account.',
        nextAction: 'Execute Go-Live in the developer demo portal and select your live production DocuSign account.',
        humanHandoff: 'Developer initiates Go-Live from developer demo dashboard.',
      },
      {
        symptom: 'Public external customers cannot connect to internal production key',
        checks: ['Verify if the app was configured for ISV multi-tenant distribution under the Partner Program.'],
        explanationOrHypothesis: 'Standard go-live binds the integration key to the owner production account. Distributing across independent third-party customer accounts requires partner registration.',
        nextAction: 'Join the DocuSign Partner Program for commercial ISV distribution.',
        humanHandoff: 'Partnerships team enrolls in DocuSign Partner Program.',
      },
    ],
    externalWaitingEstimate: 'Unknown - Automatic go-live is immediate for eligible accounts; DocuSign Partner Program review timeline is queue-dependent and undocumented.',
    developerEffortEstimate: '2–3 hours for sandbox testing, redirect setup, and go-live submission.',
  },

  mastodon: {
    providerName: 'Mastodon',
    slug: 'mastodon',
    canonicalWebsite: 'https://joinmastodon.org',
    developerPortalUrl: 'https://docs.joinmastodon.org',
    officialDocSources: [
      {
        title: 'Mastodon OAuth 2.0 Specification',
        url: 'https://docs.joinmastodon.org/spec/oauth/',
        summary: 'Decentralized OAuth 2.0 implementation. OAuth endpoints are hosted independently per instance (e.g. https://<instance>/oauth/authorize).',
      },
      {
        title: 'Mastodon Dynamic Client Registration API',
        url: 'https://docs.joinmastodon.org/methods/apps/',
        summary: 'POST /api/v1/apps allows automatic, instant registration of an OAuth client on any target Mastodon instance without human review.',
      },
    ],
    keyFacts: {
      appRegistration: 'Dynamic Client Registration via POST /api/v1/apps on each user target instance domain, or manual creation in instance User Settings -> Development.',
      apiProductAccessApproval: 'Instant self-service registration per instance. No centralized approval authority.',
      providerVerification: 'No universal verification. Each Mastodon instance is autonomously operated; administrators set local server rules.',
      marketplaceDistribution: 'No central marketplace; decentralized fediverse ecosystem.',
      customerAdminApproval: 'Server admins may throttle or block abusive client applications, but standard users authorize directly.',
      endUserConsent: 'End user authenticates against their specific instance (e.g. mastodon.social) and grants requested scopes.',
    },
    startingPathRule: {
      singlePlayerOrQuotaRule: 'Mastodon OAuth is decentralized and PER INSTANCE. Each Mastodon instance has its own OAuth endpoints. Apps can dynamically register via POST /api/v1/apps to obtain credentials instantly.',
      quotaModesOrTiers: 'Decentralized per instance. Standard rate limit is typically 300 requests per 5 minutes per user token, configured by instance admin.',
      managedAuthNote: 'Composio does not have a central Mastodon managed OAuth app because instances are federated. Register per instance dynamically or manually.',
    },
    recommendedScopes: [
      {
        permission: 'read',
        whyNeeded: 'Read user timeline, statuses, bookmarks, notifications, and profile data.',
        feature: 'Timeline & Profile Read',
        reviewImplication: 'Instant / Standard',
      },
      {
        permission: 'write',
        whyNeeded: 'Publish posts (toots), upload media attachments, and manage interactions.',
        feature: 'Status Publishing',
        reviewImplication: 'Instant / Standard',
      },
      {
        permission: 'follow',
        whyNeeded: 'Follow, unfollow, block, and mute accounts.',
        feature: 'Relationship Management',
        reviewImplication: 'Instant / Standard',
      },
    ],
    blockers: [
      {
        symptom: 'OAuth endpoints fail or return 404',
        checks: ['Verify the customer entered their full instance domain (e.g. mastodon.social, not joinmastodon.org).'],
        explanationOrHypothesis: 'Mastodon OAuth endpoints are located on the specific server instance where the user account resides.',
        nextAction: 'Prompt the user to specify their instance hostname before initiating the OAuth flow.',
        humanHandoff: 'User provides instance URL.',
      },
    ],
    externalWaitingEstimate: 'Zero waiting (instant dynamic client registration per instance).',
    developerEffortEstimate: '1–2 hours for dynamic client registration and instance URL handling.',
  },
};

export function getProviderGrounding(providerInput: string): ProviderGrounding | null {
  const clean = providerInput.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [key, grounding] of Object.entries(KNOWN_PROVIDER_GROUNDINGS)) {
    if (clean.includes(key) || grounding.providerName.toLowerCase().includes(clean)) {
      return grounding;
    }
  }
  return null;
}
