import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { StructuredData, buildHowToSchema } from '@/components/StructuredData';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle2, Circle, BookOpen, Mail, Copy, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Copy code to clipboard"
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
          <Mail className="h-4 w-4" aria-hidden="true" /> support@applyai.jobs
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
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3" role="alert">
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
          <BookOpen className="h-4 w-4" aria-hidden="true" /> Full API reference →
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
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" aria-hidden="true" />
            Production domain(s) added to your allowed CORS origins
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" aria-hidden="true" />
            API key stored securely (env vars, secrets manager)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" aria-hidden="true" />
            Error handling for rate limits (HTTP 429) implemented
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" aria-hidden="true" />
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

const pdfSteps = [
  {
    title: '1. Request API Access',
    lines: [
      'Contact the Apply AI team at support@applyai.jobs to request partner API access.',
      'Provide: Organization name, production domain(s), technical contact email, integration use case.',
    ],
  },
  {
    title: '2. Receive Your API Key',
    lines: [
      'You will receive: an API Key (scoped to your org), allowed CORS origins, and your rate limit (default 100 req/min).',
      'Keep your API key secret — never expose it in client-side code.',
    ],
  },
  {
    title: '3. Configure Your Environment',
    lines: [
      `Set these environment variables:`,
      `  ORG_API_URL=${BASE}`,
      `  ORG_API_KEY=your_api_key_here`,
      'Endpoints: /stats, /jobs, /clients, /applications',
    ],
  },
  {
    title: '4. Test Your Connection',
    lines: [
      'Run: curl -H "x-api-key: YOUR_KEY" $ORG_API_URL/stats',
      'A 200 OK response with JSON confirms connectivity.',
    ],
  },
  {
    title: '5. Integrate Data',
    lines: [
      'Option A — Direct API Calls: call /jobs, /clients, /applications from your backend.',
      'Option B — Embed Widget: use the embeddable apply form at /embed/apply in an iframe.',
      'See full API reference at /api-docs.',
    ],
  },
  {
    title: '6. Go Live',
    lines: [
      'Pre-launch checklist:',
      '  ✓ Production domain(s) added to CORS origins',
      '  ✓ API key stored securely (env vars / secrets manager)',
      '  ✓ Error handling for rate limits (HTTP 429)',
      '  ✓ Caching strategy in place',
    ],
  },
];

const generatePdf = () => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 50;
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Apply AI — Partner Integration Guide', margin, y);
  y += 30;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  for (const step of pdfSteps) {
    checkPage(80);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(step.title, margin, y);
    y += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    for (const line of step.lines) {
      checkPage(16);
      const wrapped = doc.splitTextToSize(line, contentW);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 14;
    }
    y += 12;
  }

  checkPage(40);
  doc.setDrawColor(200);
  doc.line(margin, y, pageW - margin, y);
  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Support: support@applyai.jobs  |  API Docs: /api-docs  |  Base URL: ' + BASE, margin, y);

  doc.save('Apply-AI-Partner-Setup-Guide.pdf');
  toast.success('PDF downloaded');
};

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

  const breadcrumbs = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Partner Setup Guide', href: '/partner-setup' },
  ]);

  const howToSchema = buildHowToSchema({
    name: 'How to Integrate with the Apply AI Partner API',
    description: 'Step-by-step guide for partner organizations to connect to the Apply AI platform API.',
    totalTime: 'PT30M',
    steps: steps.map(s => ({ name: s.title, text: s.description })),
  });

  return (
    <>
      <SEO
        title="Partner Setup Guide | API Integration Walkthrough"
        description="Step-by-step integration guide for partner organizations connecting to the Apply AI platform API. Configure, test, and go live."
        keywords="partner integration, API setup guide, Apply AI partner, developer onboarding, API key setup"
        canonical="https://applyai.jobs/partner-setup"
      />
      <StructuredData data={[breadcrumbs, howToSchema]} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Partner Setup Guide</span>
          </nav>

          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                Partner Integration Guide
              </h1>
              <p className="text-muted-foreground text-lg">
                Follow these steps to connect your platform to the Apply AI API.
              </p>
            </div>
            <Button variant="outline" onClick={generatePdf} className="shrink-0 min-h-[44px]">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Download PDF
            </Button>
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
                  <Progress value={progress} className="h-2" aria-label={`Setup progress: ${progress}%`} />
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
                            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                            aria-label={`Mark step ${i + 1} "${step.title}" as ${completed.has(i) ? 'incomplete' : 'complete'}`}
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
            <aside className="space-y-4 lg:sticky lg:top-8 self-start" aria-label="Quick links">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/api-docs" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <BookOpen className="h-4 w-4" aria-hidden="true" /> API Reference
                  </Link>
                  <a href="mailto:support@applyai.jobs" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Mail className="h-4 w-4" aria-hidden="true" /> Support
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