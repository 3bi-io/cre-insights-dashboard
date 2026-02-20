/**
 * Breadcrumbs Component
 * Navigation breadcrumbs with structured data
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { StructuredData, buildBreadcrumbSchema } from './StructuredData';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const location = useLocation();

  // Auto-generate breadcrumbs from URL if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  // Always include home
  const fullItems: BreadcrumbItem[] = [
    { name: 'Home', path: '/' },
    ...breadcrumbItems,
  ];

  // Build structured data
  const schemaItems = fullItems.map(item => ({
    name: item.name,
    url: `https://applyai.jobs${item.path}`,
  }));

  return (
    <>
      <StructuredData data={buildBreadcrumbSchema(schemaItems)} />
      
      <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-2 text-sm', className)}>
        {fullItems.map((item, index) => {
          const isLast = index === fullItems.length - 1;
          const isFirst = index === 0;

          return (
            <React.Fragment key={item.path}>
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              
              {isLast ? (
                <span 
                  className="text-foreground font-medium" 
                  aria-current="page"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
                >
                  {isFirst && <Home className="h-4 w-4 mr-1" aria-hidden="true" />}
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

/**
 * Generate breadcrumbs from URL path
 */
function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach(segment => {
    currentPath += `/${segment}`;
    items.push({
      name: formatSegmentName(segment),
      path: currentPath,
    });
  });

  return items;
}

/**
 * Format URL segment to readable name
 */
function formatSegmentName(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
