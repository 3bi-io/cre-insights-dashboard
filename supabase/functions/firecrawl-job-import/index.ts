const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const JOB_CATEGORIES = [
  { id: '61bd5f79-b3c1-4804-a6a0-d568773c3d84', name: 'Driver Recruitment' },
  { id: 'e0d27c99-a2e5-4a52-bb47-9893fbcddb56', name: 'Logistics Positions' },
  { id: '88a88843-cc2c-489c-9d08-98eab00f2b6f', name: 'Mechanics' },
  { id: '81397d9f-4ff0-43e5-839d-efaca089c91f', name: 'Technical Positions' },
  { id: 'f9d46470-2352-493d-af0b-ac5ad2386c30', name: 'Administrative' },
  { id: '4cfe3e84-73bb-4499-8909-5ac964199f1c', name: 'Customer Service' },
  { id: '92626aab-dc65-458c-adab-2f9a2a368245', name: 'Management Roles' },
];

const CATEGORY_LIST = JOB_CATEGORIES.map(c => `"${c.name}"`).join(', ');

interface ScrapedJob {
  title: string;
  company?: string;
  location?: string;
  city?: string;
  state?: string;
  pay_range?: string;
  job_type?: string;
  requirements?: string[];
  apply_url?: string;
  description?: string;
}

async function scrapeJobs(url: string, apiKey: string): Promise<ScrapedJob[]> {
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }

  console.log('Scraping jobs from:', formattedUrl);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: formattedUrl,
      formats: [
        {
          type: 'json',
          schema: {
            type: 'object',
            properties: {
              jobs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    company: { type: 'string' },
                    location: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    pay_range: { type: 'string' },
                    job_type: { type: 'string' },
                    requirements: { type: 'array', items: { type: 'string' } },
                    apply_url: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          prompt: 'Extract ALL job listings from this page. For each job, extract the title, company name, full location string, city, state, pay/salary range, job type (Full-time, Part-time, Contract, etc.), requirements as an array, the direct apply URL, and a brief description.',
        },
      ],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Firecrawl error:', data);
    throw new Error(data.error || `Firecrawl request failed: ${response.status}`);
  }

  const json = data.data?.json || data.json;
  return json?.jobs || [];
}

async function categorizeJobs(jobs: ScrapedJob[], lovableApiKey: string): Promise<Map<number, string>> {
  const titles = jobs.map((j, i) => `${i}: ${j.title}`).join('\n');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You categorize job titles into these categories: ${CATEGORY_LIST}. Respond with the tool call only.`,
        },
        {
          role: 'user',
          content: `Categorize each job by its index number:\n${titles}`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'categorize_jobs',
            description: 'Assign a category to each job by index',
            parameters: {
              type: 'object',
              properties: {
                categorizations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' },
                      category: { type: 'string', enum: JOB_CATEGORIES.map(c => c.name) },
                    },
                    required: ['index', 'category'],
                  },
                },
              },
              required: ['categorizations'],
            },
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'categorize_jobs' } },
    }),
  });

  if (!response.ok) {
    console.error('AI categorization failed:', response.status);
    // Fall back to default category
    return new Map();
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return new Map();

  try {
    const args = JSON.parse(toolCall.function.arguments);
    const result = new Map<number, string>();
    for (const cat of args.categorizations || []) {
      const match = JOB_CATEGORIES.find(c => c.name === cat.category);
      if (match) result.set(cat.index, match.id);
    }
    return result;
  } catch {
    return new Map();
  }
}

function parseSalary(payRange: string | undefined): { min: number | null; max: number | null; type: string | null } {
  if (!payRange) return { min: null, max: null, type: null };

  const cleaned = payRange.replace(/[,$]/g, '').toLowerCase();
  const numbers = cleaned.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];

  let type: string | null = null;
  if (cleaned.includes('/yr') || cleaned.includes('year') || cleaned.includes('annual')) type = 'yearly';
  else if (cleaned.includes('/hr') || cleaned.includes('hour')) type = 'hourly';
  else if (cleaned.includes('/wk') || cleaned.includes('week')) type = 'weekly';
  else if (cleaned.includes('/mi') || cleaned.includes('mile') || cleaned.includes('cpm')) type = 'per_mile';

  if (numbers.length >= 2) return { min: numbers[0], max: numbers[1], type };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0], type };
  return { min: null, max: null, type };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, client_id, client_name, organization_id, user_id, dry_run } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Scrape
    const jobs = await scrapeJobs(url, firecrawlKey);
    console.log(`Scraped ${jobs.length} jobs from ${url}`);

    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, jobs: [], imported: 0, message: 'No jobs found on this page' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Auto-categorize
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    let categories = new Map<number, string>();
    if (lovableKey) {
      categories = await categorizeJobs(jobs, lovableKey);
      console.log(`Categorized ${categories.size}/${jobs.length} jobs`);
    }

    const defaultCategoryId = JOB_CATEGORIES[0].id; // Driver Recruitment

    // Build enriched jobs with categories
    const enrichedJobs = jobs.map((job, i) => ({
      ...job,
      category_id: categories.get(i) || defaultCategoryId,
      category_name: JOB_CATEGORIES.find(c => c.id === (categories.get(i) || defaultCategoryId))?.name,
      salary: parseSalary(job.pay_range),
    }));

    // Dry run: return preview without importing
    if (dry_run) {
      return new Response(
        JSON.stringify({ success: true, jobs: enrichedJobs, imported: 0, dry_run: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Import into job_listings
    if (!user_id || !organization_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id and organization_id are required for import' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const inserts = enrichedJobs.map((job) => ({
      title: job.title || 'Untitled Position',
      job_title: job.title,
      job_summary: job.description || null,
      location: job.location || null,
      city: job.city || null,
      state: job.state || null,
      job_type: job.job_type || null,
      salary_min: job.salary.min,
      salary_max: job.salary.max,
      salary_type: job.salary.type,
      apply_url: job.apply_url || null,
      category_id: job.category_id,
      client_id: client_id || null,
      client: client_name || job.company || null,
      organization_id,
      user_id,
      status: 'active',
      source: 'firecrawl',
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('job_listings')
      .insert(inserts)
      .select('id, title, category_id');

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Imported ${inserted?.length || 0} jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        jobs: enrichedJobs,
        imported: inserted?.length || 0,
        imported_ids: inserted?.map((r: any) => r.id) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Job import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to import jobs' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
