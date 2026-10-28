import { Claim, Source, PermissionItem, ChecklistStep, EvidenceValidationSummary, Guide } from './types.js';

export interface ValidationResult {
  validatedClaims: Claim[];
  validatedPermissions: PermissionItem[];
  validatedSteps: ChecklistStep[];
  summary: EvidenceValidationSummary;
  isValid: boolean;
  warnings: string[];
}

export function validateEvidenceContract(
  claims: Claim[],
  sources: Source[],
  permissions: PermissionItem[] = [],
  steps: ChecklistStep[] = []
): ValidationResult {
  const sourcesMap = new Map<string, Source>();
  for (const s of sources) {
    if (s && s.id) {
      sourcesMap.set(s.id, s);
    }
  }

  const warnings: string[] = [];
  let missingSourceReferencesCount = 0;
  let verifiedClaimsCount = 0;
  let unverifiedClaimsCount = 0;
  let claimsRequiringReviewCount = 0;

  // 1. Validate Claims
  const validatedClaims: Claim[] = claims.map((claim) => {
    const c: Claim = { ...claim };
    const missingIds: string[] = [];
    const validSources: Source[] = [];

    if (!c.sourceIds || c.sourceIds.length === 0) {
      warnings.push(`Claim "${c.id}" has no referenced source IDs.`);
      c.validationStatus = 'requires_human_review';
      c.evidenceStatus = 'unverified';
      c.validationNote = 'No source IDs cited for this claim. Marked for human review.';
      claimsRequiringReviewCount++;
      unverifiedClaimsCount++;
      return c;
    }

    for (const sId of c.sourceIds) {
      const foundSource = sourcesMap.get(sId);
      if (!foundSource) {
        missingIds.push(sId);
      } else {
        validSources.push(foundSource);
      }
    }

    if (missingIds.length > 0) {
      missingSourceReferencesCount += missingIds.length;
      warnings.push(`Claim "${c.id}" references missing source IDs: ${missingIds.join(', ')}`);
      c.validationStatus = 'requires_human_review';
      c.evidenceStatus = 'unverified';
      c.validationNote = `Referenced source IDs not found in source store: [${missingIds.join(', ')}]. Downgraded to unverified.`;
      claimsRequiringReviewCount++;
      unverifiedClaimsCount++;
      return c;
    }

    // Check if any referenced source failed retrieval
    const hasFailedSource = validSources.some(s => s.retrievalStatus === 'failed');
    if (hasFailedSource) {
      warnings.push(`Claim "${c.id}" relies on a source that failed retrieval.`);
      c.validationStatus = 'requires_human_review';
      c.evidenceStatus = 'unverified';
      c.validationNote = 'One or more cited sources failed retrieval. Human confirmation required.';
      claimsRequiringReviewCount++;
      unverifiedClaimsCount++;
      return c;
    }

    // Check URL structure
    const hasInvalidUrl = validSources.some(s => {
      try {
        const u = new URL(s.canonicalUrl);
        return !u.protocol.startsWith('http');
      } catch {
        return true;
      }
    });

    if (hasInvalidUrl) {
      warnings.push(`Claim "${c.id}" has malformed source URLs.`);
      c.validationStatus = 'requires_human_review';
      c.evidenceStatus = 'unverified';
      c.validationNote = 'Source URL is invalid or non-HTTP.';
      claimsRequiringReviewCount++;
      unverifiedClaimsCount++;
      return c;
    }

    // Determine evidence status accurately
    const isOfficial = validSources.every(s => 
      s.sourceType === 'provider_docs' || 
      s.sourceType === 'composio_docs' || 
      s.sourceType === 'official_policy'
    );

    if (isOfficial) {
      c.evidenceStatus = 'verified_official';
      c.validationStatus = 'verified';
      c.validationNote = `Verified against ${validSources.length} official source(s).`;
      verifiedClaimsCount++;
    } else {
      c.evidenceStatus = c.evidenceStatus || 'supported_evidence';
      c.validationStatus = 'verified';
      c.validationNote = `Corroborated by ${validSources.length} reference source(s).`;
      verifiedClaimsCount++;
    }

    return c;
  });

  // 2. Validate Permissions
  const validatedPermissions: PermissionItem[] = permissions.map((p) => {
    const item: PermissionItem = { ...p };
    if (!item.sourceIds || item.sourceIds.length === 0) {
      item.evidenceStatus = 'unverified';
      item.uncertainty = item.uncertainty || 'No official sources cited for this scope string.';
      return item;
    }

    const missingIds = item.sourceIds.filter(id => !sourcesMap.has(id));
    if (missingIds.length > 0) {
      missingSourceReferencesCount += missingIds.length;
      item.evidenceStatus = 'unverified';
      item.uncertainty = `Missing source IDs: ${missingIds.join(', ')}. Scope strings must be verified in developer portal.`;
      item.isConfirmedScope = false;
      return item;
    }

    if (item.isConfirmedScope === false || item.permission.includes('Pending') || item.permission.includes('Unverified')) {
      item.evidenceStatus = 'unknown_not_documented';
      return item;
    }

    item.evidenceStatus = item.evidenceStatus || 'verified_official';
    return item;
  });

  // 3. Validate Steps
  const validatedSteps: ChecklistStep[] = steps.map((s) => {
    const step: ChecklistStep = { ...s };
    if (step.sourceIds && step.sourceIds.length > 0) {
      const hasMissing = step.sourceIds.some(id => !sourcesMap.has(id));
      if (hasMissing) {
        step.evidenceStatus = 'unverified';
      }
    }
    return step;
  });

  // 4. Check for Orphan Sources (sources in list never referenced anywhere)
  const referencedSourceIds = new Set<string>();
  for (const c of claims) {
    c.sourceIds?.forEach(id => referencedSourceIds.add(id));
  }
  for (const p of permissions) {
    p.sourceIds?.forEach(id => referencedSourceIds.add(id));
  }
  for (const s of steps) {
    s.sourceIds?.forEach(id => referencedSourceIds.add(id));
  }

  let orphanSourcesCount = 0;
  for (const s of sources) {
    if (!referencedSourceIds.has(s.id)) {
      orphanSourcesCount++;
    }
  }

  // 5. Overall Reliability Calculation
  let overallReliability: EvidenceValidationSummary['overallReliability'] = 'unverified_desk_research';
  if (claims.length > 0 && verifiedClaimsCount === claims.length && missingSourceReferencesCount === 0) {
    overallReliability = 'high_confidence';
  } else if (verifiedClaimsCount > 0) {
    overallReliability = 'partially_verified';
  }

  const summary: EvidenceValidationSummary = {
    totalClaims: claims.length,
    verifiedClaims: verifiedClaimsCount,
    unverifiedClaims: unverifiedClaimsCount,
    claimsRequiringReview: claimsRequiringReviewCount,
    orphanSourcesCount,
    missingSourceReferencesCount,
    overallReliability,
    validationTimestamp: new Date().toISOString(),
  };

  return {
    validatedClaims,
    validatedPermissions,
    validatedSteps,
    summary,
    isValid: missingSourceReferencesCount === 0 && claimsRequiringReviewCount === 0,
    warnings,
  };
}
