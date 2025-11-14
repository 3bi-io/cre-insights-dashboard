import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO, buildArticleSchema, StructuredData, Breadcrumbs } from '@/lib/seo';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const sanitizeContent = useMemo(() => {
    return (content: string) => {
      if (typeof window === 'undefined') return content;
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'blockquote', 'code', 'pre', 'br', 'hr', 'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur']
      });
    };
  }, []);

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post?.title || 'Post', path: `/blog/${slug}` },
  ];

  const structuredData = post ? buildArticleSchema({
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image || '',
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: post.author,
    publisher: 'ATS.me',
  }) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-wide py-12 text-center">
          <h1 className="heading-1 mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        keywords={post.keywords?.join(', ')}
        canonical={`https://ats.me/blog/${post.slug}`}
        ogType="article"
        ogImage={post.featured_image}
        articlePublishedTime={post.published_at || post.created_at}
        articleModifiedTime={post.updated_at}
        author={post.author}
      />
      {structuredData && <StructuredData data={structuredData} />}

      <article className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container-wide py-8">
            <Breadcrumbs items={breadcrumbItems} />
            
            <div className="mt-8">
              <h1 className="heading-1 mb-4">{post.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(post.published_at || post.created_at), 'MMMM d, yyyy')}
                </div>
                {post.reading_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {post.reading_time} min read
                  </div>
                )}
                <div className="text-foreground font-medium">
                  By {post.author}
                </div>
              </div>
            </div>
          </div>
        </header>

        {post.featured_image && (
          <div className="container-wide py-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full max-h-[500px] object-cover rounded-lg"
            />
          </div>
        )}

        <main className="container-wide py-8">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ 
              __html: sanitizeContent(post.content)
            }} />
          </div>

          <div className="mt-12 pt-8 border-t border-border">
            <Button variant="outline" asChild>
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </main>
      </article>
    </>
  );
};

export default BlogPostPage;
