import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const BlogAdminPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete post: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ postId, published }: { postId: string; published: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          published: !published,
          published_at: !published ? new Date().toISOString() : null,
        })
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: 'Success',
        description: 'Post status updated',
      });
    },
  });

  return (
    <div className="container-wide py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-1">Blog Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage blog posts for SEO</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{post.title}</CardTitle>
                      <Badge variant={post.published ? 'default' : 'secondary'}>
                        {post.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>By {post.author}</span>
                      <span>•</span>
                      <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                      {post.reading_time && (
                        <>
                          <span>•</span>
                          <span>{post.reading_time} min read</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.published && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link to={`/blog/${post.slug}`} target="_blank">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublishMutation.mutate({ 
                        postId: post.id, 
                        published: post.published 
                      })}
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this post?')) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No blog posts yet</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlogAdminPage;
