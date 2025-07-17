import { supabase } from '@/integrations/supabase/client';
import { aiService } from '@/services/aiService';

/**
 * Background processor for handling AI operations asynchronously
 * This helps avoid blocking the UI during intensive operations
 */
export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private processingQueue: Map<string, Promise<any>> = new Map();
  private processingResults: Map<string, any> = new Map();
  
  // Singleton pattern
  public static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }
  
  /**
   * Queue a task for background processing
   * @param taskId Unique identifier for this task
   * @param taskFn Function to execute in the background
   * @param priority Priority level (higher = more important)
   * @returns Promise that resolves when task is complete
   */
  async queueTask<T>(
    taskId: string, 
    taskFn: () => Promise<T>,
    priority: number = 1
  ): Promise<{ taskId: string, status: string }> {
    // Store the task execution promise
    const taskPromise = taskFn()
      .then(result => {
        this.processingResults.set(taskId, { 
          status: 'completed',
          result,
          completedAt: new Date().toISOString()
        });
        return result;
      })
      .catch(error => {
        this.processingResults.set(taskId, { 
          status: 'failed',
          error: error.message,
          completedAt: new Date().toISOString()
        });
        console.error(`Task ${taskId} failed:`, error);
        throw error;
      })
      .finally(() => {
        // Remove from active queue when done
        setTimeout(() => {
          this.processingQueue.delete(taskId);
        }, 60000); // Keep for 1 minute for status checks
      });
    
    this.processingQueue.set(taskId, taskPromise);
    this.processingResults.set(taskId, { 
      status: 'processing', 
      startedAt: new Date().toISOString() 
    });
    
    return { taskId, status: 'queued' };
  }
  
  /**
   * Check the status of a background task
   */
  getTaskStatus(taskId: string): { status: string, result?: any, error?: string } {
    const result = this.processingResults.get(taskId);
    if (!result) {
      return { status: 'not_found' };
    }
    return result;
  }
  
  /**
   * Wait for a task to complete
   */
  async waitForTask<T>(taskId: string): Promise<T> {
    const taskPromise = this.processingQueue.get(taskId);
    if (!taskPromise) {
      const result = this.processingResults.get(taskId);
      if (result && result.status === 'completed') {
        return result.result;
      }
      throw new Error(`Task ${taskId} not found in queue`);
    }
    return taskPromise as Promise<T>;
  }
  
  /**
   * Process applications in the background
   */
  async processApplicationsBackground(
    applicationIds: string[], 
    parameters: any
  ): Promise<{ taskId: string, status: string }> {
    const taskId = `app_analysis_${Date.now()}`;
    
    return this.queueTask(taskId, async () => {
      // Fetch applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .in('id', applicationIds);
      
      if (error) throw error;
      if (!applications?.length) throw new Error('No applications found');
      
      // Process applications with AI service
      const results = [];
      for (const app of applications) {
        const result = await aiService.processRequest({
          prompt: 'Analyze application for fit and quality',
          data: app,
          sensitivity: 'internal',
          requiresAI: true,
          parameters: parameters
        });
        results.push({
          applicationId: app.id,
          analysis: result
        });
      }
      
      return results;
    });
  }
}

export const backgroundProcessor = BackgroundProcessor.getInstance();