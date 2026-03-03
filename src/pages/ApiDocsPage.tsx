import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Key, Globe, Zap, Shield } from 'lucide-react';

const SUPABASE_URL = 'https://auwhcdpppldjlcaxzsme.supabase.co';
const BASE = `${SUPABASE_URL}/functions/v1/organization-api`;

const CodeBlock = ({ children, lang = 'bash' }: { children: string; lang?: string }) => (
  <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono whitespace-pre">
    <code>{children}</code>
  </pre>
);

const endpoints = [
  {
    method: 'GET',
    path: '/clients',
    description: 'List all clients in your organization with job and application counts.',
    params: [],
    response: `{
  "clients": [
    {
      "id": "uuid",
      "name": "Acme Trucking",
      "city": "Dallas",
      "state": "TX",
      "logo_url": "https://...",
      "active_jobs": 5,
      "total_applications": 142,
      "applications_this_month": 23
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/jobs',
    description: 'List job postings with application counts. Supports filtering and pagination.',
    params: [
      { name: 'client_id', type: 'UUID', desc: 'Filter by client' },
      { name: 'status', type: 'string', desc: '"active" (default), "closed", or "all"' },
      { name: 'limit', type: 'number', desc: 'Max results (default: 100, max: 500)' },
      { name: 'offset', type: 'number', desc: 'Pagination offset (default: 0)' },
    ],
    response: `{
  "jobs": [
    {
      "id": "uuid",
      "title": "OTR CDL-A Driver",
      "location": "Dallas, TX",
      "city": "Dallas",
      "state": "TX",
      "status": "active",
      "client_id": "uuid",
      "application_count": 28,
      "created_at": "2026-01-15T..."
    }
  ],
  "total": 12
}`,
  },
  {
    method: 'GET',
    path: '/applications',
    description: 'List applications with applicant details. Supports filtering by client and status.',
    params: [
      { name: 'client_id', type: 'UUID', desc: 'Filter by client' },
      { name: 'status', type: 'string', desc: 'Filter by status (pending, reviewed, hired, etc.)' },
      { name: 'limit', type: 'number', desc: 'Max results (default: 50, max: 200)' },
      { name: 'offset', type: 'number', desc: 'Pagination offset (default: 0)' },
    ],
    response: `{
  "applications": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "status": "pending",
      "applied_at": "2026-03-01T...",
      "source": "Indeed",
      "city": "Houston",
      "state": "TX",
      "phone": "+1...",
      "email": "john@...",
      "experience": "5 years",
      "cdl": "Class A",
      "job_title": "OTR CDL-A Driver",
      "client_name": "Acme Trucking"
    }
  ],
  "total": 142
}`,
  },
  {
    method: 'GET',
    path: '/stats',
    description: 'Get aggregate statistics for your organization.',
    params: [],
    response: `{
  "total_clients": 3,
  "active_jobs": 12,
  "total_applications": 456,
  "applications_by_status": {
    "pending": 120,
    "reviewed": 200,
    "hired": 80,
    "rejected": 56
  },
  "applications_by_client": {
    "Acme Trucking": 200,
    "Swift Logistics": 150
  },
  "applications_this_week": 34
}`,
  },
];

const ApiDocsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>API Documentation | ApplyAI</title>
        <meta name="description" content="ApplyAI Organization API documentation. Integrate recruitment data into your own website dashboard." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Organization API</h1>
            <p className="text-muted-foreground text-lg">
              Integrate your recruitment data into your own website. Fetch clients, jobs, applications, and stats via a simple REST API.
            </p>
          </div>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">1. Generate an API key</p>
                <p className="text-sm text-muted-foreground">
                  Go to <strong>Dashboard → Settings → API Keys</strong> and generate a new key. Add your website's domain as an allowed origin.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">2. Make your first request</p>
                <CodeBlock>{`curl -H "x-api-key: YOUR_KEY" \\
  ${BASE}/stats`}</CodeBlock>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Or use the embeddable SDK (zero code)</p>
                <CodeBlock lang="html">{`<script src="https://applyai.jobs/sdk.js"
  data-api-key="YOUR_KEY"
  data-theme="light"
  data-accent="#6366f1">
</script>
<div id="applyai-dashboard"></div>`}</CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>All requests require an <code className="bg-muted px-1.5 py-0.5 rounded text-xs">x-api-key</code> header with your organization's API key.</p>
              <CodeBlock>{`fetch("${BASE}/stats", {
  headers: { "x-api-key": "your_api_key_here" }
})`}</CodeBlock>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Shield className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">CORS & Security</p>
                  <p className="text-muted-foreground">Each API key has configurable <strong>allowed origins</strong>. Only requests from whitelisted domains will succeed. Configure origins in Dashboard → Settings → API Keys.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <Zap className="h-4 w-4 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">Rate Limiting</p>
                  <p className="text-muted-foreground">Default: 100 requests/minute per API key. Exceeding the limit returns <code className="bg-background px-1 py-0.5 rounded text-xs">429 Too Many Requests</code>.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Code className="h-5 w-5" />
              Endpoints
            </h2>

            {endpoints.map((ep) => (
              <Card key={ep.path}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Badge variant="outline" className="font-mono text-xs">{ep.method}</Badge>
                    <code className="text-sm">/organization-api{ep.path}</code>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{ep.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ep.params.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">Query Parameters</p>
                      <div className="space-y-1">
                        {ep.params.map((p) => (
                          <div key={p.name} className="flex gap-3 text-sm">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono min-w-[100px]">{p.name}</code>
                            <Badge variant="secondary" className="text-xs">{p.type}</Badge>
                            <span className="text-muted-foreground">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wider">Response</p>
                    <CodeBlock lang="json">{ep.response}</CodeBlock>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* SDK Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Embeddable SDK
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>Drop the SDK script into any website to render a pre-built dashboard with your data. No coding required.</p>
              <CodeBlock lang="html">{`<script src="https://applyai.jobs/sdk.js"
  data-api-key="YOUR_KEY"
  data-container="#applyai-dashboard"
  data-theme="dark"
  data-accent="#10b981"
  data-sections="stats,jobs">
</script>
<div id="applyai-dashboard"></div>`}</CodeBlock>
              <div>
                <p className="font-medium mb-2">SDK Options</p>
                <div className="space-y-1">
                  {[
                    { attr: 'data-api-key', desc: 'Required. Your organization API key.' },
                    { attr: 'data-container', desc: 'CSS selector for the container (default: #applyai-dashboard)' },
                    { attr: 'data-theme', desc: '"light" or "dark" (default: light)' },
                    { attr: 'data-accent', desc: 'Hex color for accent (default: #6366f1)' },
                    { attr: 'data-sections', desc: 'Comma-separated: stats, clients, jobs, applications (default: all)' },
                  ].map((o) => (
                    <div key={o.attr} className="flex gap-3">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono min-w-[140px]">{o.attr}</code>
                      <span className="text-muted-foreground">{o.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="js">
                <TabsList>
                  <TabsTrigger value="js">JavaScript</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="js" className="mt-4">
                  <CodeBlock lang="javascript">{`const API_KEY = 'your_api_key';
const BASE = '${BASE}';

async function fetchStats() {
  const res = await fetch(BASE + '/stats', {
    headers: { 'x-api-key': API_KEY }
  });
  return res.json();
}

fetchStats().then(data => {
  console.log('Active jobs:', data.active_jobs);
  console.log('Total applications:', data.total_applications);
});`}</CodeBlock>
                </TabsContent>
                <TabsContent value="react" className="mt-4">
                  <CodeBlock lang="tsx">{`import { useEffect, useState } from 'react';

const API_KEY = 'your_api_key';
const BASE = '${BASE}';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(BASE + '/stats', {
      headers: { 'x-api-key': API_KEY }
    })
    .then(r => r.json())
    .then(setStats);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Active Jobs: {stats.active_jobs}</h2>
      <h2>Applications: {stats.total_applications}</h2>
    </div>
  );
}`}</CodeBlock>
                </TabsContent>
                <TabsContent value="curl" className="mt-4">
                  <CodeBlock>{`# Get stats
curl -H "x-api-key: YOUR_KEY" ${BASE}/stats

# Get jobs for a client
curl -H "x-api-key: YOUR_KEY" \\
  "${BASE}/jobs?client_id=UUID&status=active"

# Get recent applications
curl -H "x-api-key: YOUR_KEY" \\
  "${BASE}/applications?limit=25"`}</CodeBlock>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground pb-8">
            New partner? <Link to="/partner-setup" className="text-primary hover:underline">Follow our setup guide →</Link>
            {' · '}
            Questions? <a href="mailto:support@applyai.jobs" className="text-primary hover:underline">support@applyai.jobs</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ApiDocsPage;
