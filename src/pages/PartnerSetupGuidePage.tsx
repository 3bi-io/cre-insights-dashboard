import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, Circle, BookOpen, Mail, ExternalLink, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://auwhcdpppldjlcaxzsme.supabase.co';
const BASE = `${SUPABASE_URL}/functions/v1/organization-api`;

const CodeBlock = ({ children }: { children: string }) => {
  const copy = () => {
    navigator.clipboard.writeText(children);
    toast.success('Copied to clipboard');
  };
  return (
    <div className="relative group">
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono whitespace-pre">
        <code>{children}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground"
        aria-label="Copy code"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
};

interface Step {
  title: string;
  description: string;
  content: React.ReactNode;
}

const steps: Step[] = [
  {
    title: 'Request API Access',
    description: 'Contact the Apply AI team to get started.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Reach out to the Apply AI team to request partner API access. You can email us directly or ask your account manager.
        </p>
        <p className="text-sm font-medium">Information we'll need:</p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Organization name</li>
          <li>Production domain(s) for CORS whitelisting (e.g. <code className="text-xs bg-muted px-1 py-0.5 rounded">https://yourapp.com</code>)</li>
          <li>Primary technical contact email</li>
          <li>Brief description of your integration use case</li>
        </ul>
        <a href="mailto:support@applyai.jobs?subject=Partner API Access Request" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Mail className="h-4 w-4" /> support@applyai.jobs
        </a>
      </div>
    ),
  },
  {
    title: 'Receive Your API Key',
    description: "Understand what credentials you'll receive.",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Once approved, we'll provide you with:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li><strong>API Key</strong> — a unique key scoped to your organization</li>
          <li><strong>Allowed Origins</strong> — the domains whitelisted for CORS</li>
          <li><strong>Rate Limit</strong> — your request quota (default: 100 req/min)</li>
        </ul>
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-warning-foreground font-medium">🔒 Keep your API key secret</p>
          <p className="text-xs text-muted-foreground mt-1">
            Never expose it in client-side code. Use it only in server-to-server calls or secure backend proxies.
          </p>
        </div>
      </div>
    ),
  },
  {
    title: 'Configure Your Environment',
    description: 'Set the base URL and API key in your app.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Add these environment variables to your application:
        </p>
        <CodeBlock>{`ORG_API_URL=${BASE}
ORG_API_KEY=your_api_key_here`}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          The base URL provides four endpoints: <code className="text-xs bg-muted px-1 py-0.5 rounded">/stats</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">/jobs</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">/clients</code>, and <code className="text-xs bg-muted px-1 py-0.5 rounded">/applications</code>.
        </p>
      </div>
    ),
  },
  {
    title: 'Test Your Connection',
    description: 'Verify everything works with a quick test call.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Run this cURL command to confirm your key and connectivity:
        </p>
        <CodeBlock>{`curl -i \\
  -H "x-api-key: YOUR_API_KEY" \\
  "${BASE}/stats"`}</CodeBlock>
        <p className="text-sm text-muted-foreground">Or in JavaScript (Node / server-side):</p>
        <CodeBlock>{`const res = await fetch(
  process.env.ORG_API_URL + "/stats",
  { headers: { "x-api-key": process.env.ORG_API_KEY } }
);
const data = await res.json();
console.log(data);
// Expected: { active_jobs, total_applications, ... }`}</CodeBlock>
        <p className="text-sm text-muted-foreground">
          A <Badge variant="outline" className="text-xs">200 OK</Badge> response with JSON confirms you're connected.
        </p>
      </div>
    ),
  },
  {
    title: 'Integrate Data',
    description: 'Choose how to consume the API in your product.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          You have two integration paths:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Direct API Calls</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Call <code className="bg-muted px-1 py-0.5 rounded">/jobs</code>, <code className="bg-muted px-1 py-0.5 rounded">/clients</code>, <code className="bg-muted px-1 py-0.5 rounded">/applications</code> from your backend. Full control over display and caching.
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Embed Widget</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Use our embeddable apply form at <code className="bg-muted px-1 py-0.5 rounded">/embed/apply</code> inside an iframe for zero-code job applications.
              </p>
            </CardContent>
          </Card>
        </div>
        <Link to="/api-docs" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <BookOpen className="h-4 w-4" /> Full API reference →
        </Link>
      </div>
    ),
  },
  {
    title: 'Go Live',
    description: 'Final checklist before launching to production.',
    content: (
      <div className="space-y-3">
        <p className="text-sm font-medium">Pre-launch checklist:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            Production domain(s) added to your allowed CORS origins
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            API key stored securely (env vars, secrets manager)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            Error handling for rate limits (HTTP 429) implemented
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
            Caching strategy in place to minimize redundant calls
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Questions or need to update your allowed domains? Contact <a href="mailto:support@applyai.jobs" className="text-primary hover:underline">support@applyai.jobs</a>.
        </p>
      </div>
    ),
  },
];

const PartnerSetupGuidePage: React.FC = () => {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const progress = Math.round((completed.size / steps.length) * 100);

  return (
    <>
      <Helmet>
        <title>Partner Setup Guide | Apply AI</title>
        <meta name="description" content="Step-by-step integration guide for partner organizations connecting to the Apply AI platform API." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
              Partner Integration Guide
            </h1>
            <p className="text-muted-foreground text-lg">
              Follow these steps to connect your platform to the Apply AI API.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
            {/* Main content */}
            <div className="space-y-6">
              {/* Progress */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {completed.size} of {steps.length} steps complete
                    </span>
                    <span className="text-sm text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardContent>
              </Card>

              {/* Steps */}
              <Accordion type="multiple" className="space-y-3">
                {steps.map((step, i) => (
                  <Card key={i}>
                    <AccordionItem value={`step-${i}`} className="border-0">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggle(i); }}
                            className="shrink-0"
                            aria-label={`Mark step ${i + 1} as ${completed.has(i) ? 'incomplete' : 'complete'}`}
                          >
                            {completed.has(i) ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          <div>
                            <span className="text-xs text-muted-foreground">Step {i + 1}</span>
                            <p className={`font-medium ${completed.has(i) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {step.title}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-5 pl-14">
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                        {step.content}
                      </AccordionContent>
                    </AccordionItem>
                  </Card>
                ))}
              </Accordion>
            </div>

            {/* Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-8 self-start">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/api-docs" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <BookOpen className="h-4 w-4" /> API Reference
                  </Link>
                  <a href="mailto:support@applyai.jobs" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" /> Support
                  </a>
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Footer cross-link */}
          <p className="text-center text-xs text-muted-foreground mt-12">
            Need the full endpoint reference? <Link to="/api-docs" className="text-primary hover:underline">View API Docs →</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default PartnerSetupGuidePage;
