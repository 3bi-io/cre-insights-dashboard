import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_BASE_URL") || "https://applyai.jobs";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabase
      .from("job_listings")
      .select("id, title, job_title, job_description, job_summary, location, city, state, salary_min, salary_max, salary_type, job_type, created_at, updated_at, feed_date, organization_id, client_id")
      .eq("status", "active")
      .eq("is_hidden", false)
      .order("feed_date", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: jobs, error } = await query;
    if (error) throw error;

    // Fetch client names for all jobs
    const clientIds = [...new Set((jobs || []).map((j) => j.client_id).filter(Boolean))];
    let clientMap: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("public_client_info")
        .select("id, name")
        .in("id", clientIds);
      if (clients) {
        clientMap = Object.fromEntries(clients.map((c) => [c.id, c.name]));
      }
    }

    const now = new Date().toUTCString();
    const feedUrl = `${SUPABASE_URL}/functions/v1/rss-feed${organizationId ? `?organization_id=${organizationId}` : ""}`;

    const items = (jobs || []).map((job) => {
      const title = job.title || job.job_title || "Job Opening";
      const description = stripHtml(job.job_description || job.job_summary || `${title} position. Apply today.`);
      const truncatedDesc = description.length > 500 ? description.substring(0, 497) + "..." : description;
      const link = `${SITE_URL}/jobs/${job.id}`;
      const pubDate = new Date(job.feed_date || job.created_at).toUTCString();
      const company = job.client_id ? clientMap[job.client_id] || "" : "";
      const location = job.location || [job.city, job.state].filter(Boolean).join(", ") || "";

      const categoryTags = [
        job.job_type && `<category>${escapeXml(job.job_type)}</category>`,
        location && `<category>${escapeXml(location)}</category>`,
        company && `<category>${escapeXml(company)}</category>`,
      ].filter(Boolean).join("\n        ");

      return `    <item>
      <title>${escapeXml(title)}${company ? ` at ${escapeXml(company)}` : ""}${location ? ` — ${escapeXml(location)}` : ""}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(truncatedDesc)}</description>
      <pubDate>${pubDate}</pubDate>
      ${categoryTags}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Apply AI — Job Listings</title>
    <link>${SITE_URL}/jobs</link>
    <description>Latest job openings from Apply AI. Browse and apply to positions across multiple industries.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <ttl>60</ttl>
    <image>
      <url>${SITE_URL}/favicon.png</url>
      <title>Apply AI</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>${escapeXml(error.message)}</description></channel></rss>`,
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8" },
      }
    );
  }
});
