/**
 * ATS Readiness Scorer
 * Pure function that calculates how ready an application is for ATS submission.
 * No DB dependencies — takes application data and ATS slug, returns a score.
 */

export interface ReadinessField {
  name: string;
  display: string;
  weight: number; // 0-1, higher = more important
  required: boolean;
}

export interface ReadinessResult {
  score: number; // 0-100
  missingFields: string[];
  missingRequired: string[];
  missingRecommended: string[];
  isReady: boolean;
  threshold: number;
}

/**
 * Required/recommended fields per ATS slug
 */
const ATS_FIELD_REQUIREMENTS: Record<string, ReadinessField[]> = {
  tenstreet: [
    // Required fields (weight 1.0)
    { name: 'first_name', display: 'First Name', weight: 1.0, required: true },
    { name: 'last_name', display: 'Last Name', weight: 1.0, required: true },
    { name: 'phone', display: 'Phone', weight: 1.0, required: true },
    { name: 'applicant_email', display: 'Email', weight: 0.9, required: true },
    { name: 'city', display: 'City', weight: 0.8, required: true },
    { name: 'state', display: 'State', weight: 0.8, required: true },
    { name: 'zip', display: 'ZIP Code', weight: 0.8, required: true },
    // Recommended fields (weight 0.3-0.7)
    { name: 'cdl_class', display: 'CDL Class', weight: 0.7, required: false },
    { name: 'driving_experience_years', display: 'Experience Years', weight: 0.5, required: false },
    { name: 'date_of_birth', display: 'Date of Birth', weight: 0.5, required: false },
    { name: 'cdl_endorsements', display: 'CDL Endorsements', weight: 0.3, required: false },
    { name: 'address_1', display: 'Street Address', weight: 0.3, required: false },
    { name: 'consent', display: 'Consent', weight: 0.4, required: false },
    { name: 'veteran', display: 'Veteran Status', weight: 0.2, required: false },
  ],
  driverreach: [
    { name: 'first_name', display: 'First Name', weight: 1.0, required: true },
    { name: 'last_name', display: 'Last Name', weight: 1.0, required: true },
    { name: 'phone', display: 'Phone', weight: 1.0, required: true },
    { name: 'applicant_email', display: 'Email', weight: 0.9, required: true },
    { name: 'city', display: 'City', weight: 0.7, required: false },
    { name: 'state', display: 'State', weight: 0.7, required: false },
    { name: 'zip', display: 'ZIP Code', weight: 0.7, required: false },
    { name: 'cdl_class', display: 'CDL Class', weight: 0.6, required: false },
    { name: 'driving_experience_years', display: 'Experience Years', weight: 0.5, required: false },
  ],
};

// Default fallback for unknown ATS systems
const DEFAULT_FIELDS: ReadinessField[] = [
  { name: 'first_name', display: 'First Name', weight: 1.0, required: true },
  { name: 'last_name', display: 'Last Name', weight: 1.0, required: true },
  { name: 'phone', display: 'Phone', weight: 1.0, required: true },
  { name: 'applicant_email', display: 'Email', weight: 0.9, required: true },
  { name: 'city', display: 'City', weight: 0.6, required: false },
  { name: 'state', display: 'State', weight: 0.6, required: false },
  { name: 'zip', display: 'ZIP Code', weight: 0.6, required: false },
];

/**
 * Check if a field value is considered "populated"
 */
function isPopulated(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '' && value !== 'N/A';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'number') return true;
  return Boolean(value);
}

/**
 * Calculate ATS readiness score for an application
 * @param applicationData - The application record (key-value pairs)
 * @param atsSlug - The ATS system slug (e.g., 'tenstreet', 'driverreach')
 * @param threshold - Minimum score to be considered "ready" (default 60)
 */
export function calculateReadinessScore(
  applicationData: Record<string, unknown>,
  atsSlug: string = 'tenstreet',
  threshold: number = 60
): ReadinessResult {
  const fields = ATS_FIELD_REQUIREMENTS[atsSlug] || DEFAULT_FIELDS;

  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const field of fields) {
    totalWeight += field.weight;
    const value = applicationData[field.name] ?? applicationData[field.name.replace('applicant_email', 'email')];

    if (isPopulated(value)) {
      weightedSum += field.weight;
    } else {
      if (field.required) {
        missingRequired.push(field.display);
      } else {
        missingRecommended.push(field.display);
      }
    }
  }

  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  return {
    score,
    missingFields: [...missingRequired, ...missingRecommended],
    missingRequired,
    missingRecommended,
    isReady: score >= threshold,
    threshold,
  };
}

/**
 * Get the field requirements for a given ATS slug
 */
export function getATSFieldRequirements(atsSlug: string): ReadinessField[] {
  return ATS_FIELD_REQUIREMENTS[atsSlug] || DEFAULT_FIELDS;
}
