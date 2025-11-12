import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from '../SEO';

describe('SEO Component', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <HelmetProvider>{children}</HelmetProvider>
  );

  it('renders title correctly', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
      />,
      { wrapper }
    );

    const title = document.querySelector('title');
    expect(title?.textContent).toBe('Test Page - ATS.me');
  });

  it('renders meta description', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description for SEO"
      />,
      { wrapper }
    );

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Test description for SEO');
  });

  it('renders canonical URL', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        canonical="https://ats.me/test"
      />,
      { wrapper }
    );

    const canonical = document.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://ats.me/test');
  });

  it('renders Open Graph tags', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        ogImage="https://example.com/image.jpg"
      />,
      { wrapper }
    );

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    expect(ogTitle?.getAttribute('content')).toBe('Test Page - ATS.me');
    expect(ogDescription?.getAttribute('content')).toBe('Test description');
    expect(ogImage?.getAttribute('content')).toBe('https://example.com/image.jpg');
  });

  it('renders Twitter Card tags', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        twitterCard="summary_large_image"
      />,
      { wrapper }
    );

    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');

    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
    expect(twitterTitle?.getAttribute('content')).toBe('Test Page - ATS.me');
  });

  it('applies noindex when specified', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        noindex={true}
      />,
      { wrapper }
    );

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toBe('noindex, nofollow');
  });

  it('renders keywords when provided', () => {
    render(
      <SEO
        title="Test Page"
        description="Test description"
        keywords="test, seo, keywords"
      />,
      { wrapper }
    );

    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    expect(keywordsMeta?.getAttribute('content')).toBe('test, seo, keywords');
  });
});
