/**
 * Blog Index Page
 * Lists all published blog posts with category filtering
 * Implements E-E-A-T with author attribution and reading time
 */

import React, { useState } from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useBlogPosts, useBlogCategories } from '@/hooks/useBlog';
import { BlogPostCard } from '@/components/blog';
import { HeroBackground } from '@/components/shared';
import socialHero from '@/assets/hero/social-hero.png';

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
        <HeroBackground
          imageSrc={socialHero}
          imageAlt="Insights and resources for modern recruitment and HR technology"
          variant="compact"
          overlayVariant="dark"
          overlayOpacity={65}
        >
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="inline-block text-xs sm:text-sm font-semibold text-black bg-white rounded-full px-4 py-1.5 mb-4 md:mb-6">
                Insights & Resources
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 lg:mb-4 text-black">
                The ATS.me
                <span className="text-white"> Blog</span>
              </h1>
              <span className="inline-block text-base lg:text-xl text-black font-medium bg-white rounded-full px-6 py-2">
                Expert insights on AI-powered recruitment & HR technology
              </span>
            </div>
          </div>
        </HeroBackground>

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
                  <BlogPostCard key={post.id} post={post} />
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
