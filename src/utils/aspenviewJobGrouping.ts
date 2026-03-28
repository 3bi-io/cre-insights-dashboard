/**
 * Groups AspenView jobs with identical titles but different locations
 * into a single entry with multiple locations and apply URLs.
 * Non-AspenView jobs pass through unchanged.
 */

const ASPENVIEW_CLIENT_ID = '82513316-7df2-4bf0-83d8-6c511c83ddfb';

/** Client IDs that should show Voice Apply even with external apply URLs */
const VOICE_APPLY_CLIENT_IDS = new Set([
  ASPENVIEW_CLIENT_ID,                              // AspenView Technology
  '67cadf11-8cce-41c6-8e19-7d2bb0be3b03',          // Pemberton Truck Lines
  '30ab5f68-258c-4e81-8217-1123c4536259',          // Day and Ross
  '4a9ef1df-dcc9-499c-999a-446bb9a329fc',          // Novco, Inc.
  'b2a29507-32a6-4f5e-85d6-a7e6ffac3c52',          // James Burg Trucking
  'feb3479f-4116-42a5-bb6a-811406c1c99a',          // Werner Enterprises
  '8ca3faca-b91c-4ab8-a9af-b145ab265228',          // Hub Group
  '50657f4d-c47b-4104-a307-b82d5fa4a1df',          // TMC Transportation
]);

export interface JobLocationVariant {
  id: string;
  location: string;
  city?: string | null;
  state?: string | null;
  apply_url?: string | null;
}

/**
 * A job that may represent multiple location variants (for AspenView).
 * The `locationVariants` array is only populated when 2+ jobs share the same title.
 */
export interface GroupedJob {
  /** The primary job data (first occurrence) */
  [key: string]: any;
  /** Multiple locations when grouped; undefined for non-grouped jobs */
  locationVariants?: JobLocationVariant[];
}

export function isAspenViewClientId(clientId: string | null | undefined): boolean {
  return clientId === ASPENVIEW_CLIENT_ID;
}

/** Returns true if Voice Apply should be shown for this client, even with external apply URLs */
export function isVoiceApplyEnabled(clientId: string | null | undefined): boolean {
  return !!clientId && VOICE_APPLY_CLIENT_IDS.has(clientId);
}

/**
 * Groups AspenView jobs by title. Jobs with the same title are merged into
 * a single entry whose `locationVariants` contains each location + apply URL.
 * Non-AspenView jobs are returned unchanged.
 */
export function groupAspenViewJobs<T extends Record<string, any>>(jobs: T[]): GroupedJob[] {
  if (!jobs || jobs.length === 0) return jobs;

  const grouped: GroupedJob[] = [];
  const aspenViewTitleMap = new Map<string, { primary: T; variants: JobLocationVariant[] }>();

  for (const job of jobs) {
    // Only group AspenView jobs
    if (!isAspenViewClientId(job.client_id)) {
      grouped.push(job);
      continue;
    }

    const normalizedTitle = (job.title || job.job_title || '').trim().toLowerCase();
    
    if (!normalizedTitle) {
      grouped.push(job);
      continue;
    }

    const variant: JobLocationVariant = {
      id: job.id,
      location: job.location || (job.city && job.state ? `${job.city}, ${job.state}` : job.city || 'Remote'),
      city: job.city,
      state: job.state,
      apply_url: job.apply_url,
    };

    if (aspenViewTitleMap.has(normalizedTitle)) {
      aspenViewTitleMap.get(normalizedTitle)!.variants.push(variant);
    } else {
      aspenViewTitleMap.set(normalizedTitle, {
        primary: job,
        variants: [variant],
      });
    }
  }

  // Convert AspenView groups into grouped jobs
  for (const { primary, variants } of aspenViewTitleMap.values()) {
    if (variants.length > 1) {
      grouped.push({
        ...primary,
        // Clear single location since we have multiple
        location: variants.map(v => v.location).join(' · '),
        locationVariants: variants,
      });
    } else {
      // Single location, no grouping needed
      grouped.push(primary);
    }
  }

  return grouped;
}
