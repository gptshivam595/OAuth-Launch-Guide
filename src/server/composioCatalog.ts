import { ComposioToolkitMatch, ComposioLookupOutcome } from './types.js';

export interface InspectToolkitResult {
  outcome: ComposioLookupOutcome;
  toolkit: ComposioToolkitMatch | null;
  retrievalProvenance: string;
  errorDetail?: string;
}

export async function inspectComposioToolkit(providerNameOrSlug: string): Promise<InspectToolkitResult> {
  const cleanSlug = providerNameOrSlug
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0]
    .replace(/[^a-z0-9_-]/g, '');

  if (!cleanSlug) {
    return {
      outcome: 'toolkit_not_found',
      toolkit: null,
      retrievalProvenance: 'Invalid or empty provider identifier provided.',
    };
  }

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
        let data: any;
        try {
          data = await res.json();
        } catch (jsonErr: any) {
          return {
            outcome: 'malformed_metadata',
            toolkit: null,
            retrievalProvenance: `API response from GET https://backend.composio.dev/api/v3.1/toolkits/${cleanSlug} was malformed JSON at ${new Date().toISOString()}`,
            errorDetail: jsonErr?.message,
          };
        }

        if (!data || typeof data !== 'object') {
          return {
            outcome: 'malformed_metadata',
            toolkit: null,
            retrievalProvenance: `API response missing object body at ${new Date().toISOString()}`,
          };
        }

        const managedSchemes = data.composio_managed_auth_schemes;
        let managedAuthAvailable: 'available' | 'unavailable' | 'unknown' = 'unknown';
        let outcome: ComposioLookupOutcome = 'ambiguous_config';
        let relevantAuthMethod = 'OAuth 2.0';

        if (Array.isArray(managedSchemes)) {
          const hasManagedOAuth = managedSchemes.some((s: any) => {
            if (typeof s === 'string') return s.toLowerCase().includes('oauth');
            return s?.auth_mode?.toLowerCase?.().includes('oauth');
          });

          if (hasManagedOAuth) {
            managedAuthAvailable = 'available';
            outcome = 'confirmed_available';
            relevantAuthMethod = 'OAuth 2.0';
          } else if (managedSchemes.length === 0) {
            managedAuthAvailable = 'unavailable';
            outcome = 'confirmed_unavailable';
            relevantAuthMethod = 'OAuth 2.0 (Custom App Required)';
          } else {
            managedAuthAvailable = 'unavailable';
            outcome = 'confirmed_unavailable';
            relevantAuthMethod = 'API Key / Non-OAuth Credentials';
          }
        } else {
          outcome = 'ambiguous_config';
          managedAuthAvailable = 'unknown';
        }

        const actions: string[] = Array.isArray(data.actions)
          ? data.actions.map((a: any) => a?.name || a?.slug || (typeof a === 'string' ? a : '')).filter(Boolean).slice(0, 5)
          : [];

        return {
          outcome,
          toolkit: {
            found: true,
            slug: cleanSlug,
            name: data.name || `${cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1)} Toolkit`,
            docUrl: `https://docs.composio.dev/toolkits/${cleanSlug}`,
            managedAuthAvailable,
            lookupOutcome: outcome,
            relevantAuthMethod,
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
      } else if (res.status !== 404) {
        return {
          outcome: 'network_error',
          toolkit: null,
          retrievalProvenance: `API call to Composio v3.1 returned HTTP ${res.status} ${res.statusText} at ${new Date().toISOString()}`,
          errorDetail: `HTTP ${res.status}`,
        };
      }
    } catch (apiErr: any) {
      console.warn('Composio API fetch failed or timed out:', apiErr?.message);
    }
  }

  // 2. Public documentation retrieval against official Composio docs
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

      // Extract real action names if present in the page content
      const actionsFound: string[] = [];
      const actionRegex = new RegExp(`["'](${cleanSlug}_[a-z0-9_]+)["']`, 'gi');
      let match;
      while ((match = actionRegex.exec(html)) !== null && actionsFound.length < 5) {
        if (!actionsFound.includes(match[1])) {
          actionsFound.push(match[1]);
        }
      }

      const toolkitName = cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1);
      const lowerHtml = html.toLowerCase();

      // Check explicit negation badges
      const hasExplicitNegation =
        lowerHtml.includes('composio-managed oauth not available') ||
        lowerHtml.includes('managed oauth not available') ||
        lowerHtml.includes('why is there no default oauth app') ||
        lowerHtml.includes('composio does not provide a default oauth app') ||
        lowerHtml.includes('create your own oauth app in');

      // Check explicit positive badges
      const hasExplicitPositive =
        lowerHtml.includes('composio-managed oauth available') ||
        lowerHtml.includes('managed oauth is available') ||
        lowerHtml.includes('connect with managed oauth') ||
        lowerHtml.includes('use composio default oauth');

      let managedAuthAvailable: 'available' | 'unavailable' | 'unknown' = 'unknown';
      let outcome: ComposioLookupOutcome = 'ambiguous_config';
      let relevantAuthMethod = 'OAuth 2.0';
      const limitations: string[] = [`Inspected Composio documentation at ${docUrl}.`];

      if (hasExplicitNegation) {
        managedAuthAvailable = 'unavailable';
        outcome = 'confirmed_unavailable';
        relevantAuthMethod = 'OAuth 2.0 (Custom App Required)';
        limitations.push(
          'Composio-managed OAuth is explicitly NOT available for this toolkit.',
          'You must register your own OAuth app in the provider developer dashboard and configure custom credentials in Composio.'
        );
      } else if (hasExplicitPositive) {
        managedAuthAvailable = 'available';
        outcome = 'confirmed_available';
        relevantAuthMethod = 'OAuth 2.0';
        limitations.push(
          'Managed OAuth displays Composio branding on the provider consent screen.',
          'For custom branding or dedicated quotas, configure an owned app in Composio custom app settings.'
        );
      } else {
        // Ambiguous: DO NOT guess! The presence of "oauth" in the text does NOT mean managed OAuth is available.
        managedAuthAvailable = 'unknown';
        outcome = 'ambiguous_config';
        relevantAuthMethod = lowerHtml.includes('api key') ? 'API Key / Unknown OAuth' : 'OAuth 2.0 (Unconfirmed Managed Support)';
        limitations.push(
          'Documentation mentions the toolkit, but does not explicitly confirm whether a Composio-managed OAuth app is provisioned.',
          'Check your Composio dashboard under Integrations to verify if a default connection mode is enabled.'
        );
      }

      return {
        outcome,
        toolkit: {
          found: true,
          slug: cleanSlug,
          name: `${toolkitName} Toolkit`,
          docUrl,
          managedAuthAvailable,
          lookupOutcome: outcome,
          relevantAuthMethod,
          metadataStatus: 'documentation_checked',
          limitationsDocumented: limitations,
          supportedActionsSummary: actionsFound,
          customAuthDocUrl: 'https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app',
        },
        retrievalProvenance: `Documentation checked: GET ${docUrl} (outcome: ${outcome}, managed status: ${managedAuthAvailable}) at ${new Date().toISOString()}`,
      };
    } else if (docRes.status === 404) {
      return {
        outcome: 'toolkit_not_found',
        toolkit: null,
        retrievalProvenance: `Documentation checked: GET ${docUrl} returned 404 Not Found at ${new Date().toISOString()}`,
      };
    } else {
      return {
        outcome: 'network_error',
        toolkit: null,
        retrievalProvenance: `Documentation request to ${docUrl} returned HTTP ${docRes.status} at ${new Date().toISOString()}`,
        errorDetail: `HTTP ${docRes.status}`,
      };
    }
  } catch (err: any) {
    console.warn(`Documentation check for "${cleanSlug}" encountered network error:`, err?.message);
    return {
      outcome: 'network_error',
      toolkit: null,
      retrievalProvenance: `Documentation check attempted at https://docs.composio.dev/toolkits/${cleanSlug} but network request failed: ${err?.message || 'timeout'}`,
      errorDetail: err?.message || 'Network connection failed or timed out',
    };
  }
}
