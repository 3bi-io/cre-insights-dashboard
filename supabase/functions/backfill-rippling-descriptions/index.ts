import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors-config.ts'
import { successResponse } from '../_shared/response.ts'
import { wrapHandler } from '../_shared/error-handler.ts'
import { getServiceClient } from '../_shared/supabase-client.ts'
import { createLogger } from '../_shared/logger.ts'

const logger = createLogger('backfill-rippling-descriptions');

const ASPENVIEW_CLIENT_ID = '82513316-7df2-4bf0-83d8-6c511c83ddfb';

function cleanJobDescription(markdown: string, jobTitle: string): string {
  let lines = markdown.split('\n');

  if (lines.length > 0 && lines[0].startsWith('# Content from')) {
    lines = lines.slice(1);
  }

  const titleIndex = lines.findIndex(l => {
    const trimmed = l.trim();
    return trimmed.startsWith('##') && trimmed.includes(jobTitle.substring(0, Math.min(20, jobTitle.length)));
  });
  if (titleIndex !== -1) {
    lines = lines.slice(titleIndex + 1);
  }

  const trailingPatterns = [
    /^Postularme ahora$/i,
    /^Apply now$/i,
    /^Compartir en:?$/i,
    /^Share:?$/i,
  ];

  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (
      lastLine === '' ||
      trailingPatterns.some(p => p.test(lastLine)) ||
      (lines.length > 3 && lastLine.length < 40 && !lastLine.startsWith('#') && !lastLine.startsWith('-') && !lastLine.startsWith('*') && !lastLine.includes('**'))
    ) {
      lines.pop();
    } else {
      break;
    }
  }

  return lines.join('\n').trim();
}

const handler = wrapHandler(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured');

  const supabase = getServiceClient();

  // Get all active AspenView jobs without descriptions
  const { data: jobs, error } = await supabase
    .from('job_listings')
    .select('id, title, url')
    .eq('client_id', ASPENVIEW_CLIENT_ID)
    .eq('status', 'active')
    .is('job_description', null)
    .not('url', 'is', null);

  if (error) throw error;
  if (!jobs || jobs.length === 0) {
    return successResponse({ updated: 0 }, 'No jobs need backfill');
  }

  logger.info('Backfilling descriptions for jobs', { count: jobs.length });

  let updated = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      logger.info('Scraping job page', { title: job.title, url: job.url });

      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: job.url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        logger.error('Firecrawl error', null, { status: response.status, title: job.title });
        failed++;
        continue;
      }

      const data = await response.json();
      const content = data.data || data;
      const markdown: string = content.markdown || '';

      if (markdown.length < 50) {
        logger.warn('Minimal content', { title: job.title });
        failed++;
        continue;
      }

      const description = cleanJobDescription(markdown, job.title);

      if (description.length > 30) {
        const { error: updateErr } = await supabase
          .from('job_listings')
          .update({ job_description: description, updated_at: new Date().toISOString() })
          .eq('id', job.id);

        if (updateErr) {
          logger.error('Update failed', updateErr, { id: job.id });
          failed++;
        } else {
          updated++;
          logger.info('Updated job description', { title: job.title, length: description.length });
        }
      } else {
        failed++;
      }

      // Rate limit - wait between requests
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (err) {
      logger.error('Job scrape failed', err, { title: job.title });
      failed++;
    }
  }

  return successResponse({ total: jobs.length, updated, failed }, 'Backfill complete');
}, { context: 'BackfillRipplingDescriptions', logRequests: true });

serve(handler);
