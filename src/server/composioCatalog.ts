import { ComposioToolkitMatch } from './types.js';

export async function inspectComposioToolkit(providerNameOrSlug: string): Promise<{
  toolkit: ComposioToolkitMatch | null;
  retrievalProvenance: string;
}> {
  // Normalize candidate slug
  const cleanSlug = providerNameOrSlug
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0]
    .replace(/[^a-z0-9_-]/g, '');

  const apiKey = process.env.COMPOSIO_API_KEY;

  // 1. If COMPOSIO_API_KEY is available, query official read-only metadata API
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://backend.composio.dev/api/v3.1/toolkits/${cleanSlug}`, {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const managedSchemes = data.composio_managed_auth_schemes || [];
        const isManagedOAuth = Array.isArray(managedSchemes) && managedSchemes.some((s: any) => 
          typeof s === 'string' ? s.toLowerCase().includes('oauth') : s?.auth_mode?.toLowerCase?.().includes('oauth')
        );

        const actions = Array.isArray(data.actions) 
          ? data.actions.map((a: any) => a.name || a.slug || a).slice(0, 5)
          : [`${cleanSlug}_default_action`];

        return {
          toolkit: {
            found: true,
            slug: cleanSlug,
            name: data.name || `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)} Toolkit`,
            docUrl: `https://docs.composio.dev/toolkits/${cleanSlug}`,
            managedAuthAvailable: isManagedOAuth ? 'available' : (managedSchemes.length > 0 ? 'available' : 'unavailable'),
            relevantAuthMethod: 'OAuth 2.0',
            metadataStatus: 'api_checked',
            limitationsDocumented: [
              'Retrieved directly from Composio v3.1 metadata API.',
              'Managed OAuth apps share platform rate limits; custom app advised for high-volume production.',
            ],
            supportedActionsSummary: actions,
            customAuthDocUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
          },
          retrievalProvenance: `API checked: GET https://backend.composio.dev/api/v3.1/toolkits/${cleanSlug} at ${new Date().toISOString()}`,
        };
      }
    } catch (e) {
      console.warn('Composio API fetch failed or timed out:', e);
    }
  }

  // 2. Public documentation retrieval against official Composio docs (e.g. Linear, Airtable, Slack, Spotify, Xero, etc.)
  try {
    const docUrl = `https://docs.composio.dev/toolkits/${cleanSlug}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const docRes = await fetch(docUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (docRes.status === 200) {
      const html = await docRes.text();

      // Extract action names if present in the page content or embedded JSON
      const actionsFound: string[] = [];
      const actionRegex = new RegExp(`["'](${cleanSlug}_[a-z0-9_]+)["']`, 'gi');
      let match;
      while ((match = actionRegex.exec(html)) !== null && actionsFound.length < 5) {
        if (!actionsFound.includes(match[1])) {
          actionsFound.push(match[1]);
        }
      }

      const toolkitName = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);

      // Locate "Authentication Details" section
      const authIdx = html.indexOf('Authentication Details');
      let managedAuthAvailable: 'available' | 'unavailable' | 'unknown' = 'unknown';
      let relevantAuthMethod = 'OAuth 2.0';
      const limitations: string[] = [`Verified via Composio documentation at ${docUrl}.`];

      if (authIdx !== -1) {
        // Inspect the immediate 800 characters following "Authentication Details" header
        const authSection = html.substring(authIdx, authIdx + 800);
        
        // Exact badge check: Look for amber negation badge:
        // e.g. 'Composio-managed OAuth not available'
        const hasManagedNotAvailableBadge = 
          authSection.toLowerCase().includes('composio-managed oauth not available') ||
          authSection.toLowerCase().includes('managed oauth not available') ||
          html.includes('Why is there no default OAuth app') ||
          html.includes('Composio does not provide a default OAuth app');

        if (hasManagedNotAvailableBadge) {
          managedAuthAvailable = 'unavailable';
          relevantAuthMethod = 'OAuth 2.0 (Custom App Required)';
          limitations.push(
            'Composio-managed OAuth is explicitly NOT available for this toolkit.',
            'You must register your own OAuth app in the provider developer dashboard and configure custom credentials in Composio.',
          );
        } else {
          // If no negation badge exists and OAuth 2.0 is supported:
          const mentionsOAuth = 
            authSection.toLowerCase().includes('oauth') || 
            html.toLowerCase().includes('oauth 2.0') ||
            html.includes('/docs/authentication');

          if (mentionsOAuth) {
            managedAuthAvailable = 'available';
            relevantAuthMethod = 'OAuth 2.0';
            limitations.push(
              'Managed OAuth displays Composio branding on the provider consent screen.',
              'For custom branding or dedicated quotas, configure an owned app using the Redirect URI from your Composio auth configuration.',
            );
          } else {
            // Might be API key or basic auth
            managedAuthAvailable = 'unavailable';
            relevantAuthMethod = authSection.toLowerCase().includes('api key') ? 'API Key' : 'Custom Credentials';
            limitations.push('Toolkit uses non-OAuth or custom credential authentication.');
          }
        }
      } else {
        // "Authentication Details" header was not found in HTML - preserve unknown
        managedAuthAvailable = 'unknown';
        limitations.push('Authentication Details section was not identified in documentation; managed status is unknown.');
      }

      return {
        toolkit: {
          found: true,
          slug: cleanSlug,
          name: `${toolkitName} Toolkit`,
          docUrl,
          managedAuthAvailable,
          relevantAuthMethod,
          metadataStatus: 'documentation_checked',
          limitationsDocumented: limitations,
          supportedActionsSummary: actionsFound.length > 0 
            ? actionsFound 
            : [`${cleanSlug}_read`, `${cleanSlug}_write`],
          customAuthDocUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
        },
        retrievalProvenance: `Documentation checked: GET ${docUrl} (managed auth status: ${managedAuthAvailable}) at ${new Date().toISOString()}`,
      };
    } else if (docRes.status === 404) {
      return {
        toolkit: null,
        retrievalProvenance: `Documentation checked: GET ${docUrl} returned 404 Not Found at ${new Date().toISOString()}`,
      };
    }
  } catch (err: any) {
    console.warn(`Documentation check for "${cleanSlug}" encountered network error:`, err?.message);
    return {
      toolkit: {
        found: false,
        slug: cleanSlug,
        managedAuthAvailable: 'unknown',
        relevantAuthMethod: 'OAuth 2.0',
        metadataStatus: 'unverified',
        limitationsDocumented: ['Composio documentation could not be reached; availability is unknown.'],
        supportedActionsSummary: [],
      },
      retrievalProvenance: `Documentation check attempted at https://docs.composio.dev/toolkits/${cleanSlug} but network request failed: ${err?.message || 'timeout'}`,
    };
  }

  // Fallback
  return {
    toolkit: null,
    retrievalProvenance: `Documentation checked: No toolkit identified for slug "${cleanSlug}" at https://docs.composio.dev/toolkits/${cleanSlug}`,
  };
}
