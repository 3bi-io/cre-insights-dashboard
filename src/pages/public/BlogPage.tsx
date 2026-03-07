/**
 * Blog Index Page
 * Featured post hero, search, category filtering, newsletter CTA,
 * and CollectionPage/ItemList structured data for SEO
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBlogPosts, useBlogCategories } from '@/hooks/useBlog';
import { BlogPostCard, BlogFeaturedImage, buildBlogIndexSchema } from '@/components/blog';
import { PublicPageHero, FilterBar } from '@/components/shared';
import { calculateReadingTime } from '@/utils/seoUtils';
import socialHero from '@/assets/hero/social-hero.png';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://auwhcdpppldjlcaxzsme.supabase.co';

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { data: posts, isLoading } = useBlogPosts(selectedCategory);
  const { data: categories } = useBlogCategories();

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  const blogIndexSchema = useMemo(() => {
    if (!posts || posts.length === 0) return null;
    return buildBlogIndexSchema(posts.map(p => ({ slug: p.slug, title: p.title, image: p.featured_image })));
  }, [posts]);

  const breadcrumbs = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog' },
  ]), []);

  const tabs = useMemo(() => [
    { id: '__all__', label: 'All Posts' },
    ...(categories?.map(cat => ({ id: cat, label: cat })) || []),
  ], [categories]);

  return (
    <>
      <SEO
        title="Blog | Apply AI - Recruitment Insights & Industry Trends"
        description="Expert insights on AI recruitment, applicant tracking systems, hiring strategies, and HR technology trends."
        keywords="recruitment blog, ATS insights, hiring strategies, HR technology, AI recruiting tips"
        canonical="https://applyai.jobs/blog"
      />
      <Helmet>
        <link rel="alternate" type="application/atom+xml" title="Apply AI Blog" href={`${SUPABASE_URL}/functions/v1/blog-rss`} />
      </Helmet>
      <StructuredData data={[breadcrumbs, ...(blogIndexSchema ? [blogIndexSchema] : [])]} />

      <div className="min-h-screen">
        <PublicPageHero
          imageSrc={socialHero}
          imageAlt="Insights and resources for modern recruitment and HR technology"
          badge="Insights & Resources"
          title="The Apply AI"
          titleAccent="Blog"
          subtitle="Expert insights on AI-powered recruitment & HR technology"
        />

        <FilterBar
          tabs={tabs}
          activeTab={selectedCategory || '__all__'}
          onTabChange={(id) => setSelectedCategory(id === '__all__' ? undefined : id)}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search posts..."
        />

        {/* Featured Post Hero */}
        {!isLoading && featuredPost && !searchQuery && (
          <section className="py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Link to={`/blog/${featuredPost.slug}`} className="group block">
                  <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <BlogFeaturedImage featuredImage={featuredPost.featured_image} slug={featuredPost.slug} title={featuredPost.title} className="h-64 lg:h-full" />
                      <CardContent className="p-6 md:p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="default" className="text-xs">Featured</Badge>
                          {featuredPost.category && <Badge variant="secondary" className="text-xs">{featuredPost.category}</Badge>}
                          <span className="text-xs text-muted-foreground">{calculateReadingTime(featuredPost.content)} min read</span>
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors mb-3">{featuredPost.title}</h2>
                        {featuredPost.description && <p className="text-muted-foreground mb-4 line-clamp-3">{featuredPost.description}</p>}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {featuredPost.author?.full_name && <span>{featuredPost.author.full_name}</span>}
                          {featuredPost.published_at && (
                            <><span>·</span><span>{new Date(featuredPost.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* Posts Grid */}
        <section className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}><Skeleton className="h-48 rounded-t-lg" /><CardContent className="p-6 space-y-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                ))}
              </div>
            ) : (searchQuery ? filteredPosts : remainingPosts).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(searchQuery ? filteredPosts : remainingPosts).map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? 'No matching posts' : selectedCategory ? `No posts in "${selectedCategory}"` : 'Coming Soon'}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery ? 'Try adjusting your search terms.' : selectedCategory ? 'Try selecting a different category or view all posts.' : 'We\'re preparing expert insights. Check back soon!'}
                </p>
                {(selectedCategory || searchQuery) && (
                  <Button variant="outline" onClick={() => { setSelectedCategory(undefined); setSearchQuery(''); }}>View All Posts</Button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-12 md:py-16 bg-muted/50">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Stay in the loop</h2>
            <p className="text-muted-foreground mb-6">Get the latest recruitment insights and product updates delivered to your inbox.</p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={async (e) => {
              e.preventDefault();
              if (!newsletterEmail || isSubscribing) return;
              setIsSubscribing(true);
              try {
                const response = await fetch(`${SUPABASE_URL}/functions/v1/newsletter-subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newsletterEmail, source: 'blog' }) });
                if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Subscription failed'); }
                toast.success('Thanks for subscribing! Check your inbox.');
                setNewsletterEmail('');
              } catch (err: any) { toast.error(err.message || 'Something went wrong. Please try again.'); } finally { setIsSubscribing(false); }
            }}>
              <Input type="email" placeholder="your@email.com" className="flex-1 min-h-[44px]" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} />
              <Button type="submit" className="min-h-[44px]" disabled={isSubscribing}>Subscribe <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogPage;
