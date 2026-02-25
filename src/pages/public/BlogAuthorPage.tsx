/**
 * Blog Author Page
 * Dedicated author page with Person schema for E-E-A-T
 */

import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlogPostCard } from '@/components/blog';
import type { BlogPost } from '@/hooks/useBlog';

const BASE_URL = import.meta.env.VITE_SITE_URL || 'https://applyai.jobs';

function useAuthorWithPosts(authorId: string | undefined) {
  return useQuery({
    queryKey: ['blog-author', authorId],
    queryFn: async () => {
      if (!authorId) throw new Error('No author ID');
      
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:profiles!blog_posts_author_id_fkey(id, full_name, email, author_bio, author_title)
        `)
        .eq('author_id', authorId)
        .eq('published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      if (!posts || posts.length === 0) throw new Error('Author not found');

      const author = (posts[0] as any).author;
      return { author, posts: posts as BlogPost[] };
    },
    enabled: !!authorId,
  });
}

const BlogAuthorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAuthorWithPosts(id);

  if (!id) return <Navigate to="/blog" replace />;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Author Not Found</h1>
        <Button asChild><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link></Button>
      </div>
    );
  }

  const { author, posts } = data;
  const authorName = author?.full_name || 'Apply AI Team';
  const authorTitle = author?.author_title || '';
  const authorBio = author?.author_bio || `Contributing author at Apply AI.`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": authorName,
    ...(authorTitle && { "jobTitle": authorTitle }),
    "description": authorBio,
    "url": `${BASE_URL}/blog/author/${id}`,
    "worksFor": {
      "@type": "Organization",
      "name": "Apply AI",
      "url": BASE_URL,
    },
  };

  return (
    <>
      <SEO
        title={`${authorName} | Apply AI Blog Author`}
        description={`Articles by ${authorName}. ${authorBio.substring(0, 100)}`}
        canonical={`${BASE_URL}/blog/author/${id}`}
      />
      <StructuredData data={personSchema} />

      <div className="bg-muted/30 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { name: 'Blog', path: '/blog' },
            { name: authorName, path: `/blog/author/${id}` },
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Card className="mb-10">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{authorName}</h1>
              {authorTitle && <p className="text-sm text-primary mb-2">{authorTitle}</p>}
              <p className="text-sm text-muted-foreground leading-relaxed">{authorBio}</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-foreground mb-6">
          Articles by {authorName} ({posts.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button asChild variant="outline">
            <Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default BlogAuthorPage;
