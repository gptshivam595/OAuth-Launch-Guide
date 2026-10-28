import { repository, normalizeGuide } from '../src/server/storage.js';
import { validateEvidenceContract } from '../src/server/evidenceValidator.js';
import { inspectComposioToolkit } from '../src/server/composioCatalog.js';
import { runResearchJob, isSafePublicUrl } from '../src/server/researchAgent.js';
import { Claim, Source, GuideAssumptions, ResearchJob } from '../src/server/types.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${failureDetail ? ` (${failureDetail})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n=======================================================');
  console.log('       OAUTH LAUNCH GUIDE — VERIFICATION TEST SUITE     ');
  console.log('=======================================================\n');

  // -------------------------------------------------------------------------
  // TEST A: Known Provider with Managed OAuth Available (Airtable)
  // -------------------------------------------------------------------------
  console.log('--- Test A: Known Provider with Managed OAuth (Airtable) ---');
  {
    const airtableGuide = repository.getGuideById('airtable-guide-v1');
    assert(!!airtableGuide, 'Airtable guide exists in repository');
    if (airtableGuide) {
      assert(
        airtableGuide.pathAssessment.startingPath === 'composio_managed_suitable',
        'Starting path is composio_managed_suitable'
      );
      assert(
        airtableGuide.composioToolkitMatch?.managedAuthAvailable === 'available',
        'Composio-managed auth is available'
      );
      assert(
        airtableGuide.permissionsTable.every(p => p.permission.startsWith('data.') || p.permission.startsWith('schema.')),
        'Permissions use authentic documented Airtable scopes (data.records:read, etc.)'
      );
      assert(
        airtableGuide.pathAssessment.limitations.some(l => l.includes('Composio') || l.includes('branding')),
        'Explains managed OAuth consent branding limitation'
      );
    }
  }

  // -------------------------------------------------------------------------
  // TEST B: Known Provider with Managed OAuth Unavailable (Spotify & Xero)
  // -------------------------------------------------------------------------
  console.log('\n--- Test B: Known Provider with Managed OAuth Unavailable (Spotify/Xero) ---');
  {
    const spotifyGuide = repository.getGuideById('spotify-guide-v1');
    assert(!!spotifyGuide, 'Spotify guide exists in repository');
    if (spotifyGuide) {
      assert(
        spotifyGuide.pathAssessment.startingPath === 'register_owned_app',
        'Spotify recommends register_owned_app (not managed OAuth)'
      );
      assert(
        spotifyGuide.composioToolkitMatch?.managedAuthAvailable === 'unavailable',
        'Spotify managed OAuth is marked unavailable'
      );
      assert(
        spotifyGuide.pathAssessment.limitations.some(l => l.includes('5') || l.includes('whitelisted')),
        'Spotify reflects Development Mode 5-user whitelist constraint'
      );
    }

    const xeroGuide = repository.getGuideById('xero-guide-v1');
    assert(!!xeroGuide, 'Xero guide exists in repository');
    if (xeroGuide) {
      assert(
        xeroGuide.pathAssessment.startingPath === 'register_owned_app',
        'Xero recommends register_owned_app (not managed OAuth)'
      );
      assert(
        xeroGuide.pathAssessment.limitations.some(l => l.includes('5') || l.includes('organisation')),
        'Xero reflects 5 active organisation limit constraint'
      );
    }
  }

  // -------------------------------------------------------------------------
  // TEST C: Unknown / Unfamiliar Provider (No fabricated scopes or fake SLAs)
  // -------------------------------------------------------------------------
  console.log('\n--- Test C: Unknown Provider (Honest Unverified Scopes & SLAs) ---');
  {
    const testJobId = `job-test-unknown-${Date.now()}`;
    const unknownJob: ResearchJob = {
      id: testJobId,
      providerInput: 'HypotheticalUnfamiliarCloudCorp999',
      assumptions: {
        intendedActions: 'Synchronize warehouse inventory units',
        audience: 'external_customers',
        customBrandingRequired: false,
        alreadyHasApp: false,
      },
      status: 'researching',
      currentStage: 'resolve_identity',
      events: [],
      sourcesDiscovered: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    repository.saveResearchJob(unknownJob);

    await runResearchJob(testJobId);
    const completedJob = repository.getResearchJob(testJobId);
    assert(!!completedJob, 'Unknown research job saved and retrieved');
    assert(completedJob?.status === 'completed', 'Job finished with completion state');

    if (completedJob?.guideId) {
      const generatedGuide = repository.getGuideById(completedJob.guideId);
      assert(!!generatedGuide, 'Generated guide saved in storage');
      if (generatedGuide) {
        // Must NOT fabricate fake scopes like hypotheticalunfamiliarcloudcorp999.read
        const hasFabricatedScope = generatedGuide.permissionsTable.some(p => 
          p.permission.includes('.read') || p.permission.includes('.write')
        );
        assert(!hasFabricatedScope, 'Does NOT fabricate fake {provider}.read or {provider}.write scope strings');

        // Must label scope unconfirmed or pending
        const hasUnconfirmedScope = generatedGuide.permissionsTable.some(p => 
          p.isConfirmedScope === false || p.permission.includes('Pending')
        );
        assert(hasUnconfirmedScope, 'Correctly flags unverified scopes as Pending/Unconfirmed');

        // Review tier must NOT be labeled "Non-sensitive / instant"
        const hasMisleadingInstantTier = generatedGuide.permissionsTable.some(p =>
          p.reviewImplication === 'Non-sensitive / instant'
        );
        assert(!hasMisleadingInstantTier, 'Does NOT label unknown permissions as "Non-sensitive / instant"');

        // External waiting must NOT fabricate a fake SLA like "2-3 business days"
        assert(
          generatedGuide.pathAssessment.externalWaiting.includes('Not publicly specified') ||
          generatedGuide.pathAssessment.externalWaiting.includes('Unknown') ||
          generatedGuide.pathAssessment.externalWaiting.includes('vary'),
          'Does NOT fabricate a provider review SLA (reports Not publicly specified / Unknown)'
        );

        // Path assessment correctly marks unverified
        assert(
          generatedGuide.pathAssessment.startingPath === 'unverified_provider_requirements' ||
          generatedGuide.pathAssessment.startingPath === 'provider_not_found_in_composio',
          'Starting path accurately reflects unverified provider requirements'
        );

        // Unverified notice banner is present
        assert(!!generatedGuide.unverifiedNotice, 'Includes honest unverified requirements advisory notice');
      }
    }
  }

  // -------------------------------------------------------------------------
  // TEST D: External Research / Quota Failure Handling
  // -------------------------------------------------------------------------
  console.log('\n--- Test D: External Research Failure & Input Protection ---');
  {
    // Test SSRF protection
    const localhostCheck = isSafePublicUrl('http://127.0.0.1:8080/admin');
    assert(!localhostCheck.safe, 'SSRF check blocks loopback http://127.0.0.1');

    const metadataCheck = isSafePublicUrl('http://169.254.169.254/latest/meta-data');
    assert(!metadataCheck.safe, 'SSRF check blocks cloud metadata 169.254.169.254');

    const privateIpCheck = isSafePublicUrl('http://10.0.0.5:3000');
    assert(!privateIpCheck.safe, 'SSRF check blocks RFC1918 private IP range (10.0.0.0/8)');

    const publicUrlCheck = isSafePublicUrl('https://developers.airtable.com');
    assert(publicUrlCheck.safe, 'SSRF check permits public HTTPS developer portals');
  }

  // -------------------------------------------------------------------------
  // TEST E: Missing or Ambiguous Metadata (No Binary Guessing)
  // -------------------------------------------------------------------------
  console.log('\n--- Test E: Ambiguous Metadata & Catalog Lookup ---');
  {
    const emptyProvider = await inspectComposioToolkit('');
    assert(
      emptyProvider.outcome === 'toolkit_not_found',
      'Empty provider returns toolkit_not_found outcome'
    );

    const nonExistentSlug = `nonexistent-random-provider-${Date.now()}`;
    const nonExistentResult = await inspectComposioToolkit(nonExistentSlug);
    assert(
      nonExistentResult.outcome === 'toolkit_not_found' || nonExistentResult.outcome === 'network_error',
      'Non-existent toolkit returns toolkit_not_found or network_error'
    );
    assert(
      nonExistentResult.toolkit === null || nonExistentResult.toolkit?.managedAuthAvailable === 'unknown',
      'Does not fabricate an active toolkit for non-existent provider'
    );
  }

  // -------------------------------------------------------------------------
  // TEST F: Evidence Validation Contract (Referential Integrity & Downward Adjustment)
  // -------------------------------------------------------------------------
  console.log('\n--- Test F: Evidence Validation Contract ---');
  {
    const mockSources: Source[] = [
      {
        id: 'src-valid-1',
        title: 'Official Documentation',
        canonicalUrl: 'https://docs.example.com/oauth',
        sourceType: 'provider_docs',
        retrievalMethod: 'direct_fetch',
        retrievalStatus: 'retrieved',
        retrievedAt: new Date().toISOString(),
      },
    ];

    // Case 1: Claim with missing source ID -> MUST fail structural validation & downgrade
    const brokenClaim: Claim = {
      id: 'claim-broken-1',
      statement: 'Provider offers instant self-service app review.',
      applicability: 'Launch planning',
      sourceIds: ['src-non-existent-999'], // Missing ID
      evidenceClass: 'provider_documentation',
    };

    const res1 = validateEvidenceContract([brokenClaim], mockSources);
    assert(
      res1.summary.missingSourceReferencesCount === 1,
      'Detects missing source ID in claim reference'
    );
    assert(
      res1.validatedClaims[0].validationStatus === 'requires_human_review',
      'Downgrades broken claim to "requires_human_review"'
    );
    assert(
      res1.validatedClaims[0].evidenceStatus === 'unverified',
      'Downgrades broken claim evidence status to "unverified"'
    );
    assert(!res1.isValid, 'Overall validation flags contract failure');

    // Case 2: Claim with valid official source -> Passes validation
    const validClaim: Claim = {
      id: 'claim-valid-1',
      statement: 'Official documentation confirms OAuth 2.0 authorization code flow.',
      applicability: 'OAuth flow setup',
      sourceIds: ['src-valid-1'],
      evidenceClass: 'provider_documentation',
    };

    const res2 = validateEvidenceContract([validClaim], mockSources);
    assert(res2.summary.verifiedClaims === 1, 'Valid claim successfully verified');
    assert(res2.summary.missingSourceReferencesCount === 0, 'Zero missing sources for valid claim');
    assert(res2.validatedClaims[0].validationStatus === 'verified', 'Validation status is verified');
    assert(res2.summary.overallReliability === 'high_confidence', 'Reliability is high_confidence');
    assert(res2.isValid, 'Overall validation contract passes');
  }

  // -------------------------------------------------------------------------
  // TEST G: Shareable Guide & Persistence
  // -------------------------------------------------------------------------
  console.log('\n--- Test G: Shareable Guide & Persistence ---');
  {
    const airtableById = repository.getGuideById('airtable-guide-v1');
    const airtableBySlug = repository.getGuideBySlug('airtable');
    assert(!!airtableById && !!airtableBySlug, 'Guide resolves by both ID and Slug');
    assert(airtableById?.id === airtableBySlug?.id, 'Stable guide ID across lookups');

    // Test versioning creates distinct version
    const newAssumptions: GuideAssumptions = {
      intendedActions: 'New custom team action',
      audience: 'team_only',
      customBrandingRequired: true,
      alreadyHasApp: false,
    };

    const v2Guide = repository.createGuideVersion('airtable-guide-v1', newAssumptions);
    assert(!!v2Guide, 'Successfully created guide version');
    if (v2Guide) {
      assert(v2Guide.version === 2, 'Version incremented to 2');
      assert(v2Guide.id === 'airtable-guide-v2', 'New guide ID is stable (airtable-guide-v2)');
      assert(v2Guide.previousVersionId === 'airtable-guide-v1', 'Links to previous version');
      assert(
        v2Guide.pathAssessment.startingPath === 'register_owned_app',
        'Adjusts starting path to register_owned_app when custom branding is required'
      );
    }
  }

  // -------------------------------------------------------------------------
  // TEST H: All Flagship Guides Structural Integrity
  // -------------------------------------------------------------------------
  console.log('\n--- Test H: Flagship Guides Structural Integrity ---');
  {
    const allGuides = repository.getAllGuides();
    assert(allGuides.length >= 9, `Repository loaded ${allGuides.length} guides (expected >= 9)`);

    for (const g of allGuides) {
      assert(!!g.id && !!g.slug && !!g.providerName, `Guide "${g.providerName}" has valid identity`);
      assert(!!g.pathAssessment?.startingPath, `Guide "${g.providerName}" has startingPath`);
      assert(g.permissionsTable.length > 0, `Guide "${g.providerName}" has permissions`);
      assert(g.setupChecklist.length > 0, `Guide "${g.providerName}" has setup steps`);
      assert(g.sources.length > 0, `Guide "${g.providerName}" has sourced references`);
    }
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=======================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('=======================================================\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
