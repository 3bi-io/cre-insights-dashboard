/**
 * Blog Post Card Component
 * Renders a single blog post card for the blog index grid
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { calculateReadingTime } from '@/utils/seoUtils';
import BlogFeaturedImage from './BlogFeaturedImage';
import type { BlogPost } from '@/hooks/useBlog';

interface BlogPostCardProps {
  post: BlogPost;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post }) => {
  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:border-primary/30">
        <BlogFeaturedImage
          featuredImage={post.featured_image}
          slug={post.slug}
          title={post.title}
          className="h-48"
        />
        <CardContent className="p-6 space-y-3">
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
                  {new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default BlogPostCard;
