import { createClient } from 'npm:@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// State → Primary Metro mapping
const STATE_METRO: Record<string, { city: string; fullName: string }> = {
  AZ: { city: 'Phoenix', fullName: 'Arizona' },
  UT: { city: 'Salt Lake City', fullName: 'Utah' },
  CO: { city: 'Denver', fullName: 'Colorado' },
  NM: { city: 'Albuquerque', fullName: 'New Mexico' },
  TX: { city: 'Dallas', fullName: 'Texas' },
  OK: { city: 'Oklahoma City', fullName: 'Oklahoma' },
  AR: { city: 'Little Rock', fullName: 'Arkansas' },
  LA: { city: 'Baton Rouge', fullName: 'Louisiana' },
  MS: { city: 'Jackson', fullName: 'Mississippi' },
  AL: { city: 'Birmingham', fullName: 'Alabama' },
  TN: { city: 'Nashville', fullName: 'Tennessee' },
  KY: { city: 'Louisville', fullName: 'Kentucky' },
  GA: { city: 'Atlanta', fullName: 'Georgia' },
  FL: { city: 'Jacksonville', fullName: 'Florida' },
  SC: { city: 'Columbia', fullName: 'South Carolina' },
  NC: { city: 'Charlotte', fullName: 'North Carolina' },
  VA: { city: 'Richmond', fullName: 'Virginia' },
  WV: { city: 'Charleston', fullName: 'West Virginia' },
  OH: { city: 'Columbus', fullName: 'Ohio' },
  IN: { city: 'Indianapolis', fullName: 'Indiana' },
  IL: { city: 'Chicago', fullName: 'Illinois' },
  MO: { city: 'St. Louis', fullName: 'Missouri' },
  KS: { city: 'Kansas City', fullName: 'Kansas' },
  NE: { city: 'Omaha', fullName: 'Nebraska' },
  IA: { city: 'Des Moines', fullName: 'Iowa' },
  SD: { city: 'Sioux Falls', fullName: 'South Dakota' },
  MN: { city: 'Minneapolis', fullName: 'Minnesota' },
  WI: { city: 'Milwaukee', fullName: 'Wisconsin' },
  MI: { city: 'Detroit', fullName: 'Michigan' },
  PA: { city: 'Philadelphia', fullName: 'Pennsylvania' },
  NY: { city: 'New York', fullName: 'New York' },
  CT: { city: 'Hartford', fullName: 'Connecticut' },
  NJ: { city: 'Newark', fullName: 'New Jersey' },
  DE: { city: 'Wilmington', fullName: 'Delaware' },
  MD: { city: 'Baltimore', fullName: 'Maryland' },
  CA: { city: 'Los Angeles', fullName: 'California' },
};

// Coverage sets
const COVERAGE_SETS: Record<string, string[]> = {
  otr: ['AZ','UT','CO','NM','TX','OK','AR','LA','MS','AL','TN','KY','GA','FL','SC','NC','VA','WV','OH','IN','IL','MO','KS','NE','IA','SD','MN','WI','MI','PA','NY','CT','NJ','DE','MD'],
  regional: ['TX','AR','LA','MS','AL','TN','KY','GA','SC','NC','VA','FL','OK','KS','NE','IA','MN','WI','IL','MO'],
  team_otr: ['TX','GA','FL','TN','IL','OH','IN','PA','NC','VA','MO','AL','KY','MS','AR','LA','OK','NJ'],
  reefer: ['TX','FL','GA','AZ','CO','AL','MS','LA','AR','TN','KY','NC','SC','VA','PA','NY','OH','IN','IL','CA'],
};

function detectCoverageSet(title: string, jobType: string | null): string {
  const t = (title || '').toLowerCase();
  const jt = (jobType || '').toLowerCase();

  if (t.includes('reefer') || t.includes('byot') || t.includes('bring your own')) return 'reefer';
  if (t.includes('team')) return 'team_otr';
  if (jt.includes('regional') || t.includes('regional')) return 'regional';
  return 'otr';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Auth check - must be super_admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check super_admin role
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Super admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { job_ids, client_id, dry_run = false, coverage_override } = body as {
      job_ids?: string[];
      client_id?: string;
      dry_run?: boolean;
      coverage_override?: string;
    };

    // Resolve job_ids: either passed directly or fetched by client_id
    let targetJobIds = job_ids || [];
    if (client_id && targetJobIds.length === 0) {
      const { data: clientJobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('client_id', client_id)
        .eq('status', 'active');
      targetJobIds = (clientJobs || []).map(j => j.id);
    }

    if (targetJobIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No jobs to expand' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch parent jobs
    const { data: parentJobs, error: fetchErr } = await supabase
      .from('job_listings')
      .select('*')
      .in('id', targetJobIds);

    if (fetchErr || !parentJobs?.length) {
      return new Response(JSON.stringify({ error: 'Failed to fetch parent jobs' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build expansion plan
    const plan: Array<{
      parentTitle: string;
      parentId: string;
      coverageSet: string;
      states: string[];
      newListings: any[];
    }> = [];

    for (const job of parentJobs) {
      const coverageKey = coverage_override || detectCoverageSet(job.title || '', job.job_type);
      const states = COVERAGE_SETS[coverageKey] || COVERAGE_SETS.otr;

      // Check for existing variants
      const { data: existing } = await supabase
        .from('job_listings')
        .select('title')
        .eq('client_id', job.client_id)
        .like('title', `${job.title} | %`);

      const existingStates = new Set(
        (existing || []).map(e => {
          const match = e.title?.match(/\|\s*(.+)$/);
          return match ? match[1].trim() : '';
        })
      );

      const newListings: any[] = [];
      for (const st of states) {
        const meta = STATE_METRO[st];
        if (!meta) continue;
        if (existingStates.has(meta.fullName)) continue;

        newListings.push({
          title: `${job.title} | ${meta.fullName}`,
          job_summary: job.job_summary,
          location: `${meta.city}, ${st}`,
          city: meta.city,
          state: st,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_type: job.salary_type,
          job_type: job.job_type,
          experience_level: job.experience_level || 'mid',
          status: 'active',
          client_id: job.client_id,
          organization_id: job.organization_id,
          category_id: job.category_id,
          user_id: job.user_id,
        });
      }

      plan.push({
        parentTitle: job.title || 'Untitled',
        parentId: job.id,
        coverageSet: coverageKey,
        states: states.filter(st => !existingStates.has(STATE_METRO[st]?.fullName)),
        newListings,
      });
    }

    const totalNew = plan.reduce((sum, p) => sum + p.newListings.length, 0);

    if (dry_run) {
      return new Response(JSON.stringify({
        dry_run: true,
        total_new: totalNew,
        jobs: plan.map(p => ({
          parent_title: p.parentTitle,
          parent_id: p.parentId,
          coverage_set: p.coverageSet,
          new_count: p.newListings.length,
          states: p.states,
        })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Execute inserts
    let totalInserted = 0;
    for (const p of plan) {
      if (p.newListings.length === 0) continue;
      // Batch in chunks of 50
      for (let i = 0; i < p.newListings.length; i += 50) {
        const chunk = p.newListings.slice(i, i + 50);
        const { error: insertErr } = await supabase.from('job_listings').insert(chunk);
        if (insertErr) {
          console.error('Insert error:', insertErr);
          return new Response(JSON.stringify({ error: `Insert failed: ${insertErr.message}`, inserted_so_far: totalInserted }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        totalInserted += chunk.length;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_inserted: totalInserted,
      jobs: plan.map(p => ({
        parent_title: p.parentTitle,
        parent_id: p.parentId,
        coverage_set: p.coverageSet,
        new_count: p.newListings.length,
      })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Geo expand error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
