import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('generate-applications');

// Realistic CDL driver data for generating applications
const firstNames = [
  "James", "Robert", "John", "Michael", "David", "William", "Richard", "Joseph", "Thomas", "Christopher",
  "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Andrew", "Kenneth", "Joshua", "Kevin",
  "Brian", "Timothy", "Ronald", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric",
  "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Nancy",
  "Lisa", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee",
  "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams"
];

interface CityData {
  name: string;
  state: string;
  zip: string;
}

const cities: CityData[] = [
  { name: "Phoenix", state: "AZ", zip: "85001" },
  { name: "Tucson", state: "AZ", zip: "85701" },
  { name: "Mesa", state: "AZ", zip: "85201" },
  { name: "Scottsdale", state: "AZ", zip: "85251" },
  { name: "Dallas", state: "TX", zip: "75201" },
  { name: "Houston", state: "TX", zip: "77001" },
  { name: "San Antonio", state: "TX", zip: "78201" },
  { name: "Austin", state: "TX", zip: "78701" },
  { name: "Atlanta", state: "GA", zip: "30301" },
  { name: "Charlotte", state: "NC", zip: "28201" },
  { name: "Nashville", state: "TN", zip: "37201" },
  { name: "Memphis", state: "TN", zip: "38101" },
  { name: "Jacksonville", state: "FL", zip: "32099" },
  { name: "Miami", state: "FL", zip: "33101" },
  { name: "Tampa", state: "FL", zip: "33601" },
  { name: "Oklahoma City", state: "OK", zip: "73101" },
  { name: "Tulsa", state: "OK", zip: "74101" },
  { name: "Birmingham", state: "AL", zip: "35201" },
  { name: "Montgomery", state: "AL", zip: "36101" },
  { name: "Mobile", state: "AL", zip: "36601" }
];

const cdlEndorsements: string[][] = [
  ["Hazmat", "Tanker"],
  ["Hazmat"],
  ["Tanker"],
  ["Doubles/Triples"],
  ["Hazmat", "Doubles/Triples"],
  [],
  ["Tanker", "Doubles/Triples"]
];

const experienceLevels = [
  "6 months", "1 year", "2 years", "3 years", "5 years", 
  "7 years", "10 years", "15 years", "20+ years"
];

const sources = [
  "Adzuna", "Indeed", "CDL Job Cast", "ZipRecruiter", 
  "LinkedIn", "Facebook", "Google Jobs", "Craigslist"
];

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const randomPhone = (): string => {
  const area = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const line = Math.floor(Math.random() * 9000) + 1000;
  return `+1${area}${prefix}${line}`;
};

const randomEmail = (first: string, last: string): string => {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
  const separators = [".", "_", ""];
  const separator = random(separators);
  const number = Math.random() > 0.5 ? Math.floor(Math.random() * 99).toString() : "";
  return `${first.toLowerCase()}${separator}${last.toLowerCase()}${number}@${random(domains)}`;
};

interface GeneratedApplication {
  job_listing_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  applicant_email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  cdl: string;
  cdl_class: string | null;
  cdl_state: string | null;
  cdl_endorsements: string[] | null;
  exp: string;
  age: string;
  veteran: string;
  education_level: string;
  work_authorization: string;
  consent: string;
  drug: string;
  privacy: string;
  convicted_felony: string;
  source: string;
  campaign_id: string;
  ad_id: string;
  status: string;
  notes: string | null;
  applied_at: string;
}

const generateApplication = (jobListingId: string): GeneratedApplication => {
  const firstName = random(firstNames);
  const lastName = random(lastNames);
  const location = random(cities);
  const isVeteran = Math.random() > 0.7;
  const hasCDL = Math.random() > 0.1;
  const endorsements = hasCDL ? random(cdlEndorsements) : [];
  const experience = random(experienceLevels);
  
  return {
    job_listing_id: jobListingId,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    applicant_email: randomEmail(firstName, lastName),
    phone: randomPhone(),
    city: location.name,
    state: location.state,
    zip: location.zip,
    country: "US",
    cdl: hasCDL ? "Yes" : "In Process",
    cdl_class: hasCDL ? "A" : null,
    cdl_state: hasCDL ? location.state : null,
    cdl_endorsements: endorsements.length > 0 ? endorsements : null,
    exp: experience,
    age: "Yes",
    veteran: isVeteran ? "Yes" : "No",
    education_level: random(["High School", "GED", "Some College", "Associate Degree"]),
    work_authorization: random(["US Citizen", "Permanent Resident", "Work Visa"]),
    consent: "Yes",
    drug: "Yes",
    privacy: "Yes",
    convicted_felony: Math.random() > 0.85 ? "Yes" : "No",
    source: random(sources),
    campaign_id: `campaign_${Math.floor(Math.random() * 1000)}`,
    ad_id: `ad_${Math.floor(Math.random() * 10000)}`,
    status: random(["pending", "pending", "pending", "reviewed", "contacted"]),
    notes: Math.random() > 0.7 ? `Applied via ${random(sources)}. ${isVeteran ? "Military veteran." : ""}` : null,
    applied_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  };
};

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  logger.info('Generate applications function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }

  try {
    const supabase = getServiceClient();

    const body = await req.json();
    const { count = 50, organization_id } = body as { count?: number; organization_id?: string };

    if (!organization_id) {
      return new Response(
        JSON.stringify({ 
          error: 'organization_id is required',
          message: 'Please provide an organization_id to generate applications for'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    logger.info('Generating applications', { count, organization_id });

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', organization_id)
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ 
          error: 'Organization not found',
          message: `No organization found with ID: ${organization_id}`
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    const { data: jobListings, error: jobError } = await supabase
      .from('job_listings')
      .select('id, title')
      .eq('organization_id', organization_id)
      .eq('status', 'active')
      .limit(50);

    if (jobError) {
      throw new Error(`Failed to fetch job listings: ${jobError.message}`);
    }

    if (!jobListings || jobListings.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No active job listings found for this organization',
          message: 'Please import jobs first before generating applications'
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }

    logger.info('Found job listings', { count: jobListings.length, organization: org.name });

    const applications: GeneratedApplication[] = [];
    for (let i = 0; i < count; i++) {
      const jobListing = random(jobListings);
      const application = generateApplication(jobListing.id);
      applications.push(application);
    }

    logger.info('Generated applications', { count: applications.length });

    const batchSize = 100;
    let insertedCount = 0;
    const errors: Array<{ batch: number; error: string }> = [];

    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('applications')
        .insert(batch)
        .select('id');

      if (error) {
        logger.error('Error inserting batch', { batch: i / batchSize + 1, error });
        errors.push({
          batch: i / batchSize + 1,
          error: error.message
        });
      } else {
        insertedCount += data?.length || 0;
        logger.info('Inserted batch', { batch: i / batchSize + 1, count: data?.length || 0 });
      }
    }

    logger.info('Successfully inserted applications', { count: insertedCount, organization: org.name });

    const { data: stats } = await supabase
      .from('applications')
      .select('status')
      .in('job_listing_id', jobListings.map((j: { id: string }) => j.id));

    const statusCounts = (stats || []).reduce((acc: Record<string, number>, app: { status: string | null }) => {
      const status = app.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Generated ${insertedCount} applications for ${org.name}`,
        details: {
          organization_id,
          organization_name: org.name,
          requested: count,
          inserted: insertedCount,
          job_listings: jobListings.length,
          status_breakdown: statusCounts,
          errors: errors.length > 0 ? errors : undefined
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: unknown) {
    logger.error('Error generating applications', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
};

serve(handler);
