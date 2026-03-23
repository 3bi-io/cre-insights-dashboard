# Contributing to Apply AI

Thank you for your interest in contributing to Apply AI! This guide will help you get started.

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Development Workflow](#development-workflow)
6. [Coding Standards](#coding-standards)
7. [Testing Guidelines](#testing-guidelines)
8. [Commit Guidelines](#commit-guidelines)
9. [Pull Request Process](#pull-request-process)
10. [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and professional in all interactions.

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behaviors:**
- Harassment of any kind
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information
- Other conduct inappropriate in a professional setting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Finding Issues

1. Check the [Issues](https://github.com/yourusername/apply-ai/issues) page
2. Look for issues labeled:
   - `good-first-issue` - Great for beginners
   - `help-wanted` - We'd love contributions
   - `bug` - Something isn't working
   - `enhancement` - New feature or request
3. Comment on the issue to indicate you're working on it

### Asking Questions

- Use GitHub Discussions for questions
- Join our Discord community
- Check existing issues for similar questions

## 💻 Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/apply-ai.git
cd apply-ai

# Add upstream remote
git remote add upstream https://github.com/original-owner/apply-ai.git
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Supabase

Follow the setup instructions in [DEPLOYMENT.md](./DEPLOYMENT.md#supabase-configuration)

### 4. Start Development Server

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:8080`

### 5. Verify Setup

- Visit the app in your browser
- Check that authentication works
- Verify database connection
- Test core features

## 🏗️ Project Structure

```
apply-ai/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base components (shadcn)
│   │   └── ...          # Feature-specific components
│   ├── features/        # Feature-based modules
│   │   ├── ai-analytics/
│   │   ├── applications/
│   │   └── jobs/
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   ├── tests/           # Test files
│   └── main.tsx         # Entry point
├── supabase/
│   ├── functions/       # Edge functions
│   └── migrations/      # Database migrations
├── e2e/                 # End-to-end tests
└── public/              # Static assets
```

### Architecture Principles

1. **Feature-Based Organization**
   - Group related components, hooks, and utilities
   - Keep features self-contained
   - Minimize cross-feature dependencies

2. **Component Composition**
   - Prefer small, focused components
   - Use composition over inheritance
   - Extract reusable logic into hooks

3. **Type Safety**
   - Use TypeScript everywhere
   - Define interfaces for all data structures
   - Avoid `any` types

4. **Performance**
   - Lazy load routes and heavy components
   - Memoize expensive computations
   - Optimize re-renders

## 🔄 Development Workflow

### 1. Create a Branch

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Changes

- Write code following our [coding standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 3. Commit Changes

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: add candidate filtering"
```

See [Commit Guidelines](#commit-guidelines) for commit message format.

### 4. Keep Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch
git rebase upstream/main
```

### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

See [Pull Request Process](#pull-request-process) below.

## 📝 Coding Standards

### TypeScript

**Use explicit types:**
```typescript
// ✅ Good
const userName: string = 'John';
function getUserName(id: string): Promise<string> { }

// ❌ Bad
const userName = 'John'; // implicit typing okay for obvious cases
function getUserName(id) { } // missing types
```

**Define interfaces:**
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad
const user = {
  id: '123',
  name: 'John',
  email: 'john@example.com'
}; // no type safety
```

### React Components

**Use functional components:**
```typescript
// ✅ Good
const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};

// ❌ Bad - class components
class Button extends React.Component { }
```

**Extract complex logic into hooks:**
```typescript
// ✅ Good
const useApplications = (jobId: string) => {
  // Hook logic here
};

// In component
const { applications, loading } = useApplications(jobId);

// ❌ Bad - logic in component
const MyComponent = () => {
  const [applications, setApplications] = useState([]);
  // Many lines of data fetching logic...
};
```

**Use semantic HTML:**
```tsx
// ✅ Good
<main>
  <section>
    <article>
      <h1>Title</h1>
      <p>Content</p>
    </article>
  </section>
</main>

// ❌ Bad
<div>
  <div>
    <div>
      <div>Title</div>
      <div>Content</div>
    </div>
  </div>
</div>
```

### CSS/Tailwind

**Use design tokens:**
```tsx
// ✅ Good
<div className="bg-background text-foreground">

// ❌ Bad
<div className="bg-white text-black">
```

**Follow mobile-first approach:**
```tsx
// ✅ Good
<div className="flex flex-col md:flex-row">

// ❌ Bad
<div className="flex flex-row sm:flex-col">
```

**Keep classes organized:**
```tsx
// ✅ Good
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-primary text-primary-foreground
  rounded-md shadow-sm
  hover:bg-primary/90
  transition-colors
">

// ❌ Bad
<div className="flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors">
```

### File Naming

- **Components**: PascalCase - `CandidateCard.tsx`
- **Hooks**: camelCase with 'use' prefix - `useApplications.tsx`
- **Utils**: camelCase - `formatDate.ts`
- **Types**: PascalCase - `Application.ts`
- **Tests**: Same as file + `.test` - `CandidateCard.test.tsx`

## 🧪 Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Hooks
- Business logic

```typescript
// src/utils/__tests__/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from '../formatDate';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('January 15, 2025');
  });

  it('handles invalid dates', () => {
    expect(formatDate(null)).toBe('Invalid date');
  });
});
```

### Component Tests

Test component behavior:
- User interactions
- Conditional rendering
- Props handling

```typescript
// src/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

Test critical user flows:
```typescript
// e2e/application-flow.spec.ts
import { test, expect } from '@playwright/test';

test('can submit job application', async ({ page }) => {
  await page.goto('/jobs/some-job-id');
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('button:has-text("Apply")');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Running Tests

```bash
# Unit and component tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:headed
```

## 📬 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(applications): add bulk status update
fix(scoring): correct AI confidence calculation
docs(readme): update installation instructions
refactor(hooks): extract useApplications logic
test(components): add tests for CandidateCard
```

### Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line should be < 72 characters
- Reference issues in footer (`Closes #123`)

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Self-review completed
- [ ] No console errors
- [ ] Commits follow guidelines

### Creating the PR

1. **Go to GitHub** and create a pull request from your branch

2. **Fill out the template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   How to test these changes

   ## Screenshots
   If applicable

   ## Checklist
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)
   ```

3. **Request review** from maintainers

### Review Process

1. Automated checks run (tests, linting, build)
2. Code review by maintainers
3. Address feedback if requested
4. Maintainer approval
5. Merge (squash and merge)

### After Merge

- Delete your feature branch
- Close related issues
- Update your local main branch

## 📚 Documentation

### What to Document

- **New features**: User guide updates
- **API changes**: API documentation updates
- **Breaking changes**: Migration guide
- **Bug fixes**: Changelog entry
- **Configuration**: Setup instructions

### Documentation Standards

**Be clear and concise:**
```markdown
✅ Good:
## Installing Dependencies
Run `npm install` to install all required packages.

❌ Bad:
## Installing Dependencies
You might want to install the dependencies, which you can do by running the npm install command in your terminal, assuming you have npm installed on your system.
```

**Use examples:**
```markdown
✅ Good:
### Using the Hook
\`\`\`typescript
const { applications, loading } = useApplications(jobId);
\`\`\`

❌ Bad:
### Using the Hook
Call the hook with a job ID parameter.
```

**Keep updated:**
- Update docs in the same PR as code changes
- Remove outdated information
- Add migration guides for breaking changes

## 🏆 Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes
- Special recognition for significant contributions

## ❓ Questions?

- Open a [Discussion](https://github.com/yourusername/apply-ai/discussions)
- Join our [Discord](https://discord.gg/apply-ai)
- Email: dev@applyai.jobs

---

Thank you for contributing to Apply AI! 🎉
