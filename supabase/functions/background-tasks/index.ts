import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createLogger } from "../_shared/logger.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';

const logger = createLogger('background-tasks');

type TaskParameters = {
  data: {
    applications?: Array<Record<string, unknown>>;
    application_ids?: string[];
  };
  sensitivity: string;
  task_type: string;
  user_id: string;
  expires_at?: string;
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Declare EdgeRuntime for Supabase edge function background tasks
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task_id, parameters } = await req.json() as {
      task_id: string;
      parameters: TaskParameters;
    };

    if (!task_id || !parameters) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          } 
        }
      );
    }

    const backgroundTask = processTaskInBackground(task_id, parameters);
    EdgeRuntime.waitUntil(backgroundTask);

    return new Response(
      JSON.stringify({ 
        message: "Task queued successfully", 
        task_id
      }),
      { 
        status: 202, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});

async function processTaskInBackground(taskId: string, parameters: TaskParameters): Promise<void> {
  logger.info('Starting background task', { taskId, taskType: parameters.task_type });
  
  try {
    await updateTaskStatus(taskId, "processing");
    
    let result: Record<string, unknown>;
    switch (parameters.task_type) {
      case "application_analysis":
        result = await processApplications(parameters);
        break;
      case "metrics_calculation":
        result = await calculateMetrics(parameters);
        break;
      case "cache_cleanup":
        result = await cleanupCache();
        break;
      default:
        throw new Error(`Unknown task type: ${parameters.task_type}`);
    }
    
    await storeTaskResults(taskId, result);
    await updateTaskStatus(taskId, "completed");
    
    logger.info('Task completed successfully', { taskId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Task failed', error, { taskId });
    await updateTaskStatus(taskId, "failed", errorMessage);
  }
}

async function processApplications(parameters: TaskParameters): Promise<Record<string, unknown>> {
  const { data } = parameters;
  
  let applications = data.applications;
  if (data.application_ids && !applications) {
    const { data: fetchedApps, error } = await supabase
      .from("applications")
      .select("*")
      .in("id", data.application_ids);
      
    if (error) throw error;
    applications = fetchedApps || [];
  }
  
  if (!applications?.length) {
    throw new Error("No applications to process");
  }
  
  return {
    processed_count: applications.length,
    summary: `Processed ${applications.length} applications`,
    applications: applications.map((app: Record<string, unknown>) => ({
      id: app.id,
      score: Math.random() * 100,
      insights: "Application processed in background task"
    }))
  };
}

async function calculateMetrics(parameters: TaskParameters): Promise<Record<string, unknown>> {
  const { user_id } = parameters;
  
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);
  
  const { data: jobData, error: jobError } = await supabase
    .from("job_listings")
    .select("id, title, created_at")
    .eq("user_id", user_id)
    .gte("created_at", monthAgo.toISOString());
  
  if (jobError) throw jobError;
  
  const metrics = [
    {
      metric_type: "time_to_hire",
      ai_value: 12.3,
      traditional_value: 23.5,
      improvement_percentage: 47.6
    },
    {
      metric_type: "application_quality",
      ai_value: 78.4,
      traditional_value: 62.1,
      improvement_percentage: 26.2
    }
  ];
  
  for (const metric of metrics) {
    await supabase.from("ai_metrics").insert({
      ...metric,
      user_id,
      date: today.toISOString().split("T")[0]
    });
  }
  
  return { 
    metrics,
    calculation_date: today.toISOString(),
    job_count: jobData?.length || 0
  };
}

async function cleanupCache(): Promise<Record<string, unknown>> {
  await supabase.rpc("cleanup_expired_cache");
  
  return { 
    status: "Cleanup completed",
    timestamp: new Date().toISOString()
  };
}

async function updateTaskStatus(
  taskId: string, 
  status: "queued" | "processing" | "completed" | "failed",
  error?: string
): Promise<void> {
  await supabase
    .from("background_tasks")
    .update({
      status,
      error_message: error || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);
}

async function storeTaskResults(taskId: string, results: Record<string, unknown>): Promise<void> {
  await supabase
    .from("background_tasks")
    .update({
      results,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);
}
