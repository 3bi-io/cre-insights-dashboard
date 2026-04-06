import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('syndication-push');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FREE_PLATFORMS = [
  "indeed",
  "simplyhired",
  "talent",
  "careerjet",
  "jooble",
  "jobrapido",
  "linkedin",
  "trovit",
  "recruitnet",
  "adzuna",
  "dice",
  "wellfound",
  "hcareers",
  "snagajob",
  "healthecareers",
  "nurse",
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all distinct org IDs with active, non-hidden jobs
    const { data: orgs, error: orgError } = await supabase
      .from("job_listings")
      .select("organization_id")
      .eq("status", "active")
      .eq("is_hidden", false)
      .not("organization_id", "is", null);

    if (orgError) throw orgError;

    const uniqueOrgIds = [...new Set((orgs || []).map((r) => r.organization_id))];
    console.log(`Found ${uniqueOrgIds.length} organizations with active jobs`);

    const feedBaseUrl = `${SUPABASE_URL}/functions/v1/universal-xml-feed`;
    const results: Record<string, { success: string[]; failed: string[] }> = {};

    for (const orgId of uniqueOrgIds) {
      results[orgId] = { success: [], failed: [] };

      for (const platform of FREE_PLATFORMS) {
        try {
          const url = `${feedBaseUrl}?organization_id=${orgId}&format=${platform}`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          });

          if (res.ok) {
            results[orgId].success.push(platform);
          } else {
            results[orgId].failed.push(`${platform}:${res.status}`);
            console.warn(`Failed ${platform} for org ${orgId}: ${res.status}`);
          }
        } catch (e) {
          results[orgId].failed.push(`${platform}:error`);
          console.error(`Error ${platform} for org ${orgId}:`, e.message);
        }
      }

      // Small delay between orgs to avoid self-rate-limiting
      await new Promise((r) => setTimeout(r, 100));
    }

    const totalSuccess = Object.values(results).reduce(
      (sum, r) => sum + r.success.length,
      0
    );
    const totalFailed = Object.values(results).reduce(
      (sum, r) => sum + r.failed.length,
      0
    );

    const summary = {
      organizations: uniqueOrgIds.length,
      platforms: FREE_PLATFORMS.length,
      totalFeeds: uniqueOrgIds.length * FREE_PLATFORMS.length,
      totalSuccess,
      totalFailed,
      details: results,
      completedAt: new Date().toISOString(),
    };

    console.log(
      `Syndication push complete: ${totalSuccess} success, ${totalFailed} failed across ${uniqueOrgIds.length} orgs`
    );

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Syndication push error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
