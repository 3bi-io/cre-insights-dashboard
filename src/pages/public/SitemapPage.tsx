import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { StructuredData, buildBreadcrumbSchema } from '@/components/StructuredData';
import { sitemapCategories } from '@/config/sitemapData';

const SitemapPage = () => {
  const breadcrumbData = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://applyai.jobs/' },
    { name: 'Sitemap', url: 'https://applyai.jobs/sitemap' },
  ]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Sitemap - Navigate Apply AI"
        description="Complete directory of Apply AI pages. Find job listings, features, resources, and platform documentation."
        keywords="sitemap, Apply AI pages, navigation, site directory, job board, recruitment platform"
        canonical="https://applyai.jobs/sitemap"
        ogImage="https://applyai.jobs/og-sitemap.png"
      />
      <StructuredData data={breadcrumbData} />

      <header className="border-b border-border bg-card">
        <div className="container-wide py-12">
          <h1 className="heading-1 mb-4">Sitemap</h1>
          <p className="text-muted-foreground text-lg max-w-3xl">
            Comprehensive directory of all pages and features available on the platform.
          </p>
        </div>
      </header>

      <main className="container-wide py-8 space-y-8">
        {sitemapCategories.map((category, idx) => (
          <Card key={idx} className="card-elevated">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">{category.icon}</div>
                <div>
                  <CardTitle className="text-2xl">{category.title}</CardTitle>
                  <CardDescription className="text-base mt-1">{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.routes.map((route, routeIdx) => (
                  <Link key={routeIdx} to={route.path} className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/5 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">{route.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{route.label}</div>
                        {route.description && <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{route.description}</div>}
                        <div className="text-xs text-muted-foreground/70 mt-1 font-mono">{route.path}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="container-wide py-8 text-center text-muted-foreground">
          <p className="text-sm">Need help navigating? <Link to="/admin/support" className="text-primary hover:underline">Contact support</Link></p>
        </div>
      </footer>
    </div>
  );
};

export default SitemapPage;
