/**
 * useSimulationAnalytics
 * Tracks engagement inside the geo-restricted simulation apply flow.
 * All writes go to `simulation_events` (anon INSERT allowed, no PII stored).
 */

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type SimEventType =
  | 'session_start'
  | 'step_complete'
  | 'step_dropoff'
  | 'simulation_complete'
  | 'waitlist_joined';

const STEP_NAMES: Record<number, string> = {
  1: 'personal_info',
  2: 'cdl_info',
  3: 'background',
  4: 'consent',
};

interface SimAnalyticsOptions {
  country?: string | null;
  countryCode?: string | null;
  jobListingId?: string | null;
}

/** Generate a lightweight session ID (no crypto needed, not a security use-case) */
function generateSessionId(): string {
  return `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useSimulationAnalytics({
  country,
  countryCode,
  jobListingId,
}: SimAnalyticsOptions) {
  const sessionId = useRef<string>(generateSessionId());
  const stepEnteredAt = useRef<number>(Date.now());
  // Track which steps were already logged to avoid double-firing
  const loggedSteps = useRef<Set<number>>(new Set());
  const sessionStarted = useRef(false);

  const log = useCallback(
    async (
      eventType: SimEventType,
      extra?: {
        stepNumber?: number;
        totalStepsCompleted?: number;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const stepNumber = extra?.stepNumber;
      const stepName = stepNumber != null ? STEP_NAMES[stepNumber] : undefined;
      const timeOnStepMs =
        stepNumber != null ? Math.round(Date.now() - stepEnteredAt.current) : undefined;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('simulation_events') as any).insert({
          session_id: sessionId.current,
          event_type: eventType,
          step_number: stepNumber ?? null,
          step_name: stepName ?? null,
          country: country ?? null,
          country_code: countryCode ?? null,
          job_listing_id: jobListingId ?? null,
          time_on_step_ms: timeOnStepMs ?? null,
          total_steps_completed: extra?.totalStepsCompleted ?? null,
          metadata: extra?.metadata ?? null,
        });
      } catch (err) {
        // Analytics failures should never surface to the user
        logger.debug('Simulation analytics log error (non-critical)', { err });
      }
    },
    [country, countryCode, jobListingId]
  );

  /** Called once when the form mounts */
  const trackSessionStart = useCallback(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    stepEnteredAt.current = Date.now();
    log('session_start');
  }, [log]);

  /** Called when the user successfully advances to the next step */
  const trackStepComplete = useCallback(
    (completedStep: number, totalCompleted: number) => {
      if (loggedSteps.current.has(completedStep)) return;
      loggedSteps.current.add(completedStep);
      log('step_complete', { stepNumber: completedStep, totalStepsCompleted: totalCompleted });
      // Reset timer for the next step
      stepEnteredAt.current = Date.now();
    },
    [log]
  );

  /** Called on unmount if the form wasn't completed (drop-off detection) */
  const trackDropoff = useCallback(
    (currentStep: number, totalCompleted: number) => {
      // Only log if user made it past step 1 (they engaged meaningfully)
      if (totalCompleted === 0) return;
      log('step_dropoff', {
        stepNumber: currentStep,
        totalStepsCompleted: totalCompleted,
        metadata: { dropped_on_step_name: STEP_NAMES[currentStep] },
      });
    },
    [log]
  );

  /** Called when user reaches the SimulationCompleteScreen */
  const trackSimulationComplete = useCallback(() => {
    log('simulation_complete', { totalStepsCompleted: 4 });
  }, [log]);

  /** Called from SimulationCompleteScreen after waitlist insert succeeds */
  const trackWaitlistJoined = useCallback(() => {
    log('waitlist_joined', { totalStepsCompleted: 4 });
  }, [log]);

  return {
    sessionId: sessionId.current,
    trackSessionStart,
    trackStepComplete,
    trackDropoff,
    trackSimulationComplete,
    trackWaitlistJoined,
  };
}
