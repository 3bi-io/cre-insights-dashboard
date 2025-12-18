/**
 * Voice Workflow Illustration Component
 * Animated visual showing the AI voice recruitment flow
 */

import React from 'react';
import { Phone, Bot, CheckCircle, User } from 'lucide-react';

const VoiceWorkflowIllustration = () => {
  return (
    <div className="relative w-full max-w-2xl mx-auto mt-8 md:mt-12">
      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 120">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Animated dashed lines connecting steps */}
        <path
          d="M100 60 L250 60"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          fill="none"
          className="motion-safe:animate-[dash_2s_linear_infinite]"
        />
        <path
          d="M350 60 L500 60"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeDasharray="8 4"
          fill="none"
          className="motion-safe:animate-[dash_2s_linear_infinite]"
          style={{ animationDelay: '0.5s' }}
        />
      </svg>

      {/* Steps container */}
      <div className="relative flex items-center justify-between px-4 sm:px-8">
        {/* Step 1: Jobseeker Applies */}
        <div className="flex flex-col items-center gap-2 group">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors duration-300">
              <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </div>
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center max-w-[80px]">
            Jobseeker Applies
          </span>
        </div>

        {/* Step 2: AI Processes */}
        <div className="flex flex-col items-center gap-2 group">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center group-hover:border-accent/60 transition-colors duration-300">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-accent motion-safe:animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
              2
            </div>
            {/* Pulse ring effect */}
            <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-accent/40 motion-safe:animate-ping opacity-75" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center max-w-[80px]">
            AI Screens
          </span>
        </div>

        {/* Step 3: Instant Callback */}
        <div className="flex flex-col items-center gap-2 group">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center group-hover:border-success/60 transition-colors duration-300">
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-success motion-safe:animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-success text-success-foreground flex items-center justify-center text-xs font-bold">
              3
            </div>
            {/* Sound wave effect */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
              <div className="w-0.5 h-2 bg-success/60 rounded-full motion-safe:animate-[soundwave_1s_ease-in-out_infinite]" />
              <div className="w-0.5 h-3 bg-success/60 rounded-full motion-safe:animate-[soundwave_1s_ease-in-out_infinite_0.1s]" />
              <div className="w-0.5 h-2 bg-success/60 rounded-full motion-safe:animate-[soundwave_1s_ease-in-out_infinite_0.2s]" />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center max-w-[80px]">
            AI Callback
          </span>
        </div>

        {/* Step 4: Hired */}
        <div className="flex flex-col items-center gap-2 group">
          <div className="relative">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:border-primary/60 transition-colors duration-300">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              4
            </div>
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground text-center max-w-[80px]">
            Hired Fast
          </span>
        </div>
      </div>

      {/* Floating notification mockup */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 motion-safe:animate-[float_3s_ease-in-out_infinite]">
        <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <Phone className="w-4 h-4 text-success" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-foreground">AI Calling Now</p>
            <p className="text-[10px] text-muted-foreground">New applicant • 2 min ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceWorkflowIllustration;
