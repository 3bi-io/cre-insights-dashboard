import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO, buildArticleSchema, StructuredData } from '@/lib/seo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const BlogListPage = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const structuredData = posts?.map(post => 
    buildArticleSchema({
      headline: post.title,
      description: post.excerpt,
      image: post.featured_image || '',
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: post.author,
      publisher: 'ATS.me',
    })
  );

  return (
    <>
      <SEO
        title="Blog - ATS Insights & Recruitment Tips"
        description="Stay updated with the latest recruitment trends, ATS best practices, and hiring insights. Expert guidance for modern talent acquisition."
        keywords="recruitment blog, ATS tips, hiring insights, talent acquisition, HR best practices"
        canonical="https://ats.me/blog"
      />
      {structuredData && <StructuredData data={structuredData} />}

      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container-wide py-12">
            <h1 className="heading-1 mb-4">Blog</h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Stay ahead with insights on recruitment technology, hiring strategies, and ATS best practices.
            </p>
          </div>
        </header>

        <main className="container-wide py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-200 group">
                    {post.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(post.published_at || post.created_at), 'MMM d, yyyy')}
                        </div>
                        {post.reading_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.reading_time} min read
                          </div>
                        )}
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{post.author}</Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-lg">No blog posts available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">Check back soon for recruitment insights and tips!</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
};

export default BlogListPage;
