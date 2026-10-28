export interface ParsedTimeMetrics {
  primaryEffort: string;
  effortSubtext: string;
  primaryWait: string;
  waitSubtext: string;
  testingStatus: string;
  testingSubtext: string;
  isEffortUnknown: boolean;
  isWaitUnknown: boolean;
}

/**
 * Extracts punchy, high-impact time and readiness numbers from guide assessment text.
 * Strictly preserves 'Unknown' when evidence is uncertain or unverified.
 */
export function extractTimeMetrics(
  developerEffort: string = '',
  externalWaiting: string = '',
  canStartTesting?: { status: string; note: string }
): ParsedTimeMetrics {
  // 1. Developer Effort
  let primaryEffort = '15–30 min';
  let effortSubtext = 'Hands-on setup';
  let isEffortUnknown = false;

  const effortLower = developerEffort.toLowerCase();
  if (effortLower.includes('unknown') || effortLower.includes('unverified') || effortLower.includes('not established')) {
    primaryEffort = 'Unknown';
    effortSubtext = 'Effort unverified';
    isEffortUnknown = true;
  } else if (effortLower.includes('15–30 min') || effortLower.includes('15-30 min')) {
    primaryEffort = '15–30 min';
    effortSubtext = 'Managed OAuth setup';
  } else if (effortLower.includes('2–4 hour') || effortLower.includes('2-4 hour') || effortLower.includes('2–4 hr') || effortLower.includes('2-4 hr')) {
    primaryEffort = '2–4 hrs';
    effortSubtext = 'App setup & materials';
  } else if (effortLower.includes('1–2 hour') || effortLower.includes('1-2 hour') || effortLower.includes('1–2 hr') || effortLower.includes('1-2 hr')) {
    primaryEffort = '1–2 hrs';
    effortSubtext = 'App registration & keys';
  } else if (effortLower.includes('30–60 min') || effortLower.includes('30-60 min')) {
    primaryEffort = '30–60 min';
    effortSubtext = 'Console configuration';
  } else {
    const match = developerEffort.match(/(\d+(?:[–-]\d+)?\s*(?:min(?:ute)?s?|hours?|hrs?|days?))/i);
    if (match) {
      primaryEffort = match[1];
      effortSubtext = 'Hands-on setup';
    } else if (developerEffort.length > 0) {
      primaryEffort = developerEffort.split(/[,.;]/)[0].trim().slice(0, 18);
      effortSubtext = 'Developer effort';
    } else {
      primaryEffort = 'Unknown';
      effortSubtext = 'Effort unverified';
      isEffortUnknown = true;
    }
  }

  // 2. External Waiting
  let primaryWait = '0 days';
  let waitSubtext = 'No approval queue';
  let isWaitUnknown = false;

  const waitLower = externalWaiting.toLowerCase();
  if (waitLower.includes('unknown') || waitLower.includes('uncertain') || waitLower.includes('unverified')) {
    primaryWait = 'Unknown';
    waitSubtext = 'Turnaround unverified';
    isWaitUnknown = true;
  } else if (waitLower.includes('zero') || waitLower.includes('none') || waitLower.includes('no approval') || waitLower.includes('unlisted')) {
    primaryWait = '0 days';
    waitSubtext = 'Instant / Unlisted app';
  } else if (waitLower.includes('week') || waitLower.includes('casa') || waitLower.includes('verification') || waitLower.includes('audit')) {
    if (waitLower.includes('2–4') || waitLower.includes('2-4')) {
      primaryWait = '2–4 wks';
      waitSubtext = 'Verification & review';
    } else {
      primaryWait = '1–3 wks';
      waitSubtext = 'Provider review queue';
    }
  } else if (waitLower.includes('day')) {
    const matchDays = externalWaiting.match(/(\d+(?:[–-]\d+)?\s*(?:business\s*)?days?)/i);
    if (matchDays) {
      primaryWait = matchDays[1];
      waitSubtext = 'Review turnaround';
    } else {
      primaryWait = '3–7 days';
      waitSubtext = 'Review queue';
    }
  } else if (waitLower.includes('self-serve') || waitLower.includes('self serve') || waitLower.includes('immediate')) {
    primaryWait = 'Instant';
    waitSubtext = 'Self-serve approval';
  } else if (externalWaiting.length > 0) {
    const match = externalWaiting.match(/(\d+(?:[–-]\d+)?\s*(?:min(?:ute)?s?|hours?|hrs?|days?|weeks?|wks?))/i);
    if (match) {
      primaryWait = match[1];
      waitSubtext = 'External wait';
    } else {
      primaryWait = 'Unknown';
      waitSubtext = 'Turnaround unverified';
      isWaitUnknown = true;
    }
  } else {
    primaryWait = 'Unknown';
    waitSubtext = 'Turnaround unverified';
    isWaitUnknown = true;
  }

  // 3. Testing Readiness
  let testingStatus = 'Immediate';
  let testingSubtext = 'Test with Composio today';

  if (canStartTesting) {
    if (canStartTesting.status === 'yes') {
      testingStatus = 'Immediate';
      testingSubtext = canStartTesting.note.length > 60 ? 'Ready to connect today' : canStartTesting.note;
    } else if (canStartTesting.status === 'with_limitations') {
      testingStatus = 'Sandbox Only';
      testingSubtext = canStartTesting.note.length > 60 ? 'Test users or dev quota apply' : canStartTesting.note;
    } else {
      testingStatus = 'Pending Setup';
      testingSubtext = canStartTesting.note;
    }
  }

  return {
    primaryEffort,
    effortSubtext,
    primaryWait,
    waitSubtext,
    testingStatus,
    testingSubtext,
    isEffortUnknown,
    isWaitUnknown,
  };
}
