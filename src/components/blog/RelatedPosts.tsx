/**
 * Related Posts Component
 * Shows related blog posts from the same category
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight } from 'lucide-react';
import { useBlogPosts } from '@/hooks/useBlog';
import { calculateReadingTime } from '@/utils/seoUtils';
import BlogFeaturedImage from './BlogFeaturedImage';

interface RelatedPostsProps {
  currentSlug: string;
  category?: string | null;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ currentSlug, category }) => {
  const { data: posts } = useBlogPosts(category || undefined);

  const relatedPosts = posts?.filter((p) => p.slug !== currentSlug).slice(0, 3);

  if (!relatedPosts || relatedPosts.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-foreground mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
            <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30">
              <BlogFeaturedImage
                featuredImage={post.featured_image}
                slug={post.slug}
                title={post.title}
                className="h-36"
              />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {post.category && (
                    <Badge variant="secondary" className="text-xs">
                      {post.category}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {calculateReadingTime(post.content)} min
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Read more <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;
