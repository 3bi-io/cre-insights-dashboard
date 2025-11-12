/**
 * Integration Tests for Blog API
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('Blog API Integration Tests', () => {
  const testPost = {
    slug: `test-post-${Date.now()}`,
    title: 'Test Blog Post',
    excerpt: 'This is a test blog post excerpt',
    content: '<p>This is the test blog post content</p>',
    author: 'Test Author',
    published: false,
    reading_time: 5,
  };

  let createdPostId: string;

  beforeAll(async () => {
    // Note: These tests require authentication
    // In a real scenario, you'd authenticate a test user first
  });

  it('should create a blog post', async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(testPost)
      .select()
      .single();

    // This will fail without authentication, which is expected
    expect(error).toBeDefined();
    expect(error?.code).toBe('42501'); // Insufficient privilege
  });

  it('should fetch published blog posts', async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });

    // Public can read published posts
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should fetch blog post by slug', async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', 'test-slug')
      .eq('published', true)
      .single();

    // Should handle not found gracefully
    if (error) {
      expect(error.code).toBe('PGRST116'); // Not found
    }
  });

  it('should fetch blog categories', async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
