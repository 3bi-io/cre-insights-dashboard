/**
 * Voice Workflow Illustration Component
 * Mobile-responsive visual representation of the AI voice recruitment workflow
 */

import React from 'react';
import { User, Bot, Phone, CheckCircle } from 'lucide-react';

interface WorkflowStep {
  icon: React.ElementType;
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    icon: User,
    label: 'Design Intake',
    description: 'Your team calls AI and designs role',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
  },
  {
    icon: Bot,
    label: 'Taxonomy Adds',
    description: 'Validated knowledge, skills, and abilities',
    colorClass: 'text-accent',
    bgClass: 'bg-accent/10',
    borderClass: 'border-accent/30',
  },
  {
    icon: Phone,
    label: 'AI Calls Candidate',
    description: 'Secured / anti-fraud conversation',
    colorClass: 'text-success',
    bgClass: 'bg-success/10',
    borderClass: 'border-success/30',
  },
  {
    icon: CheckCircle,
    label: 'Complete Validation',
    description: 'Ready for interview',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
  },
];

const VoiceWorkflowIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8 md:mt-12 px-2">
      {/* Desktop/Tablet: Horizontal layout with SVG connecting lines */}
      <div className="hidden sm:block relative">
        {/* SVG connecting lines - percentage based for responsiveness */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Connecting lines between steps - using percentages */}
          <line x1="18%" y1="35%" x2="32%" y2="35%" stroke="url(#lineGradient1)" strokeWidth="0.5" strokeDasharray="2 1" className="motion-safe:animate-pulse" />
          <line x1="43%" y1="35%" x2="57%" y2="35%" stroke="url(#lineGradient2)" strokeWidth="0.5" strokeDasharray="2 1" className="motion-safe:animate-pulse" style={{ animationDelay: '0.2s' }} />
          <line x1="68%" y1="35%" x2="82%" y2="35%" stroke="url(#lineGradient3)" strokeWidth="0.5" strokeDasharray="2 1" className="motion-safe:animate-pulse" style={{ animationDelay: '0.4s' }} />
        </svg>

        {/* Workflow steps - horizontal */}
        <div className="relative z-10 grid grid-cols-4 gap-4 md:gap-6">
          {workflowSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.label}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${step.bgClass} border-2 ${step.borderClass} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <StepIcon 
                      className={`h-6 w-6 md:h-7 md:w-7 ${step.colorClass} ${
                        index === 1 ? 'motion-safe:animate-pulse' : ''
                      } ${index === 2 ? 'motion-safe:animate-bounce' : ''}`}
                      style={index === 2 ? { animationDuration: '2s' } : undefined}
                    />
                  </div>
                  {/* Step number badge */}
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${
                    index === 1 ? 'bg-accent text-accent-foreground' : 
                    index === 2 ? 'bg-success text-success-foreground' : 
                    'bg-primary text-primary-foreground'
                  } flex items-center justify-center text-xs font-bold`}>
                    {index + 1}
                  </div>
                  {/* Pulse ring for AI step */}
                  {index === 1 && (
                    <div className="absolute inset-0 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-accent/40 motion-safe:animate-ping opacity-75" />
                  )}
                  {/* Sound wave effect for callback step */}
                  {index === 2 && (
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <div className="w-0.5 h-2 bg-success/60 rounded-full motion-safe:animate-pulse" />
                      <div className="w-0.5 h-3 bg-success/60 rounded-full motion-safe:animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <div className="w-0.5 h-2 bg-success/60 rounded-full motion-safe:animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
                <span className="text-sm md:text-base font-semibold text-foreground mt-3 mb-1">
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground leading-tight hidden md:block max-w-[100px]">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: 2x2 Grid layout without SVG lines */}
      <div className="sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          {workflowSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.label}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold ${
                    index === 1 ? 'text-accent' : 
                    index === 2 ? 'text-success' : 
                    'text-primary'
                  }`}>
                    {index + 1}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-full ${step.bgClass} border-2 ${step.borderClass} flex items-center justify-center shadow-md`}
                  >
                    <StepIcon 
                      className={`h-5 w-5 ${step.colorClass} ${
                        index === 2 ? 'motion-safe:animate-bounce' : ''
                      }`}
                      style={index === 2 ? { animationDuration: '2s' } : undefined}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground leading-tight mt-1">
                  {step.description}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile: Flow indicator */}
        <div className="flex justify-center items-center mt-4 gap-1.5 text-xs">
          <span className="text-primary font-medium">Intake</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-accent font-medium">Taxonomy</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-success font-medium">Call</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-primary font-medium">Validate</span>
        </div>
      </div>

      {/* Floating notification - responsive positioning */}
      <div className="mt-8 sm:mt-10 flex justify-center">
        <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 motion-safe:animate-pulse">
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
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
