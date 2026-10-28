export type EvidenceClass =
  | 'composio_documentation'
  | 'provider_documentation'
  | 'api_observation'
  | 'community_report'
  | 'estimate'
  | 'unverified';

export type EvidenceStatus =
  | 'verified_official'
  | 'observed_api'
  | 'supported_evidence'
  | 'estimated'
  | 'inferred_confirmation_required'
  | 'unknown_not_documented'
  | 'unverified'
  | 'blocked_policy';

export type ValidationStatus =
  | 'verified'
  | 'unverified'
  | 'requires_human_review';

export interface Source {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceType: 'composio_docs' | 'provider_docs' | 'api_metadata' | 'community_report' | 'official_policy' | 'secondary_source';
  retrievalMethod: 'direct_fetch' | 'gemini_search_grounding' | 'verified_doc_archive' | 'metadata_api' | 'manual_curation';
  retrievalStatus: 'retrieved' | 'cached' | 'partial' | 'failed' | 'not_attempted';
  retrievedAt: string | null;
  summary?: string;
  supportingExcerpt?: string;
}

export interface Claim {
  id: string;
  statement: string;
  applicability: string;
  sourceIds: string[];
  evidenceClass: EvidenceClass;
  evidenceStatus?: EvidenceStatus;
  supportingExcerpt?: string;
  validationStatus?: ValidationStatus;
  validationNote?: string;
  uncertaintyNote?: string;
}

export interface SetupAttempt {
  actualAction: string;
  method: string;
  timestamp: string;
  observedResult: string;
  evidence: string;
  stoppingPoint: string;
}

export interface PermissionItem {
  feature: string;
  permission: string;
  whyNeeded: string;
  providerProductRequirement?: string;
  reviewImplication: 'Non-sensitive / instant' | 'Sensitive scope / verification required' | 'Restricted scope / security audit (CASA)' | 'Partner approval / product application required' | 'Standard user consent' | 'Unknown / unverified';
  evidenceStatus?: EvidenceStatus;
  sourceIds: string[];
  uncertainty?: string;
  isConfirmedScope?: boolean;
}

export interface ChecklistStep {
  id: string;
  action: string;
  owner: 'developer' | 'agent' | 'provider_reviewer' | 'customer_admin' | 'end_user';
  prerequisites: string[];
  completionCondition: string;
  sourceIds: string[];
  evidenceStatus: 'source_backed' | 'estimated' | 'unverified';
  estimate?: {
    duration: string;
    basis: string;
  };
  phase: 'composio_prep' | 'provider_registration' | 'access_configuration' | 'verification_and_review' | 'testing_and_launch';
  details?: string;
}

export interface Blocker {
  symptom: string;
  checks: string[];
  explanationOrHypothesis: string;
  isHypothesis: boolean;
  nextAction: string;
  humanHandoff: string;
}

export type StartingPath =
  | 'composio_managed_suitable'
  | 'register_owned_app'
  | 'unverified_provider_requirements'
  | 'more_information_needed'
  | 'oauth_not_established'
  | 'provider_not_found_in_composio';

export interface GuideAssumptions {
  intendedActions: string;
  audience: 'team_only' | 'external_customers' | 'not_sure';
  customBrandingRequired: boolean;
  alreadyHasApp: boolean;
  specialNotes?: string;
}

export interface PathAssessment {
  startingPath: StartingPath;
  headline: string;
  why: string;
  assumptions: GuideAssumptions;
  canStartTesting: {
    status: 'yes' | 'with_limitations' | 'blocked';
    note: string;
  };
  whatCouldBlockLaunch: string;
  developerEffort: string;
  externalWaiting: string;
  myNextAction: string;
  limitations: string[];
}

export type ComposioLookupOutcome =
  | 'confirmed_available'
  | 'confirmed_unavailable'
  | 'ambiguous_config'
  | 'toolkit_not_found'
  | 'network_error'
  | 'malformed_metadata';

export interface ComposioToolkitMatch {
  found: boolean;
  slug?: string;
  name?: string;
  docUrl?: string;
  managedAuthAvailable: 'available' | 'unavailable' | 'unknown';
  lookupOutcome?: ComposioLookupOutcome;
  relevantAuthMethod: string;
  metadataStatus: 'api_checked' | 'documentation_checked' | 'unverified';
  limitationsDocumented: string[];
  supportedActionsSummary: string[];
  customAuthDocUrl?: string;
  callbackUrl?: string;
}

export interface ApprovalAndDistribution {
  appRegistration: string;
  apiProductAccessApproval: string;
  providerVerification: string;
  marketplaceDistribution: string;
  customerAdminApproval: string;
  endUserConsent: string;
}

export interface EvidenceAndUnknowns {
  composioDocs: string[];
  providerDocs: string[];
  metadataApiObservations: string[];
  communityReports: string[];
  estimates: string[];
  setupAttempts: SetupAttempt[];
  unresolvedAssumptions: string[];
}

export interface EvidenceValidationSummary {
  totalClaims: number;
  verifiedClaims: number;
  unverifiedClaims: number;
  claimsRequiringReview: number;
  orphanSourcesCount: number;
  missingSourceReferencesCount: number;
  overallReliability: 'high_confidence' | 'partially_verified' | 'unverified_desk_research';
  validationTimestamp: string;
}

export interface Guide {
  id: string;
  slug: string;
  version: number;
  previousVersionId?: string;
  providerName: string;
  providerWebsite?: string;
  providerLogo?: string;
  exampleUseCase: string;
  composioToolkitMatch: ComposioToolkitMatch | null;
  useCaseFit: 'supported_by_evidence' | 'limitation_found' | 'unknown';
  pathAssessment: PathAssessment;
  prerequisites: {
    category: string;
    items: string[];
  }[];
  permissionsTable: PermissionItem[];
  setupChecklist: ChecklistStep[];
  approvalAndDistribution: ApprovalAndDistribution;
  blockersAndRecovery: Blocker[];
  evidenceAndUnknowns: EvidenceAndUnknowns;
  sources: Source[];
  claims: Claim[];
  evidenceValidation?: EvidenceValidationSummary;
  isPartialResearch?: boolean;
  unverifiedNotice?: string;
  updatedAt: string;
  createdAt: string;
}

export interface NextStepPackSection {
  title: string;
  content: string;
}

export interface NextStepPack {
  id: string;
  guideId: string;
  generatedAt: string;
  pathType: 'managed' | 'owned';
  title: string;
  summary: string;
  sections: NextStepPackSection[];
  draftPermissionJustification?: string;
  demoWalkthroughOutline?: string;
  reviewerInstructionsTemplate?: string;
  warningsAndDisclaimers: string[];
}

export interface ResearchJobEvent {
  stage: 'resolve_identity' | 'check_composio' | 'read_provider_requirements' | 'assess_oauth_path' | 'build_guide' | 'check_evidence' | 'completed' | 'failed';
  title: string;
  description: string;
  timestamp: string;
  sourceUrl?: string;
}

export interface ResearchJob {
  id: string;
  providerInput: string;
  websiteInput?: string;
  assumptions: GuideAssumptions;
  status: 'queued' | 'researching' | 'completed' | 'failed';
  currentStage: ResearchJobEvent['stage'];
  events: ResearchJobEvent[];
  sourcesDiscovered: Source[];
  guideId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
