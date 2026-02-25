/**
 * Blog Post Detail Page
 * BlogPosting schema with E-E-A-T, speakable, TOC, FAQ, DOMPurify
 */

import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, ArrowLeft, Tag, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useBlogPost } from '@/hooks/useBlog';
import { calculateReadingTime } from '@/utils/seoUtils';
import {
  BlogFeaturedImage,
  BlogShareButtons,
  RelatedPosts,
  BlogTableOfContents,
  BlogFAQSection,
  injectHeadingIds,
  buildBlogPostingSchema,
} from '@/components/blog';
import { buildHowToSchema } from '@/components/StructuredData';
import { getBlogOgImage } from '@/utils/blogImageUtils';

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || '');

  // Process content: inject heading IDs for TOC anchors, then sanitize
  const processedContent = useMemo(() => {
    if (!post?.content) return '';
    const withIds = injectHeadingIds(post.content);
    return DOMPurify.sanitize(withIds, {
      ADD_ATTR: ['id', 'target', 'rel'],
    });
  }, [post?.content]);

  if (!slug) return <Navigate to="/blog" replace />;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-64 w-full mb-6 rounded-xl" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The blog post you're looking for doesn't exist or has been unpublished.
        </p>
        <Button asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.content);
  const wordCount = post.content.trim().split(/\s+/).length;
  const publishedDate = post.published_at ? new Date(post.published_at).toISOString() : post.created_at;
  const authorName = post.author?.full_name || 'Apply AI Team';
  const ogImage = getBlogOgImage(post.slug, post.featured_image);

  // Show "Updated" if updated_at differs from published_at by > 1 day
  const showUpdatedDate = post.published_at && post.updated_at &&
    Math.abs(new Date(post.updated_at).getTime() - new Date(post.published_at).getTime()) > 86400000;

  // BlogPosting schema with full E-E-A-T
  const blogPostingSchema = buildBlogPostingSchema({
    title: post.title,
    description: post.description || post.title,
    image: post.featured_image || 'https://applyai.jobs/og-image.png',
    datePublished: publishedDate,
    dateModified: post.updated_at,
    authorName,
    authorTitle: post.author?.author_title,
    authorBio: post.author?.author_bio,
    authorUrl: post.author_id ? `https://applyai.jobs/blog/author/${post.author_id}` : undefined,
    category: post.category,
    tags: post.tags || undefined,
    wordCount,
    slug: post.slug,
  });

  // Parse FAQs from jsonb field
  const faqs = (post as any).faqs as Array<{ question: string; answer: string }> | null;
  
  // Parse HowTo steps from jsonb field
  const howtoSteps = (post as any).howto_steps as Array<{ name: string; text: string }> | null;
  const howtoSchema = howtoSteps && howtoSteps.length > 0
    ? buildHowToSchema({ name: post.title, description: post.description || post.title, steps: howtoSteps })
    : null;

  // Collect all schemas
  const schemas = [blogPostingSchema, ...(howtoSchema ? [howtoSchema] : [])];

  return (
    <>
      <SEO
        title={`${post.title} | Apply AI Blog`}
        description={post.description || `Read ${post.title} on the Apply AI blog.`}
        keywords={post.tags?.join(', ')}
        canonical={`https://applyai.jobs/blog/${post.slug}`}
        ogImage={ogImage}
        ogType="article"
        articlePublishedTime={publishedDate}
        articleModifiedTime={post.updated_at}
        author={authorName}
      />
      <StructuredData data={schemas} />

      <article className="min-h-screen">
        {/* Header */}
        <div className="bg-muted/30 border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumbs
              items={[
                { name: 'Blog', path: '/blog' },
                { name: post.title, path: `/blog/${post.slug}` },
              ]}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {post.category && (
              <Badge variant="secondary">{post.category}</Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
            {post.published_at && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {showUpdatedDate && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Updated {new Date(post.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Description / subtitle */}
          {post.description && (
            <p className="text-lg text-muted-foreground mb-6">
              {post.description}
            </p>
          )}

          {/* Author + Share */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to={post.author_id ? `/blog/author/${post.author_id}` : '/blog'}
              className="flex items-center gap-3 group"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {authorName}
                </p>
                {post.author?.author_title && (
                  <p className="text-xs text-muted-foreground">{post.author.author_title}</p>
                )}
              </div>
            </Link>
            <BlogShareButtons
              title={post.title}
              slug={post.slug}
              description={post.description || undefined}
            />
          </div>

          {/* Featured Image */}
          <BlogFeaturedImage
            featuredImage={post.featured_image}
            slug={post.slug}
            title={post.title}
            className="mb-8 rounded-xl border max-h-[500px]"
            eager
          />

          {/* Table of Contents */}
          <BlogTableOfContents content={post.content} />

          {/* Content — sanitized with DOMPurify */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12
              prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-8 prose-headings:mb-4
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
              prose-li:text-foreground/90 prose-li:leading-relaxed prose-li:pl-2
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:text-muted-foreground prose-blockquote:italic
              prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-border
              prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-border
              prose-img:rounded-lg prose-img:my-6"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* FAQ Section with FAQPage schema */}
          {faqs && faqs.length > 0 && <BlogFAQSection faqs={faqs} />}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Share Bar */}
          <div className="flex items-center justify-between py-4 px-4 rounded-lg bg-muted/50 mb-8">
            <span className="text-sm text-muted-foreground">Enjoyed this article? Share it with your network.</span>
            <BlogShareButtons
              title={post.title}
              slug={post.slug}
              description={post.description || undefined}
            />
          </div>

          <Separator className="my-8" />

          {/* Author Bio - E-E-A-T */}
          {post.author && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <Link
                  to={post.author_id ? `/blog/author/${post.author_id}` : '/blog'}
                  className="flex items-start gap-4 group"
                >
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      About {authorName}
                    </h3>
                    {post.author.author_title && (
                      <p className="text-sm text-primary mb-2">{post.author.author_title}</p>
                    )}
                    {post.author.author_bio ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {post.author.author_bio}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Contributing author at Apply AI, sharing insights on AI-powered recruitment and HR technology.
                      </p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Related Posts */}
          <RelatedPosts currentSlug={post.slug} category={post.category} />

          {/* Back to Blog */}
          <div className="text-center mt-12">
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Posts
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPostPage;
