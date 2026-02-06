/**
 * Blog Index Page
 * Lists all published blog posts with category filtering
 * Implements E-E-A-T with author attribution and reading time
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, ArrowRight, BookOpen } from 'lucide-react';
import { useBlogPosts, useBlogCategories } from '@/hooks/useBlog';
import { calculateReadingTime } from '@/utils/seoUtils';
import { cn } from '@/lib/utils';

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { data: posts, isLoading } = useBlogPosts(selectedCategory);
  const { data: categories } = useBlogCategories();

  return (
    <>
      <SEO
        title="Blog | ATS.me - Recruitment Insights & Industry Trends"
        description="Expert insights on AI recruitment, applicant tracking systems, hiring strategies, and HR technology trends. Stay ahead with ATS.me's industry-leading blog."
        keywords="recruitment blog, ATS insights, hiring strategies, HR technology, AI recruiting tips"
        canonical="https://ats.me/blog"
      />

      <div className="min-h-screen">
        {/* Hero */}
        <section className="relative py-12 md:py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="absolute inset-0 bg-grid-primary/5 bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm">
              <BookOpen className="h-4 w-4" />
              Insights & Resources
            </div>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold text-foreground mb-4">
              The ATS.me
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Blog</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert insights on AI-powered recruitment, hiring strategies, and the future of HR technology.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <section className="border-b bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(undefined)}
                  className="min-h-[36px]"
                >
                  All Posts
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="min-h-[36px]"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 rounded-t-lg" />
                    <CardContent className="p-6 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30">
                      {post.featured_image && (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardContent className={cn("p-6 space-y-3", !post.featured_image && "pt-6")}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {calculateReadingTime(post.content)} min read
                          </span>
                        </div>

                        <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h2>

                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {post.author?.full_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.author.full_name}
                              </span>
                            )}
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {selectedCategory ? `No posts in "${selectedCategory}"` : 'Coming Soon'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {selectedCategory
                    ? 'Try selecting a different category or view all posts.'
                    : 'We\'re preparing expert insights on AI recruitment, hiring strategies, and HR technology. Check back soon!'}
                </p>
                {selectedCategory && (
                  <Button variant="outline" onClick={() => setSelectedCategory(undefined)}>
                    View All Posts
                  </Button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;
