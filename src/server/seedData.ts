import { Guide, NextStepPack } from './types.js';

export const SEED_GUIDES: Guide[] = [
  {
    id: 'airtable-guide-v1',
    slug: 'airtable',
    version: 1,
    providerName: 'Airtable',
    providerWebsite: 'https://airtable.com',
    exampleUseCase: 'AI sales/ops agent reading Airtable customer bases and creating synced CRM records',
    composioToolkitMatch: {
      found: true,
      slug: 'airtable',
      name: 'Airtable Toolkit',
      docUrl: 'https://docs.composio.dev/toolkits/airtable',
      managedAuthAvailable: 'available',
      relevantAuthMethod: 'OAuth 2.0 (Authorization Code with PKCE)',
      metadataStatus: 'documentation_checked',
      limitationsDocumented: [
        'Composio-managed OAuth displays Composio branding on the Airtable OAuth consent screen.',
        'Users explicitly authorize specific bases or entire workspaces during OAuth consent.',
        'Token refresh is handled automatically by Composio, but Airtable refresh tokens expire if unused for 60 days.',
      ],
      supportedActionsSummary: [
        'airtable_create_record',
        'airtable_get_record',
        'airtable_update_record',
        'airtable_list_records',
      ],
      customAuthDocUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
    },
    useCaseFit: 'supported_by_evidence',
    pathAssessment: {
      startingPath: 'composio_managed_suitable',
      headline: 'Composio-managed OAuth appears suitable for development and initial rollout',
      why: 'Airtable does not require a formal provider security audit for private OAuth integrations. Composio provides a managed OAuth app supporting standard record read/write operations. Unless your customers require custom consent-screen branding or enterprise single-tenant lockdown, managed OAuth saves setup overhead.',
      assumptions: {
        intendedActions: 'Read customer Airtable bases and sync CRM records into tables',
        audience: 'external_customers',
        customBrandingRequired: false,
        alreadyHasApp: false,
        specialNotes: 'Standard base record operations without enterprise single-tenant lockdown',
      },
      canStartTesting: {
        status: 'yes',
        note: 'You can connect Airtable via Composio CLI or Dashboard without registering an Airtable Developer app.',
      },
      whatCouldBlockLaunch: 'Customer administrators who restrict third-party integrations to approved OAuth client IDs or require custom enterprise branding.',
      developerEffort: '15–30 minutes with Managed OAuth; 1–2 hours if registering an owned Airtable OAuth integration.',
      externalWaiting: 'Zero waiting for unlisted private integrations. Airtable does not require an approval queue for unlisted apps.',
      myNextAction: 'Test connection in Composio with a test base; if your customers mandate your own brand name on the consent prompt, register an owned OAuth integration in Airtable Developer Hub.',
      limitations: [
        'End users see "Composio" as the requesting application on the Airtable authorization screen.',
        'Scopes cannot be extended beyond what Composio’s managed app was registered with.',
        'Users must re-authorize if they want to grant access to newly created bases created after initial OAuth consent.',
      ],
    },
    prerequisites: [
      {
        category: 'Airtable Accounts & Roles',
        items: [
          'Airtable account with access to the target workspace or base (Creator or Editor permissions needed for writes).',
          'For owned apps: Access to Airtable Developer Hub (https://airtable.com/create/oauth).',
        ],
      },
      {
        category: 'Composio Setup',
        items: [
          'Composio API Key and active project.',
          'For owned apps: Composio custom integration entry configured with Client ID & Client Secret.',
        ],
      },
      {
        category: 'URLs & Assets (Only for Owned App)',
        items: [
          'Redirect URI supplied by your Composio auth configuration.',
          'Application Name, Logo (PNG/JPEG), and optional Privacy Policy URL.',
        ],
      },
    ],
    permissionsTable: [
      {
        feature: 'Read base records and table metadata',
        permission: 'data.records:read',
        whyNeeded: 'Required for AI agent to inspect customer records and query data.',
        providerProductRequirement: 'Standard Airtable Web API scope',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-airtable-official-scopes'],
        uncertainty: 'None. Standard OAuth2 scope supported by Airtable and Composio.',
      },
      {
        feature: 'Create or update records in tables',
        permission: 'data.records:write',
        whyNeeded: 'Required for AI agent to write CRM records or update existing rows.',
        providerProductRequirement: 'Standard Airtable Web API scope',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-airtable-official-scopes'],
        uncertainty: 'None.',
      },
      {
        feature: 'Inspect base schema & column definitions',
        permission: 'schema.bases:read',
        whyNeeded: 'Needed if agent dynamically discovers table structures and field IDs.',
        providerProductRequirement: 'Schema API scope',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-airtable-official-scopes'],
        uncertainty: 'Confirm if your agent relies on fixed known field IDs or inspects schema dynamically.',
      },
    ],
    setupChecklist: [
      {
        id: 'at-step-1',
        action: 'Choose auth method in Composio (Managed vs Owned)',
        owner: 'developer',
        prerequisites: ['Active Composio account'],
        completionCondition: 'Decided whether white-label consent screen is required for Day 1.',
        sourceIds: ['src-composio-managed-auth'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Product decision' },
        phase: 'composio_prep',
        details: 'If managed OAuth is acceptable, skip directly to step 4.',
      },
      {
        id: 'at-step-2',
        action: 'Register OAuth Integration in Airtable Developer Hub',
        owner: 'developer',
        prerequisites: ['Airtable account'],
        completionCondition: 'Received Client ID and Client Secret from Airtable Developer Hub.',
        sourceIds: ['src-airtable-dev-hub'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '15 min', basis: 'Developer self-service form' },
        phase: 'provider_registration',
        details: 'Go to https://airtable.com/create/oauth. Click "Register new OAuth integration". Fill in Name, Logo, and Redirect URI.',
      },
      {
        id: 'at-step-3',
        action: 'Configure Composio Redirect URI & Configure Scopes',
        owner: 'developer',
        prerequisites: ['Airtable OAuth integration created'],
        completionCondition: 'Redirect URI from Composio saved and scopes selected.',
        sourceIds: ['src-airtable-dev-hub', 'src-composio-custom-auth'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Configuration step' },
        phase: 'access_configuration',
        details: 'Copy the Redirect URI displayed in your Composio dashboard under Settings > Integrations > Airtable > Custom App, and add data.records:read and data.records:write.',
      },
      {
        id: 'at-step-4',
        action: 'Configure Custom Auth in Composio Dashboard',
        owner: 'developer',
        prerequisites: ['Airtable Client ID & Secret'],
        completionCondition: 'Custom integration configured under Composio Integrations > Airtable.',
        sourceIds: ['src-composio-custom-auth'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Dashboard field entry' },
        phase: 'access_configuration',
        details: 'Enter Client ID and Secret in Composio custom auth settings if using an owned app.',
      },
      {
        id: 'at-step-5',
        action: 'Initiate Test OAuth Connection & Select Test Base',
        owner: 'developer',
        prerequisites: ['Auth configured in Composio'],
        completionCondition: 'Successfully completed OAuth handshake and received connected account ID.',
        sourceIds: ['src-composio-airtable-toolkit'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Interactive browser consent flow' },
        phase: 'testing_and_launch',
        details: 'Authenticate with your personal or sandbox Airtable account. Explicitly grant access to a test base.',
      },
      {
        id: 'at-step-6',
        action: 'Execute Test Record Read and Write through Agent',
        owner: 'developer',
        prerequisites: ['Connected account established'],
        completionCondition: 'Agent successfully executes airtable_list_records and airtable_create_record.',
        sourceIds: ['src-composio-airtable-toolkit'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '15 min', basis: 'API execution check' },
        phase: 'testing_and_launch',
        details: 'Verify that write operations succeed on the specific base granted during OAuth.',
      },
    ],
    approvalAndDistribution: {
      appRegistration: 'Self-service in Airtable Developer Hub (https://airtable.com/create/oauth). Instant.',
      apiProductAccessApproval: 'Not applicable. Web API scopes are accessible immediately upon registration.',
      providerVerification: 'None required for private third-party integrations. Airtable does not impose an app verification review queue for unlisted integrations.',
      marketplaceDistribution: 'Only required if applying to the public Airtable Marketplace. For AI agent integrations connecting customer accounts, standard unlisted OAuth is standard practice.',
      customerAdminApproval: 'Enterprise Airtable workspaces may have third-party integration restrictions managed by Airtable Admins.',
      endUserConsent: 'User sees consent prompt where they pick either specific bases or all current and future bases.',
    },
    blockersAndRecovery: [
      {
        symptom: 'Agent receives 404 NOT_FOUND or 403 INVALID_PERMISSIONS when querying a base table.',
        checks: [
          'Verify if the user authorized this specific base during the OAuth consent screen.',
          'Check whether the Airtable user account has Creator or Editor permissions on the table.',
        ],
        explanationOrHypothesis: 'Airtable OAuth grants are scoped to individual bases or workspaces selected at authorization time. If a user creates a new base later, it is NOT automatically accessible.',
        isHypothesis: false,
        nextAction: 'Prompt the user to re-authorize the connection and select the new base, or grant access at the workspace level.',
        humanHandoff: 'Ask the customer to open their Airtable account settings > Third-party integrations to confirm granted bases.',
      },
      {
        symptom: 'OAuth authorization succeeds, but token refresh fails after 60 days.',
        checks: ['Inspect token refresh log in Composio'],
        explanationOrHypothesis: 'Airtable refresh tokens expire after 60 days of inactivity. If the AI agent does not execute any actions for 60 days, re-authentication is mandatory.',
        isHypothesis: false,
        nextAction: 'Implement an automatic reconnect prompt in your AI agent when an Airtable invalid_grant error is detected.',
        humanHandoff: 'Send reconnection email or in-app notification to the customer.',
      },
    ],
    evidenceAndUnknowns: {
      composioDocs: [
        'Composio Airtable Toolkit: https://docs.composio.dev/toolkits/airtable',
        'Composio Managed Auth Guide: https://docs.composio.dev/toolkits/managed-auth',
        'Custom App vs Managed App: https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
      ],
      providerDocs: [
        'Airtable Web API OAuth reference: https://airtable.com/developers/web/api/oauth-reference',
        'Airtable Scopes Documentation: https://airtable.com/developers/web/api/scopes',
      ],
      metadataApiObservations: [
        'Composio documentation confirms OAuth 2.0 with PKCE support for Airtable.',
      ],
      communityReports: [],
      estimates: [
        '15–30 min setup time based on standard developer console form completion.',
      ],
      setupAttempts: [],
      unresolvedAssumptions: [
        'Whether target customer workspaces enforce enterprise-level third-party integration blocklists.',
      ],
    },
    sources: [
      {
        id: 'src-composio-airtable-toolkit',
        title: 'Composio Airtable Toolkit Documentation',
        canonicalUrl: 'https://docs.composio.dev/toolkits/airtable',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Details actions, authentication methods, and setup guides for Airtable in Composio.',
      },
      {
        id: 'src-composio-managed-auth',
        title: 'Composio Managed Authentication Overview',
        canonicalUrl: 'https://docs.composio.dev/toolkits/managed-auth',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Explains when managed OAuth is available and when custom apps are advised.',
      },
      {
        id: 'src-composio-custom-auth',
        title: 'Composio Custom App vs Managed App',
        canonicalUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Guides configuring custom client credentials and redirect URIs in Composio.',
      },
      {
        id: 'src-airtable-official-scopes',
        title: 'Airtable Web API Scopes Reference',
        canonicalUrl: 'https://airtable.com/developers/web/api/scopes',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Official listing of Airtable OAuth scopes, granularities, and resource permissions.',
      },
      {
        id: 'src-airtable-dev-hub',
        title: 'Airtable Developer Hub OAuth Registration',
        canonicalUrl: 'https://airtable.com/create/oauth',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Developer portal for creating OAuth clients, managing redirect URIs, and generating credentials.',
      },
    ],
    claims: [
      {
        id: 'cl-at-1',
        statement: 'Airtable private OAuth integrations do not require an app review or provider approval queue.',
        applicability: 'All developers creating custom OAuth apps for customer connection.',
        sourceIds: ['src-airtable-official-scopes', 'src-airtable-dev-hub'],
        evidenceClass: 'provider_documentation',
      },
      {
        id: 'cl-at-2',
        statement: 'Composio provides a managed OAuth app for Airtable supporting standard record read/write actions.',
        applicability: 'Developers using Composio toolkit "airtable".',
        sourceIds: ['src-composio-airtable-toolkit', 'src-composio-managed-auth'],
        evidenceClass: 'composio_documentation',
      },
      {
        id: 'cl-at-3',
        statement: 'Airtable OAuth tokens use granular resource-level authorization where users pick permitted bases.',
        applicability: 'End-user connection flows.',
        sourceIds: ['src-airtable-official-scopes'],
        evidenceClass: 'provider_documentation',
      },
    ],
    updatedAt: '2026-10-20T01:00:00Z',
    createdAt: '2026-10-20T01:00:00Z',
  },
  {
    id: 'linkedin-guide-v1',
    slug: 'linkedin',
    version: 1,
    providerName: 'LinkedIn',
    providerWebsite: 'https://linkedin.com',
    exampleUseCase: 'AI marketing/sales assistant sharing posts and analyzing engagement on LinkedIn',
    composioToolkitMatch: {
      found: true,
      slug: 'linkedin',
      name: 'LinkedIn Toolkit',
      docUrl: 'https://docs.composio.dev/toolkits/linkedin',
      managedAuthAvailable: 'available',
      relevantAuthMethod: 'OAuth 2.0 (3-legged OAuth)',
      metadataStatus: 'documentation_checked',
      limitationsDocumented: [
        'Composio documentation explicitly advises registering an owned LinkedIn OAuth app for production to avoid shared rate limit exhaustion.',
        'Composio managed app supports personal profile sharing (w_member_social), but Company Page posting requires Community Management API permissions which require organization approval.',
        'Owning an OAuth app does not bypass provider review: company page posting still requires LinkedIn Community Management API partner approval.',
      ],
      supportedActionsSummary: [
        'linkedin_create_post',
        'linkedin_get_my_profile',
        'linkedin_get_organization_posts',
      ],
      customAuthDocUrl: 'https://composio.dev/auth/linkedin',
    },
    useCaseFit: 'limitation_found',
    pathAssessment: {
      startingPath: 'register_owned_app',
      headline: 'Register your own LinkedIn OAuth App (Recommended for Production & High Volume)',
      why: 'While Composio provides managed OAuth for LinkedIn sandbox testing, Composio official documentation explicitly advises creating your own LinkedIn app for production workloads. Why? All users of the managed app share LinkedIn API rate limits, which can throttle your production traffic. Second, posting on behalf of company pages requires LinkedIn Developer Portal "Company Page" association and Community Management API product approval, which an owned app does not bypass.',
      assumptions: {
        intendedActions: 'Publish social updates on personal profiles and manage organization posts',
        audience: 'external_customers',
        customBrandingRequired: true,
        alreadyHasApp: false,
        specialNotes: 'Shared rate limits on managed app represent a production launch risk.',
      },
      canStartTesting: {
        status: 'yes',
        note: 'You can test personal sharing in development with Composio managed OAuth, but switch to an owned app before launching to customers.',
      },
      whatCouldBlockLaunch: 'Rate limiting on the shared managed app; rejection of Company Page management product access if your LinkedIn Page is unverified.',
      developerEffort: '1–2 hours for owned app registration and product request in LinkedIn Developer Portal.',
      externalWaiting: 'Self-serve immediate for personal sharing products ("Share on LinkedIn"). Partner review timelines for "Community Management API" vary based on business evaluation.',
      myNextAction: 'Register an application in the LinkedIn Developer Portal, add the "Share on LinkedIn" product, and associate your official company LinkedIn page.',
      limitations: [
        'LinkedIn strictly restricts access to messages and connection requests to certified enterprise partners.',
        'Post creation on company pages requires the authenticated user to be an admin of that company page.',
        'LinkedIn Developer Portal requires an active LinkedIn Company Page to register an app.',
        'An owned OAuth app does NOT bypass provider product approvals for company page management.',
      ],
    },
    prerequisites: [
      {
        category: 'LinkedIn Accounts & Company Page',
        items: [
          'A personal LinkedIn account in good standing.',
          'An active LinkedIn Company Page (mandatory in LinkedIn Developer Portal to link your OAuth app).',
          'Admin privileges on the company page to verify app association.',
        ],
      },
      {
        category: 'Developer Portal Registration',
        items: [
          'Access to https://www.linkedin.com/developers/apps.',
          'App Name, Company Page URL, App Logo (square, 100x100px min), Privacy Policy URL.',
          'Legal Terms of Service URL.',
        ],
      },
      {
        category: 'Composio Custom App Setup',
        items: [
          'Redirect URI: Copy the exact callback URI displayed in your Composio dashboard under Settings > Integrations > LinkedIn > Custom App.',
          'Client ID and Client Secret generated in LinkedIn Developer Portal.',
        ],
      },
    ],
    permissionsTable: [
      {
        feature: 'Publish updates on personal member profile',
        permission: 'w_member_social',
        whyNeeded: 'Enables AI agent to publish posts, articles, and media to personal feed.',
        providerProductRequirement: '"Share on LinkedIn" Product in LinkedIn Developer Portal',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-linkedin-dev-docs', 'src-composio-linkedin-custom'],
        uncertainty: 'Self-serve approval when adding "Share on LinkedIn" product in developer portal.',
      },
      {
        feature: 'Retrieve user basic profile (name, photo, vanity)',
        permission: 'openid, profile, email',
        whyNeeded: 'Identify customer account and link connection ID to customer workspace.',
        providerProductRequirement: '"Sign In with LinkedIn using OpenID Connect" Product',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-linkedin-dev-docs'],
        uncertainty: 'Instant self-serve approval upon product request.',
      },
      {
        feature: 'Publish updates on LinkedIn Company Page',
        permission: 'w_organization_social',
        whyNeeded: 'Required for corporate social media management and brand posting.',
        providerProductRequirement: '"Community Management API" product',
        reviewImplication: 'Partner approval / product application required',
        sourceIds: ['src-linkedin-dev-docs'],
        uncertainty: 'Strict partner approval. Owning an OAuth app does not automatically grant this permission.',
      },
    ],
    setupChecklist: [
      {
        id: 'li-step-1',
        action: 'Create LinkedIn Company Page (if not already existing)',
        owner: 'developer',
        prerequisites: ['Personal LinkedIn account'],
        completionCondition: 'Active Company Page published on LinkedIn.',
        sourceIds: ['src-linkedin-dev-docs'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '15 min', basis: 'LinkedIn standard page creation' },
        phase: 'provider_registration',
        details: 'LinkedIn Developer Portal requires selecting a verified company page for every app.',
      },
      {
        id: 'li-step-2',
        action: 'Register App in LinkedIn Developer Portal',
        owner: 'developer',
        prerequisites: ['Company Page'],
        completionCondition: 'App created with linked Company Page and pending verification link.',
        sourceIds: ['src-linkedin-dev-docs', 'src-composio-linkedin-custom'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '15 min', basis: 'Form submission' },
        phase: 'provider_registration',
        details: 'Go to https://www.linkedin.com/developers/apps/new. Fill details, upload logo, link Company Page.',
      },
      {
        id: 'li-step-3',
        action: 'Verify App Association via Company Page Admin',
        owner: 'developer',
        prerequisites: ['App created in portal'],
        completionCondition: 'Company Page Admin clicks verification link in LinkedIn notification.',
        sourceIds: ['src-linkedin-dev-docs'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Email/portal confirmation' },
        phase: 'provider_registration',
        details: 'Click "Verify" in LinkedIn Developer Portal and confirm the generated verification URL as Page Admin.',
      },
      {
        id: 'li-step-4',
        action: 'Add Required Products in Developer Portal',
        owner: 'developer',
        prerequisites: ['App verified with Company Page'],
        completionCondition: '"Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" enabled.',
        sourceIds: ['src-linkedin-dev-docs'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Self-service product selection' },
        phase: 'access_configuration',
        details: 'Under Products tab, request "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect". Approval is instant self-service.',
      },
      {
        id: 'li-step-5',
        action: 'Configure Composio Callback URI in LinkedIn Auth Tab',
        owner: 'developer',
        prerequisites: ['Products enabled'],
        completionCondition: 'Exact Redirect URI copied from Composio Auth Settings and saved in LinkedIn portal.',
        sourceIds: ['src-composio-linkedin-custom'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Dashboard field entry' },
        phase: 'access_configuration',
        details: 'Copy the Redirect URI displayed in your Composio dashboard under Settings > Integrations > LinkedIn > Custom App, and paste it into Authorized Redirect URLs in your LinkedIn app.',
      },
      {
        id: 'li-step-6',
        action: 'Save Client ID & Secret in Composio Dashboard',
        owner: 'developer',
        prerequisites: ['LinkedIn Client ID & Secret obtained'],
        completionCondition: 'Custom LinkedIn auth configuration active in Composio.',
        sourceIds: ['src-composio-linkedin-custom'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Dashboard field entry' },
        phase: 'composio_prep',
        details: 'Navigate to Composio Settings > Integrations > LinkedIn > Custom App and paste credentials. Select this Auth Config ID in your connection calls.',
      },
      {
        id: 'li-step-7',
        action: 'Execute Test Post on Personal Profile',
        owner: 'developer',
        prerequisites: ['Custom auth connection established'],
        completionCondition: 'Post created and visible on LinkedIn member feed.',
        sourceIds: ['src-composio-linkedin-toolkit'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'API execution check' },
        phase: 'testing_and_launch',
        details: 'Trigger linkedin_create_post and verify that the post shows the correct visibility.',
      },
    ],
    approvalAndDistribution: {
      appRegistration: 'Self-service in LinkedIn Developer Portal (https://www.linkedin.com/developers/apps). Instant.',
      apiProductAccessApproval: '"Share on LinkedIn" product is self-service and approved instantly. "Community Management API" requires formal business verification.',
      providerVerification: 'Company Page admin verification required during app registration. Simple self-administered verification URL.',
      marketplaceDistribution: 'LinkedIn does not operate a general public consumer app store for these integrations; distribution occurs via your own OAuth connect button.',
      customerAdminApproval: 'Not required for personal posts; required if posting to customer LinkedIn Company Pages.',
      endUserConsent: 'Standard LinkedIn OAuth 2.0 consent dialog showing requested permissions and your registered app name and logo.',
    },
    blockersAndRecovery: [
      {
        symptom: 'HTTP 429 Too Many Requests when multiple users trigger agent actions.',
        checks: ['Inspect whether integration is using Composio Managed App or Owned App.'],
        explanationOrHypothesis: 'Composio managed app shares rate limits across all platform developers. Hitting global rate limits blocks your users.',
        isHypothesis: false,
        nextAction: 'Migrate connection to your own LinkedIn OAuth app where your rate limits are dedicated exclusively to your customer base.',
        humanHandoff: 'Register your own app per Composio guide at https://composio.dev/auth/linkedin.',
      },
      {
        symptom: 'Error "Not enough permissions to access: /rest/posts" when posting to a company page.',
        checks: ['Check whether the app has w_organization_social scope', 'Check whether user is an admin of the page.'],
        explanationOrHypothesis: 'w_member_social only permits posting to personal feeds. Company page posting requires w_organization_social which requires LinkedIn Community Management API approval.',
        isHypothesis: false,
        nextAction: 'If company page posting is mandatory, apply for the LinkedIn Community Management API product through the LinkedIn Partner Program.',
        humanHandoff: 'Submit LinkedIn business partner application with demo video.',
      },
    ],
    evidenceAndUnknowns: {
      composioDocs: [
        'Composio LinkedIn Toolkit: https://docs.composio.dev/toolkits/linkedin',
        'Composio LinkedIn Custom Auth Guide: https://composio.dev/auth/linkedin',
      ],
      providerDocs: [
        'LinkedIn Developer Portal: https://www.linkedin.com/developers/',
        'LinkedIn Share on LinkedIn API guide: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin',
      ],
      metadataApiObservations: [
        'Composio documentation confirms OAuth 2.0 with custom app support for LinkedIn.',
      ],
      communityReports: [
        'Composio community confirms shared quota depletion on managed LinkedIn app during peak hours.',
      ],
      estimates: [
        '1–2 hours for owned app setup. Review timeline for Community Management API is variable and subject to partner review.',
      ],
      setupAttempts: [],
      unresolvedAssumptions: [
        'Whether LinkedIn will grant Community Management API access to early-stage products without established commercial history.',
      ],
    },
    sources: [
      {
        id: 'src-composio-linkedin-toolkit',
        title: 'Composio LinkedIn Toolkit Documentation',
        canonicalUrl: 'https://docs.composio.dev/toolkits/linkedin',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Details supported LinkedIn actions and configuration requirements in Composio.',
      },
      {
        id: 'src-composio-linkedin-custom',
        title: 'Composio Custom LinkedIn Setup Guide',
        canonicalUrl: 'https://composio.dev/auth/linkedin',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Explicit Composio advisory recommending owned OAuth apps for production to avoid shared rate limits.',
      },
      {
        id: 'src-linkedin-dev-docs',
        title: 'LinkedIn Developer Portal & Share on LinkedIn',
        canonicalUrl: 'https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Official Microsoft Learn documentation for LinkedIn OAuth 2.0, scopes, and app verification.',
      },
    ],
    claims: [
      {
        id: 'cl-li-1',
        statement: 'Composio documentation advises creating an owned LinkedIn OAuth app for production to avoid shared rate limit bottlenecks.',
        applicability: 'Production deployments of LinkedIn AI agent integrations.',
        sourceIds: ['src-composio-linkedin-custom'],
        evidenceClass: 'composio_documentation',
      },
      {
        id: 'cl-li-2',
        statement: 'Personal feed sharing (w_member_social) is self-serve via "Share on LinkedIn", but Company Page posting requires enterprise partner approval.',
        applicability: 'Feature scoping for personal vs organization posting.',
        sourceIds: ['src-linkedin-dev-docs'],
        evidenceClass: 'provider_documentation',
      },
    ],
    updatedAt: '2026-10-20T01:00:00Z',
    createdAt: '2026-10-20T01:00:00Z',
  },
  {
    id: 'gmail-guide-v1',
    slug: 'gmail',
    version: 1,
    providerName: 'Gmail (Google Workspace)',
    providerWebsite: 'https://mail.google.com',
    exampleUseCase: 'AI sales assistant reading customer inbound emails and composing follow-up drafts',
    composioToolkitMatch: {
      found: true,
      slug: 'gmail',
      name: 'Gmail Toolkit',
      docUrl: 'https://docs.composio.dev/toolkits/gmail',
      managedAuthAvailable: 'available',
      relevantAuthMethod: 'OAuth 2.0 (Google OAuth Authorization Code)',
      metadataStatus: 'documentation_checked',
      limitationsDocumented: [
        'Composio-managed OAuth app can be used to connect user accounts according to Composio documentation.',
        'Developers require an owned Google Cloud OAuth client if they need custom consent-screen branding or organization-internal restrictions.',
        'Official Google documentation classifies both reading (gmail.readonly) and drafting/sending (gmail.compose, gmail.send) as Restricted Scopes.',
      ],
      supportedActionsSummary: [
        'gmail_fetch_emails',
        'gmail_send_email',
        'gmail_create_draft',
        'gmail_list_messages',
      ],
      customAuthDocUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
    },
    useCaseFit: 'limitation_found',
    pathAssessment: {
      startingPath: 'register_owned_app',
      headline: 'Register your own Google Cloud OAuth Client (Required for Custom Branding & Restricted Scopes)',
      why: 'While you can use Composio managed OAuth for initial integration testing, launching external customer connections under your own brand requires registering an owned Google Cloud OAuth client. Note that official Google API policies classify both gmail.readonly and gmail.compose as RESTRICTED SCOPES. External customer access to restricted scopes requires Google OAuth App Verification and an independent Cloud Application Security Assessment (CASA Tier 2). However, if your application is strictly internal to your own Google Workspace domain ("Internal" user type), verification and CASA are completely bypassed.',
      assumptions: {
        intendedActions: 'Read customer Gmail threads, detect leads, and compose draft replies',
        audience: 'external_customers',
        customBrandingRequired: true,
        alreadyHasApp: false,
        specialNotes: 'External customers require public app verification and CASA security assessment.',
      },
      canStartTesting: {
        status: 'yes',
        note: 'You can test in development using Composio managed auth or a Google Cloud client in "Testing" mode (with explicitly added test accounts).',
      },
      whatCouldBlockLaunch: 'Google OAuth Verification rejection; CASA Tier 2 security audit failures; unknown security assessor costs; variable review turnaround times.',
      developerEffort: '2–4 hours for Google Cloud project setup, consent screen configuration, and demo video recording; remediation time depends on security scan findings.',
      externalWaiting: 'Timelines vary widely by Google reviewer queue and third-party security assessor workload; exact turnaround is unknown until submitted.',
      myNextAction: 'Create a Google Cloud project, configure OAuth Consent Screen, copy the Redirect URI from Composio custom auth settings, and prepare verification materials.',
      limitations: [
        'Unverified apps display the "Google hasn\'t verified this app" warning screen.',
        'Google Cloud projects in "Testing" mode have a cap of 100 explicitly added test users before blocking authorization.',
        'Both gmail.readonly and gmail.compose are Restricted Scopes requiring security assessment for external production use.',
      ],
    },
    prerequisites: [
      {
        category: 'Google Accounts & Cloud Console',
        items: [
          'Google Cloud Console account with billing enabled (recommended for quota).',
          'A Google Workspace domain with verified website ownership in Google Search Console.',
          'Publicly accessible Privacy Policy and Terms of Service URLs hosted on your verified domain.',
        ],
      },
      {
        category: 'Verification Materials',
        items: [
          'A dedicated YouTube demo video showing the OAuth grant screen, client ID in URL bar, and the specific agent feature using Gmail data.',
          'Detailed written justification for each requested Gmail scope.',
          'CASA Tier 2 compliance readiness (secure secret handling, TLS 1.3, SAST scan results).',
        ],
      },
      {
        category: 'Composio Integration',
        items: [
          'Redirect URI: Copy from your Composio auth configuration dashboard under Settings > Integrations > Gmail > Custom App.',
          'Google OAuth Client ID & Secret configured in Composio custom app settings.',
        ],
      },
    ],
    permissionsTable: [
      {
        feature: 'Read customer emails and message threads',
        permission: 'https://www.googleapis.com/auth/gmail.readonly',
        whyNeeded: 'AI agent needs to analyze incoming sales emails and customer queries.',
        providerProductRequirement: 'Google Workspace Gmail API',
        reviewImplication: 'Restricted scope / security audit (CASA)',
        sourceIds: ['src-google-gmail-scopes', 'src-google-restricted-scopes'],
        uncertainty: 'Restricted scope. Requires CASA Tier 2 security assessment for external production users.',
      },
      {
        feature: 'Compose and save draft email replies',
        permission: 'https://www.googleapis.com/auth/gmail.compose',
        whyNeeded: 'Draft follow-ups for user review without sending autonomously.',
        providerProductRequirement: 'Google Workspace Gmail API',
        reviewImplication: 'Restricted scope / security audit (CASA)',
        sourceIds: ['src-google-gmail-scopes', 'src-google-restricted-scopes'],
        uncertainty: 'Restricted scope per Google official documentation. Subject to restricted scope verification.',
      },
      {
        feature: 'Send emails autonomously on behalf of user',
        permission: 'https://www.googleapis.com/auth/gmail.send',
        whyNeeded: 'Direct autonomous sending of cold emails or approved responses.',
        providerProductRequirement: 'Google Workspace Gmail API',
        reviewImplication: 'Sensitive scope / verification required',
        sourceIds: ['src-google-gmail-scopes', 'src-google-sensitive-scopes'],
        uncertainty: 'Sensitive scope. Requires Google OAuth verification and demo video.',
      },
      {
        feature: 'Read basic profile and email address',
        permission: 'openid, email, profile',
        whyNeeded: 'Associate connected inbox with developer customer account.',
        providerProductRequirement: 'Google Identity',
        reviewImplication: 'Non-sensitive / instant',
        sourceIds: ['src-google-gmail-scopes'],
        uncertainty: 'None. Standard non-sensitive identity scopes.',
      },
    ],
    setupChecklist: [
      {
        id: 'gm-step-1',
        action: 'Audit Required Scopes against Google Restricted Scope Policy',
        owner: 'developer',
        prerequisites: ['Product feature spec'],
        completionCondition: 'Identified all requested Gmail scopes and confirmed restricted status of gmail.readonly and gmail.compose.',
        sourceIds: ['src-google-restricted-scopes', 'src-google-gmail-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '30 min', basis: 'Policy review' },
        phase: 'composio_prep',
        details: 'Review official Google Workspace Gmail API Scopes documentation: both reading and drafting are Restricted Scopes.',
      },
      {
        id: 'gm-step-2',
        action: 'Create Google Cloud Project & Enable Gmail API',
        owner: 'developer',
        prerequisites: ['Google Cloud account'],
        completionCondition: 'Google Cloud Project active and Gmail API enabled in API Library.',
        sourceIds: ['src-google-gmail-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '15 min', basis: 'Console navigation' },
        phase: 'provider_registration',
        details: 'Go to https://console.cloud.google.com/. Create new project. In APIs & Services, search and enable Gmail API.',
      },
      {
        id: 'gm-step-3',
        action: 'Configure OAuth Consent Screen in "Testing" Mode',
        owner: 'developer',
        prerequisites: ['Google Cloud Project'],
        completionCondition: 'App Name, User Support Email, Logo, and Authorized Domains saved.',
        sourceIds: ['src-google-sensitive-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '30 min', basis: 'Form completion' },
        phase: 'provider_registration',
        details: 'Set User Type to "External". Enter App Name, Support Email, and your Privacy Policy URL. Keep publishing status in "Testing" for initial development.',
      },
      {
        id: 'gm-step-4',
        action: 'Add Test Users (For Owned App Testing Status)',
        owner: 'developer',
        prerequisites: ['Testing mode enabled'],
        completionCondition: 'Developer and QA Google accounts listed under Test Users in Google Cloud Console.',
        sourceIds: ['src-google-sensitive-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Email entry' },
        phase: 'access_configuration',
        details: 'When an owned Google Cloud app is in "Testing" mode, up to 100 explicitly added test users can authorize without an unverified app block.',
      },
      {
        id: 'gm-step-5',
        action: 'Create OAuth 2.0 Client ID with Composio Redirect URI',
        owner: 'developer',
        prerequisites: ['Consent screen configured'],
        completionCondition: 'Client ID and Secret created with Composio redirect URI added.',
        sourceIds: ['src-composio-custom-auth'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '10 min', basis: 'Credential creation' },
        phase: 'access_configuration',
        details: 'Copy the Redirect URI displayed in your Composio dashboard under Settings > Integrations > Gmail > Custom App, and add it to Authorized Redirect URIs in Google Cloud Console.',
      },
      {
        id: 'gm-step-6',
        action: 'Configure Custom Google App in Composio',
        owner: 'developer',
        prerequisites: ['Google Client ID & Secret'],
        completionCondition: 'Credentials linked in Composio dashboard and Auth Config ID referenced in app.',
        sourceIds: ['src-composio-custom-auth'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '5 min', basis: 'Composio dashboard entry' },
        phase: 'composio_prep',
        details: 'Enter Client ID and Secret in Composio custom integration for Gmail.',
      },
      {
        id: 'gm-step-7',
        action: 'Verify Domain Ownership in Google Search Console',
        owner: 'developer',
        prerequisites: ['Domain DNS access'],
        completionCondition: 'Domain verified under the same Google account managing the Cloud Project.',
        sourceIds: ['src-google-sensitive-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '20 min', basis: 'DNS TXT record propagation' },
        phase: 'verification_and_review',
        details: 'Google mandates domain verification in Search Console before submitting for verification.',
      },
      {
        id: 'gm-step-8',
        action: 'Record YouTube Demo Walkthrough Video',
        owner: 'developer',
        prerequisites: ['Working test connection'],
        completionCondition: 'Unlisted YouTube video showing URL bar with Client ID and OAuth flow.',
        sourceIds: ['src-google-sensitive-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: '1–2 hours', basis: 'Screen recording and demonstration' },
        phase: 'verification_and_review',
        details: 'The demo video must clearly show the Google OAuth consent screen, display the browser address bar with your Client ID legible, and demonstrate how the agent uses Gmail data.',
      },
      {
        id: 'gm-step-9',
        action: 'Submit App for Google Verification & Security Assessment',
        owner: 'developer',
        prerequisites: ['Demo video', 'Verified domain', 'Privacy Policy'],
        completionCondition: 'Submission received by Google Trust & Safety.',
        sourceIds: ['src-google-restricted-scopes'],
        evidenceStatus: 'source_backed',
        estimate: { duration: 'Unknown', basis: 'Queue latency and security assessor schedule' },
        phase: 'verification_and_review',
        details: 'Submit verification form in Google Cloud Console. For restricted scopes, Google will direct you to complete a CASA Tier 2 assessment via an authorized security assessor.',
      },
    ],
    approvalAndDistribution: {
      appRegistration: 'Self-service in Google Cloud Console (https://console.cloud.google.com). Instant.',
      apiProductAccessApproval: 'Gmail API must be enabled in API Library. Instant.',
      providerVerification: 'Mandatory for external users on owned apps. Unverified owned apps show a warning screen.',
      marketplaceDistribution: 'Optional Google Workspace Marketplace listing. Not required for standard web OAuth authorization.',
      customerAdminApproval: 'Google Workspace domain admins can restrict third-party apps by client ID.',
      endUserConsent: 'Google OAuth consent screen showing scopes and developer branding once verified.',
    },
    blockersAndRecovery: [
      {
        symptom: 'End users see "Google hasn\'t verified this app" warning screen.',
        checks: ['Check publishing status in Google Cloud Console OAuth consent screen.'],
        explanationOrHypothesis: 'Owned apps in "Testing" mode or unverified status display this warning to protect users from phishing. Users can click "Advanced" > "Go to app (unsafe)" to bypass during development.',
        isHypothesis: false,
        nextAction: 'Complete Google OAuth Verification. If still in development, add the user\'s email to the "Test Users" list.',
        humanHandoff: 'Developer manages test user list in Google Cloud Console or completes verification.',
      },
      {
        symptom: 'Google Trust & Safety rejects verification submission citing "Video does not show Client ID".',
        checks: ['Inspect YouTube demo video submitted to Google.'],
        explanationOrHypothesis: 'Google reviewers strictly require the full browser address bar containing the client_id parameter to be clearly legible in the demo video.',
        isHypothesis: false,
        nextAction: 'Re-record the demo video, zooming in on the browser address bar during the OAuth prompt to show client_id=YOUR_CLIENT_ID, then re-submit.',
        humanHandoff: 'Developer re-records and updates submission.',
      },
    ],
    evidenceAndUnknowns: {
      composioDocs: [
        'Composio Gmail Toolkit: https://docs.composio.dev/toolkits/gmail',
        'Composio Custom App Guide: https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
      ],
      providerDocs: [
        'Google OAuth 2.0 Scopes for Google APIs: https://developers.google.com/identity/protocols/oauth2/scopes',
        'Google Gmail API Scopes: https://developers.google.com/workspace/gmail/api/auth/scopes',
        'Google Sensitive Scope Verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification',
        'Google Restricted Scope Verification & CASA: https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification',
      ],
      metadataApiObservations: [
        'Composio documentation confirms OAuth2 and custom app support for Gmail.',
      ],
      communityReports: [
        'Developer community reports on CASA Tier 2 assessment journeys and documentation expectations.',
      ],
      estimates: [
        'Setup: 1–2 hours. Full verification turnaround: unknown / variable.',
      ],
      setupAttempts: [],
      unresolvedAssumptions: [
        'Exact third-party CASA Tier 2 assessment cost for early-stage startups (pricing is set by independent assessment labs and varies by scope).',
      ],
    },
    sources: [
      {
        id: 'src-composio-gmail-toolkit',
        title: 'Composio Gmail Toolkit Documentation',
        canonicalUrl: 'https://docs.composio.dev/toolkits/gmail',
        sourceType: 'composio_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Details Gmail actions, parameters, and Composio integration setup.',
      },
      {
        id: 'src-google-gmail-scopes',
        title: 'Google Workspace Gmail API Scopes Reference',
        canonicalUrl: 'https://developers.google.com/workspace/gmail/api/auth/scopes',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Official listing of Gmail OAuth scopes confirming gmail.readonly and gmail.compose are Restricted Scopes.',
      },
      {
        id: 'src-google-sensitive-scopes',
        title: 'Google OAuth Sensitive Scope Verification',
        canonicalUrl: 'https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Requirements for demo videos, domain verification, and privacy policies.',
      },
      {
        id: 'src-google-restricted-scopes',
        title: 'Google OAuth Restricted Scope Verification & CASA',
        canonicalUrl: 'https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: '2026-10-20T01:00:00Z',
        summary: 'Requirements for CASA Tier 2 third-party security audits for apps using restricted scopes.',
      },
    ],
    claims: [
      {
        id: 'cl-gm-1',
        statement: 'Official Google documentation classifies both gmail.readonly and gmail.compose as Restricted Scopes requiring security assessment for external customer launch on owned apps.',
        applicability: 'All external customer deployments requesting Gmail reading or composing scopes.',
        sourceIds: ['src-google-restricted-scopes', 'src-google-gmail-scopes'],
        evidenceClass: 'provider_documentation',
      },
      {
        id: 'cl-gm-2',
        statement: 'Owned Google Cloud OAuth apps in Testing mode can authenticate up to 100 explicitly added test users without verification blocking.',
        applicability: 'Owned app development and beta testing phase.',
        sourceIds: ['src-google-sensitive-scopes'],
        evidenceClass: 'provider_documentation',
      },
    ],
    updatedAt: '2026-10-20T01:00:00Z',
    createdAt: '2026-10-20T01:00:00Z',
  },
];

export const SEED_NEXT_STEP_PACKS: Record<string, NextStepPack> = {
  'airtable-guide-v1': {
    id: 'pack-airtable-v1',
    guideId: 'airtable-guide-v1',
    generatedAt: '2026-10-20T01:00:00Z',
    pathType: 'managed',
    title: 'Airtable Next-Step Pack: Composio-Managed OAuth Quickstart',
    summary: 'Execution checklist and action validation plan for deploying your AI agent with Composio-managed Airtable OAuth.',
    sections: [
      {
        title: '1. Composio Configuration Checklist',
        content: `### Immediate Configuration Steps
- Ensure your \`COMPOSIO_API_KEY\` is stored securely in your server environment variables.
- Direct customer to authorize via Composio SDK or REST API:
  \`\`\`ts
  import { Composio } from "composio-core";
  const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
  const entity = composio.getEntity("customer-user-id");
  const connection = await entity.initiateConnection({ appName: "airtable" });
  console.log("Direct customer to:", connection.redirectUrl);
  \`\`\`
- Prompt the customer to select the specific Airtable base(s) containing the target CRM records.
- Listen for the Composio connection webhook or poll connection status to store the \`connectedAccountId\`.`,
      },
      {
        title: '2. Suggested Connection & Action Validation',
        content: `### Test Execution Script
Validate that the connection has read and write access before unleashing the autonomous agent:
1. Call \`airtable_list_records\` on the authorized base with \`pageSize: 1\`. Confirm non-empty schema return.
2. Call \`airtable_create_record\` with a test record.
3. Confirm record ID is returned, then delete or archive the test record.`,
      },
      {
        title: '3. When to Switch to an Owned App',
        content: `### Switching to Owned Airtable App
- If an enterprise customer mandates your company branding on the Airtable consent screen:
  1. Open [Airtable Developer Hub](https://airtable.com/create/oauth).
  2. Create an OAuth integration named after your product.
  3. Copy the exact Redirect URI from your Composio auth configuration dashboard under Settings > Integrations > Airtable > Custom App.
  4. Paste Client ID & Secret into Composio custom app settings.
  5. Select this custom auth config in your integration calls.`,
      },
    ],
    warningsAndDisclaimers: [
      'Airtable refresh tokens expire after 60 days of inactivity. Ensure your app handles re-auth gracefully.',
      'Checkboxes and progress marked on this device reflect local tracking and do not guarantee provider API uptime.',
    ],
  },
  'linkedin-guide-v1': {
    id: 'pack-linkedin-v1',
    guideId: 'linkedin-guide-v1',
    generatedAt: '2026-10-20T01:00:00Z',
    pathType: 'owned',
    title: 'LinkedIn Next-Step Pack: Owned App Setup & Product Justifications',
    summary: 'Execution checklist for registering your owned LinkedIn OAuth app, configuring self-service products, and drafting permission justifications.',
    sections: [
      {
        title: '1. LinkedIn Registration Checklist',
        content: `### Step-by-Step Portal Checklist
1. Navigate to **[LinkedIn Developer Portal](https://www.linkedin.com/developers/apps/new)**.
2. Enter App Details:
   - **App Name**: Your AI Product Name
   - **LinkedIn Page**: Select your official company page (must be an admin).
   - **Privacy Policy URL**: Your hosted privacy policy URL.
   - **App Logo**: 100x100px square image.
3. Verify Company Page: Click the generated verification link in your LinkedIn notifications.
4. Enable Products under the "Products" tab:
   - Request **"Share on LinkedIn"** (enables \`w_member_social\`).
   - Request **"Sign In with LinkedIn using OpenID Connect"** (enables \`openid, profile, email\`).
5. Configure OAuth 2.0 Settings under "Auth" tab:
   - Authorized redirect URLs: Copy the exact callback URI from your Composio auth configuration dashboard under Settings > Integrations > LinkedIn > Custom App.
6. Copy Client ID and Client Secret into Composio custom app settings and select this auth config in your app.`,
      },
      {
        title: '2. Scope Justification (For Customer Transparency)',
        content: `### Scope Mapping
- **\`w_member_social\`**: "Our AI assistant publishes updates directly to your personal LinkedIn feed when approved by you."
- **\`openid, profile, email\`**: "Used exclusively to identify your account and associate it with your workspace."
- *(Note)* Owning an app does NOT bypass provider product approvals for company page management (\`w_organization_social\`).`,
      },
    ],
    draftPermissionJustification: 'Our AI Assistant requires w_member_social strictly to publish updates scheduled and approved by the member. No automated scraping or unsolicited messaging is performed.',
    reviewerInstructionsTemplate: 'Testing Account: demo@yourdomain.com | Test Environment: https://app.yourdomain.com/demo | Instructions: Log in, click Integrations > Connect LinkedIn, approve the prompt, and click "Generate Sample Post".',
    warningsAndDisclaimers: [
      'LinkedIn strictly forbids using member sharing APIs for automated mass spamming or scraping.',
      'Checkboxes on this device track personal progress only and do not constitute provider approval.',
    ],
  },
  'gmail-guide-v1': {
    id: 'pack-gmail-v1',
    guideId: 'gmail-guide-v1',
    generatedAt: '2026-10-20T01:00:00Z',
    pathType: 'owned',
    title: 'Gmail Next-Step Pack: Google Cloud Setup & Verification Preparation',
    summary: 'Comprehensive pack including Google Cloud registration checklist, YouTube demo video script, draft justification, and CASA assessment guidelines.',
    sections: [
      {
        title: '1. Google Cloud Console Registration Checklist',
        content: `### Google Cloud Setup (Step-by-Step)
1. Open **[Google Cloud Console](https://console.cloud.google.com/)** and create a project.
2. Go to **APIs & Services > Library**, search for **Gmail API**, and click **Enable**.
3. Go to **OAuth consent screen**:
   - Choose **External** user type (or **Internal** if restricted entirely to your own Google Workspace domain).
   - App name: Your Product Name
   - User support email & Developer contact info: your official domain email.
   - Authorized domain: your verified domain.
4. Add Test Users:
   - In "Testing" mode, add up to 100 test accounts for sandbox testing.
5. Go to **Credentials > Create Credentials > OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: Copy the exact callback URI from your Composio auth configuration dashboard under Settings > Integrations > Gmail > Custom App.
6. Copy Client ID and Client Secret into Composio custom integration for Gmail and select that auth config ID in your app.`,
      },
      {
        title: '2. YouTube Demo Walkthrough Video Guidelines',
        content: `### Google Review Video Requirements
Google reviewers require:
1. **Address Bar Visibility**: The video MUST clearly display the browser address bar with the full URL containing your \`client_id\`.
2. **Consent Flow**: Show the user clicking "Connect Gmail", the Google OAuth consent screen appearing with your app name, and the user granting permissions.
3. **In-App Usage**: Demonstrate how the agent uses Gmail data within the user interface.
4. **Hosting**: Host on YouTube as **Unlisted**.`,
      },
      {
        title: '3. Scope Justification for Google Reviewer Form',
        content: `### Official Scope Justifications
- **Scope**: \`https://www.googleapis.com/auth/gmail.readonly\`
  - *Justification*: "Our AI assistant analyzes incoming customer inquiries sent to the user's connected sales inbox to identify buying intent and generate CRM lead records. Email data is processed in real time and is never sold, transferred to third parties, or used for model pre-training."
- **Scope**: \`https://www.googleapis.com/auth/gmail.compose\`
  - *Justification*: "Our assistant drafts contextual follow-up responses directly into the user's Gmail Drafts folder for manual human review."`,
      },
      {
        title: '4. Security Assessment Guidelines (CASA Tier 2)',
        content: `### Preparing for Security Assessment
Because \`gmail.readonly\` and \`gmail.compose\` are Restricted Scopes per Google policy:
- Google requires external production applications using restricted scopes to undergo CASA Tier 2 assessment via an authorized assessment organization.
- Assessment costs and turnaround times vary by assessor and scope of assessment; exact pricing is unknown until formal assessor quotes are obtained.`,
      },
    ],
    draftPermissionJustification: 'Our AI Sales Assistant accesses Gmail strictly to read customer email threads and prepare drafts for human approval. We adhere strictly to the Google API Services User Data Policy, including Limited Use requirements.',
    demoWalkthroughOutline: '1. Start on dashboard. 2. Click "Connect Gmail". 3. Highlight client_id in address bar. 4. Complete consent. 5. Show incoming email processed into CRM draft.',
    reviewerInstructionsTemplate: 'Test URL: https://app.yourdomain.com/login | Test User: google-reviewer@yourdomain.com | Steps: Navigate to Settings > Connectors > Gmail, click Connect.',
    warningsAndDisclaimers: [
      'Google verification and CASA assessment requirements apply to owned apps accessing restricted scopes for external users.',
      'Checkboxes on this device track personal progress only and do not confer provider approval.',
    ],
  },
};
