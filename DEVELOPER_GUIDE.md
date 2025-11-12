# Developer Guide

Complete guide to ATS.me architecture, patterns, and development practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Design Patterns](#design-patterns)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Database Schema](#database-schema)
7. [Authentication & Authorization](#authentication--authorization)
8. [Performance Optimization](#performance-optimization)
9. [SEO Implementation](#seo-implementation)
10. [Error Handling](#error-handling)
11. [Development Workflow](#development-workflow)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   React    │  │ React Query  │  │  Service Worker │ │
│  │  (UI Layer)│◄─┤ (State Mgmt) │  │   (PWA/Cache)   │ │
│  └─────┬──────┘  └──────┬───────┘  └────────┬────────┘ │
└────────┼─────────────────┼──────────────────┼──────────┘
         │                 │                  │
         ▼                 ▼                  ▼
    ┌────────────────────────────────────────────┐
    │         Supabase Backend (BaaS)            │
    │  ┌──────────────┐  ┌──────────────────┐   │
    │  │  PostgreSQL  │  │  Edge Functions  │   │
    │  │   Database   │  │    (Deno)       │   │
    │  │   + RLS      │  │                  │   │
    │  └──────────────┘  └──────────────────┘   │
    │  ┌──────────────┐  ┌──────────────────┐   │
    │  │     Auth     │  │    Storage       │   │
    │  │  (GoTrue)    │  │                  │   │
    │  └──────────────┘  └──────────────────┘   │
    └────────────────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │   External APIs     │
            │  - Meta Ads         │
            │  - Tenstreet        │
            │  - Job Boards       │
            └─────────────────────┘
```

### Technology Stack

**Frontend**:
- React 18.3 (UI framework)
- TypeScript 5.5 (Type safety)
- Vite 6.0 (Build tool)
- TailwindCSS 3.4 (Styling)
- React Query 5.56 (Server state)
- React Router 6.26 (Routing)

**Backend**:
- Supabase (Backend as a Service)
- PostgreSQL 15 (Database)
- Deno (Edge Functions runtime)
- Row Level Security (Data security)

**Infrastructure**:
- Lovable Platform (Hosting)
- Sentry (Error tracking)
- Google Analytics (Analytics)

---

## Project Structure

### Directory Organization

```
src/
├── components/          # Shared UI components
│   ├── ui/             # Base UI components (shadcn)
│   ├── error/          # Error boundaries & fallbacks
│   ├── routing/        # Route configuration
│   ├── SEO.tsx         # SEO meta tags component
│   └── StructuredData.tsx  # JSON-LD schemas
│
├── features/           # Feature-based modules
│   ├── landing/        # Landing page feature
│   │   ├── components/ # Feature-specific components
│   │   └── content/    # Content configuration
│   ├── admin/          # Admin dashboard feature
│   └── shared/         # Shared feature utilities
│
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   ├── useAuthCache.ts # Auth caching layer
│   └── useSEO.ts       # SEO utilities hook
│
├── integrations/       # External service integrations
│   └── supabase/
│       ├── client.ts   # Supabase client setup
│       └── types.ts    # Generated DB types
│
├── lib/                # Utility libraries
│   ├── seo.ts          # SEO utilities export
│   ├── sentry.ts       # Error monitoring
│   └── logger.ts       # Logging utility
│
├── pages/              # Page components
│   ├── public/         # Public pages (no auth)
│   │   ├── LandingPage.tsx
│   │   ├── FeaturesPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── BlogListPage.tsx
│   │   └── BlogPostPage.tsx
│   └── admin/          # Protected admin pages
│       ├── Dashboard.tsx
│       └── BlogAdminPage.tsx
│
├── tests/              # Test files
│   ├── e2e/            # End-to-end tests (Playwright)
│   ├── integration/    # Integration tests
│   └── setup.ts        # Test configuration
│
├── utils/              # Helper functions
│   ├── seoUtils.ts     # SEO helper functions
│   ├── sitemapGenerator.ts
│   └── testHelpers.ts
│
├── data/               # Static data & configuration
│   └── keywords.ts     # SEO keywords
│
├── App.tsx             # Root component
├── index.css           # Global styles & design tokens
└── main.tsx            # Application entry point
```

### File Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.tsx`)
- **Utilities**: camelCase (`seoUtils.ts`)
- **Tests**: Same as source with `.test.tsx` (`Button.test.tsx`)
- **Types**: PascalCase (`UserTypes.ts`)
- **Constants**: UPPER_SNAKE_CASE in files

---

## Design Patterns

### Component Patterns

#### 1. Container/Presentational Pattern

**Container Component** (Smart - handles logic):
```typescript
// UserListContainer.tsx
export const UserListContainer = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  if (isLoading) return <Skeleton />;
  
  return <UserList users={data} />;
};
```

**Presentational Component** (Dumb - renders UI):
```typescript
// UserList.tsx
interface UserListProps {
  users: User[];
}

export const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

#### 2. Compound Component Pattern

```typescript
// Card.tsx
export const Card = ({ children }) => (
  <div className="card">{children}</div>
);

Card.Header = ({ children }) => (
  <div className="card-header">{children}</div>
);

Card.Body = ({ children }) => (
  <div className="card-body">{children}</div>
);

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

#### 3. Render Props Pattern

```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (data: T, loading: boolean) => React.ReactNode;
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const { data, isLoading } = useQuery(['data', url], () => fetch(url));
  return <>{render(data, isLoading)}</>;
}

// Usage
<DataFetcher
  url="/api/users"
  render={(data, loading) => loading ? <Spinner /> : <UserList users={data} />}
/>
```

### Hook Patterns

#### Custom Hook Template

```typescript
// useFeature.ts
import { useState, useEffect, useCallback } from 'react';

interface UseFeatureOptions {
  // Options
}

interface UseFeatureReturn {
  // Return values
}

export function useFeature(options: UseFeatureOptions): UseFeatureReturn {
  const [state, setState] = useState(initialState);

  const action = useCallback(() => {
    // Logic
  }, [dependencies]);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return {
    state,
    action,
  };
}
```

#### Composition Pattern

```typescript
// Combine multiple hooks
export function useUserWithPosts(userId: string) {
  const user = useUser(userId);
  const posts = usePosts(user?.id);
  const comments = useComments(posts?.map(p => p.id));

  return {
    user,
    posts,
    comments,
    isLoading: user.isLoading || posts.isLoading || comments.isLoading,
  };
}
```

---

## State Management

### React Query (Server State)

**Query Setup**:
```typescript
// App.tsx - Global configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes (cache time)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    },
  },
});
```

**Usage Patterns**:

```typescript
// Simple query
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});

// Query with parameters
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId, // Conditional fetching
});

// Mutation
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Optimistic updates
const updateMutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ['users'] });
    const previousUsers = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old) => [...old, newUser]);
    return { previousUsers };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(['users'], context.previousUsers);
  },
});
```

### Local State (useState)

```typescript
// Simple state
const [count, setCount] = useState(0);

// Complex state with reducer pattern
const [state, dispatch] = useReducer(reducer, initialState);

// Derived state
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

### Context (Global State)

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ... auth logic

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

---

## API Integration

### Supabase Client

```typescript
// client.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = 'https://auwhcdpppldjlcaxzsme.supabase.co';
const supabaseAnonKey = 'eyJhbGci...'; // Anon key

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### Database Operations

```typescript
// SELECT
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10);

// INSERT
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .select()
  .single();

// UPDATE
const { data, error } = await supabase
  .from('users')
  .update({ status: 'inactive' })
  .eq('id', userId);

// DELETE
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);

// WITH RLS
const { data } = await supabase
  .from('private_data')
  .select('*'); // Automatically filtered by RLS policies
```

### Edge Functions

```typescript
// Calling edge function from client
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' },
});

// Edge function example (supabase/functions/hello/index.ts)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { name } = await req.json();
  
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

---

## Database Schema

### Key Tables

#### `blog_posts`
```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  published BOOLEAN DEFAULT false,
  featured_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  reading_time INTEGER,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `blog_categories`
```sql
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

```sql
-- Published posts viewable by everyone
CREATE POLICY "Published blog posts viewable by everyone"
ON blog_posts FOR SELECT
USING (published = true OR auth.uid() IS NOT NULL);

-- Authors can manage their own posts
CREATE POLICY "Authors can update own posts"
ON blog_posts FOR UPDATE
USING (auth.uid() = author_id);
```

### Indexes

```sql
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
```

---

## Authentication & Authorization

### Authentication Flow

```typescript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
    },
  },
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});

// Sign Out
await supabase.auth.signOut();

// Get Current User
const { data: { user } } = await supabase.auth.getUser();
```

### Protected Routes

```typescript
// ProtectedRoute.tsx
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return children;
};

// Usage in routes
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### Role-Based Access Control

```typescript
// Check user role
const hasRole = (user: User, roles: string[]) => {
  return roles.includes(user.role);
};

// Usage
{hasRole(user, ['admin', 'super_admin']) && (
  <AdminPanel />
)}
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load components
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const BlogPage = lazy(() => import('./pages/public/BlogPage'));

// Usage with Suspense
<Suspense fallback={<PageSkeleton />}>
  <AdminDashboard />
</Suspense>
```

### Memoization

```typescript
// useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return processLargeDataset(data);
}, [data]);

// useCallback for function stability
const handleSubmit = useCallback((values) => {
  submitForm(values);
}, []);

// React.memo for component optimization
export const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* render */}</div>;
});
```

### Image Optimization

```typescript
// Responsive images
<picture>
  <source
    srcSet="/hero-sm.webp 640w, /hero-md.webp 1024w"
    type="image/webp"
  />
  <img
    src="/hero.jpg"
    alt="Hero image"
    loading="lazy"
  />
</picture>

// Next-gen formats
<img
  src="/image.webp"
  alt="Optimized image"
  width="800"
  height="600"
  loading="lazy"
/>
```

---

## SEO Implementation

### Meta Tags

```typescript
import { SEO } from '@/components/SEO';

<SEO
  title="Page Title"
  description="Page description under 160 characters"
  keywords="keyword1, keyword2, keyword3"
  canonical="https://ats.me/page"
  ogImage="https://ats.me/og-image.jpg"
/>
```

### Structured Data

```typescript
import { StructuredData, buildArticleSchema } from '@/lib/seo';

const schema = buildArticleSchema({
  headline: 'Article Title',
  description: 'Article description',
  image: 'https://example.com/image.jpg',
  datePublished: '2025-01-01',
  author: 'John Doe',
  publisher: 'ATS.me',
});

<StructuredData data={schema} />
```

---

## Error Handling

### Error Boundaries

```typescript
// GlobalErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Sentry Integration

```typescript
import { captureException, setUser } from '@/lib/sentry';

// Capture errors
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    context: 'Additional info',
  });
}

// Set user context
setUser({
  id: user.id,
  email: user.email,
});
```

---

## Development Workflow

### Git Workflow

1. **Main Branch**: Production-ready code
2. **Feature Branches**: `feature/feature-name`
3. **Bug Fix Branches**: `fix/bug-description`
4. **Pull Requests**: Required for merging

### Code Review Checklist

- [ ] Tests pass (`npm run test`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] No console errors
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Performance considered
- [ ] Security reviewed

### Release Process

1. Create release branch
2. Update version number
3. Run full test suite
4. Create changelog
5. Merge to main
6. Tag release
7. Deploy to production

---

**For more information, see:**
- [API Documentation](API_DOCUMENTATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Contributing Guidelines](CONTRIBUTING.md)
