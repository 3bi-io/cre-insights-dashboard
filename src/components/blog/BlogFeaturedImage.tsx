/**
 * Blog Featured Image Component
 * Renders featured image or category-based placeholder
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { getBlogPlaceholderImage } from '@/utils/blogImageUtils';

interface BlogFeaturedImageProps {
  featuredImage?: string | null;
  slug: string;
  title: string;
  className?: string;
  eager?: boolean;
}

const BlogFeaturedImage: React.FC<BlogFeaturedImageProps> = ({
  featuredImage,
  slug,
  title,
  className,
  eager = false,
}) => {
  const imageSrc = featuredImage || getBlogPlaceholderImage(slug);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading={eager ? 'eager' : 'lazy'}
      />
    </div>
  );
};

export default BlogFeaturedImage;
