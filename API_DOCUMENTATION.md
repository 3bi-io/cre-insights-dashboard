# API Documentation

Complete reference for Apply AI backend APIs and Edge Functions.

## 🌐 Base URLs

### Supabase API
```
https://auwhcdpppldjlcaxzsme.supabase.co
```

### Edge Functions
```
https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1
```

## 🔑 Authentication

All API requests require authentication using Supabase Auth.

### Headers
```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'apikey': 'your-anon-key'
}
```

### Getting Access Token
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;
```

## 📊 Database Tables

### Applications

**Table:** `applications`

Stores job application data.

#### Schema
```typescript
interface Application {
  id: string;                    // UUID
  job_id: string;               // Foreign key to jobs
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  resume_url?: string;
  cover_letter?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'offered' | 'rejected' | 'hired';
  applied_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
  organization_id: string;      // Foreign key to organizations
  user_id?: string;            // User who created (if registered)
}
```

#### Query Examples

**Fetch all applications**
```typescript
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .order('applied_at', { ascending: false });
```

**Fetch applications for specific job**
```typescript
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .eq('job_id', jobId);
```

**Update application status**
```typescript
const { data, error } = await supabase
  .from('applications')
  .update({ status: 'interviewed' })
  .eq('id', applicationId);
```

### Jobs

**Table:** `jobs`

Stores job posting data.

#### Schema
```typescript
interface Job {
  id: string;                    // UUID
  title: string;
  description: string;
  requirements: string[];
  location?: string;
  salary_range?: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'published' | 'closed';
  posted_at?: string;           // ISO timestamp
  expires_at?: string;          // ISO timestamp
  organization_id: string;
  created_by: string;           // User ID
  created_at: string;
  updated_at: string;
}
```

#### Query Examples

**Fetch active jobs**
```typescript
const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('status', 'published')
  .order('posted_at', { ascending: false });
```

**Create new job**
```typescript
const { data, error } = await supabase
  .from('jobs')
  .insert({
    title: 'Senior Developer',
    description: 'Job description...',
    requirements: ['React', 'TypeScript', '5+ years'],
    employment_type: 'full-time',
    status: 'draft',
    organization_id: orgId,
    created_by: userId
  });
```

### Candidate Scores

**Table:** `candidate_scores`

Stores AI-generated candidate evaluation scores.

#### Schema
```typescript
interface CandidateScore {
  id: string;
  application_id: string;       // Foreign key to applications
  score: number;                // 0-100
  confidence_level: number;     // 0-1
  score_type: 'initial' | 'detailed' | 'final';
  factors: {
    technical_skills: number;
    experience_match: number;
    education_relevance: number;
    cultural_fit: number;
    communication_skills: number;
    problem_solving: number;
  };
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  created_at: string;
  updated_at: string;
}
```

#### Query Examples

**Fetch score for application**
```typescript
const { data, error } = await supabase
  .from('candidate_scores')
  .select('*')
  .eq('application_id', applicationId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();
```

## ⚡ Edge Functions

### 1. Analyze Candidate

**Endpoint:** `POST /functions/v1/analyze-candidate`

Analyzes a candidate's application using AI and generates a detailed score.

#### Request
```typescript
{
  applicationId: string;
  scoreType?: 'initial' | 'detailed' | 'final';
  reanalyze?: boolean;
}
```

#### Response
```typescript
{
  success: boolean;
  score: CandidateScore;
  message?: string;
}
```

#### Example
```typescript
const response = await fetch(
  'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/analyze-candidate',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      applicationId: 'uuid',
      scoreType: 'detailed',
      reanalyze: false
    })
  }
);

const result = await response.json();
```

#### AI Model
Uses the Lovable AI Gateway with `google/gemini-2.5-flash` model for:
- Resume analysis
- Skills extraction
- Experience matching
- Cultural fit assessment
- Strength identification
- Concern detection
- Recommendation generation

### 2. Rank Candidates

**Endpoint:** `POST /functions/v1/rank-candidates`

Ranks all candidates for a specific job based on their scores.

#### Request
```typescript
{
  jobId: string;
  sortBy?: 'score' | 'match_percentage' | 'applied_date';
  order?: 'asc' | 'desc';
  filters?: {
    minScore?: number;
    status?: ApplicationStatus[];
  };
}
```

#### Response
```typescript
{
  success: boolean;
  rankings: Array<{
    rank: number;
    applicationId: string;
    candidateName: string;
    score: number;
    matchPercentage: number;
    status: string;
    appliedAt: string;
  }>;
  total: number;
}
```

#### Example
```typescript
const response = await fetch(
  'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/rank-candidates',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jobId: 'uuid',
      sortBy: 'score',
      order: 'desc',
      filters: { minScore: 70 }
    })
  }
);

const result = await response.json();
```

### 3. Generate Report

**Endpoint:** `POST /functions/v1/generate-report`

Generates comprehensive analytics reports.

#### Request
```typescript
{
  reportType: 'performance' | 'bias' | 'predictive' | 'comparative';
  dateRange: {
    start: string;  // ISO date
    end: string;    // ISO date
  };
  filters?: {
    jobIds?: string[];
    departments?: string[];
  };
  format?: 'json' | 'csv' | 'pdf';
}
```

#### Response
```typescript
{
  success: boolean;
  report: ReportData;
  downloadUrl?: string;  // For CSV/PDF formats
}
```

#### Example
```typescript
const response = await fetch(
  'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/generate-report',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reportType: 'performance',
      dateRange: {
        start: '2025-01-01',
        end: '2025-01-31'
      },
      format: 'json'
    })
  }
);

const result = await response.json();
```

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Applications Table

**SELECT Policy**
```sql
-- Users can view applications in their organization
CREATE POLICY "Users can view org applications"
ON applications FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

**INSERT Policy**
```sql
-- Users can create applications in their organization
CREATE POLICY "Users can create applications"
ON applications FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

**UPDATE Policy**
```sql
-- Users can update applications in their organization
CREATE POLICY "Users can update org applications"
ON applications FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

### Jobs Table

Similar policies apply to the jobs table, ensuring users can only access jobs within their organization.

### Candidate Scores Table

Scores inherit access control from their associated applications.

## 📈 Rate Limiting

### Current Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| analyze-candidate | 10 requests | 1 minute |
| rank-candidates | 20 requests | 1 minute |
| generate-report | 5 requests | 1 minute |
| Database queries | 100 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1642531200
```

### Error Response
```typescript
{
  error: "Rate limit exceeded",
  retryAfter: 60  // seconds
}
```

## 🔍 Error Handling

### Standard Error Response
```typescript
{
  error: string;
  message?: string;
  details?: any;
  statusCode: number;
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Examples

**Authentication Error**
```typescript
{
  error: "Unauthorized",
  message: "Invalid or expired token",
  statusCode: 401
}
```

**Validation Error**
```typescript
{
  error: "Validation Error",
  message: "Invalid request parameters",
  details: {
    applicationId: "Required field"
  },
  statusCode: 400
}
```

## 🧪 Testing

### Using cURL

**Analyze Candidate**
```bash
curl -X POST \
  https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/analyze-candidate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"applicationId": "uuid", "scoreType": "detailed"}'
```

### Using Postman

1. Import the Postman collection (link in repository)
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `ACCESS_TOKEN`
3. Run requests

## 📚 SDK Examples

### React Hook Example

```typescript
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useApplications = (jobId?: string) => {
  return useQuery({
    queryKey: ['applications', jobId],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select('*');
      
      if (jobId) {
        query = query.eq('job_id', jobId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });
};
```

### Edge Function Call Example

```typescript
import { supabase } from '@/integrations/supabase/client';

export const analyzeCandidateAPI = async (
  applicationId: string,
  scoreType: 'initial' | 'detailed' | 'final' = 'detailed'
) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(
    `${supabase.supabaseUrl}/functions/v1/analyze-candidate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ applicationId, scoreType })
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze candidate');
  }
  
  return response.json();
};
```

## 🔐 Security Best Practices

1. **Never expose service role key** - Use anon key in client-side code
2. **Always use RLS** - Ensure all tables have proper RLS policies
3. **Validate input** - Sanitize all user input in edge functions
4. **Use HTTPS** - Never send credentials over unencrypted connections
5. **Rotate keys** - Regularly rotate API keys and secrets
6. **Monitor usage** - Set up alerts for unusual API activity

## 📝 Changelog

### v1.0.0 (Current)
- Initial API release
- Basic CRUD operations
- AI analysis endpoints
- Candidate ranking
- Report generation

---

For support, refer to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue on GitHub.
