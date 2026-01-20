// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { createLogger } from "../_shared/logger.ts";

const logger = createLogger('background-tasks');

type TaskParameters = {
  data: any;
  sensitivity: string;
  task_type: string;
  user_id: string;
  expires_at?: string;
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Main handler
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request body
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

    // Start background execution using EdgeRuntime
    const backgroundTask = processTaskInBackground(task_id, parameters);
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
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

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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

// Background task processing
async function processTaskInBackground(taskId: string, parameters: TaskParameters): Promise<void> {
  logger.info('Starting background task', { taskId, taskType: parameters.task_type });
  
  try {
    // Update task status to processing
    await updateTaskStatus(taskId, "processing");
    
    // Process based on task type
    let result;
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
    
    // Store results and update status
    await storeTaskResults(taskId, result);
    await updateTaskStatus(taskId, "completed");
    
    logger.info('Task completed successfully', { taskId });
  } catch (error) {
    logger.error('Task failed', error, { taskId });
    await updateTaskStatus(taskId, "failed", error.message);
  }
}

// Helper for application processing
async function processApplications(parameters: TaskParameters): Promise<any> {
  const { data } = parameters;
  
  // Fetch applications if IDs are provided
  let applications = data.applications;
  if (data.application_ids && !applications) {
    const { data: fetchedApps, error } = await supabase
      .from("applications")
      .select("*")
      .in("id", data.application_ids);
      
    if (error) throw error;
    applications = fetchedApps;
  }
  
  if (!applications?.length) {
    throw new Error("No applications to process");
  }
  
  // Here you'd call AI services to analyze applications
  // For example, send each to OpenAI or Anthropic for analysis
  
  // For now, return a simple analysis
  return {
    processed_count: applications.length,
    summary: `Processed ${applications.length} applications`,
    applications: applications.map(app => ({
      id: app.id,
      score: Math.random() * 100,
      insights: "Application processed in background task"
    }))
  };
}

// Helper for metric calculations
async function calculateMetrics(parameters: TaskParameters): Promise<any> {
  const { user_id } = parameters;
  
  // Calculate AI vs traditional metrics
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);
  
  // Get metrics data
  const { data: jobData, error: jobError } = await supabase
    .from("job_listings")
    .select("id, title, created_at")
    .eq("user_id", user_id)
    .gte("created_at", monthAgo.toISOString());
  
  if (jobError) throw jobError;
  
  // Simulate calculating metrics
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
  
  // Store metrics in the database
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

// Helper for cache cleanup
async function cleanupCache(): Promise<any> {
  // Call the database function to clean expired cache
  await supabase.rpc("cleanup_expired_cache");
  
  return { 
    status: "Cleanup completed",
    timestamp: new Date().toISOString()
  };
}

// Update task status in the database
async function updateTaskStatus(
  taskId: string, 
  status: "queued" | "processing" | "completed" | "failed",
  error?: string
): Promise<void> {
  await supabase
    .from("background_tasks")
    .update({
      status,
      error_message: error,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);
}

// Store task results
async function storeTaskResults(taskId: string, results: any): Promise<void> {
  await supabase
    .from("background_tasks")
    .update({
      results,
      updated_at: new Date().toISOString()
    })
    .eq("id", taskId);
}